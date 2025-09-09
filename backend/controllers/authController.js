import { poolPromise } from '../db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Login existente
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const pool = await poolPromise;

    const result = await pool.request()
      .input('email', email)
      .query(`
        SELECT u.UsuarioID, u.Username, u.PasswordHash, u.Rol, u.Estado, u.EmpleadoID,
               e.NOMBRE, e.APELLIDO
        FROM Usuarios u
        LEFT JOIN Empleados e ON u.EmpleadoID = e.EmpleadoID
        WHERE (u.Email = @email OR u.Username = @email)
        AND u.Estado = 1
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const user = result.recordset[0];
    const validPassword = await bcrypt.compare(password, user.PasswordHash);
    if (!validPassword) return res.status(401).json({ message: 'Credenciales inválidas' });

    const permisos = await getUserPermissions(user.Rol);

    const token = jwt.sign(
      { userId: user.UsuarioID, rol: user.Rol, empleadoId: user.EmpleadoID },
      process.env.JWT_SECRET || 'tu-secret-key',
      { expiresIn: '8h' }
    );

    await pool.request()
      .input('userId', user.UsuarioID)
      .query('UPDATE Usuarios SET UltimoLogin = GETDATE() WHERE UsuarioID = @userId');

    res.json({
      token,
      user: {
        id: user.UsuarioID,
        username: user.Username,
        nombre: user.NOMBRE,
        apellido: user.APELLIDO,
        rol: user.Rol,
        empleadoId: user.EmpleadoID
      },
      permisos
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Verificar token existente
export const verifyToken = async (req, res) => {
  try {
    const user = req.user;
    const permisos = await getUserPermissions(user.rol);
    res.json({ user, permisos });
  } catch (error) {
    res.status(500).json({ message: 'Error verificando token' });
  }
};

// Obtener permisos
const getUserPermissions = async (rol) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('rol', rol)
      .query(`
        SELECT m.NombreModulo, p.PuedeVer, p.PuedeCrear, p.PuedeEditar, p.PuedeEliminar
        FROM Permisos p
        INNER JOIN Roles r ON p.RolID = r.RolID
        INNER JOIN Modulos m ON p.ModuloID = m.ModuloID
        WHERE r.NombreRol = @rol
      `);
    return result.recordset;
  } catch (error) {
    console.error('Error obteniendo permisos:', error);
    return [];
  }
};

// ======================================
// NUEVAS FUNCIONES - Cambio de contraseña
// ======================================

// Olvidé mi contraseña
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const pool = await poolPromise;

    const result = await pool.request()
      .input('email', email)
      .query('SELECT UsuarioID FROM Usuarios WHERE Email = @email');

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const user = result.recordset[0];
    // Generar token temporal (válido por 1 hora)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hora

    await pool.request()
      .input('userId', user.UsuarioID)
      .input('token', hashedToken)
      .input('expires', expires)
      .query('UPDATE Usuarios SET ResetPasswordToken = @token, ResetPasswordExpires = @expires WHERE UsuarioID = @userId');

    // Aquí enviarías el resetToken por email al usuario
    // Por ahora solo lo devolvemos en la respuesta (prueba)
    res.json({ message: 'Token generado, revisa tu email', resetToken });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Resetear contraseña
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const pool = await poolPromise;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const result = await pool.request()
      .input('token', hashedToken)
      .query(`
        SELECT UsuarioID, ResetPasswordExpires
        FROM Usuarios
        WHERE ResetPasswordToken = @token
      `);

    if (result.recordset.length === 0) {
      return res.status(400).json({ message: 'Token inválido o expirado' });
    }

    const user = result.recordset[0];
    if (new Date(user.ResetPasswordExpires) < new Date()) {
      return res.status(400).json({ message: 'Token expirado' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await pool.request()
      .input('userId', user.UsuarioID)
      .input('passwordHash', passwordHash)
      .query('UPDATE Usuarios SET PasswordHash = @passwordHash, ResetPasswordToken = NULL, ResetPasswordExpires = NULL WHERE UsuarioID = @userId');

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};
