// backend/routes/reportes.js
import express from 'express';
import {
  verificarToken,
  getReportesGuardados,
  guardarReporte,
  actualizarReporte,
  eliminarReporte,
  getPredefinidos,
  ejecutarQuery,
  validarQuery,
  getMetadata,
  exportarReporte,
  getEstadisticas,
  getHistorialReportes,
  getPlantillas,
  limpiarCache,
  verificarConexionDB
} from '../controllers/reportesController.js';

const router = express.Router();

// ===================== MIDDLEWARE GLOBAL =====================
// Aplicar verificación de token a todas las rutas
router.use(verificarToken);

// ===================== REPORTES GUARDADOS =====================
// GET /api/reportes/guardados - Obtener todos los reportes guardados
router.get('/guardados', getReportesGuardados);

// POST /api/reportes/guardados - Crear un nuevo reporte
router.post('/guardados', guardarReporte);

// PUT /api/reportes/guardados/:id - Actualizar un reporte existente
router.put('/guardados/:id', actualizarReporte);

// DELETE /api/reportes/guardados/:id - Eliminar un reporte
router.delete('/guardados/:id', eliminarReporte);

// GET /api/reportes/guardados/:id - Obtener un reporte específico
router.get('/guardados/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        r.ReporteID as id,
        r.Nombre as nombre,
        r.Origen as origen,
        r.Descripcion as descripcion,
        r.Configuracion as configuracion,
        r.FechaCreacion as fechaCreacion,
        r.FechaModificacion as fechaModificacion,
        u.Username as modificadoPor,
        r.EsPredeterminado as predeterminado,
        r.EliminarDuplicados as eliminarDuplicados
      FROM ReportesPersonalizados r
      LEFT JOIN Usuarios u ON r.ModificadoPor = u.UsuarioID
      WHERE r.ReporteID = ? AND r.Estado = 1
    `;

    const { executeQuery } = await import('../db.js');
    const result = await executeQuery(query, [id]);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Reporte no encontrado' });
    }

    const reporte = result.recordset[0];
    reporte.configuracion = reporte.configuracion ? JSON.parse(reporte.configuracion) : null;
    reporte.fechaCreacion = reporte.fechaCreacion?.toISOString().split('T')[0];
    reporte.fechaModificacion = reporte.fechaModificacion?.toISOString().split('T')[0];

    res.json(reporte);

  } catch (error) {
    console.error('Error obteniendo reporte:', error);
    res.status(500).json({ 
      error: 'Error al obtener el reporte',
      details: error.message 
    });
  }
});

// ===================== REPORTES PREDEFINIDOS =====================
// GET /api/reportes/predefinidos/:tipo - Ejecutar reporte predefinido
router.get('/predefinidos/:tipo', getPredefinidos);

// GET /api/reportes/predefinidos - Listar tipos de reportes predefinidos disponibles
router.get('/predefinidos', (req, res) => {
  const reportesDisponibles = {
    empleados_por_departamento: {
      nombre: 'Empleados por Departamento',
      descripcion: 'Distribución de empleados por departamento con salario promedio',
      parametros: []
    },
    vacantes_abiertas: {
      nombre: 'Vacantes Abiertas',
      descripcion: 'Listado de vacantes abiertas agrupadas por puesto',
      parametros: []
    },
    contrataciones_mensuales: {
      nombre: 'Contrataciones Mensuales',
      descripcion: 'Contrataciones por mes en los últimos 12 meses',
      parametros: []
    }
  };

  res.json({
    reportes: reportesDisponibles,
    total: Object.keys(reportesDisponibles).length
  });
});

// ===================== SQL PERSONALIZADO =====================
// POST /api/reportes/custom - Ejecutar consulta SQL personalizada
router.post('/custom', ejecutarQuery);

// POST /api/reportes/validar - Validar consulta SQL sin ejecutarla
router.post('/validar', validarQuery);

// ===================== METADATA Y ESTRUCTURA =====================
// GET /api/reportes/metadata - Obtener estructura de la base de datos
router.get('/metadata', getMetadata);

// GET /api/reportes/tablas - Obtener solo nombres de tablas
router.get('/tablas', async (req, res) => {
  try {
    const { getConnection } = await import('../db.js');
    const connection = await getConnection();
    
    const result = await connection.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'dbo' 
        AND TABLE_TYPE = 'BASE TABLE'
        AND TABLE_NAME NOT LIKE 'sys%'
      ORDER BY TABLE_NAME
    `);

    const tablas = result.recordset.map(row => row.TABLE_NAME);
    
    res.json({
      tablas,
      total: tablas.length
    });

  } catch (error) {
    console.error('Error obteniendo tablas:', error);
    res.status(500).json({ 
      error: 'Error al obtener las tablas',
      details: error.message 
    });
  }
});

// GET /api/reportes/columnas/:tabla - Obtener columnas de una tabla específica
router.get('/columnas/:tabla', async (req, res) => {
  try {
    const { tabla } = req.params;
    const { getConnection } = await import('../db.js');
    const connection = await getConnection();
    
    const result = await connection.request().query(`
      SELECT 
        COLUMN_NAME as nombre,
        DATA_TYPE as tipo,
        IS_NULLABLE as nullable,
        COLUMN_DEFAULT as valorDefault
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = '${tabla}' 
        AND TABLE_SCHEMA = 'dbo'
      ORDER BY ORDINAL_POSITION
    `);

    const columnas = result.recordset.map(col => ({
      ...col,
      nullable: col.nullable === 'YES'
    }));
    
    res.json({
      tabla,
      columnas,
      total: columnas.length
    });

  } catch (error) {
    console.error('Error obteniendo columnas:', error);
    res.status(500).json({ 
      error: 'Error al obtener las columnas',
      details: error.message 
    });
  }
});

// ===================== EXPORTACIÓN =====================
// POST /api/reportes/export - Exportar datos en diferentes formatos
router.post('/export', exportarReporte);

// POST /api/reportes/export/preview - Vista previa de exportación
router.post('/export/preview', (req, res) => {
  try {
    const { formato, data } = req.body;
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: 'No hay datos para previsualizar' });
    }

    const preview = {
      formato,
      totalRegistros: data.length,
      columnas: Object.keys(data[0]),
      primerasFilas: data.slice(0, 5),
      tamanioEstimado: JSON.stringify(data).length
    };

    res.json(preview);

  } catch (error) {
    console.error('Error en preview de exportación:', error);
    res.status(500).json({ 
      error: 'Error al generar vista previa',
      details: error.message 
    });
  }
});

// ===================== ESTADÍSTICAS Y MONITOREO =====================
// GET /api/reportes/estadisticas - Obtener estadísticas generales
router.get('/estadisticas', getEstadisticas);

// GET /api/reportes/historial - Obtener historial de ejecuciones
router.get('/historial', getHistorialReportes);

// GET /api/reportes/plantillas - Obtener plantillas predefinidas
router.get('/plantillas', getPlantillas);

// ===================== UTILIDADES =====================
// POST /api/reportes/cache/limpiar - Limpiar cache del sistema
router.post('/cache/limpiar', limpiarCache);

// GET /api/reportes/sistema/estado - Verificar estado del sistema
router.get('/sistema/estado', verificarConexionDB);

// GET /api/reportes/sistema/info - Información del sistema
router.get('/sistema/info', (req, res) => {
  res.json({
    version: '2.0.0',
    nombre: 'Sistema de Reportes RRHH',
    caracteristicas: [
      'Drag & Drop Visual Builder',
      'SQL Personalizado',
      'Exportación múltiple formato',
      'Reportes guardados',
      'Validación de consultas',
      'Historial de ejecuciones'
    ],
    limitaciones: {
      maxQueryLength: 5000,
      maxResults: 10000,
      formatosExport: ['csv', 'excel', 'pdf', 'json']
    },
    usuario: {
      id: req.user.id,
      role: req.user.role || 'user'
    },
    timestamp: new Date().toISOString()
  });
});

// ===================== MANEJO DE ERRORES =====================
// Middleware para manejo de errores no capturados
router.use((error, req, res, next) => {
  console.error('Error no manejado en rutas de reportes:', error);
  
  res.status(500).json({
    error: 'Error interno del servidor',
    details: process.env.NODE_ENV === 'development' ? error.message : 'Contacte al administrador',
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
});

// Ruta catch-all para rutas no encontradas
router.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl,
    method: req.method,
    rutasDisponibles: [
      'GET /guardados',
      'POST /guardados', 
      'PUT /guardados/:id',
      'DELETE /guardados/:id',
      'GET /predefinidos/:tipo',
      'POST /custom',
      'POST /validar',
      'GET /metadata',
      'POST /export',
      'GET /estadisticas',
      'GET /historial',
      'GET /plantillas'
    ]
  });
});

export default router;