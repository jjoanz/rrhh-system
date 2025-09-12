import { getConnection, executeQuery } from '../db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { transporter } from '../mailer.js';
import sql from 'mssql';

// ======================================
// LOGIN CON PERMISOS ESTRUCTURADOS (CORREGIDO)
// ======================================
export const login = async (req, res) => {
  try {
    const { email, password, identifier } = req.body;
    const loginIdentifier = identifier || email; // Compatibilidad con ambos formatos

    if (!loginIdentifier || !password) {
      return res.status(400).json({ 
        message: 'Email/Usuario y contraseña son requeridos' 
      });
    }
    
    const pool = await getConnection();
    if (!pool) {
      return res.status(503).json({ 
        message: 'Base de datos temporalmente no disponible. Inténtalo de nuevo.' 
      });
    }

    const result = await pool.request()
      .input('identifier', sql.VarChar(255), loginIdentifier.toLowerCase().trim())
      .query(`
        SELECT u.UsuarioID, u.Username, u.Email, u.PasswordHash, u.Rol, u.Estado, u.EmpleadoID,
               e.NOMBRE, e.APELLIDO, u.UltimoLogin
        FROM Usuarios u
        LEFT JOIN Empleados e ON u.EmpleadoID = e.EmpleadoID
        WHERE (LOWER(u.Email) = @identifier OR LOWER(u.Username) = @identifier)
        AND u.Estado = 1
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ 
        message: 'Credenciales inválidas' 
      });
    }

    const user = result.recordset[0];

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

    // ✅ OBTENER PERMISOS CON ESTRUCTURA CORREGIDA
    const permisos = await getUserPermissions(user.UsuarioID);

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
        username: user.Username,
        email: user.Email
      },
      jwtSecret,
      { expiresIn: '24h' } // Cambiado de 50y a 24h por seguridad
    );

    // Actualizar último login
    try {
      await pool.request()
        .input('userId', sql.Int, user.UsuarioID)
        .query('UPDATE Usuarios SET UltimoLogin = GETDATE() WHERE UsuarioID = @userId');
    } catch (updateError) {
      console.error('Error actualizando último login:', updateError);
    }

    // ✅ RESPUESTA COMPATIBLE CON FRONTEND
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
      permisos // Array de objetos para compatibilidad con el frontend
    });

  } catch (error) {
    console.error('Error en login:', error);
    
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
// VERIFICAR TOKEN CON PERMISOS (CORREGIDO)
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
    const permisos = await getUserPermissions(user.userId);
    
    // Verificar que el usuario siga activo
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
      }
    }

    res.json({ 
      success: true,
      valid: true,
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
// FUNCIÓN EXPORTADA PARA OBTENER PERMISOS (CORREGIDA)
// ======================================
export const getUserPermissions = async (userId) => {
  try {
    const pool = await getConnection();
    if (!pool) {
      console.error('No hay conexión disponible para obtener permisos');
      return [];
    }

    // ✅ CONSULTA CORREGIDA - Usar RolPermisos en lugar de Permisos
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT 
          p.ModuloID,
          m.NombreModulo,
          p.EstaVisible,
          p.PuedeVer,
          p.PuedeCrear,
          p.PuedeEditar,
          p.PuedeEliminar
        FROM RolPermisos p
        INNER JOIN Roles r ON p.RolID = r.RolID
        INNER JOIN Modulos m ON p.ModuloID = m.ModuloID
        INNER JOIN Usuarios u ON u.Rol = r.NombreRol
        WHERE u.UsuarioID = @userId
        ORDER BY m.NombreModulo
      `);

    // ✅ RETORNAR ARRAY PARA COMPATIBILIDAD CON MIDDLEWARE
    return result.recordset;

  } catch (error) {
    console.error('Error obteniendo permisos:', error);
    return [];
  }
};

// ======================================
// FUNCIÓN AUXILIAR PARA OBTENER ROL ID
// ======================================
export const getRoleId = async (roleName) => {
  try {
    const pool = await getConnection();
    if (!pool) return null;

    const result = await pool.request()
      .input('roleName', sql.VarChar(50), roleName)
      .query('SELECT RolID FROM Roles WHERE NombreRol = @roleName');
    
    return result.recordset[0]?.RolID || null;
  } catch (error) {
    console.error('Error obteniendo RolID:', error);
    return null;
  }
};

// ======================================
// NUEVAS FUNCIONES PARA GESTIÓN DE ROLES Y PERMISOS
// ======================================

// Obtener todos los roles disponibles
export const getRoles = async (req, res) => {
  try {
    const pool = await getConnection();
    if (!pool) {
      return res.status(503).json({ 
        message: 'Base de datos temporalmente no disponible' 
      });
    }

    const result = await pool.request()
      .query(`
        SELECT RolID, NombreRol, Descripcion, FechaCreacion
        FROM Roles
        ORDER BY NombreRol
      `);

    res.json({
      success: true,
      roles: result.recordset
    });

  } catch (error) {
    console.error('Error obteniendo roles:', error);
    res.status(500).json({ 
      message: 'Error obteniendo roles' 
    });
  }
};

// Obtener todos los módulos disponibles
export const getModulos = async (req, res) => {
  try {
    const pool = await getConnection();
    if (!pool) {
      return res.status(503).json({ 
        message: 'Base de datos temporalmente no disponible' 
      });
    }

    const result = await pool.request()
      .query(`
        SELECT ModuloID, NombreModulo, Descripcion, FechaCreacion
        FROM Modulos
        ORDER BY NombreModulo
      `);

    res.json({
      success: true,
      modulos: result.recordset
    });

  } catch (error) {
    console.error('Error obteniendo módulos:', error);
    res.status(500).json({ 
      message: 'Error obteniendo módulos' 
    });
  }
};

// ======================================
// Obtener permisos de un rol específico (CORREGIDO)
// ======================================
export const getPermisosByRol = async (req, res) => {
  try {
    const { rolId } = req.params;

    if (!rolId) {
      return res.status(400).json({ 
        message: 'RolID es requerido' 
      });
    }

    const pool = await getConnection();
    if (!pool) {
      return res.status(503).json({ 
        message: 'Base de datos temporalmente no disponible' 
      });
    }

    // ✅ CONSULTA CORREGIDA - Usar RolPermisos
    const query = `
      SELECT 
        p.PermisoID,
        p.RolID,
        p.ModuloID,
        m.NombreModulo,
        m.Descripcion as DescripcionModulo,
        p.EstaVisible,
        p.PuedeVer,
        p.PuedeCrear,
        p.PuedeEditar,
        p.PuedeEliminar
      FROM RolPermisos p
      JOIN Modulos m ON p.ModuloID = m.ModuloID
      WHERE p.RolID = @rolId
      ORDER BY m.NombreModulo
    `;

    const result = await pool.request()
      .input('rolId', sql.Int, rolId)
      .query(query);

    res.json({ 
      success: true, 
      permisos: result.recordset 
    });
  } catch (error) {
    console.error('Error obteniendo permisos:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ======================================
// Actualizar permisos de un rol (CORREGIDO)
// ======================================
export const updatePermisos = async (req, res) => {
  try {
    const { rolId } = req.params;
    const { permisos } = req.body;

    console.log('🔍 Datos recibidos:', { rolId, permisos });

    if (!rolId || !permisos || !Array.isArray(permisos)) {
      return res.status(400).json({ 
        message: 'RolID y array de permisos son requeridos' 
      });
    }

    const rolIdNum = parseInt(rolId);
    if (isNaN(rolIdNum)) {
      return res.status(400).json({ 
        message: 'RolID debe ser un número válido' 
      });
    }

    const pool = await getConnection();
    if (!pool) {
      return res.status(503).json({ 
        message: 'Base de datos temporalmente no disponible' 
      });
    }

    let permisosActualizados = 0;
    let erroresEncontrados = [];

    for (const permiso of permisos) {
      const moduloId = permiso.moduloId || permiso.ModuloID;
      
      if (!moduloId && moduloId !== 0) {
        const error = `ModuloID faltante en permiso para ${permiso.NombreModulo || 'módulo desconocido'}`;
        console.error('❌', error);
        erroresEncontrados.push(error);
        continue;
      }

      const moduloIdNum = parseInt(moduloId);
      if (isNaN(moduloIdNum)) {
        const error = `ModuloID inválido: ${moduloId} para ${permiso.NombreModulo || 'módulo desconocido'}`;
        console.error('❌', error);
        erroresEncontrados.push(error);
        continue;
      }

      const estaVisible = Boolean(permiso.estaVisible || permiso.EstaVisible);
      const puedeVer = Boolean(permiso.puedeVer || permiso.PuedeVer);
      const puedeCrear = Boolean(permiso.puedeCrear || permiso.PuedeCrear);
      const puedeEditar = Boolean(permiso.puedeEditar || permiso.PuedeEditar);
      const puedeEliminar = Boolean(permiso.puedeEliminar || permiso.PuedeEliminar);

      console.log('🔄 Actualizando permiso:', {
        rolId: rolIdNum,
        moduloId: moduloIdNum,
        nombreModulo: permiso.NombreModulo,
        estaVisible,
        puedeVer,
        puedeCrear,
        puedeEditar,
        puedeEliminar
      });

      // ✅ CONSULTA CORREGIDA - Usar RolPermisos
      const query = `
        UPDATE RolPermisos 
        SET 
          EstaVisible = @estaVisible,
          PuedeVer = @puedeVer,
          PuedeCrear = @puedeCrear,
          PuedeEditar = @puedeEditar,
          PuedeEliminar = @puedeEliminar
        WHERE RolID = @rolId AND ModuloID = @moduloId
      `;

      try {
        const result = await pool.request()
          .input('estaVisible', sql.Bit, estaVisible)
          .input('puedeVer', sql.Bit, puedeVer)
          .input('puedeCrear', sql.Bit, puedeCrear)
          .input('puedeEditar', sql.Bit, puedeEditar)
          .input('puedeEliminar', sql.Bit, puedeEliminar)
          .input('rolId', sql.Int, rolIdNum)
          .input('moduloId', sql.Int, moduloIdNum)
          .query(query);

        if (result.rowsAffected[0] > 0) {
          permisosActualizados++;
          console.log(`✅ Permiso actualizado para módulo ${permiso.NombreModulo || moduloIdNum}`);
        } else {
          const error = `No se encontró el permiso para RolID=${rolIdNum}, ModuloID=${moduloIdNum}`;
          console.warn('⚠️', error);
          erroresEncontrados.push(error);
        }

      } catch (queryError) {
        const error = `Error actualizando permiso para módulo ${permiso.NombreModulo || moduloIdNum}: ${queryError.message}`;
        console.error('❌', error);
        erroresEncontrados.push(error);
      }
    }

    const response = {
      success: permisosActualizados > 0,
      message: permisosActualizados > 0 
        ? `${permisosActualizados} permisos actualizados correctamente`
        : 'No se pudo actualizar ningún permiso',
      permisosActualizados,
      totalPermisos: permisos.length
    };

    if (erroresEncontrados.length > 0) {
      response.errores = erroresEncontrados;
      response.message += `. Se encontraron ${erroresEncontrados.length} errores.`;
    }

    const statusCode = permisosActualizados > 0 ? 200 : 400;
    res.status(statusCode).json(response);

  } catch (error) {
    console.error('❌ Error actualizando permisos:', error);
    res.status(500).json({ 
      success: false, 
      message: `Error interno del servidor: ${error.message}` 
    });
  }
};

// Obtener todos los usuarios con sus roles
export const getUsuariosConRoles = async (req, res) => {
  try {
    const pool = await getConnection();
    if (!pool) {
      return res.status(503).json({ 
        message: 'Base de datos temporalmente no disponible' 
      });
    }

    const result = await pool.request()
      .query(`
        SELECT 
          u.UsuarioID,
          u.Username,
          u.Email,
          u.Rol,
          u.Estado,
          u.EmpleadoID,
          e.NOMBRE,
          e.APELLIDO,
          u.UltimoLogin,
          u.FechaCreacion
        FROM Usuarios u
        LEFT JOIN Empleados e ON u.EmpleadoID = e.EmpleadoID
        ORDER BY u.Username
      `);

    res.json({
      success: true,
      usuarios: result.recordset
    });

  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ 
      message: 'Error obteniendo usuarios' 
    });
  }
};

// Actualizar rol de un usuario
export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { nuevoRol } = req.body;

    if (!userId || !nuevoRol) {
      return res.status(400).json({ 
        message: 'UsuarioID y nuevo rol son requeridos' 
      });
    }

    const pool = await getConnection();
    if (!pool) {
      return res.status(503).json({ 
        message: 'Base de datos temporalmente no disponible' 
      });
    }

    // Verificar que el rol existe
    const rolResult = await pool.request()
      .input('rol', sql.VarChar(50), nuevoRol)
      .query('SELECT RolID FROM Roles WHERE NombreRol = @rol');

    if (rolResult.recordset.length === 0) {
      return res.status(400).json({ 
        message: 'El rol especificado no existe' 
      });
    }

    // Actualizar el rol del usuario
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .input('nuevoRol', sql.VarChar(50), nuevoRol)
      .query(`
        UPDATE Usuarios 
        SET Rol = @nuevoRol 
        WHERE UsuarioID = @userId
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ 
        message: 'Usuario no encontrado' 
      });
    }

    res.json({
      success: true,
      message: 'Rol actualizado correctamente'
    });

  } catch (error) {
    console.error('Error actualizando rol:', error);
    res.status(500).json({ 
      message: 'Error actualizando rol' 
    });
  }
};

// ======================================
// FUNCIONES PARA RECUPERACIÓN DE CONTRASEÑA
// ======================================
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        message: 'Email es requerido' 
      });
    }

    const pool = await getConnection();
    if (!pool) {
      return res.status(503).json({ 
        message: 'Base de datos temporalmente no disponible' 
      });
    }

    const result = await pool.request()
      .input('email', sql.VarChar(255), email.toLowerCase().trim())
      .query('SELECT UsuarioID, Email, Username FROM Usuarios WHERE LOWER(Email) = @email AND Estado = 1');

    if (result.recordset.length === 0) {
      return res.json({ 
        success: true,
        message: 'Si el email existe, se ha enviado un enlace de recuperación.' 
      });
    }

    const user = result.recordset[0];

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora

    await pool.request()
      .input('userId', sql.Int, user.UsuarioID)
      .input('resetToken', sql.VarChar(255), resetToken)
      .input('resetTokenExpiry', sql.DateTime, resetTokenExpiry)
      .query(`
        UPDATE Usuarios 
        SET ResetToken = @resetToken, ResetTokenExpiry = @resetTokenExpiry 
        WHERE UsuarioID = @userId
      `);

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
    
    const mailOptions = {
      to: user.Email,
      subject: 'Recuperación de Contraseña - RRHH System',
      html: `
        <h2>Recuperación de Contraseña</h2>
        <p>Hola ${user.Username},</p>
        <p>Recibimos una solicitud para restablecer tu contraseña. Si no fuiste tú, puedes ignorar este email.</p>
        <p>Para restablecer tu contraseña, haz clic en el siguiente enlace:</p>
        <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Restablecer Contraseña</a>
        <p>Este enlace expirará en 1 hora.</p>
        <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
        <p>${resetUrl}</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({ 
      success: true,
      message: 'Si el email existe, se ha enviado un enlace de recuperación.' 
    });

  } catch (error) {
    console.error('Error en forgot password:', error);
    res.status(500).json({ 
      message: 'Error procesando la solicitud' 
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ 
        message: 'Token y nueva contraseña son requeridos' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: 'La contraseña debe tener al menos 6 caracteres' 
      });
    }

    const pool = await getConnection();
    if (!pool) {
      return res.status(503).json({ 
        message: 'Base de datos temporalmente no disponible' 
      });
    }

    const result = await pool.request()
      .input('token', sql.VarChar(255), token)
      .query(`
        SELECT UsuarioID, ResetToken, ResetTokenExpiry 
        FROM Usuarios 
        WHERE ResetToken = @token AND ResetTokenExpiry > GETDATE() AND Estado = 1
      `);

    if (result.recordset.length === 0) {
      return res.status(400).json({ 
        message: 'Token inválido o expirado' 
      });
    }

    const user = result.recordset[0];
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await pool.request()
      .input('userId', sql.Int, user.UsuarioID)
      .input('hashedPassword', sql.VarChar(255), hashedPassword)
      .query(`
        UPDATE Usuarios 
        SET PasswordHash = @hashedPassword, ResetToken = NULL, ResetTokenExpiry = NULL
        WHERE UsuarioID = @userId
      `);

    res.json({ 
      success: true,
      message: 'Contraseña actualizada correctamente' 
    });

  } catch (error) {
    console.error('Error en reset password:', error);
    res.status(500).json({ 
      message: 'Error actualizando la contraseña' 
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: 'Contraseña actual y nueva contraseña son requeridas' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: 'La nueva contraseña debe tener al menos 6 caracteres' 
      });
    }

    const pool = await getConnection();
    if (!pool) {
      return res.status(503).json({ 
        message: 'Base de datos temporalmente no disponible' 
      });
    }

    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query('SELECT PasswordHash FROM Usuarios WHERE UsuarioID = @userId AND Estado = 1');

    if (result.recordset.length === 0) {
      return res.status(404).json({ 
        message: 'Usuario no encontrado' 
      });
    }

    const user = result.recordset[0];
    const validPassword = await bcrypt.compare(currentPassword, user.PasswordHash);
    if (!validPassword) {
      return res.status(400).json({ 
        message: 'Contraseña actual incorrecta' 
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await pool.request()
      .input('userId', sql.Int, userId)
      .input('hashedPassword', sql.VarChar(255), hashedPassword)
      .query('UPDATE Usuarios SET PasswordHash = @hashedPassword WHERE UsuarioID = @userId');

    res.json({ 
      success: true,
      message: 'Contraseña actualizada correctamente' 
    });

  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    res.status(500).json({ 
      message: 'Error actualizando la contraseña' 
    });
  }
};