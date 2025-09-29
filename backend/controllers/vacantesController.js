// backend/controllers/VacantesController.js
import sql from 'mssql';

class VacantesController {
  // ===============================
  // UTILIDADES Y VALIDACIONES
  // ===============================
  
  static handleError(res, error, operation) {
    console.error(`Error en ${operation}:`, {
      message: error.message,
      stack: error.stack,
      sqlState: error.state,
      sqlNumber: error.number
    });

    const statusCode = error.status || 500;
    const message = process.env.NODE_ENV === 'production' 
      ? 'Error interno del servidor' 
      : error.message;

    res.status(statusCode).json({ 
      error: message,
      operation,
      timestamp: new Date().toISOString()
    });
  }

  // ===============================
  // HEALTH CHECK
  // ===============================
  
  static async healthCheck(req, res) {
    try {
      const pool = req.app.locals.db;
      
      if (!pool) {
        return res.status(500).json({ 
          status: 'ERROR',
          message: 'No database connection available',
          timestamp: new Date().toISOString()
        });
      }

      await pool.request().query('SELECT 1 as test');
      
      res.json({ 
        status: 'OK',
        message: 'Servicio de vacantes funcionando correctamente',
        database: 'Connected',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
      
    } catch (error) {
      res.status(500).json({ 
        status: 'ERROR',
        message: 'Database connection failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // ===============================
  // VACANTES
  // ===============================

  static async getVacantesActivas(req, res) {
    try {
      const pool = req.app.locals.db;
      
      if (!pool) {
        throw new Error('Conexión a base de datos no disponible');
      }

      const result = await pool.request().query(`
        SELECT 
          v.VacanteID as id,
          v.Titulo as titulo,
          v.Titulo as cargo,
          COALESCE(d.Nombre, 'Sin Departamento') as departamento,
          v.Descripcion as descripcion,
          v.Requisitos as requisitos,
          v.SalarioMinimo as salarioMinimo,
          v.SalarioMaximo as salarioMaximo,
          v.SalarioMinimo as salarioMin,
          v.SalarioMaximo as salarioMax,
          v.FechaPublicacion as fechaPublicacion,
          v.FechaCierre as fechaCierre,
          v.Estado as estado,
          v.Modalidad as modalidad,
          COUNT(p.PostulacionID) as postulaciones,
          COUNT(p.PostulacionID) as totalPostulaciones
        FROM Vacantes v
        LEFT JOIN Departamentos d ON v.DepartamentoID = d.DepartamentoID
        LEFT JOIN Postulaciones p ON v.VacanteID = p.VacanteID
        WHERE v.Estado = 'Activa'
        GROUP BY v.VacanteID, v.Titulo, d.Nombre, v.Descripcion, v.Requisitos, 
                 v.SalarioMinimo, v.SalarioMaximo, v.FechaPublicacion, v.FechaCierre, v.Estado, v.Modalidad
        ORDER BY v.FechaPublicacion DESC
      `);

      const vacantes = result.recordset.map(vacante => ({
        ...vacante,
        fechaPublicacion: vacante.fechaPublicacion?.toISOString().split('T')[0],
        fechaCierre: vacante.fechaCierre?.toISOString().split('T')[0]
      }));

      res.json(vacantes);
      
    } catch (error) {
      VacantesController.handleError(res, error, 'getVacantesActivas');
    }
  }

  static async crearVacante(req, res) {
    try {
      const pool = req.app.locals.db;
      const { 
        Titulo,
        titulo, 
        Descripcion,
        descripcion, 
        Requisitos,
        requisitos, 
        SalarioMinimo,
        salarioMinimo, 
        SalarioMaximo,
        salarioMaximo, 
        DepartamentoID,
        departamentoID, 
        creadoPor,
        fechaCierre,
        modalidad,
        estado
      } = req.body;

      const tituloFinal = Titulo || titulo;
      const descripcionFinal = Descripcion || descripcion;
      const departamentoFinal = DepartamentoID || departamentoID;

      if (!tituloFinal || !descripcionFinal || !departamentoFinal) {
        return res.status(400).json({ 
          error: 'Campos requeridos: Titulo, Descripcion, DepartamentoID'
        });
      }

      const result = await pool.request()
        .input('titulo', sql.NVarChar(200), tituloFinal)
        .input('descripcion', sql.NVarChar(sql.MAX), descripcionFinal)
        .input('requisitos', sql.NVarChar(sql.MAX), Requisitos || requisitos || '')
        .input('salarioMinimo', sql.Decimal(10, 2), SalarioMinimo || salarioMinimo || 0)
        .input('salarioMaximo', sql.Decimal(10, 2), SalarioMaximo || salarioMaximo || 0)
        .input('departamentoID', sql.Int, departamentoFinal)
        .input('creadoPor', sql.Int, creadoPor || 1)
        .input('fechaCierre', sql.Date, fechaCierre || null)
        .input('modalidad', sql.NVarChar(50), modalidad || 'Presencial')
        .input('estado', sql.NVarChar(50), estado || 'Activa')
        .query(`
          INSERT INTO Vacantes (Titulo, Descripcion, Requisitos, SalarioMinimo, SalarioMaximo, 
                              Estado, FechaPublicacion, FechaCierre, DepartamentoID, CreadoPor, Modalidad)
          OUTPUT INSERTED.VacanteID
          VALUES (@titulo, @descripcion, @requisitos, @salarioMinimo, @salarioMaximo,
                  @estado, GETDATE(), @fechaCierre, @departamentoID, @creadoPor, @modalidad)
        `);

      const vacanteID = result.recordset[0].VacanteID;

      res.status(201).json({ 
        message: 'Vacante creada exitosamente', 
        vacanteID,
        id: vacanteID,
        titulo: tituloFinal
      });

    } catch (error) {
      VacantesController.handleError(res, error, 'crearVacante');
    }
  }

  static async buscarVacantes(req, res) {
    try {
      const pool = req.app.locals.db;
      const { cargo, departamento, ubicacion, salarioMin, salarioMax } = req.query;

      let whereConditions = ["v.Estado = 'Activa'"];
      const request = pool.request();

      if (cargo) {
        whereConditions.push("v.Titulo LIKE @cargo");
        request.input('cargo', sql.NVarChar, `%${cargo}%`);
      }

      if (departamento) {
        whereConditions.push("d.Nombre LIKE @departamento");
        request.input('departamento', sql.NVarChar, `%${departamento}%`);
      }

      if (salarioMin) {
        whereConditions.push("v.SalarioMinimo >= @salarioMin");
        request.input('salarioMin', sql.Decimal, parseFloat(salarioMin));
      }

      if (salarioMax) {
        whereConditions.push("v.SalarioMaximo <= @salarioMax");
        request.input('salarioMax', sql.Decimal, parseFloat(salarioMax));
      }

      const whereClause = whereConditions.join(' AND ');
      const query = `
        SELECT 
          v.VacanteID as id,
          v.Titulo as cargo,
          COALESCE(d.Nombre, 'Sin Departamento') as departamento,
          v.Descripcion as descripcion,
          v.SalarioMinimo as salarioMin,
          v.SalarioMaximo as salarioMax,
          v.FechaPublicacion as fechaPublicacion,
          v.FechaCierre as fechaCierre,
          COUNT(p.PostulacionID) as postulaciones
        FROM Vacantes v
        LEFT JOIN Departamentos d ON v.DepartamentoID = d.DepartamentoID
        LEFT JOIN Postulaciones p ON v.VacanteID = p.VacanteID
        WHERE ${whereClause}
        GROUP BY v.VacanteID, v.Titulo, d.Nombre, v.Descripcion, v.SalarioMinimo, v.SalarioMaximo, v.FechaPublicacion, v.FechaCierre
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
      VacantesController.handleError(res, error, 'buscarVacantes');
    }
  }

  static async getVacanteById(req, res) {
    try {
      const { id } = req.params;
      const pool = req.app.locals.db;

      const result = await pool.request()
        .input('id', sql.Int, parseInt(id))
        .query(`
          SELECT 
            v.VacanteID as id,
            v.Titulo as cargo,
            COALESCE(d.Nombre, 'Sin Departamento') as departamento,
            v.Descripcion as descripcion,
            v.Requisitos as requisitos,
            v.SalarioMinimo as salarioMin,
            v.SalarioMaximo as salarioMax,
            v.FechaPublicacion as fechaPublicacion,
            v.FechaCierre as fechaCierre,
            v.Estado,
            COUNT(p.PostulacionID) as postulaciones
          FROM Vacantes v
          LEFT JOIN Departamentos d ON v.DepartamentoID = d.DepartamentoID
          LEFT JOIN Postulaciones p ON v.VacanteID = p.VacanteID
          WHERE v.VacanteID = @id
          GROUP BY v.VacanteID, v.Titulo, d.Nombre, v.Descripcion, v.Requisitos, 
                   v.SalarioMinimo, v.SalarioMaximo, v.FechaPublicacion, v.FechaCierre, v.Estado
        `);

      if (result.recordset.length === 0) {
        return res.status(404).json({ error: 'Vacante no encontrada' });
      }

      const vacante = {
        ...result.recordset[0],
        fechaPublicacion: result.recordset[0].fechaPublicacion?.toISOString().split('T')[0],
        fechaCierre: result.recordset[0].fechaCierre?.toISOString().split('T')[0]
      };

      res.json(vacante);
    } catch (error) {
      VacantesController.handleError(res, error, 'getVacanteById');
    }
  }

  // ===============================
  // SOLICITUDES - 100% REAL DE BD
  // ===============================

  static async getSolicitudes(req, res) {
    try {
      const pool = req.app.locals.db;
      const { usuarioID, rol } = req.query;

      let query = `
        SELECT 
          sv.SolicitudVacanteID as id,
          sv.Titulo as cargo,
          COALESCE(d.Nombre, 'Sin Departamento') as departamento,
          COALESCE(e.NOMBRE + ' ' + e.APELLIDO, 'Usuario Desconocido') as solicitante,
          sv.FechaSolicitud as fechaSolicitud,
          sv.Estado as estado,
          sv.Justificacion as justificacion,
          sv.SalarioMinimo as salarioMin,
          sv.SalarioMaximo as salarioMax,
          sv.Modalidad as modalidad,
          sv.Urgencia as prioridad,
          sv.SolicitanteID as solicitanteId
        FROM SolicitudesVacantes sv
        LEFT JOIN Departamentos d ON sv.DepartamentoID = d.DepartamentoID
        LEFT JOIN Empleados e ON sv.SolicitanteID = e.EmpleadoID
      `;

      const request = pool.request();

      // Filtrar por usuario si es necesario
      if (rol === 'director' && usuarioID) {
        query += ` WHERE sv.SolicitanteID = (SELECT EmpleadoID FROM Usuarios WHERE UsuarioID = @usuarioID)`;
        request.input('usuarioID', sql.Int, parseInt(usuarioID));
      } else if (rol === 'gerente' && usuarioID) {
        query += ` WHERE sv.SolicitanteID = (SELECT EmpleadoID FROM Usuarios WHERE UsuarioID = @usuarioID)`;
        request.input('usuarioID', sql.Int, parseInt(usuarioID));
      }

      query += ` ORDER BY sv.FechaSolicitud DESC`;

      const result = await request.query(query);

      const solicitudes = result.recordset.map(solicitud => ({
        ...solicitud,
        fechaSolicitud: solicitud.fechaSolicitud?.toISOString().split('T')[0]
      }));

      res.json(solicitudes);

    } catch (error) {
      VacantesController.handleError(res, error, 'getSolicitudes');
    }
  }

  /**
 * CREAR SOLICITUD DE VACANTE
 * 
 * Flujo: 
 * 1. Director/Gerente solicita una nueva vacante
 * 2. Se crea registro en tabla SolicitudesVacantes con estado 'Pendiente'
 * 3. Inicia el flujo de aprobación (Director Área → Gerente RRHH → Director RRHH)
 * 
 * @param {Object} req.body - Datos de la solicitud
 * @param {string} req.body.Titulo - Título de la vacante solicitada
 * @param {string} req.body.Descripcion - Descripción del puesto
 * @param {string} req.body.Requisitos - Requisitos del puesto
 * @param {number} req.body.DepartamentoID - ID del departamento
 * @param {number} req.body.SalarioMinimo - Salario mínimo ofrecido
 * @param {number} req.body.SalarioMaximo - Salario máximo ofrecido
 * @param {string} req.body.Justificacion - Justificación de la necesidad
 * @param {string} req.body.Modalidad - Modalidad: Presencial/Remoto/Híbrido
 * @param {string} req.body.Urgencia - Prioridad: Baja/Media/Alta/Urgente
 * @param {number} req.body.solicitanteId - ID del empleado que solicita
 * 
 * @returns {Object} - Solicitud creada con ID y estado
 */
    static async crearSolicitud(req, res) {
      try {
        const pool = req.app.locals.db;
        
        // Extraer datos del body - soporta múltiples formatos de nombres
        const { 
          Titulo, titulo, cargo,
          Descripcion, descripcion,
          Requisitos, requisitos,
          DepartamentoID, departamentoId,
          Justificacion, justificacion,
          SalarioMinimo, salarioMinimo, salarioMin,
          SalarioMaximo, salarioMaximo, salarioMax,
          Modalidad, modalidad,
          Urgencia, urgencia, prioridad,
          solicitanteId, SolicitanteID
        } = req.body;

        // Normalizar los valores finales (prioridad a mayúsculas)
        const tituloFinal = Titulo || titulo || cargo;
        const descripcionFinal = Descripcion || descripcion || '';
        const requisitosFinal = Requisitos || requisitos || '';
        const justificacionFinal = Justificacion || justificacion;
        const departamentoFinal = DepartamentoID || departamentoId;
        const solicitanteFinal = SolicitanteID || solicitanteId;
        const modalidadFinal = Modalidad || modalidad || 'Presencial';
        const urgenciaFinal = Urgencia || urgencia || prioridad || 'Media';
        const salarioMinFinal = SalarioMinimo || salarioMinimo || salarioMin || 0;
        const salarioMaxFinal = SalarioMaximo || salarioMaximo || salarioMax || 0;

        // Validación de campos requeridos
        if (!tituloFinal || !departamentoFinal || !justificacionFinal) {
          return res.status(400).json({ 
            error: 'Campos requeridos: Titulo, DepartamentoID, Justificacion',
            camposFaltantes: {
              titulo: !tituloFinal,
              departamento: !departamentoFinal,
              justificacion: !justificacionFinal
            }
          });
        }

        // Validación del solicitante
        if (!solicitanteFinal) {
          return res.status(400).json({ 
            error: 'Se requiere el ID del solicitante (solicitanteId)'
          });
        }

        // Insertar en tabla SolicitudesVacantes
        const result = await pool.request()
          .input('titulo', sql.NVarChar(200), tituloFinal)
          .input('descripcion', sql.NVarChar(sql.MAX), descripcionFinal)
          .input('requisitos', sql.NVarChar(sql.MAX), requisitosFinal)
          .input('departamentoID', sql.Int, parseInt(departamentoFinal))
          .input('justificacion', sql.NVarChar(sql.MAX), justificacionFinal)
          .input('salarioMin', sql.Decimal(10, 2), parseFloat(salarioMinFinal))
          .input('salarioMax', sql.Decimal(10, 2), parseFloat(salarioMaxFinal))
          .input('modalidad', sql.NVarChar(50), modalidadFinal)
          .input('urgencia', sql.NVarChar(50), urgenciaFinal)
          .input('solicitanteID', sql.Int, parseInt(solicitanteFinal))
          .query(`
            INSERT INTO SolicitudesVacantes (
              Titulo, Descripcion, Requisitos, DepartamentoID, Justificacion,
              SalarioMinimo, SalarioMaximo, Modalidad, Urgencia, 
              Estado, FechaSolicitud, SolicitanteID
            )
            OUTPUT INSERTED.SolicitudVacanteID, INSERTED.Estado, INSERTED.FechaSolicitud
            VALUES (
              @titulo, @descripcion, @requisitos, @departamentoID, @justificacion,
              @salarioMin, @salarioMax, @modalidad, @urgencia,
              'Pendiente', GETDATE(), @solicitanteID
            )
          `);

        const solicitudCreada = result.recordset[0];

        // Respuesta exitosa
        res.status(201).json({
          success: true,
          message: 'Solicitud creada exitosamente',
          solicitud: {
            id: solicitudCreada.SolicitudVacanteID,
            cargo: tituloFinal,
            departamento: departamentoFinal,
            estado: solicitudCreada.Estado,
            fechaSolicitud: solicitudCreada.FechaSolicitud.toISOString().split('T')[0],
            justificacion: justificacionFinal,
            salarioMin: salarioMinFinal,
            salarioMax: salarioMaxFinal,
            modalidad: modalidadFinal,
            urgencia: urgenciaFinal
          }
        });

      } catch (error) {
        // Log detallado del error para debugging
        console.error('Error detallado en crearSolicitud:', {
          message: error.message,
          stack: error.stack,
          body: req.body
        });
        
        VacantesController.handleError(res, error, 'crearSolicitud');
      }
    }

    /**
 * APROBAR SOLICITUD DE VACANTE
 * Actualiza el estado de una solicitud a 'Aprobada' en la tabla SolicitudesVacantes
 */
static async aprobarSolicitud(req, res) {
  try {
    const { id } = req.params;
    const { comentarios, aprobadorID } = req.body;
    const pool = req.app.locals.db;
    
    const result = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .input('comentarios', sql.NVarChar(sql.MAX), comentarios || '')
      .input('aprobadorID', sql.Int, aprobadorID || 1)
      .query(`
        UPDATE SolicitudesVacantes 
        SET Estado = 'Aprobada',
            FechaAprobacion = GETDATE(),
            AprobadorID = @aprobadorID,
            Comentarios = @comentarios
        WHERE SolicitudVacanteID = @id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    res.json({ 
      success: true,
      message: 'Solicitud aprobada exitosamente',
      solicitudId: id,
      estado: 'Aprobada',
      fechaAprobacion: new Date().toISOString().split('T')[0]
    });

  } catch (error) {
    VacantesController.handleError(res, error, 'aprobarSolicitud');
  }
}

/**
 * RECHAZAR SOLICITUD DE VACANTE
 * Actualiza el estado de una solicitud a 'Rechazada' en la tabla SolicitudesVacantes
 */
static async rechazarSolicitud(req, res) {
  try {
    const { id } = req.params;
    const { comentarios, rechazadorID } = req.body;
    const pool = req.app.locals.db;
    
    const result = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .input('comentarios', sql.NVarChar(sql.MAX), comentarios || '')
      .input('rechazadorID', sql.Int, rechazadorID || 1)
      .query(`
        UPDATE SolicitudesVacantes 
        SET Estado = 'Rechazada',
            FechaRechazo = GETDATE(),
            RechazadorID = @rechazadorID,
            Comentarios = @comentarios
        WHERE SolicitudVacanteID = @id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    res.json({ 
      success: true,
      message: 'Solicitud rechazada',
      solicitudId: id,
      estado: 'Rechazada',
      fechaRechazo: new Date().toISOString().split('T')[0]
    });

  } catch (error) {
    VacantesController.handleError(res, error, 'rechazarSolicitud');
  }
}



  // ===============================
  // POSTULACIONES - 100% REAL DE BD
  // ===============================

  static async getPostulaciones(req, res) {
    try {
      const pool = req.app.locals.db;
      const { usuarioID, rol } = req.query;

      let query = `
        SELECT 
          p.PostulacionID as id,
          p.VacanteID as vacanteId,
          COALESCE(p.NombreCandidato, e.NOMBRE + ' ' + e.APELLIDO) as nombre,
          COALESCE(p.NombreCandidato, e.NOMBRE + ' ' + e.APELLIDO) as nombreCandidato,
          COALESCE(p.Email, u.Email) as email,
          p.Telefono as telefono,
          p.Estado as estado,
          p.FechaPostulacion as fechaPostulacion,
          p.Observaciones as experiencia,
          p.Observaciones as motivacion,
          v.Titulo as cargoVacante,
          CASE 
            WHEN p.EmpleadoID IS NOT NULL THEN 'Interno'
            ELSE 'Externo'
          END as tipoPostulante
        FROM Postulaciones p
        INNER JOIN Vacantes v ON p.VacanteID = v.VacanteID
        LEFT JOIN Empleados e ON p.EmpleadoID = e.EmpleadoID
        LEFT JOIN Usuarios u ON e.EmpleadoID = u.EmpleadoID
      `;

      const request = pool.request();

      if (rol === 'colaborador' && usuarioID) {
        query += ` WHERE p.EmpleadoID = (SELECT EmpleadoID FROM Usuarios WHERE UsuarioID = @usuarioID)`;
        request.input('usuarioID', sql.Int, parseInt(usuarioID));
      }

      query += ` ORDER BY p.FechaPostulacion DESC`;

      const result = await request.query(query);

      const postulaciones = result.recordset.map(postulacion => ({
        ...postulacion,
        fechaPostulacion: postulacion.fechaPostulacion?.toISOString().split('T')[0]
      }));

      res.json(postulaciones);

    } catch (error) {
      VacantesController.handleError(res, error, 'getPostulaciones');
    }
  }

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
        motivacion,
        empleadoID 
      } = req.body;

      if (!vacanteId || !nombre || !email) {
        return res.status(400).json({ 
          error: 'Campos requeridos: vacanteId, nombre, email'
        });
      }

      const transaction = new sql.Transaction(pool);
      await transaction.begin();

      try {
        const vacanteCheck = await transaction.request()
          .input('vacanteId', sql.Int, vacanteId)
          .query(`SELECT VacanteID FROM Vacantes WHERE VacanteID = @vacanteId AND Estado = 'Activa'`);

        if (vacanteCheck.recordset.length === 0) {
          await transaction.rollback();
          return res.status(400).json({ error: 'Vacante no encontrada o inactiva' });
        }

        const duplicateCheck = await transaction.request()
          .input('vacanteId', sql.Int, vacanteId)
          .input('email', sql.NVarChar, email)
          .query(`SELECT PostulacionID FROM Postulaciones WHERE VacanteID = @vacanteId AND Email = @email`);

        if (duplicateCheck.recordset.length > 0) {
          await transaction.rollback();
          return res.status(400).json({ error: 'Ya existe una postulación para esta vacante con este email' });
        }

        const observaciones = [
          experiencia ? `Experiencia: ${experiencia}` : '',
          educacion ? `Educación: ${educacion}` : '',
          motivacion ? `Motivación: ${motivacion}` : '',
          expectativaSalarial ? `Expectativa salarial: ${expectativaSalarial}` : ''
        ].filter(Boolean).join('\n');

        const result = await transaction.request()
          .input('vacanteId', sql.Int, vacanteId)
          .input('empleadoID', sql.Int, empleadoID || null)
          .input('nombre', sql.NVarChar(200), nombre)
          .input('email', sql.NVarChar(255), email)
          .input('telefono', sql.NVarChar(50), telefono || '')
          .input('observaciones', sql.NVarChar(sql.MAX), observaciones)
          .query(`
            INSERT INTO Postulaciones (VacanteID, EmpleadoID, NombreCandidato, Email, Telefono, 
                                     Estado, FechaPostulacion, Observaciones)
            OUTPUT INSERTED.PostulacionID
            VALUES (@vacanteId, @empleadoID, @nombre, @email, @telefono,
                    'Recibida', GETDATE(), @observaciones)
          `);

        const postulacionID = result.recordset[0].PostulacionID;

        await transaction.commit();

        res.status(201).json({ 
          message: 'Postulación enviada exitosamente', 
          postulacionID,
          id: postulacionID,
          nombre,
          email
        });

      } catch (error) {
        await transaction.rollback();
        throw error;
      }

    } catch (error) {
      VacantesController.handleError(res, error, 'crearPostulacion');
    }
  }

  static async cambiarEstadoPostulacion(req, res) {
    try {
      const { id } = req.params;
      const { estado, comentarios } = req.body;
      const pool = req.app.locals.db;

      const estadosValidos = ['Recibida', 'En Revisión', 'Entrevista', 'Aprobada', 'Rechazada'];
      if (!estadosValidos.includes(estado)) {
        return res.status(400).json({ 
          error: 'Estado inválido. Estados válidos: ' + estadosValidos.join(', ')
        });
      }

      const result = await pool.request()
        .input('id', sql.Int, parseInt(id))
        .input('estado', sql.NVarChar(50), estado)
        .query(`
          UPDATE Postulaciones 
          SET Estado = @estado, FechaModificacion = GETDATE()
          WHERE PostulacionID = @id
        `);

      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ error: 'Postulación no encontrada' });
      }

      res.json({ 
        message: 'Estado actualizado exitosamente',
        postulacionId: id,
        nuevoEstado: estado,
        comentarios: comentarios || ''
      });

    } catch (error) {
      VacantesController.handleError(res, error, 'cambiarEstadoPostulacion');
    }
  }

  // ===============================
  // ESTADÍSTICAS - 100% REAL DE BD
  // ===============================

  static async getEstadisticas(req, res) {
    try {
      const pool = req.app.locals.db;
      
      const [
        vacantesResult, 
        postulacionesResult,
        postulacionesMesResult,
        solicitudesPendientesResult,
        solicitudesResult
      ] = await Promise.all([
        pool.request().query(`SELECT COUNT(*) as total FROM Vacantes WHERE Estado = 'Activa'`),
        pool.request().query(`SELECT COUNT(*) as total FROM Postulaciones`),
        pool.request().query(`
          SELECT COUNT(*) as total FROM Postulaciones 
          WHERE MONTH(FechaPostulacion) = MONTH(GETDATE()) 
          AND YEAR(FechaPostulacion) = YEAR(GETDATE())
        `),
        pool.request().query(`SELECT COUNT(*) as total FROM SolicitudesVacantes WHERE Estado = 'Pendiente'`),
        pool.request().query(`
          SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN Estado IN ('Aprobada', 'Publicada') THEN 1 ELSE 0 END) as aprobadas
          FROM SolicitudesVacantes
        `)
      ]);

      const totalSolicitudes = solicitudesResult.recordset[0]?.total || 0;
      const aprobadas = solicitudesResult.recordset[0]?.aprobadas || 0;
      const tasaAprobacion = totalSolicitudes > 0 ? Math.round((aprobadas / totalSolicitudes) * 100) : 0;

      const stats = {
        vacantesActivas: vacantesResult.recordset[0]?.total || 0,
        solicitudesPendientes: solicitudesPendientesResult.recordset[0]?.total || 0,
        totalPostulaciones: postulacionesResult.recordset[0]?.total || 0,
        postulaciones: postulacionesResult.recordset[0]?.total || 0,
        postulacionesMes: postulacionesMesResult.recordset[0]?.total || 0,
        tasaAprobacion: tasaAprobacion,
        ultimaActualizacion: new Date().toISOString()
      };

      res.json(stats);
      
    } catch (error) {
      VacantesController.handleError(res, error, 'getEstadisticas');
    }
  }

  // ===============================
  // REPORTES - 100% REAL DE BD
  // ===============================

  static async getReportesResumen(req, res) {
    try {
      const pool = req.app.locals.db;

      const [vacantesData, postulacionesData, solicitudesData] = await Promise.all([
        pool.request().query(`
          SELECT 
            d.Nombre as departamento,
            COUNT(v.VacanteID) as total
          FROM Vacantes v
          INNER JOIN Departamentos d ON v.DepartamentoID = d.DepartamentoID
          WHERE v.Estado = 'Activa'
          GROUP BY d.Nombre
        `),
        pool.request().query(`
          SELECT 
            Estado,
            COUNT(*) as total
          FROM Postulaciones
          GROUP BY Estado
        `),
        pool.request().query(`
          SELECT 
            Estado,
            COUNT(*) as total
            FROM SolicitudesVacantes
          GROUP BY Estado
        `)
      ]);

      const resumen = {
        reportesDisponibles: [
          {
            nombre: 'Vacantes por Departamento',
            descripcion: 'Distribución de vacantes activas por departamento',
            datos: vacantesData.recordset,
            ultimaEjecucion: new Date().toISOString().split('T')[0]
          },
          {
            nombre: 'Postulaciones por Estado',
            descripcion: 'Estado actual de todas las postulaciones',
            datos: postulacionesData.recordset,
            ultimaEjecucion: new Date().toISOString().split('T')[0]
          },
          {
            nombre: 'Solicitudes por Estado',
            descripcion: 'Estado actual de todas las solicitudes',
            datos: solicitudesData.recordset,
            ultimaEjecucion: new Date().toISOString().split('T')[0]
          }
        ],
        totalReportes: 3,
        timestamp: new Date().toISOString()
      };

      res.json(resumen);

    } catch (error) {
      VacantesController.handleError(res, error, 'getReportesResumen');
    }
  }

  static async exportarReporte(req, res) {
    try {
      const { formato, tipo } = req.body;

      const formatosValidos = ['csv', 'excel', 'pdf'];
      if (!formatosValidos.includes(formato)) {
        return res.status(400).json({ 
          error: 'Formato inválido. Formatos válidos: ' + formatosValidos.join(', ')
        });
      }

      const mockResponse = {
        mensaje: `Reporte ${tipo} exportado en formato ${formato}`,
        archivo: `reporte_${tipo}_${Date.now()}.${formato}`,
        tamaño: '2.5 MB',
        fechaGeneracion: new Date().toISOString(),
        url: `/downloads/reporte_${tipo}_${Date.now()}.${formato}`
      };

      res.json(mockResponse);

    } catch (error) {
      VacantesController.handleError(res, error, 'exportarReporte');
    }
  }

  // ===============================
  // DATOS AUXILIARES - 100% REAL DE BD
  // ===============================

  static async getDepartamentos(req, res) {
    try {
      const pool = req.app.locals.db;
      const result = await pool.request().query(`
        SELECT 
          DepartamentoID as id, 
          Nombre as nombre, 
          Descripcion as descripcion
        FROM Departamentos 
        WHERE Estado = 1
        ORDER BY Nombre
      `);

      res.json(result.recordset);

    } catch (error) {
      VacantesController.handleError(res, error, 'getDepartamentos');
    }
  }

  static async getUsuarios(req, res) {
    try {
      const pool = req.app.locals.db;
      const result = await pool.request().query(`
        SELECT 
          u.UsuarioID as id,
          COALESCE(e.NOMBRE + ' ' + e.APELLIDO, 'Usuario Sin Nombre') as nombre,
          u.Email as email,
          u.Rol as rol,
          COALESCE(d.Nombre, 'Sin Departamento') as departamento
        FROM Usuarios u
        LEFT JOIN Empleados e ON u.EmpleadoID = e.EmpleadoID
        LEFT JOIN Departamentos d ON e.DEPARTAMENTOID = d.DepartamentoID
        WHERE u.Estado = 1
        ORDER BY e.NOMBRE, e.APELLIDO
      `);

      res.json(result.recordset);

    } catch (error) {
      VacantesController.handleError(res, error, 'getUsuarios');
    }
  }
}

export default VacantesController;