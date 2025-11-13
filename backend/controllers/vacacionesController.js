// backend/controllers/vacacionesController.js
import sql from 'mssql';

class VacacionesController {
  /**
   * Define la jerarquía de aprobación según el rol
   */
  static getJerarquiaAprobacion(rol) {
    const jerarquia = {
      colaborador: ['gerente', 'director', 'gerente_rrhh', 'director_rrhh'],
      gerente: ['director', 'gerente_rrhh', 'director_rrhh'],
      director: ['gerente_rrhh', 'director_rrhh'],
      rrhh: ['gerente_rrhh', 'director_rrhh'],
      gerente_rrhh: ['director_rrhh'],
      director_rrhh: [],
      admin: []
    };
    return jerarquia[rol?.toLowerCase().replace(/\s+/g, '_')] || ['gerente', 'director', 'gerente_rrhh', 'director_rrhh'];
  }

  /**
   * Obtiene el flujo de aprobación dinámico basado en el rol del empleado solicitante
   */
  static getFlujoAprobacion(rolEmpleado) {
    const flujoBase = [
      { orden: 1, rol: 'gerente', tipo: 'automatica' },
      { orden: 2, rol: 'director', tipo: 'automatica' },
      { orden: 3, rol: 'gerente_rrhh', tipo: 'automatica' },
      { orden: 4, rol: 'director_rrhh', tipo: 'automatica' }
    ];

    const rolNormalizado = (rolEmpleado || '').toLowerCase().replace(/\s+/g, '_');
    const rolesAprobar = VacacionesController.getJerarquiaAprobacion(rolNormalizado);

    if (rolesAprobar.length === 0) {
      return [];
    }

    return flujoBase.filter(nivel => rolesAprobar.includes(nivel.rol));
  }

  // ===============================
  // Obtener solicitudes según rol y jerarquía ORGANIZACIONAL
  // ===============================
  static async getSolicitudes(req, res) {
    try {
      const pool = req.app.locals.db;
      if (!pool) return res.status(500).json({ error: 'DB pool no disponible' });

      const { usuarioID, rol } = req.query;
      const rolNormalizado = (rol || '').toLowerCase().replace(/\s+/g, '_');

      console.log('📥 getSolicitudes:', { usuarioID, rol: rolNormalizado });

      const request = pool.request();
      request.timeout = 120000;
      request.input('usuarioID', sql.Int, parseInt(usuarioID, 10) || 0);

      const usuarioActual = await request.query(
        'SELECT EmpleadoID, SupervisorID FROM Empleados WHERE EmpleadoID = (SELECT EmpleadoID FROM Usuarios WHERE UsuarioID = @usuarioID)'
      );

      const empleadoIdActual = usuarioActual.recordset[0]?.EmpleadoID || null;
      const supervisorIdActual = usuarioActual.recordset[0]?.SupervisorID || null;
      
      console.log('👤 Empleado actual:', empleadoIdActual, 'Supervisor:', supervisorIdActual);

      let query = `
        WITH SolicitudesBase AS (
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
            CONCAT(ea.NOMBRE, ' ', ea.APELLIDO) as aprobadoPor,
            e.DEPARTAMENTOID as departamentoId,
            e.SupervisorID as supervisorEmpleado
          FROM SolicitudesVacaciones sv
          INNER JOIN Empleados e ON sv.EmpleadoID = e.EmpleadoID
          LEFT JOIN Usuarios u ON e.EmpleadoID = u.EmpleadoID
          LEFT JOIN Departamentos d ON e.DEPARTAMENTOID = d.DepartamentoID
          LEFT JOIN Puestos p ON e.PUESTOID = p.PuestoID
          LEFT JOIN Empleados ea ON sv.AprobadoPorID = ea.EmpleadoID
      `;

      // ========== FILTROS POR ROL Y JERARQUÍA ==========
      if (rolNormalizado === 'colaborador') {
        // Solo mis solicitudes
        query += ` WHERE sv.EmpleadoID = @empleadoIdActual`;
        
      } else if (rolNormalizado === 'gerente') {
        // 1. Solicitudes donde soy el próximo aprobador Y soy supervisor del empleado
        // 2. Mis propias solicitudes
        query += ` 
          WHERE (
            (
              -- Solicitudes de mis subordinados directos pendientes de mi aprobación
              e.SupervisorID = @empleadoIdActual
              AND EXISTS (
                SELECT 1 FROM FlujoAprobacionVacaciones f 
                WHERE f.SolicitudID = sv.SolicitudID 
                  AND LOWER(REPLACE(f.RolAprobador, ' ', '_')) = 'gerente'
                  AND f.Accion IS NULL
                  AND LOWER(sv.Estado) IN ('pendiente', 'pending')
                  AND NOT EXISTS (
                    SELECT 1 FROM FlujoAprobacionVacaciones f2 
                    WHERE f2.SolicitudID = f.SolicitudID 
                      AND f2.OrdenFlujo < f.OrdenFlujo 
                      AND f2.Accion IS NULL
                  )
              )
            )
            OR sv.EmpleadoID = @empleadoIdActual
          )
        `;
        
      } else if (rolNormalizado === 'director') {
        // 1. Solicitudes donde soy el próximo aprobador Y están en mi jerarquía
        // 2. Mis propias solicitudes
        query += ` 
          WHERE (
            (
              -- Solicitudes de empleados en mi departamento/jerarquía
              EXISTS (
                SELECT 1 
                FROM Empleados sub 
                WHERE sub.EmpleadoID = e.EmpleadoID 
                  AND (
                    sub.SupervisorID IN (
                      SELECT EmpleadoID FROM Empleados WHERE SupervisorID = @empleadoIdActual
                    )
                    OR sub.SupervisorID = @empleadoIdActual
                  )
              )
              AND EXISTS (
                SELECT 1 FROM FlujoAprobacionVacaciones f 
                WHERE f.SolicitudID = sv.SolicitudID 
                  AND LOWER(REPLACE(f.RolAprobador, ' ', '_')) = 'director'
                  AND f.Accion IS NULL
                  AND LOWER(sv.Estado) IN ('pendiente', 'pending')
                  AND NOT EXISTS (
                    SELECT 1 FROM FlujoAprobacionVacaciones f2 
                    WHERE f2.SolicitudID = f.SolicitudID 
                      AND f2.OrdenFlujo < f.OrdenFlujo 
                      AND f2.Accion IS NULL
                  )
              )
            )
            OR sv.EmpleadoID = @empleadoIdActual
          )
        `;
        
      } else if (['gerente_rrhh', 'director_rrhh', 'rrhh'].includes(rolNormalizado)) {
        // RRHH ve TODAS las solicitudes de la empresa
        query += ` WHERE 1=1`;
        
      } else {
        // Default: solo mis solicitudes
        if (empleadoIdActual) query += ` WHERE sv.EmpleadoID = @empleadoIdActual`;
      }

      query += `
        )
        SELECT 
          s.*,
          f.RolAprobador as flujo_rol,
          CONCAT(ef.NOMBRE, ' ', ef.APELLIDO) as flujo_aprobadoPor,
          f.FechaAprobacion as flujo_fecha,
          f.Accion as flujo_accion,
          f.TipoAprobacion as flujo_tipo,
          f.MotivoManual as flujo_motivoManual,
          f.OrdenFlujo as flujo_orden
        FROM SolicitudesBase s
        LEFT JOIN FlujoAprobacionVacaciones f ON s.id = f.SolicitudID
        LEFT JOIN Empleados ef ON f.AprobadorID = ef.EmpleadoID
        ORDER BY s.fechaSolicitud DESC, s.id, f.OrdenFlujo
      `;

      const mainRequest = pool.request();
      mainRequest.timeout = 120000;
      mainRequest.input('empleadoIdActual', sql.Int, empleadoIdActual);

      console.log('🔍 Ejecutando query para rol:', rolNormalizado);
      const result = await mainRequest.query(query);
      console.log('📊 Resultados encontrados:', result.recordset.length);

      const solicitudesMap = new Map();

      for (const row of result.recordset) {
        if (!solicitudesMap.has(row.id)) {
          solicitudesMap.set(row.id, {
            id: row.id,
            empleadoId: row.empleadoId,
            empleado: row.empleado,
            empleadoRole: row.empleadoRole,
            departamento: row.departamento,
            puesto: row.puesto,
            fechaInicio: row.fechaInicio,
            fechaFin: row.fechaFin,
            dias: row.dias,
            diasHabiles: row.diasHabiles,
            motivo: row.motivo,
            tipo: row.tipo,
            estado: row.estado,
            fechaSolicitud: row.fechaSolicitud,
            aprobacionManual: row.aprobacionManual,
            aprobadoPor: row.aprobadoPor,
            supervisorEmpleado: row.supervisorEmpleado,
            flujoAprobacion: []
          });
        }

        if (row.flujo_rol) {
          solicitudesMap.get(row.id).flujoAprobacion.push({
            rol: row.flujo_rol,
            aprobadoPor: row.flujo_aprobadoPor,
            fecha: row.flujo_fecha,
            accion: row.flujo_accion,
            tipo: row.flujo_tipo,
            motivoManual: row.flujo_motivoManual,
            orden: row.flujo_orden
          });
        }
      }

      const solicitudes = Array.from(solicitudesMap.values());
      console.log('✅ Solicitudes procesadas:', solicitudes.length);
      
      res.json(solicitudes);
    } catch (error) {
      console.error('❌ Error getSolicitudes:', error);
      res.status(500).json({ error: 'Error al obtener solicitudes', details: error.message });
    }
  }

  // ===============================
  // Crear solicitud simple (sin períodos)
  // ===============================
  static async crearSolicitud(req, res) {
    const transaction = new sql.Transaction(req.app.locals.db);
    try {
      await transaction.begin();

      const {
        empleadoID: empleadoIDParam,
        empleadoId,
        fechaInicio,
        fechaFin,
        dias,
        motivo,
        tipo
      } = req.body;

      const empleadoID = empleadoIDParam || empleadoId;

      if (!empleadoID || !fechaInicio || !fechaFin || !dias) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Faltan datos requeridos' });
      }

      // Validar fechas
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      if (inicio < hoy) {
        await transaction.rollback();
        return res.status(400).json({ error: 'La fecha de inicio no puede ser en el pasado' });
      }

      if (fin <= inicio) {
        await transaction.rollback();
        return res.status(400).json({ error: 'La fecha de fin debe ser posterior a la fecha de inicio' });
      }

      // Obtener rol del empleado
      const empleadoRequest = new sql.Request(transaction);
      empleadoRequest.input('empleadoID', sql.Int, empleadoID);
      const empleadoResult = await empleadoRequest.query(`
        SELECT u.Rol 
        FROM Usuarios u 
        WHERE u.EmpleadoID = @empleadoID
      `);

      const rolEmpleado = empleadoResult.recordset[0]?.Rol || 'colaborador';

      // Verificar días disponibles solo para vacaciones
      if (tipo === 'vacaciones') {
        const checkRequest = new sql.Request(transaction);
        checkRequest.input('empleadoID', sql.Int, empleadoID);
        const checkResult = await checkRequest.query(`
          SELECT (DiasPendientes + DiasDisponibles) AS TotalDisponible
          FROM BalanceVacaciones
          WHERE EmpleadoID = @empleadoID AND Anio = YEAR(GETDATE())
        `);

        const totalDisponible = checkResult.recordset[0]?.TotalDisponible ?? 0;

        if (totalDisponible < dias) {
          await transaction.rollback();
          return res.status(400).json({ 
            error: 'Días insuficientes', 
            disponibles: totalDisponible,
            solicitados: dias
          });
        }
      }

      // Insertar solicitud
      const insertRequest = new sql.Request(transaction);
      insertRequest.input('empleadoID', sql.Int, empleadoID);
      insertRequest.input('fechaInicio', sql.Date, fechaInicio);
      insertRequest.input('fechaFin', sql.Date, fechaFin);
      insertRequest.input('dias', sql.Int, dias);
      insertRequest.input('motivo', sql.NVarChar, motivo || '');
      insertRequest.input('tipo', sql.NVarChar, tipo || 'Vacaciones');

      const insertResult = await insertRequest.query(`
        INSERT INTO SolicitudesVacaciones
          (EmpleadoID, TipoSolicitud, FechaInicio, FechaFin, Dias, DiasHabiles, Motivo, Estado, FechaSolicitud)
        VALUES
          (@empleadoID, @tipo, @fechaInicio, @fechaFin, @dias, @dias, @motivo, 'Pendiente', GETDATE());
        SELECT CAST(SCOPE_IDENTITY() AS INT) AS SolicitudID;
      `);

      const solicitudID = insertResult.recordset?.[0]?.SolicitudID ?? null;

      if (!solicitudID) {
        await transaction.rollback();
        return res.status(500).json({ error: 'No fue posible crear la solicitud' });
      }

      // Crear flujo dinámico basado en el rol del empleado
      const flujoAprobacion = VacacionesController.getFlujoAprobacion(rolEmpleado);

      for (const nivel of flujoAprobacion) {
        const flujoRequest = new sql.Request(transaction);
        flujoRequest.input('solicitudID', sql.Int, solicitudID);
        flujoRequest.input('rol', sql.NVarChar, nivel.rol);
        flujoRequest.input('tipo', sql.NVarChar, nivel.tipo);
        flujoRequest.input('orden', sql.Int, nivel.orden);
        await flujoRequest.query(`
          INSERT INTO FlujoAprobacionVacaciones (SolicitudID, RolAprobador, TipoAprobacion, OrdenFlujo)
          VALUES (@solicitudID, @rol, @tipo, @orden)
        `);
      }

      await transaction.commit();
      res.status(201).json({ 
        message: 'Solicitud creada exitosamente', 
        solicitudID,
        flujoCreado: flujoAprobacion.length > 0
      });
    } catch (error) {
      console.error('❌ Error crearSolicitud:', error);
      try { await transaction.rollback(); } catch (e) { console.error('Rollback error', e); }
      res.status(500).json({ error: 'Error al crear solicitud', details: error.message });
    }
  }

  // ===============================
  // Crear solicitud con períodos
  // ===============================
  static async crearSolicitudConPeriodos(req, res) {
    const transaction = new sql.Transaction(req.app.locals.db);
    try {
      await transaction.begin();
      const {
        empleadoId,
        fechaInicio,
        fechaFin,
        dias,
        diasHabiles,
        motivo,
        tipo,
        periodosSeleccionados
      } = req.body;

      if (!empleadoId || !periodosSeleccionados || !Array.isArray(periodosSeleccionados) || periodosSeleccionados.length === 0) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Faltan datos o periodos inválidos' });
      }

      // Validar fechas
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      if (inicio < hoy) {
        await transaction.rollback();
        return res.status(400).json({ error: 'La fecha de inicio no puede ser en el pasado' });
      }

      if (fin <= inicio) {
        await transaction.rollback();
        return res.status(400).json({ error: 'La fecha de fin debe ser posterior a la fecha de inicio' });
      }

      // Obtener rol del empleado
      const empleadoRequest = new sql.Request(transaction);
      empleadoRequest.input('empleadoID', sql.Int, empleadoId);
      const empleadoResult = await empleadoRequest.query(`
        SELECT u.Rol 
        FROM Usuarios u 
        WHERE u.EmpleadoID = @empleadoID
      `);

      const rolEmpleado = empleadoResult.recordset[0]?.Rol || 'colaborador';

      let totalDias = 0;
      const periodosConBalance = [];

      // Validar cada período
      for (const periodo of periodosSeleccionados) {
        const balanceId = parseInt(periodo.balanceId, 10);
        const diasPeriodo = parseInt(periodo.dias, 10) || 0;
        
        if (!balanceId || diasPeriodo <= 0) {
          await transaction.rollback();
          return res.status(400).json({ error: 'Período con datos inválidos', periodo });
        }

        const balanceRequest = new sql.Request(transaction);
        balanceRequest.input('balanceID', sql.Int, balanceId);
        const balanceResult = await balanceRequest.query(`
          SELECT BalanceID, EmpleadoID, Anio, DiasDisponibles, DiasPendientes, DiasUsados
          FROM BalanceVacaciones
          WHERE BalanceID = @balanceID
        `);

        if (!balanceResult.recordset.length) {
          await transaction.rollback();
          return res.status(400).json({ error: `Balance no encontrado: ${balanceId}` });
        }

        const b = balanceResult.recordset[0];
        const totalDisponible = (b.DiasPendientes ?? 0) + (b.DiasDisponibles ?? 0);
        
        if (totalDisponible < diasPeriodo) {
          await transaction.rollback();
          return res.status(400).json({ 
            error: `Días insuficientes en balance ${balanceId}`, 
            disponibles: totalDisponible,
            solicitados: diasPeriodo
          });
        }

        totalDias += diasPeriodo;
        periodosConBalance.push({
          balanceID: b.BalanceID,
          dias: diasPeriodo,
          anio: b.Anio
        });
      }

      // Insertar solicitud
      const insertRequest = new sql.Request(transaction);
      insertRequest.input('empleadoID', sql.Int, empleadoId);
      insertRequest.input('fechaInicio', sql.Date, fechaInicio);
      insertRequest.input('fechaFin', sql.Date, fechaFin);
      insertRequest.input('totalDias', sql.Int, totalDias);
      insertRequest.input('diasHabiles', sql.Int, diasHabiles || totalDias);
      insertRequest.input('motivo', sql.NVarChar, motivo || '');
      insertRequest.input('tipo', sql.NVarChar, tipo || 'Vacaciones');

      const insertResult = await insertRequest.query(`
        INSERT INTO SolicitudesVacaciones
          (EmpleadoID, TipoSolicitud, FechaInicio, FechaFin, Dias, DiasHabiles, Motivo, Estado, FechaSolicitud)
        VALUES
          (@empleadoID, @tipo, @fechaInicio, @fechaFin, @totalDias, @diasHabiles, @motivo, 'Pendiente', GETDATE());
        SELECT CAST(SCOPE_IDENTITY() AS INT) AS SolicitudID;
      `);

      const solicitudID = insertResult.recordset?.[0]?.SolicitudID ?? null;
      
      if (!solicitudID) {
        await transaction.rollback();
        return res.status(500).json({ error: 'No fue posible crear la solicitud' });
      }

      // Crear flujo dinámico
      const flujoAprobacion = VacacionesController.getFlujoAprobacion(rolEmpleado);

      for (const nivel of flujoAprobacion) {
        const flujoRequest = new sql.Request(transaction);
        flujoRequest.input('solicitudID', sql.Int, solicitudID);
        flujoRequest.input('rol', sql.NVarChar, nivel.rol);
        flujoRequest.input('tipo', sql.NVarChar, nivel.tipo);
        flujoRequest.input('orden', sql.Int, nivel.orden);
        await flujoRequest.query(`
          INSERT INTO FlujoAprobacionVacaciones (SolicitudID, RolAprobador, TipoAprobacion, OrdenFlujo)
          VALUES (@solicitudID, @rol, @tipo, @orden)
        `);
      }

      // Guardar detalle de períodos
      for (const periodo of periodosConBalance) {
        const detalleRequest = new sql.Request(transaction);
        detalleRequest.input('solicitudID', sql.Int, solicitudID);
        detalleRequest.input('balanceID', sql.Int, periodo.balanceID);
        detalleRequest.input('dias', sql.Int, periodo.dias);
        await detalleRequest.query(`
          INSERT INTO SolicitudVacacionesDetalle (SolicitudID, BalanceID, DiasUtilizados)
          VALUES (@solicitudID, @balanceID, @dias)
        `);
      }

      await transaction.commit();
      res.status(201).json({ 
        message: 'Solicitud con periodos creada exitosamente', 
        solicitudID, 
        totalDias,
        flujoCreado: flujoAprobacion.length > 0
      });
    } catch (error) {
      console.error('❌ Error crearSolicitudConPeriodos:', error);
      try { await transaction.rollback(); } catch (e) { console.error('Rollback error', e); }
      res.status(500).json({ error: 'Error al crear solicitud con períodos', details: error.message });
    }
  }

  // ===============================
  // Aprobar/Rechazar solicitud
  // ===============================
  static async aprobarSolicitud(req, res) {
    const transaction = new sql.Transaction(req.app.locals.db);
    try {
      await transaction.begin();

      const { solicitudID, usuarioID, accion, esManual = false, motivo = '' } = req.body;
      
      if (!solicitudID || !usuarioID || !accion) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Faltan datos: solicitudID, usuarioID, accion' });
      }

      const accionNormalizada = accion.toLowerCase();
      if (!['aprobada', 'rechazada'].includes(accionNormalizada)) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Acción inválida' });
      }

      const usuarioRequest = new sql.Request(transaction);
      usuarioRequest.input('usuarioID', sql.Int, parseInt(usuarioID, 10));
      const usuarioResult = await usuarioRequest.query(`
        SELECT EmpleadoID, Rol FROM Usuarios WHERE UsuarioID = @usuarioID
      `);

      if (!usuarioResult.recordset.length) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const aprobadorID = usuarioResult.recordset[0].EmpleadoID;
      const rolAprobador = usuarioResult.recordset[0].Rol;

      const solicitudRequest = new sql.Request(transaction);
      solicitudRequest.input('solicitudID', sql.Int, parseInt(solicitudID, 10));
      const solicitudResult = await solicitudRequest.query(`
        SELECT Estado, EmpleadoID, Dias FROM SolicitudesVacaciones WHERE SolicitudID = @solicitudID
      `);

      if (!solicitudResult.recordset.length) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Solicitud no encontrada' });
      }

      const { Estado: estadoActual, EmpleadoID: empleadoID, Dias: diasSolicitud } = solicitudResult.recordset[0];
      
      if (estadoActual.toLowerCase() !== 'pendiente') {
        await transaction.rollback();
        return res.status(400).json({ error: 'Solicitud ya procesada', estadoActual });
      }

      const flujoRequest = new sql.Request(transaction);
      flujoRequest.input('solicitudID', sql.Int, parseInt(solicitudID, 10));
      const flujoResult = await flujoRequest.query(`
        SELECT OrdenFlujo, RolAprobador, Accion, TipoAprobacion, AprobadorID
        FROM FlujoAprobacionVacaciones
        WHERE SolicitudID = @solicitudID
        ORDER BY OrdenFlujo
      `);

      const flujo = flujoResult.recordset || [];
      const accionFinal = accionNormalizada === 'aprobada' ? 'Aprobada' : 'Rechazada';

      // APROBACIÓN MANUAL
      if (esManual) {
        const insertFlujoRequest = new sql.Request(transaction);
        insertFlujoRequest.input('solicitudID', sql.Int, parseInt(solicitudID, 10));
        insertFlujoRequest.input('aprobadorID', sql.Int, aprobadorID);
        insertFlujoRequest.input('rolAprobador', sql.NVarChar, rolAprobador);
        insertFlujoRequest.input('accion', sql.NVarChar, accionFinal);
        insertFlujoRequest.input('tipo', sql.NVarChar, 'manual');
        insertFlujoRequest.input('motivoManual', sql.NVarChar, motivo);
        insertFlujoRequest.input('ordenFlujo', sql.Int, flujo.length + 1);

        await insertFlujoRequest.query(`
          INSERT INTO FlujoAprobacionVacaciones
            (SolicitudID, AprobadorID, RolAprobador, Accion, TipoAprobacion, MotivoManual, OrdenFlujo, FechaAprobacion)
          VALUES (@solicitudID, @aprobadorID, @rolAprobador, @accion, @tipo, @motivoManual, @ordenFlujo, GETDATE())
        `);

        const updateRequest = new sql.Request(transaction);
        updateRequest.input('solicitudID', sql.Int, parseInt(solicitudID, 10));
        updateRequest.input('estado', sql.NVarChar, accionFinal);
        updateRequest.input('aprobadorID', sql.Int, aprobadorID);
        updateRequest.input('aprobacionManual', sql.Bit, 1);

        await updateRequest.query(`
          UPDATE SolicitudesVacaciones
          SET Estado = @estado, 
              AprobadoPorID = @aprobadorID, 
              FechaAprobacionFinal = GETDATE(), 
              AprobacionManual = @aprobacionManual
          WHERE SolicitudID = @solicitudID
        `);

        await transaction.commit();
        return res.json({ message: `Solicitud ${accionFinal.toLowerCase()} manualmente`, tipo: 'manual' });
      }

      // APROBACIÓN AUTOMÁTICA
      const pendientes = flujo.filter(f => !f.Accion);
      
      if (pendientes.length === 0) {
        await transaction.rollback();
        return res.status(400).json({ error: 'No hay aprobaciones pendientes' });
      }

      const siguiente = pendientes[0];
      const rolEsperado = (siguiente.RolAprobador || '').toLowerCase().replace(/\s+/g, '_');
      const rolNormalizado = (rolAprobador || '').toLowerCase().replace(/\s+/g, '_');

      if (rolEsperado !== rolNormalizado) {
        await transaction.rollback();
        return res.status(403).json({ 
          error: 'No autorizado para aprobar este nivel', 
          esperado: rolEsperado, 
          tuRol: rolNormalizado
        });
      }

      const updateFlujoRequest = new sql.Request(transaction);
      updateFlujoRequest.input('solicitudID', sql.Int, parseInt(solicitudID, 10));
      updateFlujoRequest.input('aprobadorID', sql.Int, aprobadorID);
      updateFlujoRequest.input('accion', sql.NVarChar, accionFinal);
      updateFlujoRequest.input('ordenFlujo', sql.Int, siguiente.OrdenFlujo);

      await updateFlujoRequest.query(`
        UPDATE FlujoAprobacionVacaciones
        SET AprobadorID = @aprobadorID, 
            Accion = @accion, 
            FechaAprobacion = GETDATE()
        WHERE SolicitudID = @solicitudID AND OrdenFlujo = @ordenFlujo
      `);

      if (accionFinal === 'Rechazada') {
        const updateRequest = new sql.Request(transaction);
        updateRequest.input('solicitudID', sql.Int, parseInt(solicitudID, 10));
        updateRequest.input('aprobadorID', sql.Int, aprobadorID);
        
        await updateRequest.query(`
          UPDATE SolicitudesVacaciones
          SET Estado = 'Rechazada', 
              AprobadoPorID = @aprobadorID, 
              FechaAprobacionFinal = GETDATE()
          WHERE SolicitudID = @solicitudID
        `);

        await transaction.commit();
        return res.json({ message: 'Solicitud rechazada', nivel: rolEsperado });
      }

      const actualizadosRequest = new sql.Request(transaction);
      actualizadosRequest.input('solicitudID', sql.Int, parseInt(solicitudID, 10));
      const actualizadosResult = await actualizadosRequest.query(`
        SELECT COUNT(*) AS total
        FROM FlujoAprobacionVacaciones
        WHERE SolicitudID = @solicitudID AND Accion IS NOT NULL
      `);

      const aprobadosAhora = actualizadosResult.recordset?.[0]?.total ?? 0;
      const totalFlujo = flujo.length;

      if (aprobadosAhora === totalFlujo) {
        const updateRequest = new sql.Request(transaction);
        updateRequest.input('solicitudID', sql.Int, parseInt(solicitudID, 10));
        updateRequest.input('aprobadorID', sql.Int, aprobadorID);

        await updateRequest.query(`
          UPDATE SolicitudesVacaciones
          SET Estado = 'Aprobada',
              AprobadoPorID = @aprobadorID,
              FechaAprobacionFinal = GETDATE()
          WHERE SolicitudID = @solicitudID
        `);

        await transaction.commit();
        return res.json({ 
          message: 'Solicitud aprobada completamente',
          nivel: rolEsperado,
          flujoCompleto: true
        });
      }

      await transaction.commit();
      res.json({ 
        message: `Nivel ${rolEsperado} aprobado exitosamente`,
        nivel: rolEsperado,
        pendientes: totalFlujo - aprobadosAhora,
        flujoCompleto: false
      });

    } catch (error) {
      console.error('❌ Error aprobarSolicitud:', error);
      try { await transaction.rollback(); } catch (e) { console.error('Rollback error', e); }
      res.status(500).json({ error: 'Error al procesar aprobación', details: error.message });
    }
  }

  // ===============================
  // Estadísticas detalladas
  // ===============================
  static async getEstadisticasDetalladas(req, res) {
    try {
      const pool = req.app.locals.db;
      if (!pool) return res.status(500).json({ error: 'DB pool no disponible' });

      const { empleadoId } = req.params;
      
      const balanceRequest = pool.request();
      balanceRequest.input('empleadoID', sql.Int, parseInt(empleadoId, 10));
      const balanceResult = await balanceRequest.query(`
        SELECT 
          b.BalanceID, 
          b.Anio, 
          b.DiasTotales, 
          b.DiasUsados, 
          b.DiasPendientes, 
          b.DiasDisponibles,
          (b.DiasPendientes + b.DiasDisponibles) as TotalDisponible,
          b.FechaCreacion, 
          b.FechaActualizacion, 
          b.Descripcion,
          e.NOMBRE, 
          e.APELLIDO, 
          e.FECHAINGRESO
        FROM BalanceVacaciones b
        INNER JOIN Empleados e ON b.EmpleadoID = e.EmpleadoID
        WHERE b.EmpleadoID = @empleadoID
        AND b.Anio >= 2024
        AND (b.DiasPendientes > 0 OR b.DiasDisponibles > 0 OR b.DiasUsados > 0)
        ORDER BY b.Anio ASC
      `);

      if (!balanceResult.recordset.length) {
        return res.status(404).json({ 
          error: 'No se encontraron balances para este empleado',
          empleadoId: parseInt(empleadoId, 10)
        });
      }

      const totalDisponibles = balanceResult.recordset.reduce(
        (sum, b) => sum + ((b.DiasPendientes || 0) + (b.DiasDisponibles || 0)), 
        0
      );
      const totalUsados = balanceResult.recordset.reduce(
        (sum, b) => sum + (b.DiasUsados || 0), 
        0
      );
      const totalAcumulado = balanceResult.recordset.reduce(
        (sum, b) => sum + (b.DiasTotales || 0), 
        0
      );

      const periodos = balanceResult.recordset.map(b => {
        const totalDisponiblePeriodo = (b.DiasPendientes || 0) + (b.DiasDisponibles || 0);
        const anioFin = b.Anio;
        const anioInicio = b.Anio - 1;
        const descripcion = b.Descripcion || `${anioInicio}-${anioFin}`;
        
        return {
          balanceId: b.BalanceID,
          BalanceID: b.BalanceID,
          anio: b.Anio,
          Anio: b.Anio,
          anioInicio,
          AnioInicio: anioInicio,
          anioFin,
          AnioFin: anioFin,
          descripcion,
          Descripcion: descripcion,
          diasTotales: b.DiasTotales || 0,
          DiasTotales: b.DiasTotales || 0,
          diasUsados: b.DiasUsados || 0,
          DiasUsados: b.DiasUsados || 0,
          diasDisponibles: totalDisponiblePeriodo,
          DiasDisponibles: totalDisponiblePeriodo,
          diasPendientes: totalDisponiblePeriodo,
          DiasPendientes: totalDisponiblePeriodo,
          diasPendientesOriginal: b.DiasPendientes || 0,
          diasDisponiblesOriginal: b.DiasDisponibles || 0,
          fechaCreacion: b.FechaCreacion,
          fechaActualizacion: b.FechaActualizacion
        };
      });

      res.json({
        empleado: {
          nombre: balanceResult.recordset[0].NOMBRE,
          apellido: balanceResult.recordset[0].APELLIDO,
          fechaIngreso: balanceResult.recordset[0].FECHAINGRESO
        },
        totales: {
          diasTotales: totalAcumulado,
          diasUsados: totalUsados,
          diasDisponibles: totalDisponibles,
          diasPendientes: totalDisponibles
        },
        periodos,
        balancePorAnio: balanceResult.recordset
      });
    } catch (error) {
      console.error('❌ Error getEstadisticasDetalladas:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas', details: error.message });
    }
  }

  // ===============================
  // Obtener solicitud por ID
  // ===============================
  static async getSolicitudById(req, res) {
    try {
      const pool = req.app.locals.db;
      if (!pool) return res.status(500).json({ error: 'DB pool no disponible' });

      const { id } = req.params;
      
      const request = pool.request();
      request.input('solicitudID', sql.Int, parseInt(id, 10));
      const result = await request.query(`
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
          v.AprobacionManual,
          CONCAT(e.NOMBRE, ' ', e.APELLIDO) as NombreEmpleado,
          e.CARGO,
          CONCAT(ea.NOMBRE, ' ', ea.APELLIDO) as AprobadoPor,
          d.Nombre as Departamento,
          p.NOMBRE as Puesto
        FROM SolicitudesVacaciones v
        INNER JOIN Empleados e ON v.EmpleadoID = e.EmpleadoID
        LEFT JOIN Empleados ea ON v.AprobadoPorID = ea.EmpleadoID
        LEFT JOIN Departamentos d ON e.DEPARTAMENTOID = d.DepartamentoID
        LEFT JOIN Puestos p ON e.PUESTOID = p.PuestoID
        WHERE v.SolicitudID = @solicitudID
      `);

      if (!result.recordset.length) {
        return res.status(404).json({ error: 'Solicitud no encontrada' });
      }

      const flujoRequest = pool.request();
      flujoRequest.input('solicitudID', sql.Int, parseInt(id, 10));
      const flujoResult = await flujoRequest.query(`
        SELECT 
          f.OrdenFlujo,
          f.RolAprobador,
          f.Accion,
          f.TipoAprobacion,
          f.FechaAprobacion,
          f.MotivoManual,
          CONCAT(e.NOMBRE, ' ', e.APELLIDO) as AprobadorNombre
        FROM FlujoAprobacionVacaciones f
        LEFT JOIN Empleados e ON f.AprobadorID = e.EmpleadoID
        WHERE f.SolicitudID = @solicitudID
        ORDER BY f.OrdenFlujo
      `);

      const detalleRequest = pool.request();
      detalleRequest.input('solicitudID', sql.Int, parseInt(id, 10));
      const detalleResult = await detalleRequest.query(`
        SELECT 
          d.BalanceID,
          d.DiasUtilizados,
          b.Anio,
          b.Descripcion
        FROM SolicitudVacacionesDetalle d
        INNER JOIN BalanceVacaciones b ON d.BalanceID = b.BalanceID
        WHERE d.SolicitudID = @solicitudID
        ORDER BY b.Anio
      `);

      const solicitud = {
        ...result.recordset[0],
        flujoAprobacion: flujoResult.recordset || [],
        detallePeriodos: detalleResult.recordset || []
      };

      res.json(solicitud);
    } catch (error) {
      console.error('❌ Error getSolicitudById:', error);
      res.status(500).json({ error: 'Error al obtener solicitud', details: error.message });
    }
  }

  // ===============================
  // Cancelar solicitud
  // ===============================
  static async cancelarSolicitud(req, res) {
    const transaction = new sql.Transaction(req.app.locals.db);
    try {
      await transaction.begin();

      const { solicitudID, usuarioID, motivo } = req.body;

      if (!solicitudID || !usuarioID) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Faltan datos requeridos' });
      }

      const solicitudRequest = new sql.Request(transaction);
      solicitudRequest.input('solicitudID', sql.Int, parseInt(solicitudID, 10));
      const solicitudResult = await solicitudRequest.query(`
        SELECT Estado, EmpleadoID FROM SolicitudesVacaciones WHERE SolicitudID = @solicitudID
      `);

      if (!solicitudResult.recordset.length) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Solicitud no encontrada' });
      }

      const { Estado, EmpleadoID } = solicitudResult.recordset[0];

      if (Estado.toLowerCase() !== 'pendiente') {
        await transaction.rollback();
        return res.status(400).json({ 
          error: 'Solo se pueden cancelar solicitudes pendientes',
          estadoActual: Estado
        });
      }

      const usuarioRequest = new sql.Request(transaction);
      usuarioRequest.input('usuarioID', sql.Int, parseInt(usuarioID, 10));
      const usuarioResult = await usuarioRequest.query(`
        SELECT EmpleadoID FROM Usuarios WHERE UsuarioID = @usuarioID
      `);

      if (!usuarioResult.recordset.length) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const empleadoIDUsuario = usuarioResult.recordset[0].EmpleadoID;

      if (empleadoIDUsuario !== EmpleadoID) {
        await transaction.rollback();
        return res.status(403).json({ error: 'No tiene permisos para cancelar esta solicitud' });
      }

      const updateRequest = new sql.Request(transaction);
      updateRequest.input('solicitudID', sql.Int, parseInt(solicitudID, 10));
      updateRequest.input('motivo', sql.NVarChar, motivo || 'Cancelada por el usuario');

      await updateRequest.query(`
        UPDATE SolicitudesVacaciones
        SET Estado = 'Cancelada',
            Motivo = CONCAT(Motivo, ' | CANCELACIÓN: ', @motivo),
            FechaAprobacionFinal = GETDATE()
        WHERE SolicitudID = @solicitudID
      `);

      await transaction.commit();
      res.json({ message: 'Solicitud cancelada exitosamente' });

    } catch (error) {
      console.error('❌ Error cancelarSolicitud:', error);
      try { await transaction.rollback(); } catch (e) { console.error('Rollback error', e); }
      res.status(500).json({ error: 'Error al cancelar solicitud', details: error.message });
    }
  }
}

export default VacacionesController;