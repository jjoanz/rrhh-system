import sql from 'mssql';
import { poolPromise, executeQuery, getConnection } from '../db.js';

// Configuración de la base de datos
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

// ==========================================
// UTILIDADES Y HELPERS
// ==========================================

/**
 * Obtener jerarquía del empleado (Gerente y Director)
 */
const obtenerJerarquiaEmpleado = async (empleadoId) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('empleadoId', sql.Int, empleadoId)
      .query(`
        SELECT 
          SupervisorID as GerenteID,
          (SELECT SupervisorID FROM Empleados WHERE EmpleadoID = e.SupervisorID) as DirectorID
        FROM Empleados e
        WHERE EmpleadoID = @empleadoId
      `);
    
    return result.recordset[0] || { GerenteID: null, DirectorID: null };
  } catch (error) {
    console.error('Error obteniendo jerarquía:', error);
    return { GerenteID: null, DirectorID: null };
  }
};

/**
 * Determinar estado inicial según rol del solicitante
 */
const determinarEstadoInicial = (rol) => {
  const rolesRRHH = ['rrhh', 'director_rrhh', 'gerente_rrhh'];
  
  if (rol === 'colaborador') return 'pendiente_gerente';
  if (rol === 'gerente' || rol === 'director') return 'pendiente_rrhh';
  if (rolesRRHH.includes(rol)) return null; // RRHH no puede crear solicitudes
  
  return 'pendiente_gerente';
};

/**
 * Verificar permisos de aprobación
 */
const puedeAprobarEnNivel = (solicitud, userRole, userId) => {
  if (userRole === 'gerente' && 
      solicitud.Estado === 'pendiente_gerente' && 
      solicitud.GerenteID === userId) {
    return true;
  }
  
  if (userRole === 'director' && 
      solicitud.Estado === 'pendiente_director' && 
      solicitud.DirectorID === userId) {
    return true;
  }
  
  const rolesRRHH = ['rrhh', 'director_rrhh', 'gerente_rrhh', 'admin'];
  if (rolesRRHH.includes(userRole) && solicitud.Estado === 'pendiente_rrhh') {
    return true;
  }
  
  return false;
};

// ==========================================
// SOLICITUDES DE CAPACITACIÓN
// ==========================================

/**
 * Crear nueva solicitud de capacitación
 * POST /api/capacitacion/solicitudes
 */
export const crearSolicitud = async (req, res) => {
  try {
    const { 
      titulo, descripcion, justificacion, proveedor, modalidad, 
      fechaInicio, fechaFin, costo, categoria, prioridad, horas 
    } = req.body;
    
    const empleadoId = req.user.empleadoId || req.user.id;
    const rol = req.user.rol || req.user.role;
    
    // Validar que no sea RRHH
    const rolesRRHH = ['rrhh', 'director_rrhh', 'gerente_rrhh'];
    if (rolesRRHH.includes(rol)) {
      return res.status(403).json({ 
        success: false, 
        message: 'RRHH no puede crear solicitudes de capacitación. Debe crear cursos disponibles.' 
      });
    }
    
    // Validaciones
    if (!titulo || !justificacion) {
      return res.status(400).json({ 
        success: false, 
        message: 'Título y justificación son requeridos' 
      });
    }
    
    // Obtener jerarquía del empleado
    const jerarquia = await obtenerJerarquiaEmpleado(empleadoId);
    
    // Determinar estado inicial
    const estadoInicial = determinarEstadoInicial(rol);
    
    const pool = await getConnection();
    const result = await pool.request()
      .input('titulo', sql.VarChar(200), titulo)
      .input('descripcion', sql.Text, descripcion || null)
      .input('justificacion', sql.Text, justificacion)
      .input('proveedor', sql.VarChar(100), proveedor || null)
      .input('modalidad', sql.VarChar(20), modalidad || 'presencial')
      .input('fechaInicio', sql.Date, fechaInicio || new Date())
      .input('fechaFin', sql.Date, fechaFin || (fechaInicio ? new Date(new Date(fechaInicio).getTime() + 7 * 24 * 60 * 60 * 1000) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)))
      .input('costo', sql.Decimal(10, 2), costo || 0)
      .input('categoria', sql.VarChar(50), categoria || 'tecnica')
      .input('prioridad', sql.VarChar(20), prioridad || 'media')
      .input('horas', sql.Int, horas || 0)
      .input('solicitanteId', sql.Int, empleadoId)
      .input('estado', sql.VarChar(50), estadoInicial)
      .input('gerenteId', sql.Int, jerarquia.GerenteID)
      .input('directorId', sql.Int, jerarquia.DirectorID)
      .query(`
        INSERT INTO SolicitudesCapacitacion (
          Titulo, Descripcion, Justificacion, Proveedor, Modalidad,
          FechaInicio, FechaFin, Costo, Categoria, Prioridad, Horas,
          SolicitanteID, Estado, GerenteID, DirectorID
        )
        OUTPUT INSERTED.*
        VALUES (
          @titulo, @descripcion, @justificacion, @proveedor, @modalidad,
          @fechaInicio, @fechaFin, @costo, @categoria, @prioridad, @horas,
          @solicitanteId, @estado, @gerenteId, @directorId
        )
      `);
    
    const solicitud = result.recordset[0];
    
    res.status(201).json({
      success: true,
      message: estadoInicial === 'pendiente_gerente' 
        ? 'Solicitud enviada a tu gerente para aprobación'
        : 'Solicitud enviada a RRHH para aprobación',
      data: solicitud
    });
  } catch (error) {
    console.error('Error creando solicitud:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al crear la solicitud',
      error: error.message 
    });
  }
};

/**
 * Obtener MIS solicitudes
 * GET /api/capacitacion/solicitudes/mis-solicitudes
 */
export const obtenerMisSolicitudes = async (req, res) => {
  try {
    const empleadoId = req.user.empleadoId || req.user.id;
    
    const pool = await getConnection();
    const result = await pool.request()
      .input('empleadoId', sql.Int, empleadoId)
      .query(`
        SELECT 
          s.*,
          e.Nombre + ' ' + e.Apellido as NombreSolicitante,
          eg.Nombre + ' ' + eg.Apellido as NombreGerente,
          ed.Nombre + ' ' + ed.Apellido as NombreDirector,
          ag.Nombre + ' ' + ag.Apellido as NombreAprobadorGerente,
          ad.Nombre + ' ' + ad.Apellido as NombreAprobadorDirector,
          ar.Nombre + ' ' + ar.Apellido as NombreAprobadorRRHH
        FROM SolicitudesCapacitacion s
        INNER JOIN Empleados e ON s.SolicitanteID = e.EmpleadoID
        LEFT JOIN Empleados eg ON s.GerenteID = eg.EmpleadoID
        LEFT JOIN Empleados ed ON s.DirectorID = ed.EmpleadoID
        LEFT JOIN Empleados ag ON s.AprobadorGerenteID = ag.EmpleadoID
        LEFT JOIN Empleados ad ON s.AprobadorDirectorID = ad.EmpleadoID
        LEFT JOIN Empleados ar ON s.AprobadorRRHHID = ar.EmpleadoID
        WHERE s.SolicitanteID = @empleadoId
        AND s.Activo = 1
        ORDER BY s.FechaSolicitud DESC
      `);
    
    // Obtener comentarios para cada solicitud
    for (let solicitud of result.recordset) {
      const comentarios = await pool.request()
        .input('solicitudId', sql.Int, solicitud.SolicitudID)
        .query(`
          SELECT * FROM ComentariosSolicitud 
          WHERE SolicitudID = @solicitudId 
          ORDER BY FechaComentario ASC
        `);
      
      solicitud.Comentarios = comentarios.recordset;
    }
    
    res.json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error('Error obteniendo solicitudes:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener solicitudes',
      error: error.message 
    });
  }
};

/**
 * Obtener solicitudes PENDIENTES de aprobar
 * GET /api/capacitacion/solicitudes/pendientes
 */
export const obtenerSolicitudesPendientes = async (req, res) => {
  try {
    const empleadoId = req.user.empleadoId || req.user.id;
    const rol = req.user.rol || req.user.role;
    
    const pool = await getConnection();
    let query = '';
    
    const rolesRRHH = ['rrhh', 'director_rrhh', 'gerente_rrhh', 'admin'];
    
    if (rol === 'gerente') {
      query = `
        WHERE s.Estado = 'pendiente_gerente' 
        AND s.GerenteID = @empleadoId
      `;
    } else if (rol === 'director') {
      query = `
        WHERE s.Estado = 'pendiente_director' 
        AND s.DirectorID = @empleadoId
      `;
    } else if (rolesRRHH.includes(rol)) {
      query = `
        WHERE s.Estado = 'pendiente_rrhh'
      `;
    } else {
      return res.json({ success: true, data: [] });
    }
    
    const result = await pool.request()
      .input('empleadoId', sql.Int, empleadoId)
      .query(`
        SELECT 
          s.*,
          e.Nombre + ' ' + e.Apellido as NombreSolicitante,
          u.Rol as RolSolicitante,
          eg.Nombre + ' ' + eg.Apellido as NombreGerente,
          ed.Nombre + ' ' + ed.Apellido as NombreDirector,
          ag.Nombre + ' ' + ag.Apellido as NombreAprobadorGerente,
          ad.Nombre + ' ' + ad.Apellido as NombreAprobadorDirector
        FROM SolicitudesCapacitacion s
        INNER JOIN Empleados e ON s.SolicitanteID = e.EmpleadoID
        LEFT JOIN Usuarios u ON e.EmpleadoID = u.EmpleadoID
        LEFT JOIN Empleados eg ON s.GerenteID = eg.EmpleadoID
        LEFT JOIN Empleados ed ON s.DirectorID = ed.EmpleadoID
        LEFT JOIN Empleados ag ON s.AprobadorGerenteID = ag.EmpleadoID
        LEFT JOIN Empleados ad ON s.AprobadorDirectorID = ad.EmpleadoID
        ${query}
        AND s.Activo = 1
        ORDER BY s.FechaSolicitud DESC
      `);
    
    res.json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error('Error obteniendo solicitudes pendientes:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener solicitudes pendientes',
      error: error.message 
    });
  }
};

/**
 * Aprobar solicitud
 * PUT /api/capacitacion/solicitudes/:id/aprobar
 */
export const aprobarSolicitud = async (req, res) => {
  try {
    const { id } = req.params;
    // Validar ID
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ 
          success: false, 
          message: 'ID inválido' 
        });
      }
    const { comentario } = req.body;
    const empleadoId = req.user.empleadoId || req.user.id;
    const rol = req.user.rol || req.user.role;
    const nombreUsuario = req.user.username || req.user.name;
    
    const pool = await getConnection();
    
    const solicitudResult = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query('SELECT * FROM SolicitudesCapacitacion WHERE SolicitudID = @id');
    
    const solicitud = solicitudResult.recordset[0];
    
    if (!solicitud) {
      return res.status(404).json({ 
        success: false, 
        message: 'Solicitud no encontrada' 
      });
    }
    
    if (!puedeAprobarEnNivel(solicitud, rol, empleadoId)) {
      return res.status(403).json({ 
        success: false, 
        message: 'No tienes permisos para aprobar en este nivel' 
      });
    }
    
    let nuevoEstado = '';
    let campoFecha = '';
    let campoAprobador = '';
    let mensaje = '';
    
    if (solicitud.Estado === 'pendiente_gerente') {
      // Si no hay DirectorID, saltar directo a RRHH
      if (!solicitud.DirectorID || solicitud.DirectorID === null) {
        nuevoEstado = 'pendiente_rrhh';
        mensaje = 'Solicitud aprobada y enviada a RRHH';
      } else {
        nuevoEstado = 'pendiente_director';
        mensaje = 'Solicitud aprobada y enviada al Director';
      }
      campoFecha = 'FechaAprobacionGerente';
      campoAprobador = 'AprobadorGerenteID';
    }
     else if (solicitud.Estado === 'pendiente_director') {
      nuevoEstado = 'pendiente_rrhh';
      campoFecha = 'FechaAprobacionDirector';
      campoAprobador = 'AprobadorDirectorID';
      mensaje = 'Solicitud aprobada y enviada a RRHH';
    } 
    else if (solicitud.Estado === 'pendiente_rrhh') {
      nuevoEstado = 'aprobado_completo';
      campoFecha = 'FechaAprobacionRRHH';
      campoAprobador = 'AprobadorRRHHID';
      mensaje = 'Solicitud aprobada completamente. Proceso de capacitación iniciado';
    }
    
    await pool.request()
      .input('id', sql.Int, parseInt(id))
      .input('estado', sql.VarChar(50), nuevoEstado)
      .input('fecha', sql.DateTime, new Date())
      .input('aprobadorId', sql.Int, empleadoId)
      .query(`
        UPDATE SolicitudesCapacitacion 
        SET Estado = @estado,
            ${campoFecha} = @fecha,
            ${campoAprobador} = @aprobadorId
        WHERE SolicitudID = @id
      `);
    
    if (comentario) {
      await pool.request()
        .input('solicitudId', sql.Int, id)
        .input('usuarioId', sql.Int, empleadoId)
        .input('nombreUsuario', sql.VarChar(100), nombreUsuario)
        .input('comentario', sql.Text, comentario)
        .query(`
          INSERT INTO ComentariosSolicitud (SolicitudID, UsuarioID, NombreUsuario, Comentario)
          VALUES (@solicitudId, @usuarioId, @nombreUsuario, @comentario)
        `);
    }
    
    res.json({
      success: true,
      message: mensaje
    });
  } catch (error) {
    console.error('Error aprobando solicitud:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al aprobar la solicitud',
      error: error.message 
    });
  }
};

/**
 * Rechazar solicitud
 * PUT /api/capacitacion/solicitudes/:id/rechazar
 */
export const rechazarSolicitud = async (req, res) => {
  try {
    const { id } = req.params;
    // Validar ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID inválido' 
      });
    }
    const { comentario } = req.body;
    const empleadoId = req.user.empleadoId || req.user.id;
    const rol = req.user.rol || req.user.role;
    const nombreUsuario = req.user.username || req.user.name;
    
    const pool = await getConnection();
    
    const solicitudResult = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query('SELECT * FROM SolicitudesCapacitacion WHERE SolicitudID = @id');
    
    const solicitud = solicitudResult.recordset[0];
    
    if (!solicitud) {
      return res.status(404).json({ 
        success: false, 
        message: 'Solicitud no encontrada' 
      });
    }
    
    if (!puedeAprobarEnNivel(solicitud, rol, empleadoId)) {
      return res.status(403).json({ 
        success: false, 
        message: 'No tienes permisos para rechazar en este nivel' 
      });
    }
    
    await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query(`
        UPDATE SolicitudesCapacitacion 
        SET Estado = 'rechazado'
        WHERE SolicitudID = @id
      `);
    
    const comentarioRechazo = comentario || `Solicitud rechazada por ${rol}`;
    await pool.request()
      .input('solicitudId', sql.Int, id)
      .input('usuarioId', sql.Int, empleadoId)
      .input('nombreUsuario', sql.VarChar(100), nombreUsuario)
      .input('comentario', sql.Text, comentarioRechazo)
      .query(`
        INSERT INTO ComentariosSolicitud (SolicitudID, UsuarioID, NombreUsuario, Comentario)
        VALUES (@solicitudId, @usuarioId, @nombreUsuario, @comentario)
      `);
    
    res.json({
      success: true,
      message: 'Solicitud rechazada'
    });
  } catch (error) {
    console.error('Error rechazando solicitud:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al rechazar la solicitud',
      error: error.message 
    });
  }
};

/**
 * Ver detalle de solicitud con comentarios
 * GET /api/capacitacion/solicitudes/:id
 */
export const obtenerDetalleSolicitud = async (req, res) => {
  try {
    const { id } = req.params;
    
    // ✅ VALIDACIÓN AGREGADA
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID de solicitud inválido' 
      });
    }
    
    const pool = await getConnection();
    const result = await pool.request()
      .input('id', sql.Int, parseInt(id))  // ← Convertir a número
      .query(`
        SELECT 
          s.*,
          e.Nombre + ' ' + e.Apellido as NombreSolicitante,
          e.Email as EmailSolicitante,
          eg.Nombre + ' ' + eg.Apellido as NombreGerente,
          ed.Nombre + ' ' + ed.Apellido as NombreDirector,
          ag.Nombre + ' ' + ag.Apellido as NombreAprobadorGerente,
          ad.Nombre + ' ' + ad.Apellido as NombreAprobadorDirector,
          ar.Nombre + ' ' + ar.Apellido as NombreAprobadorRRHH
        FROM SolicitudesCapacitacion s
        INNER JOIN Empleados e ON s.SolicitanteID = e.EmpleadoID
        LEFT JOIN Empleados eg ON s.GerenteID = eg.EmpleadoID
        LEFT JOIN Empleados ed ON s.DirectorID = ed.EmpleadoID
        LEFT JOIN Empleados ag ON s.AprobadorGerenteID = ag.EmpleadoID
        LEFT JOIN Empleados ad ON s.AprobadorDirectorID = ad.EmpleadoID
        LEFT JOIN Empleados ar ON s.AprobadorRRHHID = ar.EmpleadoID
        WHERE s.SolicitudID = @id
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Solicitud no encontrada' 
      });
    }
    
    const solicitud = result.recordset[0];
    
    const comentarios = await pool.request()
      .input('id', sql.Int, parseInt(id))  // ← Convertir a número
      .query(`
        SELECT * FROM ComentariosSolicitud 
        WHERE SolicitudID = @id 
        ORDER BY FechaComentario ASC
      `);
    
    solicitud.Comentarios = comentarios.recordset;
    
    res.json({
      success: true,
      data: solicitud
    });
  } catch (error) {
    console.error('Error obteniendo detalle:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener detalle de la solicitud',
      error: error.message 
    });
  }
};

// ==========================================
// CURSOS DISPONIBLES
// ==========================================

/**
 * Obtener todos los cursos disponibles
 * GET /api/capacitacion/cursos-disponibles
 */
export const obtenerCursosDisponibles = async (req, res) => {
  try {
    const empleadoId = req.user.empleadoId || req.user.id;
    
    const pool = await getConnection();
    
    const result = await pool.request()
      .input('empleadoId', sql.Int, empleadoId)
      .query(`
        SELECT 
          c.CursoID,
          c.CursoID as id,
          c.Titulo,
          c.Descripcion,
          c.Proveedor,
          c.Modalidad,
          c.Duracion,
          c.Categoria,
          c.Costo,
          c.Rating,
          c.FechaInicio,
          c.Cupos,
          c.Inscritos,
          u.username as creadoPor,
          CASE 
            WHEN EXISTS (
              SELECT 1 FROM InscripcionesCursos 
              WHERE CursoID = c.CursoID 
              AND EmpleadoID = @empleadoId
            ) THEN 1 
            ELSE 0 
          END as yaInscrito
        FROM CursosDisponibles c
        LEFT JOIN usuarios u ON c.CreadoPorID = u.usuarioId
        WHERE c.Estado = 1 AND c.Disponible = 1
        ORDER BY c.FechaCreacion DESC
      `);
    
    console.log('📚 Cursos encontrados:', result.recordset.length);
    
    res.json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error('Error obteniendo cursos:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener cursos disponibles',
      error: error.message 
    });
  }
};


// Obtener todos los empleados (para cursos cerrados)
export const obtenerEmpleados = async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT 
        e.EmpleadoID as id, 
        e.NOMBRE as nombre, 
        e.APELLIDO as apellido, 
        e.CARGO as cargo,
        e.DEPARTAMENTOID as departamentoId,
        ISNULL(d.NOMBRE, 'Sin departamento') as departamento
      FROM Empleados e
      LEFT JOIN Departamentos d ON e.DEPARTAMENTOID = d.DepartamentoID
      WHERE e.ESTADO = 1
      ORDER BY e.APELLIDO, e.NOMBRE
    `);
    
    const empleados = result.recordset;
    res.json(empleados);
  } catch (error) {
    console.error('Error al obtener empleados:', error);
    res.status(500).json({ message: 'Error al obtener empleados' });
  }
};

/**
 * Crear nuevo curso (solo RRHH y Admin)
 * POST /api/capacitacion/cursos-disponibles
 */
export const crearCurso = async (req, res) => {
  try {
    const { 
      titulo, descripcion, proveedor, modalidad, duracion, categoria,
      costo, fechaInicio, cupos, tipoAcceso, empleadosSeleccionados
    } = req.body;
    
    const empleadoId = req.user.empleadoId || req.user.id;
    const rol = req.user.rol || req.user.role;
    
    console.log('👤 Usuario creando curso - EmpleadoID:', empleadoId);
    
    const rolesPermitidos = ['rrhh', 'director_rrhh', 'gerente_rrhh', 'admin'];
    if (!rolesPermitidos.includes(rol)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Solo RRHH y Administradores pueden crear cursos' 
      });
    }
    
    if (!titulo || !duracion || !cupos) {
      return res.status(400).json({ 
        success: false, 
        message: 'Título, duración y cupos son requeridos' 
      });
    }
    
    const pool = await getConnection();
    
    // Crear el curso en CursosDisponibles
    const result = await pool.request()
      .input('titulo', sql.VarChar(200), titulo)
      .input('descripcion', sql.Text, descripcion || null)
      .input('proveedor', sql.VarChar(100), proveedor || 'Interno')
      .input('modalidad', sql.VarChar(50), modalidad || 'presencial')
      .input('duracion', sql.Int, duracion)
      .input('categoria', sql.VarChar(50), categoria || 'tecnica')
      .input('costo', sql.Decimal(10, 2), costo || 0)
      .input('fechaInicio', sql.Date, fechaInicio || null)
      .input('cupos', sql.Int, cupos)
      .input('creadoPorID', sql.Int, empleadoId)
      .query(`
        INSERT INTO CursosDisponibles (
          Titulo, Descripcion, Proveedor, Modalidad, Duracion,
          Categoria, Costo, Rating, Disponible, FechaInicio,
          Cupos, Inscritos, CreadoPorID, FechaCreacion, Estado
        )
        VALUES (
          @titulo, @descripcion, @proveedor, @modalidad, @duracion,
          @categoria, @costo, 0, 1, ISNULL(@fechaInicio, GETDATE()),
          @cupos, 0, @creadoPorID, GETDATE(), 1
        );
        SELECT SCOPE_IDENTITY() AS CursoID;
      `);
    
    const cursoID = result.recordset[0].CursoID;
    let empleadosInscritos = 0;
    
    console.log(`✅ Curso creado con ID: ${cursoID}`);
    
    // Si es curso cerrado, inscribir empleados automáticamente
    if (tipoAcceso === 'cerrado' && empleadosSeleccionados && empleadosSeleccionados.length > 0) {
      console.log(`📝 Inscribiendo ${empleadosSeleccionados.length} empleados al curso ${cursoID}`);
      
      for (const empId of empleadosSeleccionados) {
        try {
          await pool.request()
            .input('cursoId', sql.Int, cursoID)
            .input('empleadoId', sql.Int, empId)
            .query(`
              INSERT INTO InscripcionesCursos (
                CursoID, EmpleadoID, FechaInscripcion, 
                Progreso, EstadoCurso, TieneCertificado, Tipo
              )
              VALUES (
                @cursoId, @empleadoId, GETDATE(), 
                0, 'inscrito', 0, 'cerrado'
              )
            `);
          empleadosInscritos++;
          console.log(`✅ Empleado ${empId} inscrito`);
        } catch (inscripcionError) {
          console.error(`❌ Error inscribiendo empleado ${empId}:`, inscripcionError.message);
        }
      }
      
      // Actualizar contador de inscritos
      await pool.request()
        .input('cursoId', sql.Int, cursoID)
        .input('inscritos', sql.Int, empleadosInscritos)
        .query(`
          UPDATE CursosDisponibles 
          SET Inscritos = @inscritos 
          WHERE CursoID = @cursoId
        `);
      
      console.log(`✅ Total inscritos: ${empleadosInscritos}`);
    }
    
    res.status(201).json({
      success: true,
      message: tipoAcceso === 'cerrado' 
        ? `Curso creado e inscritos ${empleadosInscritos} empleados automáticamente`
        : 'Curso creado exitosamente y disponible para inscripción',
      data: {
        CursoID: cursoID,
        Titulo: titulo,
        Inscritos: empleadosInscritos
      }
    });
  } catch (error) {
    console.error('Error creando curso:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al crear el curso',
      error: error.message 
    });
  }
};

/**
 * Inscribir empleados manualmente a un curso (solo RRHH)
 * POST /api/capacitacion/cursos-disponibles/:id/inscribir-empleados
 */
export const inscribirEmpleadosManualmente = async (req, res) => {
  try {
    const { id } = req.params;
    const { empleadosIds } = req.body;
    const rol = req.user.rol || req.user.role;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID inválido' 
      });
    }
    
    const rolesPermitidos = ['rrhh', 'director_rrhh', 'gerente_rrhh', 'admin'];
    if (!rolesPermitidos.includes(rol)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Solo RRHH puede inscribir empleados manualmente' 
      });
    }
    
    if (!empleadosIds || !Array.isArray(empleadosIds) || empleadosIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Debes seleccionar al menos un empleado' 
      });
    }
    
    const pool = await getConnection();
    
    // Verificar que el curso existe
    const cursoResult = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query('SELECT * FROM CursosDisponibles WHERE CursoID = @id');
    
    if (cursoResult.recordset.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Curso no encontrado' 
      });
    }
    
    let inscritosExitosos = 0;
    let yaInscritos = 0;
    
    for (const empId of empleadosIds) {
      // Verificar si ya está inscrito
      const existente = await pool.request()
        .input('cursoId', sql.Int, parseInt(id))
        .input('empleadoId', sql.Int, empId)
        .query(`
          SELECT * FROM InscripcionesCursos 
          WHERE CursoID = @cursoId AND EmpleadoID = @empleadoId
        `);
      
      if (existente.recordset.length === 0) {
        await pool.request()
          .input('cursoId', sql.Int, parseInt(id))
          .input('empleadoId', sql.Int, empId)
          .query(`
            INSERT INTO InscripcionesCursos (CursoID, EmpleadoID, EstadoCurso, Tipo)
            VALUES (@cursoId, @empleadoId, 'inscrito', 'asignacion')
          `);
        inscritosExitosos++;
      } else {
        yaInscritos++;
      }
    }
    
    res.json({
      success: true,
      message: `${inscritosExitosos} empleados inscritos exitosamente`,
      detalles: {
        inscritos: inscritosExitosos,
        yaInscritos: yaInscritos
      }
    });
  } catch (error) {
    console.error('Error inscribiendo empleados:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al inscribir empleados',
      error: error.message 
    });
  }
};

/**
 * Editar curso (solo RRHH y Admin)
 * PUT /api/capacitacion/cursos-disponibles/:id
 */
export const editarCurso = async (req, res) => {
  try {
    const { id } = req.params;
          // Validar ID
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ 
          success: false, 
          message: 'ID inválido' 
        });
      }
    const { 
      titulo, descripcion, proveedor, modalidad, duracion, 
      categoria, costo, fechaInicio, cupos, disponible, solicitudId
    } = req.body;
    
    const rol = req.user.rol || req.user.role;
    
    const rolesPermitidos = ['rrhh', 'director_rrhh', 'gerente_rrhh', 'admin'];
    if (!rolesPermitidos.includes(rol)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Solo RRHH y Administradores pueden editar cursos' 
      });
    }
    
    const pool = await getConnection();
    
    let updates = [];
    let request = pool.request().input('id', sql.Int, parseInt(id));
    
    if (titulo !== undefined) {
      updates.push('Titulo = @titulo');
      request.input('titulo', sql.VarChar(200), titulo);
    }
    if (descripcion !== undefined) {
      updates.push('Descripcion = @descripcion');
      request.input('descripcion', sql.Text, descripcion);
    }
    if (proveedor !== undefined) {
      updates.push('Proveedor = @proveedor');
      request.input('proveedor', sql.VarChar(100), proveedor);
    }
    if (modalidad !== undefined) {
      updates.push('Modalidad = @modalidad');
      request.input('modalidad', sql.VarChar(20), modalidad);
    }
    if (duracion !== undefined) {
      updates.push('Duracion = @duracion');
      request.input('duracion', sql.Int, duracion);
    }
    if (categoria !== undefined) {
      updates.push('Categoria = @categoria');
      request.input('categoria', sql.VarChar(50), categoria);
    }
    if (costo !== undefined) {
      updates.push('Costo = @costo');
      request.input('costo', sql.Decimal(10, 2), costo);
    }
    if (fechaInicio !== undefined) {
      updates.push('FechaInicio = @fechaInicio');
      request.input('fechaInicio', sql.Date, fechaInicio);
    }
    if (cupos !== undefined) {
      updates.push('Cupos = @cupos');
      request.input('cupos', sql.Int, cupos);
    }
    if (disponible !== undefined) {
      updates.push('Disponible = @disponible');
      request.input('disponible', sql.Bit, disponible);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No hay campos para actualizar' 
      });
    }
    
    await request.query(`
      UPDATE CursosDisponibles 
      SET ${updates.join(', ')}
      WHERE CursoID = @id
    `);
    
    res.json({
      success: true,
      message: 'Curso actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error editando curso:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al editar el curso',
      error: error.message 
    });
  }
};


/**
 * Eliminar curso (soft delete)
 * DELETE /api/capacitacion/cursos-disponibles/:id
 */
export const eliminarCurso = async (req, res) => {
  try {
    const { id } = req.params;

          // Validar ID
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ 
          success: false, 
          message: 'ID inválido' 
        });
      }
    const rol = req.user.rol || req.user.role;
    
    const rolesPermitidos = ['rrhh', 'director_rrhh', 'gerente_rrhh', 'admin'];
    if (!rolesPermitidos.includes(rol)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Solo RRHH y Administradores pueden eliminar cursos' 
      });
    }
    
    const pool = await getConnection();
    await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query(`
        UPDATE CursosDisponibles 
        SET Estado = 0, Disponible = 0
        WHERE CursoID = @id
      `);
    
    res.json({
      success: true,
      message: 'Curso eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando curso:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al eliminar el curso',
      error: error.message 
    });
  }
};

// ==========================================
// INSCRI// ==========================================
// INSCRIPCIONES A CURSOS
// ==========================================

/**
 * Inscribirse a un curso disponible
 * POST /api/capacitacion/inscripciones
 */
export const inscribirseCurso = async (req, res) => {
  try {
    const { cursoID } = req.body;
    const empleadoId = req.user.empleadoId || req.user.id;
    
    if (!cursoID) {
      return res.status(400).json({ 
        success: false, 
        message: 'El ID del curso es requerido' 
      });
    }
    
    const pool = await getConnection();
    
    // Verificar que el curso existe y está disponible
    const cursoResult = await pool.request()
      .input('cursoId', sql.Int, cursoID)
      .query(`
        SELECT * FROM CursosDisponibles 
        WHERE CursoID = @cursoId AND Disponible = 1 AND Estado = 1
      `);
    
    if (cursoResult.recordset.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Curso no encontrado o no disponible' 
      });
    }
    
    const curso = cursoResult.recordset[0];
    
    // Verificar cupos disponibles
    if (curso.Inscritos >= curso.Cupos) {
      return res.status(400).json({ 
        success: false, 
        message: 'No hay cupos disponibles para este curso' 
      });
    }
    
    // Verificar si ya está inscrito
    const inscripcionExistente = await pool.request()
      .input('cursoId', sql.Int, cursoID)
      .input('empleadoId', sql.Int, empleadoId)
      .query(`
        SELECT * FROM InscripcionesCursos 
        WHERE CursoID = @cursoId AND EmpleadoID = @empleadoId
      `);
    
    if (inscripcionExistente.recordset.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Ya estás inscrito en este curso' 
      });
    }
    
    // Inscribir al empleado (SIN OUTPUT porque hay un trigger)
    await pool.request()
      .input('cursoId', sql.Int, cursoID)
      .input('empleadoId', sql.Int, empleadoId)
      .query(`
        INSERT INTO InscripcionesCursos (
          CursoID, EmpleadoID, FechaInscripcion, 
          Progreso, EstadoCurso, TieneCertificado, Tipo
        )
        VALUES (
          @cursoId, @empleadoId, GETDATE(), 
          0, 'inscrito', 0, 'inscripcion'
        )
      `);
    
    // Actualizar contador de inscritos en CursosDisponibles
    await pool.request()
      .input('cursoId', sql.Int, cursoID)
      .query(`
        UPDATE CursosDisponibles 
        SET Inscritos = Inscritos + 1 
        WHERE CursoID = @cursoId
      `);
    
    console.log(`✅ Empleado ${empleadoId} inscrito exitosamente al curso ${cursoID}`);
    
    res.status(201).json({
      success: true,
      message: `Te has inscrito exitosamente a: ${curso.Titulo}`
    });
  } catch (error) {
    console.error('Error inscribiéndose:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al inscribirse al curso',
      error: error.message 
    });
  }
};

/**
 * Obtener MIS cursos inscritos
 * GET /api/capacitacion/inscripciones/mis-cursos
 */
export const obtenerMisCursos = async (req, res) => {
  try {
    const empleadoId = req.user.empleadoId || req.user.id;
    
    const pool = await getConnection();
    const result = await pool.request()
      .input('empleadoId', sql.Int, empleadoId)
      .query(`
        SELECT 
          i.*,
          c.Titulo,
          c.Descripcion,
          c.Proveedor,
          c.Modalidad,
          c.Duracion,
          c.Categoria,
          c.FechaInicio as FechaLimite
        FROM InscripcionesCursos i
        INNER JOIN CursosDisponibles c ON i.CursoID = c.CursoID
        WHERE i.EmpleadoID = @empleadoId
        ORDER BY i.FechaInscripcion DESC
      `);
    
    res.json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error('Error obteniendo cursos:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener tus cursos',
      error: error.message 
    });
  }
};

/**
 * Actualizar progreso de curso
 * PUT /api/capacitacion/inscripciones/:id/progreso
 */
export const actualizarProgreso = async (req, res) => {
  try {
    const { id } = req.params;
          // Validar ID
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ 
          success: false, 
          message: 'ID inválido' 
        });
      }
    const { progreso, calificacion } = req.body;
    const empleadoId = req.user.empleadoId || req.user.id;
    
    const pool = await getConnection();
    
    const inscripcionResult = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .input('empleadoId', sql.Int, empleadoId)
      .query(`
        SELECT * FROM InscripcionesCursos 
        WHERE InscripcionID = @id AND EmpleadoID = @empleadoId
      `);
    
    if (inscripcionResult.recordset.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Inscripción no encontrada' 
      });
    }
    
    let updates = [];
    let request = pool.request().input('id', sql.Int, parseInt(id));
    
    if (progreso !== undefined) {
      updates.push('Progreso = @progreso');
      request.input('progreso', sql.Int, progreso);
      
      if (progreso === 100) {
        updates.push("EstadoCurso = 'completado'");
        updates.push('FechaCompletado = @fechaCompletado');
        request.input('fechaCompletado', sql.DateTime, new Date());
      } else if (progreso > 0) {
        updates.push("EstadoCurso = 'en_progreso'");
      }
    }
    
    if (calificacion !== undefined) {
      updates.push('Calificacion = @calificacion');
      request.input('calificacion', sql.Int, calificacion);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No hay campos para actualizar' 
      });
    }
    
    await request.query(`
      UPDATE InscripcionesCursos 
      SET ${updates.join(', ')}
      WHERE InscripcionID = @id
    `);
    
    res.json({
      success: true,
      message: progreso === 100 ? '¡Felicidades! Has completado el curso' : 'Progreso actualizado'
    });
  } catch (error) {
    console.error('Error actualizando progreso:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar el progreso',
      error: error.message 
    });
  }
};

// ==========================================
// CERTIFICADOS
// ==========================================

/**
 * Obtener MIS certificados
 * GET /api/capacitacion/certificados/mis-certificados
 */
export const obtenerMisCertificados = async (req, res) => {
  try {
    const empleadoId = req.user.empleadoId || req.user.id;
    
    const pool = await getConnection();
    const result = await pool.request()
      .input('empleadoId', sql.Int, empleadoId)
      .query(`
        SELECT * FROM Certificados 
        WHERE EmpleadoID = @empleadoId
        ORDER BY FechaObtencion DESC
      `);
    
    res.json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error('Error obteniendo certificados:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener certificados',
      error: error.message 
    });
  }
};

/**
 * Descargar certificado
 * GET /api/capacitacion/certificados/:id/descargar
 */
export const descargarCertificado = async (req, res) => {
  try {
    const { id } = req.params;
          // Validar ID
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ 
          success: false, 
          message: 'ID inválido' 
        });
      }
    const empleadoId = req.user.empleadoId || req.user.id;
    
    const pool = await getConnection();
    const result = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .input('empleadoId', sql.Int, empleadoId)
      .query(`
        SELECT * FROM Certificados 
        WHERE CertificadoID = @id AND EmpleadoID = @empleadoId
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Certificado no encontrado' 
      });
    }
    
    const certificado = result.recordset[0];
    
    res.json({
      success: true,
      data: certificado,
      downloadUrl: certificado.URLArchivo || `/certificados/${certificado.Codigo}.pdf`
    });
  } catch (error) {
    console.error('Error descargando certificado:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al descargar el certificado',
      error: error.message 
    });
  }
};

/**
 * Crear certificado manual (RRHH)
 * POST /api/capacitacion/certificados
 */
export const crearCertificado = async (req, res) => {
  try {
    const { 
      empleadoID, titulo, fechaObtencion, proveedor, codigo, fechaVigencia 
    } = req.body;
    
    const rol = req.user.rol || req.user.role;
    
    const rolesPermitidos = ['rrhh', 'director_rrhh', 'gerente_rrhh', 'admin'];
    if (!rolesPermitidos.includes(rol)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Solo RRHH puede crear certificados manualmente' 
      });
    }
    
    if (!empleadoID || !titulo || !fechaObtencion || !codigo) {
      return res.status(400).json({ 
        success: false, 
        message: 'Campos requeridos: empleadoID, titulo, fechaObtencion, codigo' 
      });
    }
    
    const pool = await getConnection();
    const result = await pool.request()
      .input('empleadoId', sql.Int, empleadoID)
      .input('titulo', sql.VarChar(200), titulo)
      .input('fechaObtencion', sql.Date, fechaObtencion)
      .input('proveedor', sql.VarChar(100), proveedor || null)
      .input('codigo', sql.VarChar(100), codigo)
      .input('fechaVigencia', sql.Date, fechaVigencia || null)
      .query(`
        INSERT INTO Certificados (
          EmpleadoID, Titulo, FechaObtencion, Proveedor, Codigo, FechaVigencia
        )
        OUTPUT INSERTED.*
        VALUES (
          @empleadoId, @titulo, @fechaObtencion, @proveedor, @codigo, @fechaVigencia
        )
      `);
    
    res.status(201).json({
      success: true,
      message: 'Certificado creado exitosamente',
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Error creando certificado:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al crear el certificado',
      error: error.message 
    });
  }
};

// ==========================================
// ESTADÍSTICAS Y DASHBOARD
// ==========================================

/**
 * Obtener estadísticas según rol
 * GET /api/capacitacion/estadisticas
 */
export const obtenerEstadisticas = async (req, res) => {
  try {
    const empleadoId = req.user.empleadoId || req.user.id;
    const rol = req.user.rol || req.user.role;
    
    const pool = await getConnection();
    const rolesRRHH = ['rrhh', 'director_rrhh', 'gerente_rrhh', 'admin'];
    
    let estadisticas = {};
    
    if (rolesRRHH.includes(rol)) {
      const result = await pool.request().query(`
        SELECT 
          (SELECT COUNT(*) FROM SolicitudesCapacitacion WHERE Activo = 1) as TotalSolicitudes,
          (SELECT COUNT(*) FROM SolicitudesCapacitacion WHERE Estado = 'pendiente_rrhh' AND Activo = 1) as PendientesAprobacion,
          (SELECT COUNT(*) FROM CursosDisponibles WHERE Estado = 1) as CursosCreados,
          (SELECT COUNT(DISTINCT EmpleadoID) FROM InscripcionesCursos) as EmpleadosCapacitados,
          (SELECT ISNULL(SUM(Costo), 0) FROM SolicitudesCapacitacion WHERE Estado = 'aprobado_completo') as PresupuestoUtilizado
      `);
      
      estadisticas = result.recordset[0];
    } else if (rol === 'gerente' || rol === 'director') {
      const campo = rol === 'gerente' ? 'GerenteID' : 'DirectorID';
      const result = await pool.request()
        .input('empleadoId', sql.Int, empleadoId)
        .query(`
          SELECT 
            (SELECT COUNT(*) FROM SolicitudesCapacitacion WHERE ${campo} = @empleadoId AND Activo = 1) as SolicitudesEquipo,
            (SELECT COUNT(*) FROM SolicitudesCapacitacion WHERE ${campo} = @empleadoId AND Estado LIKE 'pendiente%' AND Activo = 1) as PendientesAprobacion,
            (SELECT COUNT(*) FROM InscripcionesCursos i 
             INNER JOIN Empleados e ON i.EmpleadoID = e.EmpleadoID 
             WHERE e.SupervisorID = @empleadoId AND i.EstadoCurso = 'completado') as CursosCompletados,
            (SELECT ISNULL(SUM(c.Duracion), 0) FROM InscripcionesCursos i 
             INNER JOIN CursosDisponibles c ON i.CursoID = c.CursoID
             INNER JOIN Empleados e ON i.EmpleadoID = e.EmpleadoID 
             WHERE e.SupervisorID = @empleadoId AND i.EstadoCurso = 'completado') as HorasCapacitacion
        `);
      
      estadisticas = result.recordset[0];
    } else {
      const result = await pool.request()
        .input('empleadoId', sql.Int, empleadoId)
        .query(`
          SELECT 
            (SELECT COUNT(*) FROM SolicitudesCapacitacion WHERE SolicitanteID = @empleadoId AND Activo = 1) as TotalSolicitudes,
            (SELECT COUNT(*) FROM SolicitudesCapacitacion WHERE SolicitanteID = @empleadoId AND Estado LIKE 'pendiente%' AND Activo = 1) as SolicitudesPendientes,
            (SELECT COUNT(*) FROM InscripcionesCursos WHERE EmpleadoID = @empleadoId AND EstadoCurso = 'completado') as CursosCompletados,
            (SELECT ISNULL(SUM(c.Duracion), 0) FROM InscripcionesCursos i 
             INNER JOIN CursosDisponibles c ON i.CursoID = c.CursoID 
             WHERE i.EmpleadoID = @empleadoId AND i.EstadoCurso = 'completado') as HorasCapacitacion
        `);
      
      estadisticas = result.recordset[0];
    }
    
    res.json({
      success: true,
      data: estadisticas
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener estadísticas',
      error: error.message 
    });
  }
};

/**
 * Obtener progreso del equipo (Gerente/Director)
 * GET /api/capacitacion/progreso-equipo
 */
export const obtenerProgresoEquipo = async (req, res) => {
  try {
    const empleadoId = req.user.empleadoId || req.user.id;
    const rol = req.user.rol || req.user.role;
    
    if (rol !== 'gerente' && rol !== 'director') {
      return res.status(403).json({ 
        success: false, 
        message: 'Solo gerentes y directores pueden ver el progreso del equipo' 
      });
    }
    
    const pool = await getConnection();
    const result = await pool.request()
      .input('empleadoId', sql.Int, empleadoId)
      .query(`
        SELECT 
          e.EmpleadoID,
          e.Nombre + ' ' + e.Apellido as NombreEmpleado,
          (SELECT COUNT(*) FROM InscripcionesCursos WHERE EmpleadoID = e.EmpleadoID) as TotalCursos,
          (SELECT COUNT(*) FROM InscripcionesCursos WHERE EmpleadoID = e.EmpleadoID AND EstadoCurso = 'completado') as CursosCompletados,
          (SELECT ISNULL(AVG(Progreso), 0) FROM InscripcionesCursos WHERE EmpleadoID = e.EmpleadoID) as ProgresoPromedio,
          (SELECT ISNULL(SUM(c.Duracion), 0) FROM InscripcionesCursos i 
           INNER JOIN CursosDisponibles c ON i.CursoID = c.CursoID 
           WHERE i.EmpleadoID = e.EmpleadoID AND i.EstadoCurso = 'completado') as HorasTotales
        FROM Empleados e
        WHERE e.SupervisorID = @empleadoId AND e.Estado = 1
        ORDER BY e.Nombre
      `);
    
    res.json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error('Error obteniendo progreso del equipo:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener progreso del equipo',
      error: error.message 
    });
  }
};

/**
 * Obtener progreso global (RRHH)
 * GET /api/capacitacion/progreso-global
 */
export const obtenerProgresoGlobal = async (req, res) => {
  try {
    const rol = req.user.rol || req.user.role;
    
    const rolesPermitidos = ['rrhh', 'director_rrhh', 'gerente_rrhh', 'admin'];
    if (!rolesPermitidos.includes(rol)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Solo RRHH puede ver el progreso global' 
      });
    }
    
    const pool = await getConnection();
    
    const porDepartamento = await pool.request().query(`
      SELECT 
        d.NombreDepartamento as Departamento,
        COUNT(DISTINCT i.EmpleadoID) as EmpleadosCapacitados,
        COUNT(i.InscripcionID) as TotalInscripciones,
        SUM(CASE WHEN i.EstadoCurso = 'completado' THEN 1 ELSE 0 END) as CursosCompletados,
        ISNULL(AVG(i.Progreso), 0) as ProgresoPromedio
      FROM Departamentos d
      LEFT JOIN Empleados e ON d.DepartamentoID = e.DepartamentoID
      LEFT JOIN InscripcionesCursos i ON e.EmpleadoID = i.EmpleadoID
      WHERE e.Estado = 1
      GROUP BY d.DepartamentoID, d.NombreDepartamento
      ORDER BY d.NombreDepartamento
    `);
    
    const porCategoria = await pool.request().query(`
      SELECT 
        c.Categoria,
        COUNT(i.InscripcionID) as TotalInscripciones,
        SUM(CASE WHEN i.EstadoCurso = 'completado' THEN 1 ELSE 0 END) as Completados,
        ISNULL(AVG(i.Progreso), 0) as ProgresoPromedio
      FROM CursosDisponibles c
      LEFT JOIN InscripcionesCursos i ON c.CursoID = i.CursoID
      WHERE c.Estado = 1
      GROUP BY c.Categoria
      ORDER BY TotalInscripciones DESC
    `);
    
    const cursosPopulares = await pool.request().query(`
      SELECT TOP 5
        c.Titulo,
        c.Categoria,
        c.Inscritos,
        c.Cupos,
        CAST((c.Inscritos * 100.0 / NULLIF(c.Cupos, 0)) AS DECIMAL(5,2)) as PorcentajeOcupacion
      FROM CursosDisponibles c
      WHERE c.Estado = 1 AND c.Disponible = 1
      ORDER BY c.Inscritos DESC
    `);
    
    res.json({
      success: true,
      data: {
        porDepartamento: porDepartamento.recordset,
        porCategoria: porCategoria.recordset,
        cursosPopulares: cursosPopulares.recordset
      }
    });
  } catch (error) {
    console.error('Error obteniendo progreso global:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener progreso global',
      error: error.message 
    });
  }
};

/**
 * Obtener TODAS las solicitudes (histórico)
 * GET /api/capacitacion/solicitudes/todas
 */
export const obtenerTodasSolicitudes = async (req, res) => {
  try {
    const empleadoId = req.user.empleadoId || req.user.id;
    const rol = req.user.rol || req.user.role;
    
    const pool = await getConnection();
    const rolesRRHH = ['rrhh', 'director_rrhh', 'gerente_rrhh', 'admin'];
    
    let whereClause = '';
    
    if (rolesRRHH.includes(rol)) {
      // RRHH ve TODAS
      whereClause = 'WHERE s.Activo = 1';
    } else if (rol === 'gerente') {
      // Gerente ve las de su equipo
      whereClause = 'WHERE s.GerenteID = @empleadoId AND s.Activo = 1';
    } else if (rol === 'director') {
      // Director ve las de su área
      whereClause = 'WHERE s.DirectorID = @empleadoId AND s.Activo = 1';
    } else {
      return res.status(403).json({ 
        success: false, 
        message: 'No tienes permisos' 
      });
    }
    
    const result = await pool.request()
      .input('empleadoId', sql.Int, empleadoId)
      .query(`
        SELECT 
          s.*,
          e.Nombre + ' ' + e.Apellido as solicitante,
          u.Rol as solicitanteRole,
          eg.Nombre + ' ' + eg.Apellido as nombreGerente,
          ed.Nombre + ' ' + ed.Apellido as nombreDirector,
          ag.Nombre + ' ' + ag.Apellido as aprobadoPorGerente,
          ad.Nombre + ' ' + ad.Apellido as aprobadoPorDirector,
          ar.Nombre + ' ' + ar.Apellido as aprobadoPorRRHH
        FROM SolicitudesCapacitacion s
        INNER JOIN Empleados e ON s.SolicitanteID = e.EmpleadoID
        LEFT JOIN Usuarios u ON e.EmpleadoID = u.EmpleadoID
        LEFT JOIN Empleados eg ON s.GerenteID = eg.EmpleadoID
        LEFT JOIN Empleados ed ON s.DirectorID = ed.EmpleadoID
        LEFT JOIN Empleados ag ON s.AprobadorGerenteID = ag.EmpleadoID
        LEFT JOIN Empleados ad ON s.AprobadorDirectorID = ad.EmpleadoID
        LEFT JOIN Empleados ar ON s.AprobadorRRHHID = ar.EmpleadoID
        ${whereClause}
        ORDER BY s.FechaSolicitud DESC
      `);
    
    res.json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error('Error obteniendo todas las solicitudes:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener solicitudes',
      error: error.message 
    });
  }
};

/**
 * Obtener capacitaciones del empleado autenticado
 * GET /api/capacitacion/mis-capacitaciones
 */
export const obtenerMisCapacitaciones = async (req, res) => {
  try {
    const empleadoId = req.user.empleadoId || req.user.id;
    
    const pool = await getConnection();
    
    const result = await pool.request()
      .input('empleadoId', sql.Int, empleadoId)
      .query(`
        SELECT 
          c.CapacitacionID as id,
          c.Titulo as titulo,
          c.Descripcion as descripcion,
          c.FechaInicio as fechaInicio,
          c.FechaFin as fechaFin,
          c.Modalidad as modalidad,
          c.Instructor as instructor,
          c.Estado as estado,
          ec.FechaInscripcion as fechaInscripcion,
          CASE 
            WHEN c.FechaInicio > GETDATE() THEN 'Próximo'
            WHEN c.FechaFin < GETDATE() THEN 'Completado'
            ELSE 'En curso'
          END as estadoCurso
        FROM EmpleadoCapacitacion ec
        INNER JOIN Capacitaciones c ON ec.CapacitacionID = c.CapacitacionID
        WHERE ec.EmpleadoID = @empleadoId
        ORDER BY c.FechaInicio DESC
      `);
    
    res.json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error('Error obteniendo mis capacitaciones:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener capacitaciones',
      error: error.message 
    });
  }
};

/**
 * Obtener participantes inscritos en una capacitación
 * GET /api/capacitacion/:id/participantes
 */
export const obtenerParticipantes = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('📊 Obteniendo participantes del curso:', id);
    
    const pool = await getConnection();
    
    const result = await pool.request()
      .input('cursoId', sql.Int, id)
      .query(`
        SELECT 
          i.InscripcionID,
          i.EmpleadoID,
          e.NOMBRE as Nombre,
          e.APELLIDO as Apellido,
          CONCAT(e.NOMBRE, ' ', e.APELLIDO) as NombreCompleto,
          e.CARGO as Cargo,
          d.NOMBRE as Departamento,
          e.Email,
          i.FechaInscripcion,
          i.Progreso,
          i.EstadoCurso as Estado,
          i.Calificacion,
          i.FechaCompletado
        FROM InscripcionesCursos i
        INNER JOIN Empleados e ON i.EmpleadoID = e.EmpleadoID
        LEFT JOIN Departamentos d ON e.DEPARTAMENTOID = d.DEPARTAMENTOID
        WHERE i.CursoID = @cursoId
        AND e.ESTADO = 1
        ORDER BY e.APELLIDO, e.NOMBRE
      `);
    
    console.log(`✅ Participantes encontrados: ${result.recordset.length}`);
    
    res.json({
      success: true,
      data: result.recordset,
      total: result.recordset.length
    });
  } catch (error) {
    console.error('Error obteniendo participantes:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener participantes',
      error: error.message 
    });
  }
};