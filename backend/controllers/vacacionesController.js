import sql from 'mssql';

class VacacionesController {
  // Obtener jerarquía de aprobación según rol
  static getJerarquiaAprobacion(rol) {
      const jerarquia = {
        'colaborador': ['gerente', 'director', 'gerente_rrhh', 'director_rrhh'],  // ← CAMBIO
        'gerente': ['director', 'gerente_rrhh', 'director_rrhh'],                // ← CAMBIO
        'director': ['gerente_rrhh', 'director_rrhh'],                           // ← CAMBIO
        'rrhh': ['gerente_rrhh', 'director_rrhh'],
        'gerente_rrhh': ['director_rrhh'],
        'director_rrhh': [],
        'admin': []
      };
      return jerarquia[rol?.toLowerCase()] || [];
    }

  // Obtener solicitudes según rol
  static async getSolicitudes(req, res) {
  try {
    const pool = req.app.locals.db;
    const { usuarioID, rol } = req.query;

    let query = `
      SELECT 
        sv.SolicitudID as id,
        sv.EmpleadoID as empleadoId,
        CONCAT(e.NOMBRE, ' ', e.APELLIDO) as empleado,
        u.Rol as empleadoRole,  -- CAMBIO: desde Usuarios
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
      LEFT JOIN Usuarios u ON e.EmpleadoID = u.EmpleadoID  -- NUEVO
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
      // Solo su departamento
      query += ` WHERE (u.Rol = 'colaborador' AND e.DEPARTAMENTOID = (SELECT DEPARTAMENTOID FROM Empleados WHERE EmpleadoID = @empleadoIdActual)) OR sv.EmpleadoID = @empleadoIdActual`;
    } else if (rolNormalizado === 'director') {
      // Solo su departamento
      query += ` WHERE (u.Rol IN ('colaborador', 'gerente') AND e.DEPARTAMENTOID = (SELECT DEPARTAMENTOID FROM Empleados WHERE EmpleadoID = @empleadoIdActual)) OR sv.EmpleadoID = @empleadoIdActual`;
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

      const jerarquia = VacacionesController.getJerarquiaAprobacion(solicitud.empleadoRole);
      const completados = flujoResult.recordset
        .filter(f => f.accion)
        .map(f => f.rol);
      
      solicitud.flujoAprobacion = {
        requeridos: jerarquia,
        completados: completados,
        actual: solicitud.estado === 'pendiente' ? jerarquia.find(r => !completados.includes(r)) : null,
        historial: flujoResult.recordset
      };
    }

    res.json(result.recordset);
  } catch (error) {
    console.error('Error en getSolicitudes:', error);
    res.status(500).json({ error: error.message });
  }
}


  // MODIFICADO: Crear solicitud con validación de días disponibles
  static async crearSolicitud(req, res) {
    try {
      const pool = req.app.locals.db;
      const { empleadoId, tipo, fechaInicio, fechaFin, dias, diasHabiles, motivo } = req.body;

      // NUEVO: Validar días disponibles si es tipo "vacaciones"
      if (tipo === 'vacaciones') {
        const anio = new Date(fechaInicio).getFullYear();
        
        const balanceResult = await pool.request()
          .input('empleadoId', sql.Int, empleadoId)
          .input('anio', sql.Int, anio)
          .execute('SP_ObtenerBalance');

        const balance = balanceResult.recordset[0];
        
        if (balance.DiasDisponibles < dias) {
          return res.status(400).json({ 
            error: `No tienes suficientes días disponibles. Solicitas ${dias} días pero solo tienes ${balance.DiasDisponibles} disponibles.`
          });
        }
      }

      const result = await pool.request()
        .input('empleadoId', sql.Int, empleadoId)
        .input('tipo', sql.NVarChar, tipo)
        .input('fechaInicio', sql.Date, fechaInicio)
        .input('fechaFin', sql.Date, fechaFin)
        .input('dias', sql.Int, dias)
        .input('diasHabiles', sql.Int, diasHabiles)
        .input('motivo', sql.NVarChar, motivo)
        .query(`
          INSERT INTO SolicitudesVacaciones 
          (EmpleadoID, TipoSolicitud, FechaInicio, FechaFin, Dias, DiasHabiles, Motivo, Estado)
          VALUES (@empleadoId, @tipo, @fechaInicio, @fechaFin, @dias, @diasHabiles, @motivo, 'pendiente');
          
          SELECT SCOPE_IDENTITY() AS SolicitudID;
        `);

      const solicitudID = result.recordset[0].SolicitudID;

      // Obtener rol del empleado para crear flujo
      const empResult = await pool.request()
        .input('empleadoId', sql.Int, empleadoId)
        .query('SELECT ROL FROM Empleados WHERE EmpleadoID = @empleadoId');

      const jerarquia = VacacionesController.getJerarquiaAprobacion(empResult.recordset[0].ROL);

      // Crear registros de flujo
      for (let i = 0; i < jerarquia.length; i++) {
        await pool.request()
          .input('solicitudID', sql.Int, solicitudID)
          .input('rol', sql.NVarChar, jerarquia[i])
          .input('orden', sql.Int, i + 1)
          .query(`
            INSERT INTO FlujoAprobacionVacaciones (SolicitudID, RolAprobador, OrdenFlujo)
            VALUES (@solicitudID, @rol, @orden)
          `);
      }

      res.status(201).json({ success: true, solicitudID });
    } catch (error) {
      console.error('Error en crearSolicitud:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Aprobar/Rechazar solicitud (sin cambios, los triggers se encargan del balance)
  static async procesarSolicitud(req, res) {
    try {
      const { id } = req.params;
      const { accion, aprobadorId, rol, esManual, motivoManual } = req.body;

      const pool = req.app.locals.db;

      // Actualizar flujo
      await pool.request()
        .input('solicitudID', sql.Int, parseInt(id))
        .input('rol', sql.NVarChar, rol)
        .input('aprobadorId', sql.Int, aprobadorId)
        .input('accion', sql.NVarChar, accion)
        .input('tipo', sql.NVarChar, esManual ? 'manual' : 'normal')
        .input('motivoManual', sql.NVarChar, motivoManual || null)
        .query(`
          UPDATE FlujoAprobacionVacaciones
          SET AprobadorID = @aprobadorId,
              FechaAprobacion = GETDATE(),
              Accion = @accion,
              TipoAprobacion = @tipo,
              MotivoManual = @motivoManual
          WHERE SolicitudID = @solicitudID AND RolAprobador = @rol
        `);

      // Verificar si se completó el flujo o es manual
      const flujoResult = await pool.request()
        .input('solicitudID', sql.Int, parseInt(id))
        .query(`
          SELECT COUNT(*) as total,
                 SUM(CASE WHEN Accion IS NULL THEN 1 ELSE 0 END) as pendientes,
                 SUM(CASE WHEN Accion = 'rechazada' THEN 1 ELSE 0 END) as rechazadas
          FROM FlujoAprobacionVacaciones
          WHERE SolicitudID = @solicitudID
        `);

      const { total, pendientes, rechazadas } = flujoResult.recordset[0];
      let nuevoEstado = 'pendiente';

      if (esManual || accion === 'rechazada' || rechazadas > 0) {
        nuevoEstado = accion === 'aprobada' ? 'aprobada' : 'rechazada';
      } else if (pendientes === 0) {
        nuevoEstado = 'aprobada';
      }

      // Actualizar estado de solicitud (el trigger actualizará el balance automáticamente)
      await pool.request()
        .input('solicitudID', sql.Int, parseInt(id))
        .input('estado', sql.NVarChar, nuevoEstado)
        .input('aprobadorId', sql.Int, aprobadorId)
        .input('esManual', sql.Bit, esManual ? 1 : 0)
        .query(`
          UPDATE SolicitudesVacaciones
          SET Estado = @estado,
              AprobadoPorID = @aprobadorId,
              AprobacionManual = @esManual,
              FechaAprobacionFinal = CASE WHEN @estado = 'aprobada' THEN GETDATE() ELSE NULL END,
              FechaRechazo = CASE WHEN @estado = 'rechazada' THEN GETDATE() ELSE NULL END
          WHERE SolicitudID = @solicitudID
        `);

      res.json({ success: true, nuevoEstado });
    } catch (error) {
      console.error('Error en procesarSolicitud:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Obtener solicitud por ID
  static async getSolicitudById(req, res) {
    try {
      const { id } = req.params;
      const pool = req.app.locals.db;

      const result = await pool.request()
        .input('id', sql.Int, parseInt(id))
        .query(`
          SELECT 
            sv.SolicitudID as id,
            sv.EmpleadoID as empleadoId,
            CONCAT(e.NOMBRE, ' ', e.APELLIDO) as empleado,
            e.ROL as empleadoRole,
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
          LEFT JOIN Departamentos d ON e.DEPARTAMENTOID = d.DepartamentoID
          LEFT JOIN Puestos p ON e.PUESTOID = p.PuestoID
          LEFT JOIN Empleados ea ON sv.AprobadoPorID = ea.EmpleadoID
          WHERE sv.SolicitudID = @id
        `);

      if (result.recordset.length === 0) {
        return res.status(404).json({ error: 'Solicitud no encontrada' });
      }

      res.json(result.recordset[0]);
    } catch (error) {
      console.error('Error en getSolicitudById:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // MODIFICADO: Obtener estadísticas desde BalanceVacaciones
  static async getEstadisticas(req, res) {
    try {
      const { empleadoId } = req.params;
      const anio = req.query.anio || new Date().getFullYear();
      const pool = req.app.locals.db;

      const result = await pool.request()
        .input('empleadoId', sql.Int, parseInt(empleadoId))
        .input('anio', sql.Int, parseInt(anio))
        .execute('SP_ObtenerBalance');

      if (result.recordset.length === 0) {
        return res.json({
          diasTotales: 0,
          diasUsados: 0,
          diasPendientes: 0,
          diasDisponibles: 0
        });
      }

      res.json({
        diasTotales: result.recordset[0].DiasTotales,
        diasUsados: result.recordset[0].DiasUsados,
        diasPendientes: result.recordset[0].DiasPendientes,
        diasDisponibles: result.recordset[0].DiasDisponibles
      });
    } catch (error) {
      console.error('Error en getEstadisticas:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // AGREGAR después del método getEstadisticas
static async getEstadisticasDetalladas(req, res) {
  try {
    const { empleadoId } = req.params;
    const pool = req.app.locals.db;

    const result = await pool.request()
      .input('empleadoId', sql.Int, parseInt(empleadoId))
      .execute('SP_ObtenerBalanceTotal');

    res.json({
      totales: result.recordsets[0][0] || {
        diasTotales: 0,
        diasUsados: 0,
        diasPendientes: 0,
        diasDisponibles: 0
      },
      periodos: result.recordsets[1] || []
    });
  } catch (error) {
    console.error('Error en getEstadisticasDetalladas:', error);
    res.status(500).json({ error: error.message });
  }
}

// AGREGAR nuevo método para crear solicitud con períodos
static async crearSolicitudConPeriodos(req, res) {
  try {
    const pool = req.app.locals.db;
    const { empleadoId, tipo, fechaInicio, fechaFin, dias, diasHabiles, motivo, periodosSeleccionados } = req.body;

    const totalDiasSolicitados = periodosSeleccionados.reduce((sum, p) => sum + p.dias, 0);
    if (totalDiasSolicitados !== dias) {
      return res.status(400).json({ 
        error: 'La suma de días por período no coincide con el total solicitado' 
      });
    }

    for (const periodo of periodosSeleccionados) {
      const balanceCheck = await pool.request()
        .input('balanceId', sql.Int, periodo.balanceId)
        .query('SELECT DiasDisponibles FROM BalanceVacaciones WHERE BalanceID = @balanceId');
      
      if (!balanceCheck.recordset[0] || balanceCheck.recordset[0].DiasDisponibles < periodo.dias) {
        return res.status(400).json({ 
          error: `No tienes suficientes días en uno de los períodos seleccionados` 
        });
      }
    }

    const result = await pool.request()
      .input('empleadoId', sql.Int, empleadoId)
      .input('tipo', sql.NVarChar, tipo)
      .input('fechaInicio', sql.Date, fechaInicio)
      .input('fechaFin', sql.Date, fechaFin)
      .input('dias', sql.Int, dias)
      .input('diasHabiles', sql.Int, diasHabiles)
      .input('motivo', sql.NVarChar, motivo)
      .query(`
        INSERT INTO SolicitudesVacaciones 
        (EmpleadoID, TipoSolicitud, FechaInicio, FechaFin, Dias, DiasHabiles, Motivo, Estado)
        VALUES (@empleadoId, @tipo, @fechaInicio, @fechaFin, @dias, @diasHabiles, @motivo, 'pendiente');
        
        SELECT SCOPE_IDENTITY() AS SolicitudID;
      `);

    const solicitudID = result.recordset[0].SolicitudID;

    for (const periodo of periodosSeleccionados) {
      await pool.request()
        .input('solicitudId', sql.Int, solicitudID)
        .input('balanceId', sql.Int, periodo.balanceId)
        .input('dias', sql.Int, periodo.dias)
        .query(`
          INSERT INTO SolicitudVacacionesDetalle (SolicitudID, BalanceID, DiasUtilizados)
          VALUES (@solicitudId, @balanceId, @dias)
        `);
    }

    // CAMBIO: Obtener rol desde Usuarios
    const empResult = await pool.request()
      .input('empleadoId', sql.Int, empleadoId)
      .query('SELECT u.Rol FROM Usuarios u WHERE u.EmpleadoID = @empleadoId');

    const jerarquia = VacacionesController.getJerarquiaAprobacion(empResult.recordset[0].Rol);

    for (let i = 0; i < jerarquia.length; i++) {
      await pool.request()
        .input('solicitudID', sql.Int, solicitudID)
        .input('rol', sql.NVarChar, jerarquia[i])
        .input('orden', sql.Int, i + 1)
        .query(`
          INSERT INTO FlujoAprobacionVacaciones (SolicitudID, RolAprobador, OrdenFlujo)
          VALUES (@solicitudID, @rol, @orden)
        `);
    }

    res.status(201).json({ success: true, solicitudID });
  } catch (error) {
    console.error('Error en crearSolicitudConPeriodos:', error);
    res.status(500).json({ error: error.message });
  }
}


  // NUEVO: Asignar días manualmente (solo para RRHH)
  static async asignarDias(req, res) {
    try {
      const pool = req.app.locals.db;
      const { empleadoId, anio, dias } = req.body;

      await pool.request()
        .input('empleadoId', sql.Int, empleadoId)
        .input('anio', sql.Int, anio)
        .input('dias', sql.Int, dias)
        .query(`
          MERGE BalanceVacaciones AS target
          USING (SELECT @empleadoId AS EmpleadoID, @anio AS Anio, @dias AS DiasTotales) AS source
          ON target.EmpleadoID = source.EmpleadoID AND target.Anio = source.Anio
          WHEN MATCHED THEN
              UPDATE SET DiasTotales = source.DiasTotales, FechaActualizacion = GETDATE()
          WHEN NOT MATCHED THEN
              INSERT (EmpleadoID, Anio, DiasTotales)
              VALUES (source.EmpleadoID, source.Anio, source.DiasTotales);
        `);

      res.json({ success: true, message: 'Días asignados correctamente' });
    } catch (error) {
      console.error('Error en asignarDias:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default VacacionesController;