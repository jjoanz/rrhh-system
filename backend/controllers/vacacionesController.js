import sql from 'mssql';

class VacacionesController {
  // Obtener jerarquía de aprobación según rol
  static getJerarquiaAprobacion(rol) {
    const jerarquia = {
      'colaborador': ['gerente', 'director', 'director_rrhh'],
      'gerente': ['director', 'director_rrhh'],
      'director': ['director_rrhh'],
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
      `;

      const rolNormalizado = rol?.toLowerCase().replace(/\s+/g, '_');
      
      // Filtrar según jerarquía
      if (rolNormalizado === 'colaborador') {
        query += ` WHERE sv.EmpleadoID = (SELECT EmpleadoID FROM Usuarios WHERE UsuarioID = @usuarioID)`;
      } else if (rolNormalizado === 'gerente') {
        query += ` WHERE e.ROL IN ('colaborador') OR sv.EmpleadoID = (SELECT EmpleadoID FROM Usuarios WHERE UsuarioID = @usuarioID)`;
      } else if (rolNormalizado === 'director') {
        query += ` WHERE e.ROL IN ('colaborador', 'gerente') OR sv.EmpleadoID = (SELECT EmpleadoID FROM Usuarios WHERE UsuarioID = @usuarioID)`;
      }
      // RRHH, Gerente RRHH y Director RRHH ven todo

      query += ` ORDER BY sv.FechaSolicitud DESC`;

      const result = await pool.request()
        .input('usuarioID', sql.Int, parseInt(usuarioID))
        .query(query);

      // Obtener flujo de aprobación para cada solicitud
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

  // Crear solicitud
  static async crearSolicitud(req, res) {
    try {
      const pool = req.app.locals.db;
      const { empleadoId, tipo, fechaInicio, fechaFin, dias, diasHabiles, motivo } = req.body;

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
          OUTPUT INSERTED.SolicitudID
          VALUES (@empleadoId, @tipo, @fechaInicio, @fechaFin, @dias, @diasHabiles, @motivo, 'pendiente')
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

  // Aprobar/Rechazar solicitud
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

      // Actualizar estado de solicitud
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

  // Obtener estadísticas de vacaciones del empleado
  static async getEstadisticas(req, res) {
    try {
      const { empleadoId } = req.params;
      const pool = req.app.locals.db;

      const result = await pool.request()
        .input('empleadoId', sql.Int, parseInt(empleadoId))
        .query(`
          SELECT 
            e.DiasVacacionesAnuales as diasTotales,
            ISNULL(SUM(CASE WHEN sv.Estado = 'aprobada' AND sv.TipoSolicitud = 'vacaciones' THEN sv.Dias ELSE 0 END), 0) as diasUsados,
            e.DiasVacacionesAnuales - ISNULL(SUM(CASE WHEN sv.Estado = 'aprobada' AND sv.TipoSolicitud = 'vacaciones' THEN sv.Dias ELSE 0 END), 0) as diasDisponibles,
            COUNT(CASE WHEN sv.Estado = 'pendiente' THEN 1 END) as solicitudesPendientes,
            COUNT(CASE WHEN sv.Estado = 'aprobada' THEN 1 END) as solicitudesAprobadas,
            COUNT(CASE WHEN sv.Estado = 'rechazada' THEN 1 END) as solicitudesRechazadas
          FROM Empleados e
          LEFT JOIN SolicitudesVacaciones sv ON e.EmpleadoID = sv.EmpleadoID 
            AND YEAR(sv.FechaInicio) = YEAR(GETDATE())
          WHERE e.EmpleadoID = @empleadoId
          GROUP BY e.DiasVacacionesAnuales
        `);

      res.json(result.recordset[0] || {
        diasTotales: 0,
        diasUsados: 0,
        diasDisponibles: 0,
        solicitudesPendientes: 0,
        solicitudesAprobadas: 0,
        solicitudesRechazadas: 0
      });
    } catch (error) {
      console.error('Error en getEstadisticas:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default VacacionesController;