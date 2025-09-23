const sql = require('mssql');

class VacantesController {
  // Obtener todas las vacantes activas
  static async getVacantesActivas(req, res) {
    try {
      const pool = req.app.locals.db;
      const result = await pool.request().query(`
        SELECT 
          v.VacanteID as id,
          v.Titulo as cargo,
          d.Nombre as departamento,
          v.Descripcion as descripcion,
          v.Requisitos as requisitos,
          v.SalarioMinimo as salarioMin,
          v.SalarioMaximo as salarioMax,
          v.FechaPublicacion as fechaPublicacion,
          v.FechaCierre as fechaCierre,
          v.Estado,
          'Santo Domingo' as ubicacion,
          'Híbrido' as modalidad,
          COUNT(p.PostulacionID) as postulaciones,
          STRING_AGG(vr.Requisito, '|') as requisitosArray
        FROM Vacantes v
        LEFT JOIN Departamentos d ON v.DepartamentoID = d.DepartamentoID
        LEFT JOIN Postulaciones p ON v.VacanteID = p.VacanteID
        LEFT JOIN VacanteRequisitos vr ON v.VacanteID = vr.VacanteID
        WHERE v.Estado = 'Activa'
        GROUP BY v.VacanteID, v.Titulo, d.Nombre, v.Descripcion, v.Requisitos, 
                 v.SalarioMinimo, v.SalarioMaximo, v.FechaPublicacion, v.FechaCierre, v.Estado
        ORDER BY v.FechaPublicacion DESC
      `);

      const vacantes = result.recordset.map(vacante => ({
        ...vacante,
        requisitos: vacante.requisitosArray ? vacante.requisitosArray.split('|') : [],
        beneficios: [
          'Seguro médico completo',
          'Flexibilidad horaria',
          'Capacitación continua',
          'Bonos por desempeño'
        ],
        fechaPublicacion: vacante.fechaPublicacion?.toISOString().split('T')[0],
        fechaCierre: vacante.fechaCierre?.toISOString().split('T')[0]
      }));

      res.json(vacantes);
    } catch (error) {
      console.error('Error al obtener vacantes:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Crear nueva vacante (desde solicitud aprobada)
  static async crearVacante(req, res) {
    try {
      const pool = req.app.locals.db;
      const { 
        titulo, 
        descripcion, 
        requisitos, 
        salarioMinimo, 
        salarioMaximo, 
        departamentoID, 
        creadoPor,
        fechaCierre 
      } = req.body;

      const transaction = new sql.Transaction(pool);
      await transaction.begin();

      try {
        // Insertar vacante
        const result = await transaction.request()
          .input('titulo', sql.NVarChar(200), titulo)
          .input('descripcion', sql.NVarChar(2000), descripcion)
          .input('requisitos', sql.NVarChar(2000), Array.isArray(requisitos) ? requisitos.join('\n') : requisitos)
          .input('salarioMinimo', sql.Decimal(10, 2), salarioMinimo)
          .input('salarioMaximo', sql.Decimal(10, 2), salarioMaximo)
          .input('departamentoID', sql.Int, departamentoID)
          .input('creadoPor', sql.Int, creadoPor)
          .input('fechaCierre', sql.Date, fechaCierre)
          .query(`
            INSERT INTO Vacantes (Titulo, Descripcion, Requisitos, SalarioMinimo, SalarioMaximo, 
                                Estado, FechaPublicacion, FechaCierre, DepartamentoID, CreadoPor)
            OUTPUT INSERTED.VacanteID
            VALUES (@titulo, @descripcion, @requisitos, @salarioMinimo, @salarioMaximo,
                    'Activa', GETDATE(), @fechaCierre, @departamentoID, @creadoPor)
          `);

        const vacanteID = result.recordset[0].VacanteID;

        // Insertar requisitos individuales si vienen como array
        if (Array.isArray(requisitos)) {
          for (const requisito of requisitos) {
            await transaction.request()
              .input('vacanteID', sql.Int, vacanteID)
              .input('requisito', sql.NVarChar(500), requisito)
              .query(`
                INSERT INTO VacanteRequisitos (VacanteID, Requisito)
                VALUES (@vacanteID, @requisito)
              `);
          }
        }

        // Registrar en el flujo
        await transaction.request()
          .input('vacanteID', sql.Int, vacanteID)
          .query(`
            INSERT INTO FlujosVacantes (VacanteID, Estado, Fecha, Comentarios)
            VALUES (@vacanteID, 'Publicada', GETDATE(), 'Vacante publicada automáticamente')
          `);

        await transaction.commit();

        res.status(201).json({ 
          message: 'Vacante creada exitosamente', 
          vacanteID 
        });

      } catch (error) {
        await transaction.rollback();
        throw error;
      }

    } catch (error) {
      console.error('Error al crear vacante:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Obtener solicitudes de vacantes
  static async getSolicitudes(req, res) {
    try {
      const pool = req.app.locals.db;
      const { usuarioID, rol } = req.query;

      let whereClause = '';
      if (rol === 'director') {
        whereClause = `WHERE u.UsuarioID = ${usuarioID}`;
      }

      // Como no tienes tabla de solicitudes específica, simularemos con datos
      // En un caso real, crearías una tabla SolicitudesVacantes
      const mockSolicitudes = [
        {
          id: 1,
          cargo: 'Desarrollador Frontend Senior',
          departamento: 'Tecnología',
          solicitante: 'María García',
          fechaSolicitud: '2025-07-15',
          estado: 'Pendiente',
          justificacion: 'Expansión del equipo de desarrollo para nuevos proyectos',
          salarioMin: 80000,
          salarioMax: 120000,
          modalidad: 'Híbrido'
        }
      ];

      res.json(mockSolicitudes);
    } catch (error) {
      console.error('Error al obtener solicitudes:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Crear solicitud de vacante
  static async crearSolicitud(req, res) {
    try {
      // En un sistema real, insertarías en una tabla SolicitudesVacantes
      const mockResponse = {
        id: Date.now(),
        ...req.body,
        estado: 'Pendiente',
        fechaSolicitud: new Date().toISOString().split('T')[0]
      };

      res.status(201).json(mockResponse);
    } catch (error) {
      console.error('Error al crear solicitud:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Aprobar solicitud
  static async aprobarSolicitud(req, res) {
    try {
      const { id } = req.params;
      
      // Aquí actualizarías el estado de la solicitud y crearías la vacante
      res.json({ message: 'Solicitud aprobada exitosamente' });
    } catch (error) {
      console.error('Error al aprobar solicitud:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Obtener postulaciones
  static async getPostulaciones(req, res) {
    try {
      const pool = req.app.locals.db;
      const { usuarioID, rol } = req.query;

      let query = `
        SELECT 
          p.PostulacionID as id,
          p.VacanteID as vacanteId,
          p.NombreCandidato as nombre,
          p.Email as email,
          p.Telefono as telefono,
          p.Estado as estado,
          p.FechaPostulacion as fechaPostulacion,
          p.Observaciones as experiencia,
          v.Titulo as cargoVacante,
          CASE 
            WHEN p.EmpleadoID IS NOT NULL THEN 'Interno'
            ELSE 'Externo'
          END as tipoPostulante,
          'Licenciatura' as educacion,
          75000 as expectativaSalarial
        FROM Postulaciones p
        INNER JOIN Vacantes v ON p.VacanteID = v.VacanteID
      `;

      if (rol === 'colaborador') {
        query += ` WHERE p.EmpleadoID = (SELECT EmpleadoID FROM Usuarios WHERE UsuarioID = ${usuarioID})`;
      }

      query += ` ORDER BY p.FechaPostulacion DESC`;

      const result = await pool.request().query(query);

      const postulaciones = result.recordset.map(postulacion => ({
        ...postulacion,
        fechaPostulacion: postulacion.fechaPostulacion?.toISOString().split('T')[0]
      }));

      res.json(postulaciones);
    } catch (error) {
      console.error('Error al obtener postulaciones:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Crear postulación
  static async crearPostulacion(req, res) {
    try {
      const pool = req.app.locals.db;
      const { 
        vacanteId, 
        nombre, 
        email, 
        telefono, 
        experiencia, 
        educacion, 
        expectativaSalarial,
        empleadoID 
      } = req.body;

      const transaction = new sql.Transaction(pool);
      await transaction.begin();

      try {
        // Insertar postulación
        const result = await transaction.request()
          .input('vacanteId', sql.Int, vacanteId)
          .input('empleadoID', sql.Int, empleadoID || null)
          .input('nombre', sql.NVarChar(200), nombre)
          .input('email', sql.NVarChar(255), email)
          .input('telefono', sql.NVarChar(50), telefono)
          .input('observaciones', sql.NVarChar(1000), `Experiencia: ${experiencia}\nEducación: ${educacion}\nExpectativa salarial: ${expectativaSalarial}`)
          .query(`
            INSERT INTO Postulaciones (VacanteID, EmpleadoID, NombreCandidato, Email, Telefono, 
                                     Estado, FechaPostulacion, Observaciones)
            OUTPUT INSERTED.PostulacionID
            VALUES (@vacanteId, @empleadoID, @nombre, @email, @telefono,
                    'Recibida', GETDATE(), @observaciones)
          `);

        const postulacionID = result.recordset[0].PostulacionID;

        // Registrar en el flujo
        await transaction.request()
          .input('postulacionID', sql.Int, postulacionID)
          .query(`
            INSERT INTO FlujosPostulaciones (PostulacionID, Estado, Fecha, Comentarios)
            VALUES (@postulacionID, 'Recibida', GETDATE(), 'Postulación recibida')
          `);

        await transaction.commit();

        res.status(201).json({ 
          message: 'Postulación enviada exitosamente', 
          postulacionID 
        });

      } catch (error) {
        await transaction.rollback();
        throw error;
      }

    } catch (error) {
      console.error('Error al crear postulación:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Obtener estadísticas para el dashboard
  static async getEstadisticas(req, res) {
    try {
      const pool = req.app.locals.db;
      
      const [vacantesResult, solicitudesResult, postulacionesResult] = await Promise.all([
        pool.request().query(`SELECT COUNT(*) as total FROM Vacantes WHERE Estado = 'Activa'`),
        pool.request().query(`SELECT COUNT(*) as total FROM Vacantes WHERE Estado = 'Pendiente'`), // Simulated
        pool.request().query(`SELECT COUNT(*) as total FROM Postulaciones`)
      ]);

      const stats = {
        vacantesActivas: vacantesResult.recordset[0].total,
        solicitudesPendientes: 1, // Mock data
        totalPostulaciones: postulacionesResult.recordset[0].total,
        tasaAprobacion: 75 // Mock calculation
      };

      res.json(stats);
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Obtener departamentos
  static async getDepartamentos(req, res) {
    try {
      const pool = req.app.locals.db;
      const result = await pool.request().query(`
        SELECT DepartamentoID as id, Nombre as nombre, Descripcion as descripcion
        FROM Departamentos 
        WHERE Estado = 1
        ORDER BY Nombre
      `);

      res.json(result.recordset);
    } catch (error) {
      console.error('Error al obtener departamentos:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Obtener usuarios/empleados
  static async getUsuarios(req, res) {
    try {
      const pool = req.app.locals.db;
      const result = await pool.request().query(`
        SELECT 
          u.UsuarioID as id,
          e.NOMBRE + ' ' + e.APELLIDO as nombre,
          u.Email as email,
          u.Rol as rol,
          d.Nombre as departamento
        FROM Usuarios u
        INNER JOIN Empleados e ON u.EmpleadoID = e.EmpleadoID
        LEFT JOIN Departamentos d ON e.DEPARTAMENTOID = d.DepartamentoID
        WHERE u.Estado = 1
        ORDER BY e.NOMBRE, e.APELLIDO
      `);

      res.json(result.recordset);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}

module.exports = VacantesController;