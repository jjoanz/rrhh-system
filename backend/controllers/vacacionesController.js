import sql from 'mssql';

class VacacionesController {

  // Función auxiliar para determinar jerarquía de aprobación
  static getJerarquiaAprobacion(rol) {
    const jerarquia = {
      'gerente': ['director', 'gerente_rrhh', 'director_rrhh'],
      'director': ['gerente_rrhh', 'director_rrhh'],
      'rrhh': ['gerente_rrhh', 'director_rrhh'],
      'gerente_rrhh': ['director_rrhh'],
      'director_rrhh': [],
      'admin': []
    };
    return jerarquia[rol?.toLowerCase().replace(/\s+/g, '_')] || [];
  }

  // ===============================
  // Obtener solicitudes según rol y jerarquía
  // ===============================
  static async getSolicitudes(req, res) {
    try {
      const pool = req.app.locals.db;
      const { usuarioID, rol } = req.query;

      let query = `
        SELECT 
          sv.SolicitudID as id,
          sv.EmpleadoID as empleadoId,
          CONCAT(e.NOMBRE, ' ', e.APELLIDO) as empleado,
          u.Rol as empleadoRole,
          d.Nombre as departamento,
          p.NOMBRE as puesto,
          sv.FechaInicio as fechaInicio,
          sv.FechaFin as fechaFin,
          sv.Dias as dias,
          sv.DiasHabiles as diasHabiles,
          sv.Motivo as motivo,
          sv.TipoSolicitud as tipo,
          sv.Estado as estado,
          sv.FechaSolicitud as fechaSolicitud,
          sv.AprobacionManual as aprobacionManual,
          CONCAT(ea.NOMBRE, ' ', ea.APELLIDO) as aprobadoPor
        FROM SolicitudesVacaciones sv
        INNER JOIN Empleados e ON sv.EmpleadoID = e.EmpleadoID
        LEFT JOIN Usuarios u ON e.EmpleadoID = u.EmpleadoID
        LEFT JOIN Departamentos d ON e.DEPARTAMENTOID = d.DepartamentoID
        LEFT JOIN Puestos p ON e.PUESTOID = p.PuestoID
        LEFT JOIN Empleados ea ON sv.AprobadoPorID = ea.EmpleadoID
      `;

      const rolNormalizado = rol?.toLowerCase().replace(/\s+/g, '_');

      // Obtener empleadoId del usuario actual
      const usuarioActual = await pool.request()
        .input('usuarioID', sql.Int, parseInt(usuarioID))
        .query('SELECT EmpleadoID FROM Usuarios WHERE UsuarioID = @usuarioID');

      const empleadoIdActual = usuarioActual.recordset[0]?.EmpleadoID;

      if (rolNormalizado === 'colaborador') {
        query += ` WHERE sv.EmpleadoID = @empleadoIdActual`;
      } else if (rolNormalizado === 'gerente') {
        query += ` WHERE (LOWER(u.Rol) = 'colaborador' AND e.DEPARTAMENTOID = (SELECT DEPARTAMENTOID FROM Empleados WHERE EmpleadoID = @empleadoIdActual)) OR sv.EmpleadoID = @empleadoIdActual`;
      } else if (rolNormalizado === 'director') {
        query += ` WHERE (LOWER(u.Rol) IN ('colaborador', 'gerente') AND e.DEPARTAMENTOID = (SELECT DEPARTAMENTOID FROM Empleados WHERE EmpleadoID = @empleadoIdActual)) OR sv.EmpleadoID = @empleadoIdActual`;
      }

      query += ` ORDER BY sv.FechaSolicitud DESC`;

      const result = await pool.request()
        .input('usuarioID', sql.Int, parseInt(usuarioID))
        .input('empleadoIdActual', sql.Int, empleadoIdActual)
        .query(query);

      for (let solicitud of result.recordset) {
        const flujoResult = await pool.request()
          .input('solicitudID', sql.Int, solicitud.id)
          .query(`
            SELECT 
              RolAprobador as rol,
              CONCAT(e.NOMBRE, ' ', e.APELLIDO) as aprobadoPor,
              FechaAprobacion as fecha,
              Accion as accion,
              TipoAprobacion as tipo,
              MotivoManual as motivoManual
            FROM FlujoAprobacionVacaciones f
            LEFT JOIN Empleados e ON f.AprobadorID = e.EmpleadoID
            WHERE SolicitudID = @solicitudID
            ORDER BY OrdenFlujo
          `);

        solicitud.flujoAprobacion = flujoResult.recordset;
      }

      res.json(result.recordset);
    } catch (error) {
      console.error('Error al obtener solicitudes:', error);
      res.status(500).json({ 
        error: 'Error al obtener solicitudes',
        details: error.message 
      });
    }
  }

  // ===============================
  // Crear solicitud de vacaciones
  // ===============================
  static async crearSolicitud(req, res) {
    const transaction = new sql.Transaction(req.app.locals.db);

    try {
      const pool = req.app.locals.db;
      const { empleadoID, fechaInicio, fechaFin, dias, motivo } = req.body;

      // Validar que el empleado tenga días disponibles
      const checkQuery = `
        SELECT DiasDisponibles 
        FROM BalanceVacaciones 
        WHERE EmpleadoID = @empleadoID 
          AND Anio = YEAR(GETDATE())
      `;

      const checkRequest = pool.request();
      checkRequest.input('empleadoID', sql.Int, empleadoID);
      const checkResult = await checkRequest.query(checkQuery);

      if (!checkResult.recordset.length || checkResult.recordset[0].DiasDisponibles < dias) {
        return res.status(400).json({ 
          error: 'Días insuficientes', 
          disponibles: checkResult.recordset[0]?.DiasDisponibles || 0 
        });
      }

      // Insertar solicitud
      const insertQuery = `
        INSERT INTO SolicitudesVacaciones 
          (EmpleadoID, TipoSolicitud, FechaInicio, FechaFin, Dias, DiasHabiles, Motivo, Estado, FechaSolicitud)
        VALUES 
          (@empleadoID, 'Vacaciones', @fechaInicio, @fechaFin, @dias, @dias, @motivo, 'Pendiente', GETDATE());
        SELECT SCOPE_IDENTITY() AS SolicitudID;
      `;

      const request = pool.request();
      request.input('empleadoID', sql.Int, empleadoID);
      request.input('fechaInicio', sql.Date, fechaInicio);
      request.input('fechaFin', sql.Date, fechaFin);
      request.input('dias', sql.Int, dias);
      request.input('motivo', sql.NVarChar, motivo || '');

      const result = await request.query(insertQuery);
      const solicitudID = result.recordset[0].SolicitudID;

      res.status(201).json({ 
        message: 'Solicitud creada exitosamente', 
        solicitudID 
      });
    } catch (error) {
      console.error('Error al crear solicitud:', error);
      res.status(500).json({ 
        error: 'Error al crear solicitud',
        details: error.message 
      });
    }
  }

  // ===============================
  // Crear solicitud con múltiples períodos
  // ===============================
  static async crearSolicitudConPeriodos(req, res) {
    try {
      const pool = req.app.locals.db;
      const { empleadoID, periodos, motivo } = req.body;

      if (!periodos || !Array.isArray(periodos) || periodos.length === 0) {
        return res.status(400).json({ error: 'Se requiere al menos un período de vacaciones' });
      }

      let totalDias = 0;
      let diasPorAnio = {};

      // Validar disponibilidad por cada período
      for (const periodo of periodos) {
        const { fechaInicio, fechaFin, dias, anio } = periodo;

        const balanceQuery = `
          SELECT DiasDisponibles 
          FROM BalanceVacaciones 
          WHERE EmpleadoID = @empleadoID 
            AND Anio = @anio
        `;

        const balanceRequest = pool.request();
        balanceRequest.input('empleadoID', sql.Int, empleadoID);
        balanceRequest.input('anio', sql.Int, anio);
        
        const balanceResult = await balanceRequest.query(balanceQuery);

        if (!balanceResult.recordset.length) {
          return res.status(400).json({ 
            error: `No hay balance de vacaciones para el año ${anio}` 
          });
        }

        const disponibles = balanceResult.recordset[0].DiasDisponibles;

        if (!diasPorAnio[anio]) {
          diasPorAnio[anio] = { disponibles, solicitados: 0 };
        }

        diasPorAnio[anio].solicitados += dias;

        if (diasPorAnio[anio].solicitados > diasPorAnio[anio].disponibles) {
          return res.status(400).json({ 
            error: `Días insuficientes para el año ${anio}`,
            disponibles: diasPorAnio[anio].disponibles,
            solicitados: diasPorAnio[anio].solicitados
          });
        }

        totalDias += dias;
      }

      // Insertar solicitud principal
      const fechaInicio = periodos[0].fechaInicio;
      const fechaFin = periodos[periodos.length - 1].fechaFin;

      const insertQuery = `
        INSERT INTO SolicitudesVacaciones 
          (EmpleadoID, TipoSolicitud, FechaInicio, FechaFin, Dias, DiasHabiles, Motivo, Estado, FechaSolicitud)
        OUTPUT INSERTED.SolicitudID
        VALUES 
          (@empleadoID, 'Vacaciones', @fechaInicio, @fechaFin, @totalDias, @totalDias, @motivo, 'Pendiente', GETDATE())
      `;

      const request = pool.request();
      request.input('empleadoID', sql.Int, empleadoID);
      request.input('fechaInicio', sql.Date, fechaInicio);
      request.input('fechaFin', sql.Date, fechaFin);
      request.input('totalDias', sql.Int, totalDias);
      request.input('motivo', sql.NVarChar, motivo || '');

      const result = await request.query(insertQuery);
      const solicitudID = result.recordset[0].SolicitudID;

      // Insertar los períodos detallados
      for (const periodo of periodos) {
        const insertPeriodoQuery = `
          INSERT INTO SolicitudesVacacionesPeriodos 
            (SolicitudID, BalanceID, FechaInicio, FechaFin, Dias, FechaCreacion)
          VALUES 
            (@solicitudID, @balanceID, @fechaInicio, @fechaFin, @dias, GETDATE())
        `;

        const periodoRequest = pool.request();
        periodoRequest.input('solicitudID', sql.Int, solicitudID);
        periodoRequest.input('balanceID', sql.Int, periodo.balanceId);
        periodoRequest.input('fechaInicio', sql.Date, periodo.fechaInicio);
        periodoRequest.input('fechaFin', sql.Date, periodo.fechaFin);
        periodoRequest.input('dias', sql.Int, periodo.dias);

        await periodoRequest.query(insertPeriodoQuery);
      }

      res.status(201).json({ 
        message: 'Solicitud con períodos creada exitosamente', 
        solicitudID,
        totalDias,
        periodos: periodos.length
      });
    } catch (error) {
      console.error('Error al crear solicitud con períodos:', error);
      res.status(500).json({ 
        error: 'Error al crear solicitud con períodos',
        details: error.message 
      });
    }
  }

  // ===============================
  // Aprobar/Rechazar solicitud
  // ===============================
  static async aprobarSolicitud(req, res) {
    const transaction = new sql.Transaction(req.app.locals.db);

    try {
      await transaction.begin();
      const pool = req.app.locals.db;
      const { solicitudID, usuarioID, accion, esManual = false, motivo = '' } = req.body;

      const usuarioRequest = new sql.Request(transaction);
      usuarioRequest.input('usuarioID', sql.Int, parseInt(usuarioID));
      const usuarioResult = await usuarioRequest.query(`
        SELECT EmpleadoID, Rol 
        FROM Usuarios 
        WHERE UsuarioID = @usuarioID
      `);

      if (!usuarioResult.recordset.length) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const { EmpleadoID: aprobadorID, Rol: rolAprobador } = usuarioResult.recordset[0];

      const solicitudRequest = new sql.Request(transaction);
      solicitudRequest.input('solicitudID', sql.Int, parseInt(solicitudID));
      const solicitudResult = await solicitudRequest.query(`
        SELECT Estado, EmpleadoID, Dias 
        FROM SolicitudesVacaciones 
        WHERE SolicitudID = @solicitudID
      `);

      if (!solicitudResult.recordset.length) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Solicitud no encontrada' });
      }

      const { Estado: estadoActual, EmpleadoID: empleadoID, Dias: diasSolicitud } = solicitudResult.recordset[0];

      if (estadoActual !== 'Pendiente') {
        await transaction.rollback();
        return res.status(400).json({ error: 'La solicitud ya fue procesada' });
      }

      const flujoRequest = new sql.Request(transaction);
      flujoRequest.input('solicitudID', sql.Int, parseInt(solicitudID));
      const flujoResult = await flujoRequest.query(`
        SELECT OrdenFlujo, RolAprobador, Accion, TipoAprobacion 
        FROM FlujoAprobacionVacaciones 
        WHERE SolicitudID = @solicitudID 
        ORDER BY OrdenFlujo
      `);

      const flujo = flujoResult.recordset;
      const esAprobacionManual = esManual === true;

      const tipoAprobacion = esAprobacionManual ? 'manual' : 'automatica';
      const accionFinal = accion === 'aprobada' ? 'aprobada' : 'rechazada';

      if (esAprobacionManual) {
        const insertFlujoRequest = new sql.Request(transaction);
        insertFlujoRequest.input('solicitudID', sql.Int, parseInt(solicitudID));
        insertFlujoRequest.input('aprobadorID', sql.Int, aprobadorID);
        insertFlujoRequest.input('rolAprobador', sql.NVarChar, rolAprobador);
        insertFlujoRequest.input('accion', sql.NVarChar, accionFinal);
        insertFlujoRequest.input('tipo', sql.NVarChar, tipoAprobacion);
        insertFlujoRequest.input('motivoManual', sql.NVarChar, motivo);
        insertFlujoRequest.input('ordenFlujo', sql.Int, flujo.length + 1);

        await insertFlujoRequest.query(`
          INSERT INTO FlujoAprobacionVacaciones 
            (SolicitudID, AprobadorID, RolAprobador, Accion, TipoAprobacion, MotivoManual, OrdenFlujo, FechaAprobacion)
          VALUES 
            (@solicitudID, @aprobadorID, @rolAprobador, @accion, @tipo, @motivoManual, @ordenFlujo, GETDATE())
        `);

        const updateRequest = new sql.Request(transaction);
        updateRequest.input('solicitudID', sql.Int, parseInt(solicitudID));
        updateRequest.input('estado', sql.NVarChar, accionFinal === 'aprobada' ? 'Aprobada' : 'Rechazada');
        updateRequest.input('aprobadorID', sql.Int, aprobadorID);
        updateRequest.input('aprobacionManual', sql.Bit, true);

        await updateRequest.query(`
          UPDATE SolicitudesVacaciones 
          SET Estado = @estado, 
              AprobadoPorID = @aprobadorID, 
              FechaAprobacionFinal = GETDATE(),
              AprobacionManual = @aprobacionManual
          WHERE SolicitudID = @solicitudID
        `);

        if (accionFinal === 'aprobada') {
          const updateBalanceRequest = new sql.Request(transaction);
          updateBalanceRequest.input('empleadoID', sql.Int, empleadoID);
          updateBalanceRequest.input('dias', sql.Int, diasSolicitud);

          await updateBalanceRequest.query(`
            UPDATE BalanceVacaciones
            SET DiasUsados = DiasUsados + @dias,
                DiasDisponibles = DiasDisponibles - @dias,
                FechaActualizacion = GETDATE()
            WHERE EmpleadoID = @empleadoID 
              AND Anio = YEAR(GETDATE())
          `);
        }

        await transaction.commit();
        return res.json({ 
          message: `Solicitud ${accionFinal} manualmente exitosamente`,
          tipo: 'manual'
        });
      }

      const pendientes = flujo.filter(f => !f.Accion);
      if (pendientes.length === 0) {
        await transaction.rollback();
        return res.status(400).json({ error: 'No hay aprobaciones pendientes' });
      }

      const siguienteAprobacion = pendientes[0];
      const rolNormalizado = rolAprobador?.toLowerCase().replace(/\s+/g, '_');
      const rolEsperado = siguienteAprobacion.RolAprobador?.toLowerCase().replace(/\s+/g, '_');

      if (rolNormalizado !== rolEsperado) {
        await transaction.rollback();
        return res.status(403).json({ 
          error: 'No tienes permiso para aprobar en este nivel',
          esperado: rolEsperado,
          tuRol: rolNormalizado
        });
      }

      const updateFlujoRequest = new sql.Request(transaction);
      updateFlujoRequest.input('solicitudID', sql.Int, parseInt(solicitudID));
      updateFlujoRequest.input('aprobadorID', sql.Int, aprobadorID);
      updateFlujoRequest.input('rolAprobador', sql.NVarChar, rolAprobador);
      updateFlujoRequest.input('accion', sql.NVarChar, accionFinal);
      updateFlujoRequest.input('ordenFlujo', sql.Int, siguienteAprobacion.OrdenFlujo);

      await updateFlujoRequest.query(`
        UPDATE FlujoAprobacionVacaciones 
        SET AprobadorID = @aprobadorID,
            Accion = @accion,
            FechaAprobacion = GETDATE()
        WHERE SolicitudID = @solicitudID 
          AND OrdenFlujo = @ordenFlujo
      `);

      if (accionFinal === 'rechazada') {
        const updateRequest = new sql.Request(transaction);
        updateRequest.input('solicitudID', sql.Int, parseInt(solicitudID));
        updateRequest.input('aprobadorID', sql.Int, aprobadorID);

        await updateRequest.query(`
          UPDATE SolicitudesVacaciones 
          SET Estado = 'Rechazada', 
              AprobadoPorID = @aprobadorID, 
              FechaAprobacionFinal = GETDATE()
          WHERE SolicitudID = @solicitudID
        `);
      } else {
        const actualizadosRequest = new sql.Request(transaction);
        actualizadosRequest.input('solicitudID', sql.Int, parseInt(solicitudID));
        const actualizadosResult = await actualizadosRequest.query(`
          SELECT COUNT(*) as total 
          FROM FlujoAprobacionVacaciones 
          WHERE SolicitudID = @solicitudID 
            AND Accion IS NOT NULL
        `);

        const totalFlujo = flujo.length;
        const aprobadosAhora = actualizadosResult.recordset[0].total;

        if (aprobadosAhora === totalFlujo) {
          const updateRequest = new sql.Request(transaction);
          updateRequest.input('solicitudID', sql.Int, parseInt(solicitudID));
          updateRequest.input('aprobadorID', sql.Int, aprobadorID);

          await updateRequest.query(`
            UPDATE SolicitudesVacaciones 
            SET Estado = 'Aprobada', 
                AprobadoPorID = @aprobadorID, 
                FechaAprobacionFinal = GETDATE()
            WHERE SolicitudID = @solicitudID
          `);

          const updateBalanceRequest = new sql.Request(transaction);
          updateBalanceRequest.input('empleadoID', sql.Int, empleadoID);
          updateBalanceRequest.input('dias', sql.Int, diasSolicitud);

          await updateBalanceRequest.query(`
            UPDATE BalanceVacaciones
            SET DiasUsados = DiasUsados + @dias,
                DiasDisponibles = DiasDisponibles - @dias,
                FechaActualizacion = GETDATE()
            WHERE EmpleadoID = @empleadoID 
              AND Anio = YEAR(GETDATE())
          `);
        }
      }

      await transaction.commit();
      res.json({ 
        message: `Solicitud ${accionFinal} exitosamente`,
        tipo: 'automatica'
      });
    } catch (error) {
      console.error('Error al aprobar solicitud:', error);
      if (transaction) {
        await transaction.rollback();
      }
      res.status(500).json({ 
        error: 'Error al procesar solicitud',
        details: error.message 
      });
    }
  }

  // ===============================
  // Obtener estadísticas detalladas con períodos
  // ===============================
  static async getEstadisticasDetalladas(req, res) {
    try {
      const pool = req.app.locals.db;
      const { empleadoId } = req.params;

      // Obtener balance por año
      const balanceQuery = `
        SELECT 
          b.Anio,
          b.DiasTotales,
          b.DiasUsados,
          b.DiasPendientes,
          b.DiasDisponibles,
          b.BalanceID,
          e.NOMBRE,
          e.APELLIDO,
          e.FECHAINGRESO
        FROM BalanceVacaciones b
        INNER JOIN Empleados e ON b.EmpleadoID = e.EmpleadoID
        WHERE b.EmpleadoID = @empleadoID
        ORDER BY b.Anio DESC
      `;

      const balanceRequest = pool.request();
      balanceRequest.input('empleadoID', sql.Int, parseInt(empleadoId));
      const balanceResult = await balanceRequest.query(balanceQuery);

      // Sumar TODOS los días disponibles de TODOS los períodos
      const totalDisponibles = balanceResult.recordset.reduce((sum, b) => {
        const anioActual = new Date().getFullYear();
        if (b.Anio < anioActual) {
          return sum + (b.DiasPendientes || 0);
        } else {
          return sum + (b.DiasDisponibles || 0);
        }
      }, 0);

      const totalUsados = balanceResult.recordset.reduce((sum, b) => sum + (b.DiasUsados || 0), 0);
      const totalAcumulado = balanceResult.recordset.reduce((sum, b) => sum + (b.DiasTotales || 0), 0);

      // Obtener solicitudes
      const solicitudesQuery = `
        SELECT 
          FechaInicio,
          FechaFin,
          Dias,
          Estado,
          YEAR(FechaInicio) as Anio
        FROM SolicitudesVacaciones
        WHERE EmpleadoID = @empleadoID
        ORDER BY FechaInicio DESC
      `;

      const solicitudesRequest = pool.request();
      solicitudesRequest.input('empleadoID', sql.Int, parseInt(empleadoId));
      const solicitudesResult = await solicitudesRequest.query(solicitudesQuery);

      // ✅ CAMBIO PRINCIPAL: Formatear periodos para el frontend (SOLO años anteriores - acumulados)
      const anioActual = new Date().getFullYear();
      const periodos = balanceResult.recordset
        .filter(b => b.Anio < anioActual) // ✅ SOLO años anteriores
        .map(b => {
          // Usar días pendientes para años anteriores
          const diasDisponiblesReal = b.DiasPendientes || 0;

          // Crear descripción de período laboral (Año-1 a Año)
          const anioInicio = b.Anio - 1;
          const anioFin = b.Anio;
          const descripcion = `Período ${anioInicio}-${anioFin}`;

          return {
            balanceId: b.BalanceID,
            anio: b.Anio,
            anioInicio: anioInicio,
            anioFin: anioFin,
            descripcion: descripcion,
            diasTotales: b.DiasTotales || 0,
            diasUsados: b.DiasUsados || 0,
            diasPendientes: b.DiasPendientes || 0,
            diasDisponibles: diasDisponiblesReal
          };
        });

      res.json({
        totales: {
          diasTotales: totalAcumulado,
          diasUsados: totalUsados,
          diasDisponibles: totalDisponibles,
          diasPendientes: balanceResult.recordset.reduce((sum, b) => sum + (b.DiasPendientes || 0), 0)
        },
        periodos: periodos,
        balancePorAnio: balanceResult.recordset,
        totalAcumulado: totalDisponibles,
        totalUsados: totalUsados,
        solicitudes: solicitudesResult.recordset
      });
    } catch (error) {
      console.error('Error al obtener estadísticas detalladas:', error);
      res.status(500).json({ 
        error: 'Error al obtener estadísticas detalladas',
        details: error.message 
      });
    }
  }

  // ===============================
  // Asignar días manualmente (solo RRHH)
  // ===============================
  static async asignarDias(req, res) {
    try {
      const pool = req.app.locals.db;
      const { empleadoID, anio, diasTotales } = req.body;

      // Verificar si ya existe un balance para ese año
      const checkBalanceQuery = `
        SELECT BalanceID 
        FROM BalanceVacaciones
        WHERE EmpleadoID = @empleadoID 
          AND Anio = @anio
      `;

      const checkRequest = pool.request();
      checkRequest.input('empleadoID', sql.Int, empleadoID);
      checkRequest.input('anio', sql.Int, anio);
      const checkResult = await checkRequest.query(checkBalanceQuery);

      if (checkResult.recordset.length > 0) {
        // Actualizar balance existente
        const updateQuery = `
          UPDATE BalanceVacaciones
          SET DiasTotales = @diasTotales,
              DiasPendientes = @diasTotales - DiasUsados,
              DiasDisponibles = @diasTotales - DiasUsados,
              FechaActualizacion = GETDATE()
          WHERE EmpleadoID = @empleadoID 
            AND Anio = @anio
        `;

        const updateRequest = pool.request();
        updateRequest.input('empleadoID', sql.Int, empleadoID);
        updateRequest.input('anio', sql.Int, anio);
        updateRequest.input('diasTotales', sql.Int, diasTotales);
        await updateRequest.query(updateQuery);

        res.json({ message: 'Balance actualizado exitosamente' });
      } else {
        // Crear nuevo balance
        const insertQuery = `
          INSERT INTO BalanceVacaciones 
            (EmpleadoID, Anio, DiasTotales, DiasUsados, DiasPendientes, DiasDisponibles, FechaCreacion)
          VALUES 
            (@empleadoID, @anio, @diasTotales, 0, @diasTotales, @diasTotales, GETDATE())
        `;

        const insertRequest = pool.request();
        insertRequest.input('empleadoID', sql.Int, empleadoID);
        insertRequest.input('anio', sql.Int, anio);
        insertRequest.input('diasTotales', sql.Int, diasTotales);
        await insertRequest.query(insertQuery);

        res.status(201).json({ message: 'Balance creado exitosamente' });
      }
    } catch (error) {
      console.error('Error al asignar días:', error);
      res.status(500).json({ 
        error: 'Error al asignar días',
        details: error.message 
      });
    }
  }

  // ===============================
  // Obtener solicitud por ID
  // ===============================
  static async getSolicitudById(req, res) {
    try {
      const pool = req.app.locals.db;
      const { id } = req.params;

      const query = `
        SELECT 
          v.SolicitudID,
          v.EmpleadoID,
          v.TipoSolicitud,
          v.FechaInicio,
          v.FechaFin,
          v.Dias,
          v.DiasHabiles,
          v.Motivo,
          v.Estado,
          v.FechaSolicitud,
          v.FechaAprobacionFinal,
          v.AprobadoPorID,
          e.NOMBRE,
          e.APELLIDO,
          e.CARGO
        FROM SolicitudesVacaciones v
        INNER JOIN Empleados e ON v.EmpleadoID = e.EmpleadoID
        WHERE v.SolicitudID = @solicitudID
      `;

      const request = pool.request();
      request.input('solicitudID', sql.Int, parseInt(id));
      const result = await request.query(query);

      if (!result.recordset.length) {
        return res.status(404).json({ error: 'Solicitud no encontrada' });
      }

      res.json(result.recordset[0]);
    } catch (error) {
      console.error('Error al obtener solicitud:', error);
      res.status(500).json({ 
        error: 'Error al obtener solicitud',
        details: error.message 
      });
    }
  }
}

export default VacacionesController;