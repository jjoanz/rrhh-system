const express = require('express');
const router = express.Router();
const VacantesController = require('../controllers/vacantesController');

// Middleware para validar token de autenticación (opcional)
const authenticateToken = (req, res, next) => {
  // Aquí puedes implementar tu lógica de autenticación
  // Por ahora, simplemente pasamos al siguiente middleware
  next();
};

// Middleware para validar roles
const authorizeRoles = (roles) => {
  return (req, res, next) => {
    // Aquí puedes implementar tu lógica de autorización
    // Por ahora, simplemente pasamos al siguiente middleware
    next();
  };
};

// ===============================
// RUTAS PARA VACANTES
// ===============================

// GET /api/vacantes - Obtener todas las vacantes activas
router.get('/', VacantesController.getVacantesActivas);

// POST /api/vacantes - Crear nueva vacante
router.post('/', 
  authenticateToken, 
  authorizeRoles(['rrhh', 'admin']), 
  VacantesController.crearVacante
);

// GET /api/vacantes/estadisticas - Obtener estadísticas del dashboard
router.get('/estadisticas', 
  authenticateToken, 
  VacantesController.getEstadisticas
);

// ===============================
// RUTAS PARA SOLICITUDES
// ===============================

// GET /api/vacantes/solicitudes - Obtener solicitudes de vacantes
router.get('/solicitudes', 
  authenticateToken, 
  VacantesController.getSolicitudes
);

// POST /api/vacantes/solicitudes - Crear nueva solicitud
router.post('/solicitudes', 
  authenticateToken, 
  authorizeRoles(['director', 'admin']), 
  VacantesController.crearSolicitud
);

// PUT /api/vacantes/solicitudes/:id/aprobar - Aprobar solicitud
router.put('/solicitudes/:id/aprobar', 
  authenticateToken, 
  authorizeRoles(['rrhh', 'admin']), 
  VacantesController.aprobarSolicitud
);

// PUT /api/vacantes/solicitudes/:id/rechazar - Rechazar solicitud
router.put('/solicitudes/:id/rechazar', 
  authenticateToken, 
  authorizeRoles(['rrhh', 'admin']), 
  (req, res) => {
    // Implementar lógica de rechazo similar a aprobarSolicitud
    res.json({ message: 'Solicitud rechazada exitosamente' });
  }
);

// ===============================
// RUTAS PARA POSTULACIONES
// ===============================

// GET /api/vacantes/postulaciones - Obtener postulaciones
router.get('/postulaciones', 
  authenticateToken, 
  VacantesController.getPostulaciones
);

// POST /api/vacantes/postulaciones - Crear nueva postulación
router.post('/postulaciones', 
  VacantesController.crearPostulacion
);

// PUT /api/vacantes/postulaciones/:id/estado - Cambiar estado de postulación
router.put('/postulaciones/:id/estado', 
  authenticateToken, 
  authorizeRoles(['rrhh', 'admin']), 
  async (req, res) => {
    try {
      const { id } = req.params;
      const { estado, comentarios } = req.body;
      
      const pool = req.app.locals.db;
      
      // Actualizar estado de la postulación
      await pool.request()
        .input('id', sql.Int, id)
        .input('estado', sql.NVarChar(50), estado)
        .query(`
          UPDATE Postulaciones 
          SET Estado = @estado, FechaEvaluacion = GETDATE()
          WHERE PostulacionID = @id
        `);

      // Registrar en el flujo
      await pool.request()
        .input('postulacionID', sql.Int, id)
        .input('estado', sql.NVarChar(50), estado)
        .input('comentarios', sql.NVarChar(500), comentarios || '')
        .query(`
          INSERT INTO FlujosPostulaciones (PostulacionID, Estado, Fecha, Comentarios)
          VALUES (@postulacionID, @estado, GETDATE(), @comentarios)
        `);

      res.json({ message: 'Estado de postulación actualizado exitosamente' });
    } catch (error) {
      console.error('Error al actualizar estado de postulación:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

// ===============================
// RUTAS AUXILIARES
// ===============================

// GET /api/vacantes/departamentos - Obtener departamentos
router.get('/departamentos', VacantesController.getDepartamentos);

// GET /api/vacantes/usuarios - Obtener usuarios/empleados
router.get('/usuarios', 
  authenticateToken, 
  VacantesController.getUsuarios
);

// ===============================
// RUTAS PARA REPORTES
// ===============================

// GET /api/vacantes/reportes/resumen - Obtener resumen para reportes
router.get('/reportes/resumen', 
  authenticateToken, 
  authorizeRoles(['rrhh', 'admin']), 
  async (req, res) => {
    try {
      const pool = req.app.locals.db;
      
      // Obtener datos para reportes
      const [
        vacantesActivas,
        postulacionesPorMes,
        departamentosConVacantes,
        estadisticasGenerales
      ] = await Promise.all([
        pool.request().query(`
          SELECT 
            v.Titulo,
            d.Nombre as Departamento,
            COUNT(p.PostulacionID) as TotalPostulaciones,
            v.FechaPublicacion
          FROM Vacantes v
          LEFT JOIN Departamentos d ON v.DepartamentoID = d.DepartamentoID
          LEFT JOIN Postulaciones p ON v.VacanteID = p.VacanteID
          WHERE v.Estado = 'Activa'
          GROUP BY v.VacanteID, v.Titulo, d.Nombre, v.FechaPublicacion
          ORDER BY v.FechaPublicacion DESC
        `),
        pool.request().query(`
          SELECT 
            YEAR(FechaPostulacion) as Año,
            MONTH(FechaPostulacion) as Mes,
            COUNT(*) as TotalPostulaciones
          FROM Postulaciones
          WHERE FechaPostulacion >= DATEADD(MONTH, -12, GETDATE())
          GROUP BY YEAR(FechaPostulacion), MONTH(FechaPostulacion)
          ORDER BY Año, Mes
        `),
        pool.request().query(`
          SELECT 
            d.Nombre as Departamento,
            COUNT(DISTINCT v.VacanteID) as VacantesActivas,
            COUNT(p.PostulacionID) as TotalPostulaciones
          FROM Departamentos d
          LEFT JOIN Vacantes v ON d.DepartamentoID = v.DepartamentoID AND v.Estado = 'Activa'
          LEFT JOIN Postulaciones p ON v.VacanteID = p.VacanteID
          GROUP BY d.DepartamentoID, d.Nombre
          HAVING COUNT(DISTINCT v.VacanteID) > 0
          ORDER BY COUNT(DISTINCT v.VacanteID) DESC
        `),
        pool.request().query(`
          SELECT 
            (SELECT COUNT(*) FROM Vacantes WHERE Estado = 'Activa') as VacantesActivas,
            (SELECT COUNT(*) FROM Postulaciones) as TotalPostulaciones,
            (SELECT COUNT(*) FROM Postulaciones WHERE Estado = 'Aprobada') as PostulacionesAprobadas,
            (SELECT COUNT(DISTINCT EmpleadoID) FROM Postulaciones WHERE EmpleadoID IS NOT NULL) as PostulacionesInternas
        `)
      ]);

      const reportData = {
        vacantesActivas: vacantesActivas.recordset,
        postulacionesPorMes: postulacionesPorMes.recordset,
        departamentos: departamentosConVacantes.recordset,
        estadisticas: estadisticasGenerales.recordset[0]
      };

      res.json(reportData);
    } catch (error) {
      console.error('Error al obtener datos de reportes:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

// POST /api/vacantes/reportes/exportar - Exportar reporte
router.post('/reportes/exportar', 
  authenticateToken, 
  authorizeRoles(['rrhh', 'admin']), 
  async (req, res) => {
    try {
      const { formato, tipo } = req.body;
      
      // Aquí implementarías la lógica de exportación
      // Por ejemplo, generar Excel o PDF
      
      res.json({ 
        message: `Reporte ${tipo} exportado exitosamente en formato ${formato}`,
        downloadUrl: `/downloads/reporte_${tipo}_${Date.now()}.${formato}`
      });
    } catch (error) {
      console.error('Error al exportar reporte:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

// ===============================
// RUTAS PARA BÚSQUEDA Y FILTROS
// ===============================

// GET /api/vacantes/buscar - Buscar vacantes con filtros
router.get('/buscar', async (req, res) => {
  try {
    const { 
      cargo, 
      departamento, 
      salarioMin, 
      salarioMax, 
      modalidad, 
      fechaDesde, 
      fechaHasta 
    } = req.query;

    const pool = req.app.locals.db;
    let query = `
      SELECT 
        v.VacanteID as id,
        v.Titulo as cargo,
        d.Nombre as departamento,
        v.Descripcion as descripcion,
        v.SalarioMinimo as salarioMin,
        v.SalarioMaximo as salarioMax,
        v.FechaPublicacion as fechaPublicacion,
        v.FechaCierre as fechaCierre,
        COUNT(p.PostulacionID) as postulaciones
      FROM Vacantes v
      LEFT JOIN Departamentos d ON v.DepartamentoID = d.DepartamentoID
      LEFT JOIN Postulaciones p ON v.VacanteID = p.VacanteID
      WHERE v.Estado = 'Activa'
    `;

    const conditions = [];
    const request = pool.request();

    if (cargo) {
      conditions.push("v.Titulo LIKE @cargo");
      request.input('cargo', sql.NVarChar, `%${cargo}%`);
    }

    if (departamento) {
      conditions.push("d.Nombre LIKE @departamento");
      request.input('departamento', sql.NVarChar, `%${departamento}%`);
    }

    if (salarioMin) {
      conditions.push("v.SalarioMinimo >= @salarioMin");
      request.input('salarioMin', sql.Decimal(10, 2), salarioMin);
    }

    if (salarioMax) {
      conditions.push("v.SalarioMaximo <= @salarioMax");
      request.input('salarioMax', sql.Decimal(10, 2), salarioMax);
    }

    if (fechaDesde) {
      conditions.push("v.FechaPublicacion >= @fechaDesde");
      request.input('fechaDesde', sql.Date, fechaDesde);
    }

    if (fechaHasta) {
      conditions.push("v.FechaPublicacion <= @fechaHasta");
      request.input('fechaHasta', sql.Date, fechaHasta);
    }

    if (conditions.length > 0) {
      query += ` AND ${conditions.join(' AND ')}`;
    }

    query += `
      GROUP BY v.VacanteID, v.Titulo, d.Nombre, v.Descripcion, 
               v.SalarioMinimo, v.SalarioMaximo, v.FechaPublicacion, v.FechaCierre
      ORDER BY v.FechaPublicacion DESC
    `;

    const result = await request.query(query);
    
    const vacantes = result.recordset.map(vacante => ({
      ...vacante,
      fechaPublicacion: vacante.fechaPublicacion?.toISOString().split('T')[0],
      fechaCierre: vacante.fechaCierre?.toISOString().split('T')[0]
    }));

    res.json(vacantes);
  } catch (error) {
    console.error('Error en búsqueda de vacantes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ===============================
// MANEJO DE ERRORES
// ===============================

// Middleware para manejo de errores específicos de rutas de vacantes
router.use((error, req, res, next) => {
  console.error('Error en rutas de vacantes:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({ 
      error: 'Datos de entrada inválidos',
      details: error.message 
    });
  }
  
  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({ 
      error: 'No autorizado' 
    });
  }
  
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Algo salió mal'
  });
});

module.exports = router;