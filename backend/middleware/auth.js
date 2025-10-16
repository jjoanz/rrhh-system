import jwt from 'jsonwebtoken';
import { getConnection } from '../db.js';
import sql from 'mssql';

// ======================================
// FUNCIÓN PARA OBTENER PERMISOS DE USUARIO
// ======================================
export const getUserPermissions = async (userId) => {
  try {
    const pool = await getConnection();
    if (!pool) throw new Error('No se pudo conectar a la base de datos');

    // Obtener el rol del usuario
    const userResult = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT Rol, UsuarioID
        FROM Usuarios 
        WHERE UsuarioID = @userId AND Estado = 1
      `);

    if (userResult.recordset.length === 0) {
      return [];
    }

    const user = userResult.recordset[0];

    // Obtener RolID basado en el nombre del rol
    const roleResult = await pool.request()
      .input('rolName', sql.NVarChar, user.Rol)
      .query(`
        SELECT RolID 
        FROM Roles 
        WHERE NombreRol = @rolName
      `);

    if (roleResult.recordset.length === 0) {
      console.warn(`Rol '${user.Rol}' no encontrado en tabla Roles`);
      return [];
    }

    const roleId = roleResult.recordset[0].RolID;

    // Obtener permisos del rol
    const permissionsResult = await pool.request()
      .input('rolId', sql.Int, roleId)
      .query(`
        SELECT 
          rp.ModuloID,
          m.NombreModulo,
          rp.EstaVisible,
          rp.PuedeVer,
          rp.PuedeCrear,
          rp.PuedeEditar,
          rp.PuedeEliminar
        FROM RolPermisos rp
        INNER JOIN Modulos m ON rp.ModuloID = m.ModuloID
        WHERE rp.RolID = @rolId
      `);

    return permissionsResult.recordset;
  } catch (error) {
    console.error('Error obteniendo permisos de usuario:', error);
    return [];
  }
};

// ======================================
// MIDDLEWARE DE AUTENTICACIÓN PRINCIPAL
// ======================================
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('🔍 Auth Header:', authHeader ? 'Presente' : 'Ausente');
  console.log('🎫 Token extraído:', token ? `${token.substring(0, 20)}...` : 'No hay token');

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Token requerido' 
    });
  }

  // Verificar que el token no esté vacío
  if (!token.trim()) {
    return res.status(401).json({ 
      success: false,
      message: 'Token inválido (vacío)' 
    });
  }

  try {
    // Verificar token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu-secret-key');
    console.log('✅ Token decodificado correctamente para userId:', decoded.userId);

    // Conectar a la base de datos
    const pool = await getConnection();
    if (!pool) {
      return res.status(503).json({ 
        success: false,
        message: 'Base de datos no disponible' 
      });
    }

    // Consultar usuario activo
    const result = await pool.request()
      .input('userId', sql.Int, decoded.userId)
      .query(`
        SELECT UsuarioID, Username, Email, Rol, EmpleadoID 
        FROM Usuarios 
        WHERE UsuarioID = @userId AND Estado = 1
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ 
        success: false,
        message: 'Usuario no válido o inactivo' 
      });
    }

    const user = result.recordset[0];
    console.log('👤 Usuario autenticado:', user.Username, '| Rol:', user.Rol);

    // Obtener permisos del usuario
    const permisos = await getUserPermissions(user.UsuarioID);

    // Guardar info del usuario en req.user
    // ✅ CAMBIO PRINCIPAL: Agregar usuarioId además de userId
    req.user = {
      usuarioId: user.UsuarioID,    // ✅ Campo que espera accionesPersonalController
      userId: user.UsuarioID,       // ✅ Mantener para compatibilidad con otros controllers
      username: user.Username,
      email: user.Email,
      rol: user.Rol,
      empleadoId: user.EmpleadoID,
      permisos: permisos
    };

    console.log('🔍 req.user configurado con usuarioId:', req.user.usuarioId);

    next();
  } catch (error) {
    console.error('❌ Error en authenticateToken:', error.name, '|', error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado',
        expiredAt: error.expiredAt
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ 
        success: false,
        message: 'Token malformado o inválido',
        error: error.message
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Error interno de autenticación',
      error: error.message
    });
  }
};

// ======================================
// MIDDLEWARE PARA PERMISOS ESPECÍFICOS
// ======================================
export const requirePermission = (moduleName, action = 'PuedeVer') => {
  return (req, res, next) => {
    if (!req.user || !req.user.permisos) {
      return res.status(401).json({ 
        success: false,
        message: 'Usuario no autenticado' 
      });
    }

    // Buscar permiso del módulo
    const modulePermission = req.user.permisos.find(
      p => p.NombreModulo.toLowerCase() === moduleName.toLowerCase()
    );

    // Verificar si tiene el permiso requerido
    if (!modulePermission || 
        !modulePermission.EstaVisible || 
        !modulePermission[action]) {
      return res.status(403).json({ 
        success: false,
        message: `No tienes permisos para ${action} en ${moduleName}`,
        requiredPermission: { 
          module: moduleName, 
          action: action,
          userRole: req.user.rol
        }
      });
    }

    // Agregar permisos específicos al request para uso posterior
    req.modulePermissions = modulePermission;
    next();
  };
};

// ======================================
// MIDDLEWARE PARA CONTROL DE ROLES
// ======================================
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Usuario no autenticado' 
      });
    }

    const userRole = req.user.rol;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        success: false,
        message: 'No tienes permisos para este recurso',
        requiredRoles: allowedRoles,
        userRole: userRole
      });
    }

    next();
  };
};

// ======================================
// MIDDLEWARES ESPECÍFICOS POR ROL
// ======================================

// Solo administradores completos
export const requireAdmin = (req, res, next) => {
  return requireRole(['admin'])(req, res, next);
};

// Administradores y directores de RRHH
export const requireAdminOrHRDirector = (req, res, next) => {
  return requireRole(['admin', 'director_rrhh'])(req, res, next);
};

// Personal de RRHH (cualquier nivel)
export const requireHRStaff = (req, res, next) => {
  return requireRole(['admin', 'director_rrhh', 'gerente_rrhh', 'rrhh'])(req, res, next);
};

// Directores y gerentes
export const requireManagement = (req, res, next) => {
  return requireRole(['admin', 'director_rrhh', 'gerente_rrhh', 'director', 'gerente'])(req, res, next);
};

// ======================================
// MIDDLEWARE PARA VERIFICAR PROPIEDAD
// ======================================
export const requireOwnership = (req, res, next) => {
  const resourceEmployeeId = req.params.empleadoId || req.body.empleadoId;
  const userEmployeeId = req.user.empleadoId;
  const userRole = req.user.rol;

  // Admins y personal de RRHH pueden acceder a todo
  if (['admin', 'director_rrhh', 'gerente_rrhh', 'rrhh'].includes(userRole)) {
    return next();
  }

  // Los usuarios solo pueden acceder a sus propios datos
  if (resourceEmployeeId && userEmployeeId && 
      parseInt(resourceEmployeeId) === parseInt(userEmployeeId)) {
    return next();
  }

  return res.status(403).json({ 
    success: false,
    message: 'Solo puedes acceder a tu propia información' 
  });
};

// ======================================
// UTILIDADES PARA CONTROLLERS
// ======================================
export const getVisibleModules = (req) => {
  if (!req.user || !req.user.permisos) return [];
  
  return req.user.permisos
    .filter(p => p.EstaVisible && p.PuedeVer)
    .map(p => ({
      modulo: p.NombreModulo,
      permisos: {
        ver: p.PuedeVer,
        crear: p.PuedeCrear,
        editar: p.PuedeEditar,
        eliminar: p.PuedeEliminar
      }
    }));
};

export const canPerformAction = (req, moduleName, action) => {
  if (!req.user || !req.user.permisos) return false;
  
  const modulePermission = req.user.permisos.find(
    p => p.NombreModulo.toLowerCase() === moduleName.toLowerCase()
  );
  
  return modulePermission && 
         modulePermission.EstaVisible && 
         modulePermission[action];
};