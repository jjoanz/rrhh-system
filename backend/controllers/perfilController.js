import { poolPromise } from '../db.js';
import sql from 'mssql';
import bcrypt from 'bcrypt';

// Obtener perfil completo del usuario
export const getPerfil = async (req, res) => {
  try {
    const usuarioId = req.user.userId;
    const pool = await poolPromise;

    // Obtener datos del usuario y empleado
    const result = await pool.request()
      .input('usuarioId', sql.Int, usuarioId)
      .query(`
        SELECT 
          u.UsuarioID,
          u.Username,
          u.Email,
          u.Rol,
          u.EmpleadoID,
          e.NOMBRE,
          e.APELLIDO,
          e.CEDULA,
          e.Telefono,
          e.Email as EmailPersonal,
          e.Direccion,
          e.CARGO,
          e.Salario,
          e.FECHAINGRESO,
          e.DEPARTAMENTOID,
          d.Nombre as DEPARTAMENTO_NOMBRE
        FROM Usuarios u
        LEFT JOIN Empleados e ON u.EmpleadoID = e.EmpleadoID
        LEFT JOIN Departamentos d ON e.DEPARTAMENTOID = d.DepartamentoID
        WHERE u.UsuarioID = @usuarioId AND u.Estado = 1
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const perfil = result.recordset[0];

    res.json({
      success: true,
      perfil: {
        usuarioId: perfil.UsuarioID,
        username: perfil.Username,
        email: perfil.Email,
        rol: perfil.Rol,
        empleadoId: perfil.EmpleadoID,
        nombres: perfil.NOMBRE || '',
        apellidos: perfil.APELLIDO || '',
        cedula: perfil.CEDULA || '',
        telefono: perfil.Telefono || '',
        emailPersonal: perfil.EmailPersonal || '',
        direccion: perfil.Direccion || '',
        cargo: perfil.CARGO || '',
        salario: perfil.Salario || 0,
        fechaIngreso: perfil.FECHAINGRESO 
  ? (perfil.FECHAINGRESO instanceof Date 
      ? perfil.FECHAINGRESO.toISOString().split('T')[0] 
      : new Date(perfil.FECHAINGRESO).toISOString().split('T')[0])  : '',
        departamento: perfil.DEPARTAMENTO_NOMBRE || 'Sin departamento',
        departamentoId: perfil.DEPARTAMENTOID
      }
    });

  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Actualizar información personal
export const updatePerfil = async (req, res) => {
  try {
    const usuarioId = req.user.userId;
    const { telefono, emailPersonal, direccion } = req.body;

    const pool = await poolPromise;

    // Obtener EmpleadoID del usuario
    const userResult = await pool.request()
      .input('usuarioId', sql.Int, usuarioId)
      .query('SELECT EmpleadoID FROM Usuarios WHERE UsuarioID = @usuarioId');

    if (userResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const empleadoId = userResult.recordset[0].EmpleadoID;

    if (!empleadoId) {
      return res.status(400).json({ error: 'Usuario sin empleado asociado' });
    }

    // Actualizar datos del empleado
    await pool.request()
      .input('empleadoId', sql.Int, empleadoId)
      .input('telefono', sql.NVarChar, telefono || null)
      .input('email', sql.NVarChar, emailPersonal || null)
      .input('direccion', sql.NVarChar, direccion || null)
      .query(`
        UPDATE Empleados
        SET 
          Telefono = @telefono,
          Email = @email,
          Direccion = @direccion,
          FechaModificacion = GETDATE()
        WHERE EmpleadoID = @empleadoId
      `);

    res.json({
      success: true,
      message: 'Perfil actualizado correctamente'
    });

  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Cambiar contraseña
export const cambiarPassword = async (req, res) => {
  try {
    const usuarioId = req.user.userId;
    const { passwordActual, passwordNuevo } = req.body;

    if (!passwordActual || !passwordNuevo) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    if (passwordNuevo.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const pool = await poolPromise;

    // Obtener usuario actual
    const userResult = await pool.request()
      .input('usuarioId', sql.Int, usuarioId)
      .query('SELECT PasswordHash FROM Usuarios WHERE UsuarioID = @usuarioId');

    if (userResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const usuario = userResult.recordset[0];

    // Verificar contraseña actual
    const passwordValido = await bcrypt.compare(passwordActual, usuario.PasswordHash);

    if (!passwordValido) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }

    // Hash de nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(passwordNuevo, salt);

    // Actualizar contraseña
    await pool.request()
      .input('usuarioId', sql.Int, usuarioId)
      .input('passwordHash', sql.NVarChar, hashedPassword)
      .query(`
        UPDATE Usuarios
        SET PasswordHash = @passwordHash
        WHERE UsuarioID = @usuarioId
      `);

    res.json({
      success: true,
      message: 'Contraseña actualizada correctamente'
    });

  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener estadísticas del perfil
export const getEstadisticas = async (req, res) => {
  try {
    const usuarioId = req.user.userId;
    const pool = await poolPromise;

    // Por ahora retornamos estadísticas básicas
    // Puedes expandir esto cuando tengas más módulos
    const stats = {
      objetivosActivos: 0,
      progresoPromedio: 0,
      documentos: 0,
      experiencia: 0
    };

    res.json({
      success: true,
      estadisticas: stats
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Subir foto de perfil
export const subirFotoPerfil = async (req, res) => {
  try {
    const usuarioId = req.user.userId;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ninguna imagen' });
    }

    const pool = await poolPromise;

    // Obtener EmpleadoID del usuario
    const userResult = await pool.request()
      .input('usuarioId', sql.Int, usuarioId)
      .query('SELECT EmpleadoID FROM Usuarios WHERE UsuarioID = @usuarioId');

    if (userResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const empleadoId = userResult.recordset[0].EmpleadoID;

    if (!empleadoId) {
      return res.status(400).json({ error: 'Usuario sin empleado asociado' });
    }

    // Guardar ruta de la foto
    const fotoUrl = `/uploads/${req.file.filename}`;

    await pool.request()
      .input('empleadoId', sql.Int, empleadoId)
      .input('fotoUrl', sql.NVarChar, fotoUrl)
      .query(`
        UPDATE Empleados
        SET FotoUrl = @fotoUrl
        WHERE EmpleadoID = @empleadoId
      `);

    res.json({
      success: true,
      message: 'Foto actualizada correctamente',
      fotoUrl
    });

  } catch (error) {
    console.error('Error subiendo foto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};