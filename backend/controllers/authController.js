import { getConnection, executeQuery } from '../db.js'; // ✅ USAR getConnection
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { transporter } from '../mailer.js';
import sql from 'mssql';

// ======================================
// LOGIN COMPLETAMENTE ACTUALIZADO
// ======================================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ VALIDACIÓN DE ENTRADA
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email y contraseña son requeridos' 
      });
    }
    
    // ✅ USAR getConnection CON VALIDACIÓN
    const pool = await getConnection();
    if (!pool) {
      return res.status(503).json({ 
        message: 'Base de datos temporalmente no disponible. Inténtalo de nuevo.' 
      });
    }

    // ✅ CONSULTA MEJORADA CON MANEJO DE ERRORES
    const result = await pool.request()
      .input('email', sql.VarChar(255), email.toLowerCase().trim())
      .query(`
        SELECT u.UsuarioID, u.Username, u.Email, u.PasswordHash, u.Rol, u.Estado, u.EmpleadoID,
               e.NOMBRE, e.APELLIDO, u.UltimoLogin
        FROM Usuarios u
        LEFT JOIN Empleados e ON u.EmpleadoID = e.EmpleadoID
        WHERE (LOWER(u.Email) = @email OR LOWER(u.Username) = @email)
        AND u.Estado = 1
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ 
        message: 'Credenciales inválidas' 
      });
    }

    const user = result.recordset[0];

    // ✅ VERIFICACIÓN MEJORADA DE CONTRASEÑA
    let validPassword;
    try {
      validPassword = await bcrypt.compare(password, user.PasswordHash);
    } catch (bcryptError) {
      console.error('Error comparando contraseña:', bcryptError);
      return res.status(500).json({ 
        message: 'Error procesando credenciales' 
      });
    }

    if (!validPassword) {
      return res.status(401).json({ 
        message: 'Credenciales inválidas' 
      });
    }

    // ✅ OBTENER PERMISOS CON MANEJO DE ERRORES
    const permisos = await getUserPermissions(user.Rol);

    // ✅ GENERAR TOKEN CON VALIDACIÓN
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET no está configurado');
      return res.status(500).json({ 
        message: 'Error de configuración del servidor' 
      });
    }

    const token = jwt.sign(
      { 
        userId: user.UsuarioID, 
        rol: user.Rol, 
        empleadoId: user.EmpleadoID,
        username: user.Username
      },
      jwtSecret,
      { expiresIn: '8h' }
    );

    // ✅ ACTUALIZAR ÚLTIMO LOGIN CON MANEJO DE ERRORES
    try {
      await pool.request()
        .input('userId', sql.Int, user.UsuarioID)
        .query('UPDATE Usuarios SET UltimoLogin = GETDATE() WHERE UsuarioID = @userId');
    } catch (updateError) {
      console.error('Error actualizando último login:', updateError);
      // No bloquear el login por este error
    }

    // ✅ RESPUESTA EXITOSA
    res.json({
      success: true,
      token,
      user: {
        id: user.UsuarioID,
        username: user.Username,
        email: user.Email,
        nombre: user.NOMBRE,
        apellido: user.APELLIDO,
        rol: user.Rol,
        empleadoId: user.EmpleadoID,
        ultimoLogin: user.UltimoLogin
      },
      permisos
    });

  } catch (error) {
    console.error('Error en login:', error);
    
    // ✅ MANEJO ESPECÍFICO DE DIFERENTES TIPOS DE ERROR
    if (error.code === 'ETIMEOUT') {
      return res.status(503).json({ 
        message: 'El servidor está temporalmente ocupado. Inténtalo de nuevo.' 
      });
    }
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        message: 'No se puede conectar con la base de datos. Inténtalo más tarde.' 
      });
    }
    
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ======================================
// VERIFICAR TOKEN ACTUALIZADO
// ======================================
export const verifyToken = async (req, res) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ 
        message: 'Token inválido' 
      });
    }

    // ✅ OBTENER PERMISOS ACTUALIZADOS
    const permisos = await getUserPermissions(user.rol);
    
    // ✅ VERIFICAR QUE EL USUARIO SIGA ACTIVO
    const pool = await getConnection();
    if (pool) {
      try {
        const result = await pool.request()
          .input('userId', sql.Int, user.userId)
          .query('SELECT Estado FROM Usuarios WHERE UsuarioID = @userId');
        
        if (result.recordset.length === 0 || result.recordset[0].Estado !== 1) {
          return res.status(401).json({ 
            message: 'Usuario inactivo' 
          });
        }
      } catch (dbError) {
        console.error('Error verificando estado del usuario:', dbError);
        // Continuar con la verificación del token
      }
    }

    res.json({ 
      success: true,
      user, 
      permisos 
    });

  } catch (error) {
    console.error('Error verificando token:', error);
    res.status(500).json({ 
      message: 'Error verificando token' 
    });
  }
};

// ======================================
// OBTENER PERMISOS ACTUALIZADO
// ======================================
const getUserPermissions = async (rol) => {
  try {
    // ✅ USAR getConnection CON VALIDACIÓN
    const pool = await getConnection();
    if (!pool) {
      console.error('No hay conexión disponible para obtener permisos');
      return [];
    }

    const result = await pool.request()
      .input('rol', sql.VarChar(50), rol)
      .query(`
        SELECT m.NombreModulo, p.PuedeVer, p.PuedeCrear, p.PuedeEditar, p.PuedeEliminar
        FROM Permisos p
        INNER JOIN Roles r ON p.RolID = r.RolID
        INNER JOIN Modulos m ON p.ModuloID = m.ModuloID
        WHERE r.NombreRol = @rol
        ORDER BY m.NombreModulo
      `);

    return result.recordset || [];

  } catch (error) {
    console.error('Error obteniendo permisos:', error);
    return [];
  }
};

// ======================================
// FORGOT PASSWORD ACTUALIZADO
// ======================================
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // ✅ VALIDACIÓN DE ENTRADA
    if (!email) {
      return res.status(400).json({ 
        message: 'Email es requerido' 
      });
    }

    const emailTrimmed = email.toLowerCase().trim();
    
    // ✅ USAR getConnection CON VALIDACIÓN
    const pool = await getConnection();
    if (!pool) {
      return res.status(503).json({ 
        message: 'Base de datos temporalmente no disponible' 
      });
    }

    // ✅ BUSCAR USUARIO CON VALIDACIÓN DE ESTADO
    const result = await pool.request()
      .input('email', sql.VarChar(255), emailTrimmed)
      .query(`
        SELECT UsuarioID, Username, Email 
        FROM Usuarios 
        WHERE LOWER(Email) = @email AND Estado = 1
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ 
        message: 'No se encontró una cuenta con ese email' 
      });
    }

    const user = result.recordset[0];

    // ✅ GENERAR TOKEN SEGURO
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hora

    // ✅ GUARDAR TOKEN EN BASE DE DATOS
    await pool.request()
      .input('userId', sql.Int, user.UsuarioID)
      .input('token', sql.VarChar(255), hashedToken)
      .input('expires', sql.DateTime, expires)
      .query(`
        UPDATE Usuarios 
        SET ResetPasswordToken = @token, ResetPasswordExpires = @expires 
        WHERE UsuarioID = @userId
      `);

    // ✅ CONSTRUIR URL DE RESET
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetURL = `${frontendUrl}/reset-password?token=${resetToken}`;

    // ✅ VALIDAR CONFIGURACIÓN DE EMAIL
    if (!transporter) {
      console.error('Transporter de email no configurado');
      return res.status(500).json({ 
        message: 'Servicio de email no disponible' 
      });
    }

    // ✅ ENVIAR EMAIL CON MANEJO DE ERRORES
    try {
      await transporter.sendMail({
        from: `"ProDominicana - Sistema RRHH" <${process.env.SMTP_USER}>`,
        to: user.Email,
        subject: 'Restablecer contraseña - Sistema RRHH',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Restablecer contraseña</h2>
            <p>Hola <strong>${user.Username}</strong>,</p>
            <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en el Sistema RRHH de ProDominicana.</p>
            <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetURL}" 
                 style="background-color: #007bff; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 5px; display: inline-block;">
                Restablecer Contraseña
              </a>
            </div>
            <p><strong>Este enlace expirará en 1 hora.</strong></p>
            <p>Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
            <hr style="margin: 30px 0; border: 1px solid #eee;">
            <p style="font-size: 12px; color: #666;">
              Este es un correo automático del Sistema RRHH de ProDominicana. No respondas a este correo.
            </p>
          </div>
        `
      });

      console.log(`Email de reset enviado a: ${user.Email}`);

    } catch (emailError) {
      console.error('Error enviando email:', emailError);
      return res.status(500).json({ 
        message: 'Error enviando correo de restablecimiento' 
      });
    }

    res.json({ 
      success: true,
      message: 'Se ha enviado un correo con las instrucciones para restablecer tu contraseña. Revisa tu bandeja de entrada.' 
    });

  } catch (error) {
    console.error('Error en forgotPassword:', error);
    
    // ✅ MANEJO ESPECÍFICO DE TIMEOUTS
    if (error.code === 'ETIMEOUT') {
      return res.status(503).json({ 
        message: 'El servidor está temporalmente ocupado. Inténtalo de nuevo.' 
      });
    }
    
    res.status(500).json({ 
      message: 'Error interno del servidor' 
    });
  }
};

// ======================================
// RESET PASSWORD ACTUALIZADO
// ======================================
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // ✅ VALIDACIÓN DE ENTRADA
    if (!token || !newPassword) {
      return res.status(400).json({ 
        message: 'Token y nueva contraseña son requeridos' 
      });
    }

    // ✅ VALIDACIÓN DE CONTRASEÑA
    if (newPassword.length < 8) {
      return res.status(400).json({ 
        message: 'La contraseña debe tener al menos 8 caracteres' 
      });
    }
    
    // ✅ USAR getConnection CON VALIDACIÓN
    const pool = await getConnection();
    if (!pool) {
      return res.status(503).json({ 
        message: 'Base de datos temporalmente no disponible' 
      });
    }

    // ✅ VALIDAR TOKEN
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const result = await pool.request()
      .input('token', sql.VarChar(255), hashedToken)
      .query(`
        SELECT UsuarioID, Username, ResetPasswordExpires
        FROM Usuarios
        WHERE ResetPasswordToken = @token AND Estado = 1
      `);

    if (result.recordset.length === 0) {
      return res.status(400).json({ 
        message: 'Token inválido o expirado' 
      });
    }

    const user = result.recordset[0];

    // ✅ VERIFICAR EXPIRACIÓN
    if (new Date(user.ResetPasswordExpires) < new Date()) {
      return res.status(400).json({ 
        message: 'El token ha expirado. Solicita un nuevo restablecimiento de contraseña.' 
      });
    }

    // ✅ HASHEAR NUEVA CONTRASEÑA
    let passwordHash;
    try {
      passwordHash = await bcrypt.hash(newPassword, 12);
    } catch (hashError) {
      console.error('Error hasheando contraseña:', hashError);
      return res.status(500).json({ 
        message: 'Error procesando nueva contraseña' 
      });
    }

    // ✅ ACTUALIZAR CONTRASEÑA
    await pool.request()
      .input('userId', sql.Int, user.UsuarioID)
      .input('passwordHash', sql.VarChar(255), passwordHash)
      .query(`
        UPDATE Usuarios 
        SET PasswordHash = @passwordHash, 
            ResetPasswordToken = NULL, 
            ResetPasswordExpires = NULL,
            UltimoLogin = NULL
        WHERE UsuarioID = @userId
      `);

    console.log(`Contraseña actualizada para usuario: ${user.Username}`);

    res.json({ 
      success: true,
      message: 'Tu contraseña ha sido actualizada correctamente. Ya puedes iniciar sesión con tu nueva contraseña.' 
    });
    
  } catch (error) {
    console.error('Error en resetPassword:', error);
    
    // ✅ MANEJO ESPECÍFICO DE TIMEOUTS
    if (error.code === 'ETIMEOUT') {
      return res.status(503).json({ 
        message: 'El servidor está temporalmente ocupado. Inténtalo de nuevo.' 
      });
    }
    
    res.status(500).json({ 
      message: 'Error interno del servidor' 
    });
  }
};

// ======================================
// CAMBIAR CONTRASEÑA (NUEVO)
// ======================================
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId; // Del middleware de auth

    // ✅ VALIDACIONES
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: 'Contraseña actual y nueva contraseña son requeridas' 
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ 
        message: 'La nueva contraseña debe tener al menos 8 caracteres' 
      });
    }

    const pool = await getConnection();
    if (!pool) {
      return res.status(503).json({ 
        message: 'Base de datos temporalmente no disponible' 
      });
    }

    // ✅ VERIFICAR CONTRASEÑA ACTUAL
    const userResult = await pool.request()
      .input('userId', sql.Int, userId)
      .query('SELECT PasswordHash FROM Usuarios WHERE UsuarioID = @userId AND Estado = 1');

    if (userResult.recordset.length === 0) {
      return res.status(404).json({ 
        message: 'Usuario no encontrado' 
      });
    }

    const validCurrentPassword = await bcrypt.compare(currentPassword, userResult.recordset[0].PasswordHash);
    if (!validCurrentPassword) {
      return res.status(401).json({ 
        message: 'La contraseña actual es incorrecta' 
      });
    }

    // ✅ HASHEAR Y ACTUALIZAR NUEVA CONTRASEÑA
    const passwordHash = await bcrypt.hash(newPassword, 12);

    await pool.request()
      .input('userId', sql.Int, userId)
      .input('passwordHash', sql.VarChar(255), passwordHash)
      .query('UPDATE Usuarios SET PasswordHash = @passwordHash WHERE UsuarioID = @userId');

    res.json({ 
      success: true,
      message: 'Contraseña actualizada correctamente' 
    });

  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor' 
    });
  }
};