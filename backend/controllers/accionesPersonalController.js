import sql from 'mssql';
import { poolPromise } from '../db.js';
import fs from 'fs';
import path from 'path';

// Tipos de acciones disponibles
const TIPOS_ACCION = [
  // INGRESOS
  { codigo: 'INGRESO', nombre: 'Ingreso de Personal', categoria: 'Ingresos', requiereAprobacion: true },
  { codigo: 'REINGRESO', nombre: 'Reingreso de Personal', categoria: 'Ingresos', requiereAprobacion: true },
  
  // MOVIMIENTOS
  { codigo: 'PROMOCION', nombre: 'Promoción', categoria: 'Movimientos', requiereAprobacion: true },
  { codigo: 'CAMBIO_DEPTO', nombre: 'Cambio de Departamento', categoria: 'Movimientos', requiereAprobacion: true },
  { codigo: 'CAMBIO_PUESTO', nombre: 'Cambio de Puesto', categoria: 'Movimientos', requiereAprobacion: true },
  { codigo: 'TRANSFERENCIA', nombre: 'Transferencia/Cambio de Sucursal', categoria: 'Movimientos', requiereAprobacion: true },
  { codigo: 'CAMBIO_SUPERVISOR', nombre: 'Cambio de Supervisor', categoria: 'Movimientos', requiereAprobacion: true },
  { codigo: 'AJUSTE_SALARIAL', nombre: 'Ajuste Salarial', categoria: 'Movimientos', requiereAprobacion: true },
  { codigo: 'CAMBIO_JORNADA', nombre: 'Cambio de Jornada Laboral', categoria: 'Movimientos', requiereAprobacion: true },
  { codigo: 'CAMBIO_TURNO', nombre: 'Cambio de Turno', categoria: 'Movimientos', requiereAprobacion: false },
  
  // CONTRACTUALES
  { codigo: 'RENOVACION_CONTRATO', nombre: 'Renovación de Contrato', categoria: 'Contractuales', requiereAprobacion: true },
  { codigo: 'CAMBIO_TIPO_CONTRATO', nombre: 'Cambio de Tipo de Contrato', categoria: 'Contractuales', requiereAprobacion: true },
  { codigo: 'EXTENSION_PRUEBA', nombre: 'Extensión de Período de Prueba', categoria: 'Contractuales', requiereAprobacion: true },
  
  // DISCIPLINARIAS
  { codigo: 'AMONESTACION', nombre: 'Amonestación', categoria: 'Disciplinarias', requiereAprobacion: true },
  { codigo: 'SUSPENSION', nombre: 'Suspensión', categoria: 'Disciplinarias', requiereAprobacion: true },
  { codigo: 'SANCION', nombre: 'Sanción Disciplinaria', categoria: 'Disciplinarias', requiereAprobacion: true },
  
  // EGRESOS
  { codigo: 'TERMINACION', nombre: 'Terminación de Relación Laboral', categoria: 'Egresos', requiereAprobacion: true },
  { codigo: 'JUBILACION', nombre: 'Jubilación', categoria: 'Egresos', requiereAprobacion: true }
];

// Obtener tipos de acción
export const getTiposAccion = async (req, res) => {
  try {
    res.json({
      success: true,
      tipos: TIPOS_ACCION
    });
  } catch (error) {
    console.error('Error al obtener tipos de acción:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tipos de acción'
    });
  }
};

// Obtener todas las acciones con filtros
export const getAcciones = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { tipo, estado, empleadoId, fechaDesde, fechaHasta } = req.query;
    const { usuarioId, rol } = req.user;

    let query = `
      SELECT 
        ap.AccionID,
        ap.TipoAccion,
        ap.EmpleadoID,
        CASE 
          WHEN ap.TipoAccion = 'INGRESO' AND ap.Estado = 'Pendiente' THEN 
            JSON_VALUE(ap.DatosNuevos, '$.nombre') + ' ' + JSON_VALUE(ap.DatosNuevos, '$.apellido')
          ELSE 
            e.NOMBRE + ' ' + e.APELLIDO
        END AS NombreEmpleado,
        CASE 
          WHEN ap.TipoAccion = 'INGRESO' AND ap.Estado = 'Pendiente' THEN 
            JSON_VALUE(ap.DatosNuevos, '$.cedula')
          ELSE 
            e.CEDULA
        END AS CEDULA,
        ap.FechaSolicitud,
        ap.FechaEfectiva,
        ap.Estado,
        ap.Justificacion,
        u.Username AS Solicitante,
        ap.FechaAprobacion,
        ua.Username AS AprobadoPor
      FROM AccionesPersonal ap
      LEFT JOIN Empleados e ON ap.EmpleadoID = e.EmpleadoID
      INNER JOIN Usuarios u ON ap.SolicitanteID = u.UsuarioID
      LEFT JOIN Usuarios ua ON ap.AprobadoPor = ua.UsuarioID
      WHERE 1=1
    `;

    const request = pool.request();

    // Filtros según rol
    if (rol !== 'director_rrhh' && rol !== 'gerente_rrhh' && rol !== 'rrhh') {
      query += ` AND ap.SolicitanteID = @usuarioId`;
      request.input('usuarioId', sql.Int, usuarioId);
    }

    if (tipo) {
      query += ` AND ap.TipoAccion = @tipo`;
      request.input('tipo', sql.NVarChar, tipo);
    }

    if (estado) {
      query += ` AND ap.Estado = @estado`;
      request.input('estado', sql.NVarChar, estado);
    }

    if (empleadoId) {
      query += ` AND ap.EmpleadoID = @empleadoId`;
      request.input('empleadoId', sql.Int, empleadoId);
    }

    if (fechaDesde) {
      query += ` AND ap.FechaSolicitud >= @fechaDesde`;
      request.input('fechaDesde', sql.Date, fechaDesde);
    }

    if (fechaHasta) {
      query += ` AND ap.FechaSolicitud <= @fechaHasta`;
      request.input('fechaHasta', sql.Date, fechaHasta);
    }

    query += ` ORDER BY ap.FechaSolicitud DESC`;

    const result = await request.query(query);

    res.json({
      success: true,
      acciones: result.recordset
    });

  } catch (error) {
    console.error('Error al obtener acciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener acciones de personal'
    });
  }
};

// Obtener estadísticas para el dashboard
// Obtener estadísticas del dashboard
export const getEstadisticas = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { usuarioId, rol } = req.user;

    console.log('📊 Obteniendo estadísticas para:', { usuarioId, rol });

    const mesActual = new Date().getMonth() + 1;
    const anioActual = new Date().getFullYear();

    // Determinar si el usuario puede ver todas las estadísticas
    const puedeVerTodo = ['director_rrhh', 'gerente_rrhh', 'rrhh', 'admin'].includes(rol);

    let queryBase = `
      SELECT 
        COUNT(CASE WHEN TipoAccion = 'INGRESO' THEN 1 END) AS IngresosMes,
        COUNT(CASE WHEN TipoAccion IN ('TERMINACION', 'JUBILACION') THEN 1 END) AS EgresosMes,
        COUNT(CASE WHEN TipoAccion NOT IN ('INGRESO', 'TERMINACION', 'JUBILACION') THEN 1 END) AS MovimientosMes,
        COUNT(CASE WHEN Estado = 'Pendiente' THEN 1 END) AS AccionesPendientes
      FROM AccionesPersonal
      WHERE 
        MONTH(FechaSolicitud) = @mes 
        AND YEAR(FechaSolicitud) = @anio
    `;

    // Si no puede ver todo, filtrar solo sus solicitudes
    if (!puedeVerTodo) {
      queryBase += ` AND SolicitanteID = @usuarioId`;
    }

    const request = pool.request()
      .input('mes', sql.Int, mesActual)
      .input('anio', sql.Int, anioActual);

    if (!puedeVerTodo) {
      request.input('usuarioId', sql.Int, usuarioId);
    }

    const result = await request.query(queryBase);

    const estadisticas = result.recordset[0];

    console.log('✅ Estadísticas obtenidas:', estadisticas);

    res.json({
      success: true,
      estadisticas: {
        IngresosMes: estadisticas.IngresosMes || 0,
        EgresosMes: estadisticas.EgresosMes || 0,
        MovimientosMes: estadisticas.MovimientosMes || 0,
        AccionesPendientes: estadisticas.AccionesPendientes || 0
      }
    });

  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas'
    });
  }
};

// Obtener acciones pendientes de aprobación
export const getAccionesPendientes = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { usuarioId, rol } = req.user;

    // Solo RRHH y Admin pueden ver acciones pendientes de aprobación
    if (rol !== 'director_rrhh' && rol !== 'gerente_rrhh' && rol !== 'rrhh') {
      return res.json({
        success: true,
        acciones: []
      });
    }

    const result = await pool.request().query(`
      SELECT 
        ap.AccionID,
        ap.TipoAccion,
        ap.EmpleadoID,
        CASE 
          WHEN ap.TipoAccion = 'INGRESO' THEN 
            JSON_VALUE(ap.DatosNuevos, '$.nombre') + ' ' + JSON_VALUE(ap.DatosNuevos, '$.apellido')
          ELSE 
            e.NOMBRE + ' ' + e.APELLIDO
        END AS NombreEmpleado,
        CASE 
          WHEN ap.TipoAccion = 'INGRESO' THEN 
            JSON_VALUE(ap.DatosNuevos, '$.cedula')
          ELSE 
            e.CEDULA
        END AS CEDULA,
        ap.FechaSolicitud,
        ap.FechaEfectiva,
        ap.Estado,
        ap.Justificacion,
        u.Username AS Solicitante,
        DATEDIFF(day, ap.FechaSolicitud, GETDATE()) AS DiasEspera
      FROM AccionesPersonal ap
      LEFT JOIN Empleados e ON ap.EmpleadoID = e.EmpleadoID
      INNER JOIN Usuarios u ON ap.SolicitanteID = u.UsuarioID
      WHERE ap.Estado = 'Pendiente'
      ORDER BY ap.FechaSolicitud ASC
    `);

    res.json({
      success: true,
      acciones: result.recordset
    });

  } catch (error) {
    console.error('Error al obtener acciones pendientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener acciones pendientes'
    });
  }
};

// Obtener una acción específica
// Obtener una acción específica
export const getAccionById = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { id } = req.params;

    const result = await pool.request()
      .input('accionId', sql.Int, id)
      .query(`
        SELECT 
          ap.*,
          CASE 
            WHEN ap.TipoAccion = 'INGRESO' AND e.EmpleadoID IS NULL THEN 
              JSON_VALUE(ap.DatosNuevos, '$.nombre') + ' ' + JSON_VALUE(ap.DatosNuevos, '$.apellido')
            ELSE 
              e.NOMBRE + ' ' + e.APELLIDO
          END AS NombreEmpleado,
          CASE 
            WHEN ap.TipoAccion = 'INGRESO' AND e.EmpleadoID IS NULL THEN 
              JSON_VALUE(ap.DatosNuevos, '$.cedula')
            ELSE 
              e.CEDULA
          END AS CEDULA,
          e.Email,
          e.Telefono,
          u.Username AS Solicitante,
          ur.Username AS RevisadoPor,
          ua.Username AS AprobadoPor,
          ue.Username AS EjecutadoPor
        FROM AccionesPersonal ap
        LEFT JOIN Empleados e ON ap.EmpleadoID = e.EmpleadoID
        INNER JOIN Usuarios u ON ap.SolicitanteID = u.UsuarioID
        LEFT JOIN Usuarios ur ON ap.RevisadoPor = ur.UsuarioID
        LEFT JOIN Usuarios ua ON ap.AprobadoPor = ua.UsuarioID
        LEFT JOIN Usuarios ue ON ap.EjecutadoPor = ue.UsuarioID
        WHERE ap.AccionID = @accionId
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Acción no encontrada'
      });
    }

    // Obtener documentos asociados
    const documentos = await pool.request()
      .input('accionId', sql.Int, id)
      .query(`
        SELECT * FROM AccionesPersonalDocumentos
        WHERE AccionID = @accionId
        ORDER BY FechaCarga DESC
      `);

    res.json({
      success: true,
      accion: {
        ...result.recordset[0],
        documentos: documentos.recordset
      }
    });

  } catch (error) {
    console.error('Error al obtener acción:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener detalles de la acción'
    });
  }
};

// Continúa en el siguiente mensaje...// Continuación de accionesPersonalController.js

// Crear nueva acción de personal
// Crear nueva acción de personal
// Crear nueva acción de personal
// Crear nueva acción de personal
export const crearAccion = async (req, res) => {
  let transaction = null;
  
  try {
    const pool = await poolPromise;
    const { usuarioId } = req.user;
    
    const {
      tipoAccion,
      empleadoId,
      fechaEfectiva,
      justificacion,
      datosAnteriores,
      datosNuevos
    } = req.body;

    console.log('📝 Datos recibidos:', { tipoAccion, empleadoId, usuarioId, datosNuevos });

    // Validar tipo de acción
    const tipoValido = TIPOS_ACCION.find(t => t.codigo === tipoAccion);
    if (!tipoValido) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de acción inválido'
      });
    }

    let empleadoIdFinal = empleadoId;

    // Si es un INGRESO, crear el empleado primero
    if (tipoAccion === 'INGRESO') {
      console.log('🔄 Tipo INGRESO detectado, iniciando proceso...');
      
      transaction = new sql.Transaction(pool);
      
      try {
        console.log('🔄 Iniciando transacción...');
        await transaction.begin();
        console.log('✅ Transacción iniciada');

        const request = new sql.Request(transaction);
        
        console.log('🔄 Ejecutando INSERT en Empleados...');
        const resultEmpleado = await request
          .input('nombre', sql.NVarChar, datosNuevos.nombre?.trim())
          .input('apellido', sql.NVarChar, datosNuevos.apellido?.trim())
          .input('cedula', sql.NVarChar, datosNuevos.cedula?.trim())
          .input('email', sql.NVarChar, datosNuevos.email?.trim() || null)
          .input('telefono', sql.NVarChar, datosNuevos.telefono?.trim() || null)
          .input('cargo', sql.NVarChar, datosNuevos.cargo?.trim() || 'Por Asignar')
          .input('departamentoId', sql.Int, datosNuevos.departamento ? parseInt(datosNuevos.departamento) : null)
          .input('salario', sql.Decimal(18, 2), datosNuevos.salario ? parseFloat(datosNuevos.salario) : 0)
          .input('fechaIngreso', sql.Date, datosNuevos.fechaIngreso || fechaEfectiva)
          .query(`
            INSERT INTO Empleados (
              NOMBRE, APELLIDO, CEDULA, Email, Telefono, CARGO, 
              DEPARTAMENTOID, Salario, FECHAINGRESO, Estado
            )
            VALUES (
              @nombre, @apellido, @cedula, @email, @telefono, @cargo,
              @departamentoId, @salario, @fechaIngreso, 1
            );
            
            SELECT SCOPE_IDENTITY() AS EmpleadoID;
          `);

        empleadoIdFinal = resultEmpleado.recordset[0].EmpleadoID;
        console.log('✅ Empleado creado exitosamente con ID:', empleadoIdFinal);

        // Insertar la acción dentro de la misma transacción
        console.log('🔄 Insertando AccionPersonal...');
        const requestAccion = new sql.Request(transaction);
        const result = await requestAccion
          .input('tipoAccion', sql.NVarChar, tipoAccion)
          .input('empleadoId', sql.Int, empleadoIdFinal)
          .input('solicitanteId', sql.Int, usuarioId)
          .input('fechaEfectiva', sql.Date, fechaEfectiva)
          .input('justificacion', sql.NVarChar, justificacion)
          .input('datosAnteriores', sql.NVarChar, JSON.stringify(datosAnteriores || {}))
          .input('datosNuevos', sql.NVarChar, JSON.stringify(datosNuevos))
          .input('creadoPor', sql.Int, usuarioId)
          .query(`
            INSERT INTO AccionesPersonal (
              TipoAccion, EmpleadoID, SolicitanteID, FechaSolicitud,
              FechaEfectiva, Estado, Justificacion, DatosAnteriores,
              DatosNuevos, CreadoPor, FechaCreacion
            )
            VALUES (
              @tipoAccion, @empleadoId, @solicitanteId, GETDATE(),
              @fechaEfectiva, 'Pendiente', @justificacion, @datosAnteriores,
              @datosNuevos, @creadoPor, GETDATE()
            );
            
            SELECT SCOPE_IDENTITY() AS AccionID;
          `);

        const accionId = result.recordset[0].AccionID;
        console.log('✅ AccionPersonal creada con ID:', accionId);
        
        // Commit de la transacción
        console.log('🔄 Haciendo commit...');
        await transaction.commit();
        console.log('✅ Transacción completada exitosamente');

        return res.status(201).json({
          success: true,
          message: 'Acción de personal creada exitosamente',
          accionId: accionId,
          empleadoId: empleadoIdFinal
        });

      } catch (innerError) {
        console.error('❌ Error dentro de la transacción:', innerError.message);
        
        // Intentar rollback solo si la transacción está activa
        if (transaction && !transaction._aborted) {
          try {
            await transaction.rollback();
            console.log('✅ Rollback ejecutado');
          } catch (rollbackError) {
            console.error('⚠️ Error al hacer rollback (puede ser normal si ya se abortó)');
          }
        }
        
        throw innerError;
      }

    } else {
      // Para otros tipos de acción (sin transacción)
      console.log('🔄 Procesando acción tipo:', tipoAccion);
      
      // Validar que el empleado existe
      const empleadoExiste = await pool.request()
        .input('empleadoId', sql.Int, empleadoId)
        .query('SELECT EmpleadoID FROM Empleados WHERE EmpleadoID = @empleadoId');

      if (empleadoExiste.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Empleado no encontrado'
        });
      }

      // Insertar la acción
      const result = await pool.request()
        .input('tipoAccion', sql.NVarChar, tipoAccion)
        .input('empleadoId', sql.Int, empleadoId)
        .input('solicitanteId', sql.Int, usuarioId)
        .input('fechaEfectiva', sql.Date, fechaEfectiva)
        .input('justificacion', sql.NVarChar, justificacion)
        .input('datosAnteriores', sql.NVarChar, JSON.stringify(datosAnteriores || {}))
        .input('datosNuevos', sql.NVarChar, JSON.stringify(datosNuevos))
        .input('creadoPor', sql.Int, usuarioId)
        .query(`
          INSERT INTO AccionesPersonal (
            TipoAccion, EmpleadoID, SolicitanteID, FechaSolicitud,
            FechaEfectiva, Estado, Justificacion, DatosAnteriores,
            DatosNuevos, CreadoPor, FechaCreacion
          )
          VALUES (
            @tipoAccion, @empleadoId, @solicitanteId, GETDATE(),
            @fechaEfectiva, 'Pendiente', @justificacion, @datosAnteriores,
            @datosNuevos, @creadoPor, GETDATE()
          );
          
          SELECT SCOPE_IDENTITY() AS AccionID;
        `);

      const accionId = result.recordset[0].AccionID;

      return res.status(201).json({
        success: true,
        message: 'Acción de personal creada exitosamente',
        accionId: accionId
      });
    }

  } catch (error) {
    console.error('❌ Error al crear acción:', error.message);
    
    res.status(500).json({
      success: false,
      message: error.message || 'Error al crear acción de personal'
    });
  }
};


// Actualizar acción (solo si está pendiente)
export const actualizarAccion = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { id } = req.params;
    const { usuarioId } = req.user;
    const {
      fechaEfectiva,
      justificacion,
      datosNuevos
    } = req.body;

    // Verificar que la acción existe y está pendiente
    const accionExiste = await pool.request()
      .input('accionId', sql.Int, id)
      .query(`
        SELECT Estado, SolicitanteID 
        FROM AccionesPersonal 
        WHERE AccionID = @accionId
      `);

    if (accionExiste.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Acción no encontrada'
      });
    }

    const accion = accionExiste.recordset[0];

    if (accion.Estado !== 'Pendiente') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden actualizar acciones pendientes'
      });
    }

    // Solo el solicitante puede actualizar
    if (accion.SolicitanteID !== usuarioId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para actualizar esta acción'
      });
    }

    // Actualizar la acción
    await pool.request()
      .input('accionId', sql.Int, id)
      .input('fechaEfectiva', sql.Date, fechaEfectiva)
      .input('justificacion', sql.NVarChar, justificacion)
      .input('datosNuevos', sql.NVarChar, JSON.stringify(datosNuevos))
      .input('modificadoPor', sql.Int, usuarioId)
      .query(`
        UPDATE AccionesPersonal
        SET 
          FechaEfectiva = @fechaEfectiva,
          Justificacion = @justificacion,
          DatosNuevos = @datosNuevos,
          ModificadoPor = @modificadoPor,
          FechaModificacion = GETDATE()
        WHERE AccionID = @accionId
      `);

    res.json({
      success: true,
      message: 'Acción actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error al actualizar acción:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar acción'
    });
  }
};

// Aprobar acción
export const aprobarAccion = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { id } = req.params;
    const { usuarioId, rol } = req.user;
    const { comentarios } = req.body;

    // Solo RRHH puede aprobar
   if (rol !== 'director_rrhh' && rol !== 'gerente_rrhh') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para aprobar acciones'
      });
    }

    // Verificar que la acción existe y está pendiente
    const accionResult = await pool.request()
      .input('accionId', sql.Int, id)
      .query(`
        SELECT AccionID, Estado, TipoAccion 
        FROM AccionesPersonal 
        WHERE AccionID = @accionId
      `);

    if (accionResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Acción no encontrada'
      });
    }

    const accion = accionResult.recordset[0];

    if (accion.Estado !== 'Pendiente') {
      return res.status(400).json({
        success: false,
        message: 'La acción ya fue procesada'
      });
    }

    // Actualizar estado a Aprobada
    await pool.request()
      .input('accionId', sql.Int, id)
      .input('aprobadoPor', sql.Int, usuarioId)
      .input('comentarios', sql.NVarChar, comentarios || null)
      .query(`
        UPDATE AccionesPersonal
        SET 
          Estado = 'Aprobada',
          AprobadoPor = @aprobadoPor,
          FechaAprobacion = GETDATE(),
          ComentariosAprobacion = @comentarios
        WHERE AccionID = @accionId
      `);

    res.json({
      success: true,
      message: 'Acción aprobada exitosamente'
    });

  } catch (error) {
    console.error('Error al aprobar acción:', error);
    res.status(500).json({
      success: false,
      message: 'Error al aprobar acción'
    });
  }
};

// Rechazar acción
export const rechazarAccion = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { id } = req.params;
    const { usuarioId, rol } = req.user;
    const { motivo } = req.body;

    // Solo RRHH puede rechazar
    if (rol !== 'director_rrhh' && rol !== 'gerente_rrhh') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para rechazar acciones'
      });
    }

    if (!motivo) {
      return res.status(400).json({
        success: false,
        message: 'Debes proporcionar un motivo de rechazo'
      });
    }

    // Verificar que la acción existe y está pendiente
    const accionResult = await pool.request()
      .input('accionId', sql.Int, id)
      .query(`
        SELECT AccionID, Estado 
        FROM AccionesPersonal 
        WHERE AccionID = @accionId
      `);

    if (accionResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Acción no encontrada'
      });
    }

    const accion = accionResult.recordset[0];

    if (accion.Estado !== 'Pendiente') {
      return res.status(400).json({
        success: false,
        message: 'La acción ya fue procesada'
      });
    }

    // Actualizar estado a Rechazada
    await pool.request()
      .input('accionId', sql.Int, id)
      .input('revisadoPor', sql.Int, usuarioId)
      .input('motivo', sql.NVarChar, motivo)
      .query(`
        UPDATE AccionesPersonal
        SET 
          Estado = 'Rechazada',
          RevisadoPor = @revisadoPor,
          FechaRevision = GETDATE(),
          ComentariosAprobacion = @motivo
        WHERE AccionID = @accionId
      `);

    res.json({
      success: true,
      message: 'Acción rechazada'
    });

  } catch (error) {
    console.error('Error al rechazar acción:', error);
    res.status(500).json({
      success: false,
      message: 'Error al rechazar acción'
    });
  }
};

// Ejecutar acción (aplicar los cambios)
export const ejecutarAccion = async (req, res) => {
  const transaction = new sql.Transaction(await poolPromise);
  
  try {
    const { id } = req.params;
    const { usuarioId, rol } = req.user;

    // Solo RRHH puede ejecutar
   if (rol !== 'director_rrhh' && rol !== 'gerente_rrhh') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ejecutar acciones'
      });
    }

    await transaction.begin();

    // Obtener datos de la acción
    const request = new sql.Request(transaction);
    const accionResult = await request
      .input('accionId', sql.Int, id)
      .query(`
        SELECT * FROM AccionesPersonal WHERE AccionID = @accionId
      `);

    if (accionResult.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Acción no encontrada'
      });
    }

    const accion = accionResult.recordset[0];

    if (accion.Estado !== 'Aprobada') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden ejecutar acciones aprobadas'
      });
    }

    const datosNuevos = JSON.parse(accion.DatosNuevos);

    // Ejecutar según tipo de acción
    switch (accion.TipoAccion) {
      case 'INGRESO':
        await ejecutarIngreso(transaction, datosNuevos);
        break;
      
      case 'PROMOCION':
      case 'CAMBIO_PUESTO':
        await ejecutarCambioPuesto(transaction, accion.EmpleadoID, datosNuevos);
        break;
      
      case 'CAMBIO_DEPTO':
        await ejecutarCambioDepartamento(transaction, accion.EmpleadoID, datosNuevos);
        break;
      
      case 'AJUSTE_SALARIAL':
        await ejecutarAjusteSalarial(transaction, accion.EmpleadoID, datosNuevos);
        break;
      
      case 'CAMBIO_SUPERVISOR':
        await ejecutarCambioSupervisor(transaction, accion.EmpleadoID, datosNuevos);
        break;
      
      case 'TERMINACION':
        await ejecutarTerminacion(transaction, accion.EmpleadoID, datosNuevos);
        break;

      case 'SUSPENSION':
        await ejecutarSuspension(transaction, accion.EmpleadoID, datosNuevos);
        break;

      case 'CAMBIO_JORNADA':
      case 'CAMBIO_TURNO':
        await ejecutarCambioJornada(transaction, accion.EmpleadoID, datosNuevos);
        break;

      case 'RENOVACION_CONTRATO':
      case 'CAMBIO_TIPO_CONTRATO':
        await ejecutarCambioContrato(transaction, accion.EmpleadoID, datosNuevos);
        break;
      
      default:
        // Para otras acciones que no modifican datos en Empleados
        // (como AMONESTACION, SANCION, etc.) solo se registran
        break;
    }

    // Marcar acción como ejecutada
    const updateRequest = new sql.Request(transaction);
    await updateRequest
      .input('accionId', sql.Int, id)
      .input('ejecutadoPor', sql.Int, usuarioId)
      .query(`
        UPDATE AccionesPersonal
        SET 
          Estado = 'Ejecutada',
          EjecutadoPor = @ejecutadoPor,
          FechaEjecucion = GETDATE()
        WHERE AccionID = @accionId
      `);

    await transaction.commit();

    res.json({
      success: true,
      message: 'Acción ejecutada exitosamente'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al ejecutar acción:', error);
    res.status(500).json({
      success: false,
      message: 'Error al ejecutar acción: ' + error.message
    });
  }
};

// Funciones auxiliares para ejecutar cada tipo de acción

async function ejecutarIngreso(transaction, datos) {
  const request = new sql.Request(transaction);
  await request
    .input('nombre', sql.NVarChar, datos.nombre)
    .input('apellido', sql.NVarChar, datos.apellido)
    .input('cedula', sql.NVarChar, datos.cedula)
    .input('email', sql.NVarChar, datos.email)
    .input('telefono', sql.NVarChar, datos.telefono)
    .input('direccion', sql.NVarChar, datos.direccion)
    .input('fechaNacimiento', sql.Date, datos.fechaNacimiento)
    .input('genero', sql.NVarChar, datos.genero)
    .input('estadoCivil', sql.NVarChar, datos.estadoCivil)
    .input('cargo', sql.NVarChar, datos.cargo)
    .input('departamentoId', sql.Int, datos.departamentoId)
    .input('salario', sql.Decimal(18, 2), datos.salario)
    .input('fechaIngreso', sql.Date, datos.fechaIngreso)
    .input('tipoContrato', sql.NVarChar, datos.tipoContrato)
    .input('jornada', sql.NVarChar, datos.jornada)
    .input('turno', sql.NVarChar, datos.turno)
    .input('supervisorId', sql.Int, datos.supervisorId || null)
    .query(`
      INSERT INTO Empleados (
        NOMBRE, APELLIDO, CEDULA, Email, Telefono, Direccion,
        FechaNacimiento, Genero, EstadoCivil, CARGO, DEPARTAMENTOID,
        Salario, FECHAINGRESO, TipoContrato, Jornada, Turno,
        SupervisorID, Estado
      )
      VALUES (
        @nombre, @apellido, @cedula, @email, @telefono, @direccion,
        @fechaNacimiento, @genero, @estadoCivil, @cargo, @departamentoId,
        @salario, @fechaIngreso, @tipoContrato, @jornada, @turno,
        @supervisorId, 1
      )
    `);
}

async function ejecutarCambioPuesto(transaction, empleadoId, datos) {
  const request = new sql.Request(transaction);
  await request
    .input('empleadoId', sql.Int, empleadoId)
    .input('nuevoCargo', sql.NVarChar, datos.nuevoCargo)
    .input('nuevoSalario', sql.Decimal(18, 2), datos.nuevoSalario || null)
    .query(`
      UPDATE Empleados
      SET CARGO = @nuevoCargo
      ${datos.nuevoSalario ? ', Salario = @nuevoSalario' : ''}
      WHERE EmpleadoID = @empleadoId
    `);
}

async function ejecutarCambioDepartamento(transaction, empleadoId, datos) {
  const request = new sql.Request(transaction);
  await request
    .input('empleadoId', sql.Int, empleadoId)
    .input('nuevoDepartamento', sql.Int, datos.nuevoDepartamentoId)
    .input('nuevoSupervisor', sql.Int, datos.nuevoSupervisorId || null)
    .query(`
      UPDATE Empleados
      SET DEPARTAMENTOID = @nuevoDepartamento
      ${datos.nuevoSupervisorId ? ', SupervisorID = @nuevoSupervisor' : ''}
      WHERE EmpleadoID = @empleadoId
    `);
}

async function ejecutarAjusteSalarial(transaction, empleadoId, datos) {
  const request = new sql.Request(transaction);
  await request
    .input('empleadoId', sql.Int, empleadoId)
    .input('nuevoSalario', sql.Decimal(18, 2), datos.nuevoSalario)
    .query(`
      UPDATE Empleados
      SET Salario = @nuevoSalario
      WHERE EmpleadoID = @empleadoId
    `);
}

async function ejecutarCambioSupervisor(transaction, empleadoId, datos) {
  const request = new sql.Request(transaction);
  await request
    .input('empleadoId', sql.Int, empleadoId)
    .input('nuevoSupervisor', sql.Int, datos.nuevoSupervisorId)
    .query(`
      UPDATE Empleados
      SET SupervisorID = @nuevoSupervisor
      WHERE EmpleadoID = @empleadoId
    `);
}

async function ejecutarTerminacion(transaction, empleadoId, datos) {
  const request = new sql.Request(transaction);
  await request
    .input('empleadoId', sql.Int, empleadoId)
    .input('fechaSalida', sql.Date, datos.fechaSalida)
    .input('motivoSalida', sql.NVarChar, datos.motivoSalida)
    .query(`
      UPDATE Empleados
      SET 
        Estado = 0,
        FechaSalida = @fechaSalida,
        MotivoSalida = @motivoSalida
      WHERE EmpleadoID = @empleadoId
    `);

  // Desactivar usuario asociado si existe
  await request
    .input('empleadoId2', sql.Int, empleadoId)
    .query(`
      UPDATE Usuarios
      SET Estado = 0
      WHERE EmpleadoID = @empleadoId2
    `);
}

async function ejecutarSuspension(transaction, empleadoId, datos) {
  const request = new sql.Request(transaction);
  
  if (datos.bloquearAcceso) {
    // Suspender acceso al sistema temporalmente
    await request
      .input('empleadoId', sql.Int, empleadoId)
      .input('fechaFin', sql.Date, datos.fechaFinSuspension)
      .query(`
        UPDATE Usuarios
        SET 
          Suspendido = 1,
          FechaFinSuspension = @fechaFin
        WHERE EmpleadoID = @empleadoId
      `);
  }
}

async function ejecutarCambioJornada(transaction, empleadoId, datos) {
  const request = new sql.Request(transaction);
  await request
    .input('empleadoId', sql.Int, empleadoId)
    .input('nuevaJornada', sql.NVarChar, datos.nuevaJornada || null)
    .input('nuevoTurno', sql.NVarChar, datos.nuevoTurno || null)
    .input('nuevoSalario', sql.Decimal(18, 2), datos.nuevoSalario || null)
    .query(`
      UPDATE Empleados
      SET 
        ${datos.nuevaJornada ? 'Jornada = @nuevaJornada' : ''}
        ${datos.nuevoTurno ? ', Turno = @nuevoTurno' : ''}
        ${datos.nuevoSalario ? ', Salario = @nuevoSalario' : ''}
      WHERE EmpleadoID = @empleadoId
    `);
}

async function ejecutarCambioContrato(transaction, empleadoId, datos) {
  const request = new sql.Request(transaction);
  await request
    .input('empleadoId', sql.Int, empleadoId)
    .input('nuevoTipoContrato', sql.NVarChar, datos.nuevoTipoContrato || null)
    .input('nuevaFechaVencimiento', sql.Date, datos.nuevaFechaVencimiento || null)
    .query(`
      UPDATE Empleados
      SET 
        ${datos.nuevoTipoContrato ? 'TipoContrato = @nuevoTipoContrato' : ''}
        ${datos.nuevaFechaVencimiento ? ', FechaVencimientoContrato = @nuevaFechaVencimiento' : ''}
      WHERE EmpleadoID = @empleadoId
    `);
}

// Eliminar acción (solo si está pendiente o rechazada)
export const eliminarAccion = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { id } = req.params;
    const { usuarioId, rol } = req.user;

    // Verificar que la acción existe
    const accionResult = await pool.request()
      .input('accionId', sql.Int, id)
      .query(`
        SELECT Estado, SolicitanteID 
        FROM AccionesPersonal 
        WHERE AccionID = @accionId
      `);

    if (accionResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Acción no encontrada'
      });
    }

    const accion = accionResult.recordset[0];

    // Solo se pueden eliminar acciones pendientes o rechazadas
    if (accion.Estado !== 'Pendiente' && accion.Estado !== 'Rechazada') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden eliminar acciones pendientes o rechazadas'
      });
    }

    // Solo el solicitante o RRHH puede eliminar
    if (accion.SolicitanteID !== usuarioId && 
        rol !== 'Admin' && rol !== 'Director RRHH' && rol !== 'Gerente RRHH') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar esta acción'
      });
    }

    // Eliminar documentos asociados primero
    await pool.request()
      .input('accionId', sql.Int, id)
      .query('DELETE FROM AccionesPersonalDocumentos WHERE AccionID = @accionId');

    // Eliminar la acción
    await pool.request()
      .input('accionId', sql.Int, id)
      .query('DELETE FROM AccionesPersonal WHERE AccionID = @accionId');

    res.json({
      success: true,
      message: 'Acción eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar acción:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar acción'
    });
  }
};

// Obtener historial de un empleado
export const getHistorialEmpleado = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { empleadoId } = req.params;

    const result = await pool.request()
      .input('empleadoId', sql.Int, empleadoId)
      .query(`
        SELECT 
          ap.AccionID,
          ap.TipoAccion,
          ap.FechaEfectiva,
          ap.Justificacion,
          ap.DatosAnteriores,
          ap.DatosNuevos,
          ap.Estado,
          u.Username AS RealizadaPor,
          ap.FechaEjecucion
        FROM AccionesPersonal ap
        LEFT JOIN Usuarios u ON ap.EjecutadoPor = u.UsuarioID
        WHERE ap.EmpleadoID = @empleadoId
        AND ap.Estado = 'Ejecutada'
        ORDER BY ap.FechaEfectiva DESC
      `);

    res.json({
      success: true,
      historial: result.recordset
    });

  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial del empleado'
    });
  }
};

// Subir documento
export const subirDocumento = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { id } = req.params;
    const { usuarioId } = req.user;
    const { tipoDocumento } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ningún archivo'
      });
    }

    // Verificar que la acción existe
    const accionExiste = await pool.request()
      .input('accionId', sql.Int, id)
      .query('SELECT AccionID FROM AccionesPersonal WHERE AccionID = @accionId');

    if (accionExiste.recordset.length === 0) {
      // Eliminar archivo si la acción no existe
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Acción no encontrada'
      });
    }

    // Guardar referencia del documento
    await pool.request()
      .input('accionId', sql.Int, id)
      .input('tipoDocumento', sql.NVarChar, tipoDocumento)
      .input('nombreArchivo', sql.NVarChar, req.file.originalname)
      .input('rutaArchivo', sql.NVarChar, req.file.path)
      .input('cargadoPor', sql.Int, usuarioId)
      .query(`
        INSERT INTO AccionesPersonalDocumentos (
          AccionID, TipoDocumento, NombreArchivo, RutaArchivo, 
          FechaCarga, CargadoPor
        )
        VALUES (
          @accionId, @tipoDocumento, @nombreArchivo, @rutaArchivo,
          GETDATE(), @cargadoPor
        )
      `);

    res.json({
      success: true,
      message: 'Documento cargado exitosamente',
      documento: {
        nombre: req.file.originalname,
        tipo: tipoDocumento,
        ruta: req.file.path
      }
    });

  } catch (error) {
    // Eliminar archivo en caso de error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Error al subir documento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al subir documento'
    });
  }
};

// Obtener documentos de una acción
export const getDocumentosAccion = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { id } = req.params;

    const result = await pool.request()
      .input('accionId', sql.Int, id)
      .query(`
        SELECT 
          DocumentoID,
          TipoDocumento,
          NombreArchivo,
          RutaArchivo,
          FechaCarga,
          u.Username AS CargadoPor
        FROM AccionesPersonalDocumentos apd
        LEFT JOIN Usuarios u ON apd.CargadoPor = u.UsuarioID
        WHERE AccionID = @accionId
        ORDER BY FechaCarga DESC
      `);

    res.json({
      success: true,
      documentos: result.recordset
    });

  } catch (error) {
    console.error('Error al obtener documentos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener documentos'
    });
  }
};