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
  // ✅ OPTIMIZADO - Sin timeout
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

      // ✅ OPTIMIZACIÓN: Traer todos los flujos en UNA sola consulta (en vez de 1 por solicitud)
      if (result.recordset.length > 0) {
        const solicitudIds = result.recordset.map(s => s.id);
        
        const flujoResult = await pool.request().query(`
          SELECT 
            f.SolicitudID,
            f.RolAprobador as rol,
            CONCAT(e.NOMBRE, ' ', e.APELLIDO) as aprobadoPor,
            f.FechaAprobacion as fecha,
            f.Accion as accion,
            f.TipoAprobacion as tipo,
            f.MotivoManual as motivoManual,
            f.OrdenFlujo
          FROM FlujoAprobacionVacaciones f
          LEFT JOIN Empleados e ON f.AprobadorID = e.EmpleadoID
          WHERE f.SolicitudID IN (${solicitudIds.join(',')})
          ORDER BY f.SolicitudID, f.OrdenFlujo
        `);

        // Agrupar flujos por solicitud en JavaScript (muy rápido)
        const flujosPorSolicitud = {};
        flujoResult.recordset.forEach(flujo => {
          if (!flujosPorSolicitud[flujo.SolicitudID]) {
            flujosPorSolicitud[flujo.SolicitudID] = [];
          }
          flujosPorSolicitud[flujo.SolicitudID].push(flujo);
        });

        // Asignar flujos a cada solicitud
        result.recordset.forEach(solicitud => {
          solicitud.flujoAprobacion = flujosPorSolicitud[solicitud.id] || [];
        });
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
    try {
      const pool = req.app.locals.db;
      const { empleadoID, fechaInicio, fechaFin, dias, motivo } = req.body;

      // Validar que el empleado tenga días disponibles (SUMA de todos los períodos)
      const checkQuery = `
        SELECT SUM(DiasPendientes) as TotalDisponibles
        FROM BalanceVacaciones 
        WHERE EmpleadoID = @empleadoID 
          AND Anio <= YEAR(GETDATE())
      `;

      const checkRequest = pool.request();
      checkRequest.input('empleadoID', sql.Int, empleadoID);
      const checkResult = await checkRequest.query(checkQuery);

      const disponibles = checkResult.recordset[0]?.TotalDisponibles || 0;

      if (disponibles < dias) {
        return res.status(400).json({ 
          error: 'Días insuficientes', 
          disponibles: disponibles
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

  // El resto de los métodos se mantienen igual...
  // (aprobarSolicitud, getEstadisticasDetalladas, asignarDias, getSolicitudById)

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
        try {
          await transaction.rollback();
        } catch (rollbackError) {
          console.error('Error en rollback:', rollbackError);
        }
      }
      res.status(500).json({ 
        error: 'Error al procesar solicitud',
        details: error.message 
      });
    }
  }

  // ===============================
  // Obtener estadísticas detalladas
  // ===============================
  static async getEstadisticasDetalladas(req, res) {
    try {
      const pool = req.app.locals.db;
      const { empleadoId } = req.params;

      const balanceQuery = `
        SELECT 
          b.Anio,
          b.DiasTotales,
          b.DiasUsados,
          b.DiasPendientes,
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

      // Calcular total disponible (suma de DiasPendientes)
      const totalDisponibles = balanceResult.recordset.reduce((sum, b) => {
        return sum + (b.DiasPendientes || 0);
      }, 0);

      const totalUsados = balanceResult.recordset.reduce((sum, b) => sum + (b.DiasUsados || 0), 0);
      const totalAcumulado = balanceResult.recordset.reduce((sum, b) => sum + (b.DiasTotales || 0), 0);

      // Formatear períodos
      const periodos = balanceResult.recordset.map(b => {
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
          diasDisponibles: b.DiasPendientes || 0
        };
      });

      res.json({
        totales: {
          diasTotales: totalAcumulado,
          diasUsados: totalUsados,
          diasDisponibles: totalDisponibles,
          diasPendientes: totalDisponibles
        },
        periodos: periodos,
        balancePorAnio: balanceResult.recordset
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