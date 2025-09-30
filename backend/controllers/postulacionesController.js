// backend/controllers/postulacionesController.js
import sql from 'mssql';

class PostulacionesController {
  // ===============================
  // UTILIDADES
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
  // POSTULACIONES - CRUD COMPLETO
  // ===============================

  static async getPostulaciones(req, res) {
    try {
      const pool = req.app.locals.db;
      const { usuarioID, rol, vacanteId, estado, tipo } = req.query;

      let query = `
        SELECT 
          p.PostulacionID as id,
          p.VacanteID as vacanteId,
          v.Titulo as vacanteTitle,
          COALESCE(p.NombreCandidato, e.NOMBRE + ' ' + e.APELLIDO) as nombreCandidato,
          COALESCE(p.Email, u.Email) as email,
          p.Telefono as telefono,
          p.Estado as estado,
          p.FechaPostulacion as fechaPostulacion,
          p.Observaciones as observaciones,
          p.LinkedInURL as linkedinUrl,
          p.CVUrl as cvUrl,
          p.Calificacion as calificacion,
          p.NotasEntrevista as notasEntrevista,
          CASE 
            WHEN p.EmpleadoID IS NOT NULL THEN 'Interno'
            ELSE 'Externo'
          END as tipoPostulante,
          p.EmpleadoID as empleadoId,
          COALESCE(revisor.NOMBRE + ' ' + revisor.APELLIDO, '') as revisor,
          p.FechaModificacion as fechaUltimaModificacion
        FROM Postulaciones p
        INNER JOIN Vacantes v ON p.VacanteID = v.VacanteID
        LEFT JOIN Empleados e ON p.EmpleadoID = e.EmpleadoID
        LEFT JOIN Usuarios u ON e.EmpleadoID = u.EmpleadoID
        LEFT JOIN Empleados revisor ON p.RevisadoPor = revisor.EmpleadoID
      `;

      const request = pool.request();
      const whereConditions = [];

      // Filtrar por vacante específica
      if (vacanteId) {
        whereConditions.push('p.VacanteID = @vacanteId');
        request.input('vacanteId', sql.Int, parseInt(vacanteId));
      }

      // Filtrar por estado
      if (estado) {
        whereConditions.push('p.Estado = @estado');
        request.input('estado', sql.NVarChar, estado);
      }

      // Filtrar por tipo de postulante
      if (tipo === 'interno') {
        whereConditions.push('p.EmpleadoID IS NOT NULL');
      } else if (tipo === 'externo') {
        whereConditions.push('p.EmpleadoID IS NULL');
      }

      // Filtros por rol
      const rolNormalizado = rol?.toLowerCase().replace(/\s+/g, '_');
      
      if (rolNormalizado === 'colaborador' || rolNormalizado === 'empleado') {
        // Colaboradores solo ven sus propias postulaciones
        whereConditions.push('p.EmpleadoID = (SELECT EmpleadoID FROM Usuarios WHERE UsuarioID = @usuarioID)');
        request.input('usuarioID', sql.Int, parseInt(usuarioID));
      }
      // Personal RRHH ve todas las postulaciones (sin filtro adicional)

      if (whereConditions.length > 0) {
        query += ` WHERE ${whereConditions.join(' AND ')}`;
      }

      query += ` ORDER BY p.FechaPostulacion DESC`;

      const result = await request.query(query);

      const postulaciones = result.recordset.map(p => ({
        ...p,
        fechaPostulacion: p.fechaPostulacion?.toISOString().split('T')[0],
        fechaUltimaModificacion: p.fechaUltimaModificacion?.toISOString().split('T')[0]
      }));

      res.json(postulaciones);

    } catch (error) {
      PostulacionesController.handleError(res, error, 'getPostulaciones');
    }
  }

  static async getPostulacionById(req, res) {
    try {
      const { id } = req.params;
      const pool = req.app.locals.db;

      const result = await pool.request()
        .input('id', sql.Int, parseInt(id))
        .query(`
          SELECT 
            p.PostulacionID as id,
            p.VacanteID as vacanteId,
            v.Titulo as vacanteTitle,
            v.Descripcion as vacanteDescripcion,
            v.Requisitos as vacanteRequisitos,
            COALESCE(p.NombreCandidato, e.NOMBRE + ' ' + e.APELLIDO) as nombreCandidato,
            COALESCE(p.Email, u.Email) as email,
            p.Telefono as telefono,
            p.Estado as estado,
            p.FechaPostulacion as fechaPostulacion,
            p.Observaciones as observaciones,
            p.LinkedInURL as linkedinUrl,
            p.CVUrl as cvUrl,
            p.Calificacion as calificacion,
            p.NotasEntrevista as notasEntrevista,
            p.ExperienciaLaboral as experienciaLaboral,
            p.Educacion as educacion,
            p.ExpectativaSalarial as expectativaSalarial,
            CASE 
              WHEN p.EmpleadoID IS NOT NULL THEN 'Interno'
              ELSE 'Externo'
            END as tipoPostulante,
            p.EmpleadoID as empleadoId,
            COALESCE(revisor.NOMBRE + ' ' + revisor.APELLIDO, '') as revisor,
            p.FechaModificacion as fechaUltimaModificacion
          FROM Postulaciones p
          INNER JOIN Vacantes v ON p.VacanteID = v.VacanteID
          LEFT JOIN Empleados e ON p.EmpleadoID = e.EmpleadoID
          LEFT JOIN Usuarios u ON e.EmpleadoID = u.EmpleadoID
          LEFT JOIN Empleados revisor ON p.RevisadoPor = revisor.EmpleadoID
          WHERE p.PostulacionID = @id
        `);

      if (result.recordset.length === 0) {
        return res.status(404).json({ error: 'Postulación no encontrada' });
      }

      const postulacion = {
        ...result.recordset[0],
        fechaPostulacion: result.recordset[0].fechaPostulacion?.toISOString().split('T')[0],
        fechaUltimaModificacion: result.recordset[0].fechaUltimaModificacion?.toISOString().split('T')[0]
      };

      res.json(postulacion);

    } catch (error) {
      PostulacionesController.handleError(res, error, 'getPostulacionById');
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
        experienciaLaboral,
        educacion, 
        expectativaSalarial,
        motivacion,
        observaciones,
        empleadoID,
        linkedinUrl,
        cvUrl
      } = req.body;

      if (!vacanteId || !nombre || !email) {
        return res.status(400).json({ 
          error: 'Campos requeridos: vacanteId, nombre, email'
        });
      }

      const transaction = new sql.Transaction(pool);
      await transaction.begin();

      try {
        // Verificar que la vacante existe y está activa
        const vacanteCheck = await transaction.request()
          .input('vacanteId', sql.Int, parseInt(vacanteId))
          .query(`SELECT VacanteID FROM Vacantes WHERE VacanteID = @vacanteId AND Estado = 'Activa'`);

        if (vacanteCheck.recordset.length === 0) {
          await transaction.rollback();
          return res.status(400).json({ error: 'Vacante no encontrada o inactiva' });
        }

        // Verificar duplicados
        const duplicateCheck = await transaction.request()
          .input('vacanteId', sql.Int, parseInt(vacanteId))
          .input('email', sql.NVarChar, email)
          .query(`SELECT PostulacionID FROM Postulaciones WHERE VacanteID = @vacanteId AND Email = @email`);

        if (duplicateCheck.recordset.length > 0) {
          await transaction.rollback();
          return res.status(400).json({ error: 'Ya existe una postulación para esta vacante con este email' });
        }

        // Construir observaciones completas
        const observacionesCompletas = [
          experiencia ? `Experiencia: ${experiencia}` : '',
          experienciaLaboral ? `Experiencia Laboral: ${experienciaLaboral}` : '',
          educacion ? `Educación: ${educacion}` : '',
          motivacion ? `Motivación: ${motivacion}` : '',
          expectativaSalarial ? `Expectativa salarial: RD$${expectativaSalarial}` : '',
          observaciones || ''
        ].filter(Boolean).join('\n\n');

        // Insertar postulación
        const result = await transaction.request()
          .input('vacanteId', sql.Int, parseInt(vacanteId))
          .input('empleadoID', sql.Int, empleadoID || null)
          .input('nombre', sql.NVarChar(200), nombre)
          .input('email', sql.NVarChar(255), email)
          .input('telefono', sql.NVarChar(50), telefono || '')
          .input('observaciones', sql.NVarChar(sql.MAX), observacionesCompletas)
          .input('experienciaLaboral', sql.NVarChar(sql.MAX), experienciaLaboral || experiencia || '')
          .input('educacion', sql.NVarChar(sql.MAX), educacion || '')
          .input('expectativaSalarial', sql.Decimal(10, 2), expectativaSalarial || null)
          .input('linkedinUrl', sql.NVarChar(500), linkedinUrl || null)
          .input('cvUrl', sql.NVarChar(500), cvUrl || null)
          .query(`
            INSERT INTO Postulaciones (
              VacanteID, EmpleadoID, NombreCandidato, Email, Telefono, 
              Estado, FechaPostulacion, Observaciones, ExperienciaLaboral,
              Educacion, ExpectativaSalarial, LinkedInURL, CVUrl
            )
            OUTPUT INSERTED.PostulacionID, INSERTED.Estado, INSERTED.FechaPostulacion
            VALUES (
              @vacanteId, @empleadoID, @nombre, @email, @telefono,
              'Recibida', GETDATE(), @observaciones, @experienciaLaboral,
              @educacion, @expectativaSalarial, @linkedinUrl, @cvUrl
            )
          `);

        await transaction.commit();

        const postulacion = result.recordset[0];

        res.status(201).json({ 
          success: true,
          message: 'Postulación enviada exitosamente', 
          postulacion: {
            id: postulacion.PostulacionID,
            estado: postulacion.Estado,
            fechaPostulacion: postulacion.FechaPostulacion.toISOString().split('T')[0]
          }
        });

      } catch (error) {
        await transaction.rollback();
        throw error;
      }

    } catch (error) {
      PostulacionesController.handleError(res, error, 'crearPostulacion');
    }
  }

  static async actualizarPostulacion(req, res) {
    try {
      const { id } = req.params;
      const pool = req.app.locals.db;
      const { 
        estado, 
        calificacion, 
        notasEntrevista,
        observaciones,
        linkedinUrl,
        cvUrl,
        revisadoPor
      } = req.body;

      const updates = [];
      const request = pool.request().input('id', sql.Int, parseInt(id));

      if (estado) {
        updates.push('Estado = @estado');
        request.input('estado', sql.NVarChar(50), estado);
      }

      if (calificacion !== undefined) {
        updates.push('Calificacion = @calificacion');
        request.input('calificacion', sql.Int, calificacion);
      }

      if (notasEntrevista) {
        updates.push('NotasEntrevista = @notasEntrevista');
        request.input('notasEntrevista', sql.NVarChar(sql.MAX), notasEntrevista);
      }

      if (observaciones) {
        updates.push('Observaciones = @observaciones');
        request.input('observaciones', sql.NVarChar(sql.MAX), observaciones);
      }

      if (linkedinUrl) {
        updates.push('LinkedInURL = @linkedinUrl');
        request.input('linkedinUrl', sql.NVarChar(500), linkedinUrl);
      }

      if (cvUrl) {
        updates.push('CVUrl = @cvUrl');
        request.input('cvUrl', sql.NVarChar(500), cvUrl);
      }

      if (revisadoPor) {
        updates.push('RevisadoPor = @revisadoPor');
        request.input('revisadoPor', sql.Int, revisadoPor);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No hay campos para actualizar' });
      }

      updates.push('FechaModificacion = GETDATE()');

      const result = await request.query(`
        UPDATE Postulaciones 
        SET ${updates.join(', ')}
        WHERE PostulacionID = @id
      `);

      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ error: 'Postulación no encontrada' });
      }

      res.json({ 
        success: true,
        message: 'Postulación actualizada exitosamente',
        postulacionId: id
      });

    } catch (error) {
      PostulacionesController.handleError(res, error, 'actualizarPostulacion');
    }
  }

  static async cambiarEstadoPostulacion(req, res) {
    try {
      const { id } = req.params;
      const { estado, comentarios, revisadoPor } = req.body;
      const pool = req.app.locals.db;

      const estadosValidos = ['Recibida', 'En Revisión', 'Entrevista Programada', 'Entrevista Realizada', 'Aprobada', 'Rechazada', 'Contratada'];
      
      if (!estadosValidos.includes(estado)) {
        return res.status(400).json({ 
          error: 'Estado inválido. Estados válidos: ' + estadosValidos.join(', ')
        });
      }

      const request = pool.request()
        .input('id', sql.Int, parseInt(id))
        .input('estado', sql.NVarChar(50), estado)
        .input('comentarios', sql.NVarChar(sql.MAX), comentarios || '')
        .input('revisadoPor', sql.Int, revisadoPor || null);

      const result = await request.query(`
        UPDATE Postulaciones 
        SET Estado = @estado, 
            FechaModificacion = GETDATE(),
            RevisadoPor = COALESCE(@revisadoPor, RevisadoPor),
            NotasEntrevista = CASE 
              WHEN @comentarios != '' THEN COALESCE(NotasEntrevista, '') + CHAR(13) + CHAR(10) + '[' + CONVERT(varchar, GETDATE(), 120) + '] ' + @comentarios
              ELSE NotasEntrevista
            END
        WHERE PostulacionID = @id
      `);

      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ error: 'Postulación no encontrada' });
      }

      res.json({ 
        success: true,
        message: `Estado actualizado a: ${estado}`,
        postulacionId: id,
        nuevoEstado: estado
      });

    } catch (error) {
      PostulacionesController.handleError(res, error, 'cambiarEstadoPostulacion');
    }
  }

  static async calificarPostulacion(req, res) {
    try {
      const { id } = req.params;
      const { calificacion, comentarios, revisadoPor } = req.body;
      const pool = req.app.locals.db;

      if (calificacion < 0 || calificacion > 10) {
        return res.status(400).json({ error: 'La calificación debe estar entre 0 y 10' });
      }

      const result = await pool.request()
        .input('id', sql.Int, parseInt(id))
        .input('calificacion', sql.Int, calificacion)
        .input('comentarios', sql.NVarChar(sql.MAX), comentarios || '')
        .input('revisadoPor', sql.Int, revisadoPor || null)
        .query(`
          UPDATE Postulaciones 
          SET Calificacion = @calificacion,
              FechaModificacion = GETDATE(),
              RevisadoPor = COALESCE(@revisadoPor, RevisadoPor),
              NotasEntrevista = CASE 
                WHEN @comentarios != '' THEN COALESCE(NotasEntrevista, '') + CHAR(13) + CHAR(10) + '[Calificación: ' + CAST(@calificacion AS varchar) + '/10] ' + @comentarios
                ELSE NotasEntrevista
              END
          WHERE PostulacionID = @id
        `);

      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ error: 'Postulación no encontrada' });
      }

      res.json({ 
        success: true,
        message: 'Calificación registrada exitosamente',
        calificacion
      });

    } catch (error) {
      PostulacionesController.handleError(res, error, 'calificarPostulacion');
    }
  }

  static async eliminarPostulacion(req, res) {
    try {
      const { id } = req.params;
      const pool = req.app.locals.db;

      const result = await pool.request()
        .input('id', sql.Int, parseInt(id))
        .query(`DELETE FROM Postulaciones WHERE PostulacionID = @id`);

      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ error: 'Postulación no encontrada' });
      }

      res.json({ 
        success: true,
        message: 'Postulación eliminada exitosamente'
      });

    } catch (error) {
      PostulacionesController.handleError(res, error, 'eliminarPostulacion');
    }
  }

  static async getVacantesPublicas(req, res) {
    try {
      const pool = req.app.locals.db;

      const result = await pool.request().query(`
        SELECT 
          v.VacanteID as id,
          v.Titulo as titulo,
          v.Descripcion as descripcion,
          v.Requisitos as requisitos,
          v.SalarioMinimo as salarioMin,
          v.SalarioMaximo as salarioMax,
          v.Modalidad as modalidad,
          v.FechaPublicacion as fechaPublicacion,
          v.FechaCierre as fechaCierre,
          d.Nombre as departamento,
          COUNT(p.PostulacionID) as totalPostulaciones
        FROM Vacantes v
        LEFT JOIN Departamentos d ON v.DepartamentoID = d.DepartamentoID
        LEFT JOIN Postulaciones p ON v.VacanteID = p.VacanteID
        WHERE v.Estado = 'Activa' 
        AND v.PublicaEnPortal = 1
        AND (v.FechaCierre IS NULL OR v.FechaCierre >= CAST(GETDATE() AS DATE))
        GROUP BY v.VacanteID, v.Titulo, v.Descripcion, v.Requisitos, 
                 v.SalarioMinimo, v.SalarioMaximo, v.Modalidad, 
                 v.FechaPublicacion, v.FechaCierre, d.Nombre
        ORDER BY v.FechaPublicacion DESC
      `);

      const vacantes = result.recordset.map(v => ({
        ...v,
        fechaPublicacion: v.fechaPublicacion?.toISOString().split('T')[0],
        fechaCierre: v.fechaCierre?.toISOString().split('T')[0]
      }));

      res.json(vacantes);

    } catch (error) {
      PostulacionesController.handleError(res, error, 'getVacantesPublicas');
    }
  }

  static async crearPostulacionPublica(req, res) {
    try {
      const pool = req.app.locals.db;
      const archivos = req.files || {};
      
      const {
        vacanteId,
        nombre,
        email,
        telefono,
        telefonoMovil,
        telefonoFijo,
        emailSecundario,
        cedula,
        fechaNacimiento,
        genero,
        estadoCivil,
        nacionalidad,
        direccion,
        ciudad,
        provincia,
        nivelEducativo,
        institucion,
        tituloObtenido,
        anioGraduacion,
        experienciaLaboral,
        experienciaAnios,
        ultimoEmpleador,
        ultimoPuesto,
        educacion,
        expectativaSalarial,
        motivacion,
        conocimientosEspeciales,
        idiomas,
        softwareConocido,
        referenciaPersonal1,
        referenciaPersonal2,
        disponibilidadInmediata,
        disponibilidadViajar,
        tieneLicencia,
        tipoLicencia,
        comoConocioVacante
      } = req.body;

      // Validaciones básicas
      if (!vacanteId || !nombre || !email || !cedula) {
        return res.status(400).json({ 
          error: 'Campos requeridos: vacanteId, nombre, email, cédula'
        });
      }

      // Verificar que la vacante existe y está activa
      const vacanteCheck = await pool.request()
        .input('vacanteId', sql.Int, parseInt(vacanteId))
        .query(`
          SELECT VacanteID FROM Vacantes 
          WHERE VacanteID = @vacanteId 
            AND Estado = 'Activa'
            AND (FechaCierre IS NULL OR FechaCierre >= CAST(GETDATE() AS DATE))
        `);

      if (vacanteCheck.recordset.length === 0) {
        return res.status(400).json({ 
          error: 'La vacante no está disponible o ha cerrado'
        });
      }

      // Verificar duplicados por cédula o email
      const duplicateCheck = await pool.request()
        .input('vacanteId', sql.Int, parseInt(vacanteId))
        .input('cedula', sql.NVarChar, cedula)
        .input('email', sql.NVarChar, email)
        .query(`
          SELECT PostulacionID FROM Postulaciones 
          WHERE VacanteID = @vacanteId 
            AND (Cedula = @cedula OR Email = @email)
        `);

      if (duplicateCheck.recordset.length > 0) {
        return res.status(400).json({ 
          error: 'Ya existe una postulación para esta vacante con esta cédula o email'
        });
      }

      // URLs de archivos subidos
      const cvUrl = archivos.cv ? `/uploads/postulaciones/${archivos.cv[0].filename}` : null;
      const fotoCedulaUrl = archivos.fotoCedula ? `/uploads/postulaciones/${archivos.fotoCedula[0].filename}` : null;
      const foto2x2Url = archivos.foto2x2 ? `/uploads/postulaciones/${archivos.foto2x2[0].filename}` : null;

      // Construir observaciones
      const observaciones = [
        motivacion ? `Motivación: ${motivacion}` : '',
        conocimientosEspeciales ? `Conocimientos Especiales: ${conocimientosEspeciales}` : '',
        comoConocioVacante ? `Cómo conoció la vacante: ${comoConocioVacante}` : ''
      ].filter(Boolean).join('\n\n');

      // Insertar postulación
      const result = await pool.request()
        .input('vacanteId', sql.Int, parseInt(vacanteId))
        .input('nombre', sql.NVarChar(200), nombre)
        .input('email', sql.NVarChar(255), email)
        .input('telefono', sql.NVarChar(50), telefono || telefonoMovil || '')
        .input('telefonoMovil', sql.NVarChar(50), telefonoMovil || telefono || '')
        .input('telefonoFijo', sql.NVarChar(50), telefonoFijo || null)
        .input('emailSecundario', sql.NVarChar(255), emailSecundario || null)
        .input('cedula', sql.NVarChar(50), cedula)
        .input('fechaNacimiento', sql.Date, fechaNacimiento || null)
        .input('genero', sql.NVarChar(20), genero || null)
        .input('estadoCivil', sql.NVarChar(50), estadoCivil || null)
        .input('nacionalidad', sql.NVarChar(100), nacionalidad || 'Dominicana')
        .input('direccion', sql.NVarChar(500), direccion || null)
        .input('ciudad', sql.NVarChar(100), ciudad || null)
        .input('provincia', sql.NVarChar(100), provincia || null)
        .input('nivelEducativo', sql.NVarChar(100), nivelEducativo || null)
        .input('institucion', sql.NVarChar(200), institucion || null)
        .input('tituloObtenido', sql.NVarChar(200), tituloObtenido || null)
        .input('anioGraduacion', sql.Int, anioGraduacion ? parseInt(anioGraduacion) : null)
        .input('experienciaLaboral', sql.NVarChar(sql.MAX), experienciaLaboral || '')
        .input('experienciaAnios', sql.Int, experienciaAnios ? parseInt(experienciaAnios) : null)
        .input('ultimoEmpleador', sql.NVarChar(200), ultimoEmpleador || null)
        .input('ultimoPuesto', sql.NVarChar(200), ultimoPuesto || null)
        .input('educacion', sql.NVarChar(sql.MAX), educacion || '')
        .input('expectativaSalarial', sql.Decimal(10, 2), expectativaSalarial || null)
        .input('observaciones', sql.NVarChar(sql.MAX), observaciones)
        .input('conocimientosEspeciales', sql.NVarChar(sql.MAX), conocimientosEspeciales || null)
        .input('idiomas', sql.NVarChar(500), idiomas || null)
        .input('softwareConocido', sql.NVarChar(500), softwareConocido || null)
        .input('referenciaPersonal1', sql.NVarChar(500), referenciaPersonal1 || null)
        .input('referenciaPersonal2', sql.NVarChar(500), referenciaPersonal2 || null)
        .input('disponibilidadInmediata', sql.Bit, disponibilidadInmediata === 'true' || disponibilidadInmediata === true ? 1 : 0)
        .input('disponibilidadViajar', sql.Bit, disponibilidadViajar === 'true' || disponibilidadViajar === true ? 1 : 0)
        .input('tieneLicencia', sql.Bit, tieneLicencia === 'true' || tieneLicencia === true ? 1 : 0)
        .input('tipoLicencia', sql.NVarChar(50), tipoLicencia || null)
        .input('comoConocioVacante', sql.NVarChar(200), comoConocioVacante || null)
        .input('cvUrl', sql.NVarChar(500), cvUrl)
        .input('fotoCedulaUrl', sql.NVarChar(500), fotoCedulaUrl)
        .input('foto2x2Url', sql.NVarChar(500), foto2x2Url)
        .query(`
          INSERT INTO Postulaciones (
            VacanteID, NombreCandidato, Email, Telefono, TelefonoMovil, TelefonoFijo,
            EmailSecundario, Cedula, FechaNacimiento, Genero, EstadoCivil, Nacionalidad,
            Direccion, Ciudad, Provincia, NivelEducativo, Institucion, TituloObtenido,
            AnioGraduacion, ExperienciaLaboral, ExperienciaAnios, UltimoEmpleador,
            UltimoPuesto, Educacion, ExpectativaSalarial, Observaciones,
            ConocimientosEspeciales, Idiomas, SoftwareConocido, ReferenciaPersonal1,
            ReferenciaPersonal2, DisponibilidadInmediata, DisponibilidadViajar,
            TieneLicencia, TipoLicencia, ComoConocioVacante, CVUrl, FotoCedulaUrl,
            Foto2x2Url, Estado, FechaPostulacion
          )
          OUTPUT INSERTED.PostulacionID
          VALUES (
            @vacanteId, @nombre, @email, @telefono, @telefonoMovil, @telefonoFijo,
            @emailSecundario, @cedula, @fechaNacimiento, @genero, @estadoCivil, @nacionalidad,
            @direccion, @ciudad, @provincia, @nivelEducativo, @institucion, @tituloObtenido,
            @anioGraduacion, @experienciaLaboral, @experienciaAnios, @ultimoEmpleador,
            @ultimoPuesto, @educacion, @expectativaSalarial, @observaciones,
            @conocimientosEspeciales, @idiomas, @softwareConocido, @referenciaPersonal1,
            @referenciaPersonal2, @disponibilidadInmediata, @disponibilidadViajar,
            @tieneLicencia, @tipoLicencia, @comoConocioVacante, @cvUrl, @fotoCedulaUrl,
            @foto2x2Url, 'Recibida', GETDATE()
          )
        `);

      const postulacionID = result.recordset[0].PostulacionID;

      res.status(201).json({
        success: true,
        message: 'Postulación enviada exitosamente. Nos pondremos en contacto pronto.',
        postulacionID,
        archivosSubidos: {
          cv: !!cvUrl,
          fotoCedula: !!fotoCedulaUrl,
          foto2x2: !!foto2x2Url
        }
      });

    } catch (error) {
      PostulacionesController.handleError(res, error, 'crearPostulacionPublica');
    }
  }
  // ===============================
  // ESTADÍSTICAS
  // ===============================

  static async getEstadisticasPostulaciones(req, res) {
    try {
      const pool = req.app.locals.db;
      const { vacanteId } = req.query;

      let whereClause = '';
      const request = pool.request();

      if (vacanteId) {
        whereClause = 'WHERE VacanteID = @vacanteId';
        request.input('vacanteId', sql.Int, parseInt(vacanteId));
      }

      const [totalResult, porEstadoResult, promedioResult] = await Promise.all([
        request.query(`SELECT COUNT(*) as total FROM Postulaciones ${whereClause}`),
        pool.request()
          .input('vacanteId', sql.Int, vacanteId ? parseInt(vacanteId) : null)
          .query(`
            SELECT Estado, COUNT(*) as cantidad 
            FROM Postulaciones 
            ${whereClause}
            GROUP BY Estado
          `),
        pool.request()
          .input('vacanteId', sql.Int, vacanteId ? parseInt(vacanteId) : null)
          .query(`
            SELECT AVG(CAST(Calificacion AS FLOAT)) as promedioCalificacion
            FROM Postulaciones 
            ${whereClause ? whereClause + ' AND' : 'WHERE'} Calificacion IS NOT NULL
          `)
      ]);

      const estadisticas = {
        total: totalResult.recordset[0].total,
        porEstado: porEstadoResult.recordset,
        promedioCalificacion: Math.round(promedioResult.recordset[0].promedioCalificacion || 0),
        timestamp: new Date().toISOString()
      };

      res.json(estadisticas);

    } catch (error) {
      PostulacionesController.handleError(res, error, 'getEstadisticasPostulaciones');
    }
  }  // ✅ SIN COMA, SOLO LA LLAVE DE CIERRE
}



export default PostulacionesController;
