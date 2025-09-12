import express from 'express';
import { 
  getRoles, 
  getModulos, 
  getPermisosByRol, 
  updatePermisos, 
  getUsuariosConRoles, 
  updateUserRole 
} from '../controllers/authController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// ======================================
// RUTAS PARA GESTIÓN DE ROLES Y PERMISOS
// Solo accesibles para admin y director_rrhh
// ======================================

// Obtener todos los roles
router.get('/roles', 
  authenticateToken, 
  requireRole(['admin', 'director_rrhh']), 
  getRoles
);

// Obtener todos los módulos
router.get('/modulos', 
  authenticateToken, 
  requireRole(['admin', 'director_rrhh']), 
  getModulos
);

// Obtener permisos de un rol específico
router.get('/permisos/:rolId', 
  authenticateToken, 
  requireRole(['admin', 'director_rrhh']), 
  getPermisosByRol
);

// Actualizar permisos de un rol
router.put('/permisos/:rolId', 
  authenticateToken, 
  requireRole(['admin', 'director_rrhh']), 
  updatePermisos
);

// ======================================
// RUTAS PARA GESTIÓN DE USUARIOS
// ======================================

// Obtener todos los usuarios con sus roles (compatible con frontend)
router.get('/usuarios', 
  authenticateToken, 
  requireRole(['admin', 'director_rrhh', 'gerente_rrhh']), 
  async (req, res) => {
    try {
      // Llamar a la función del controller pero mapear la respuesta para compatibilidad
      const originalSend = res.json;
      let responseSent = false;
      
      res.json = function(data) {
        if (!responseSent) {
          responseSent = true;
          // Mapear la respuesta para compatibilidad con el frontend
          if (data.success && data.usuarios) {
            const mappedData = {
              success: true,
              usuarios: data.usuarios.map(usuario => ({
                UsuarioID: usuario.UsuarioID,
                Username: usuario.Username,
                Email: usuario.Email,
                Rol: usuario.Rol,
                Estado: usuario.Estado,
                EmpleadoID: usuario.EmpleadoID,
                NOMBRE: usuario.NOMBRE,
                APELLIDO: usuario.APELLIDO,
                UltimoLogin: usuario.UltimoLogin,
                FechaCreacion: usuario.FechaCreacion
              }))
            };
            return originalSend.call(this, mappedData);
          }
          return originalSend.call(this, data);
        }
      };
      
      await getUsuariosConRoles(req, res);
    } catch (error) {
      console.error('Error en /usuarios:', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          success: false, 
          message: 'Error interno del servidor' 
        });
      }
    }
  }
);

// Actualizar rol de un usuario
router.put('/usuarios/:userId/rol', 
  authenticateToken, 
  requireRole(['admin', 'director_rrhh']), 
  updateUserRole
);

// ======================================
// RUTAS ADICIONALES PARA ADMINISTRACIÓN
// ======================================

// Endpoint de prueba para verificar conectividad
router.get('/health', 
  authenticateToken, 
  requireRole(['admin', 'director_rrhh']), 
  (req, res) => {
    res.json({
      success: true,
      message: 'Admin API funcionando correctamente',
      timestamp: new Date().toISOString(),
      user: {
        id: req.user.userId,
        rol: req.user.rol
      }
    });
  }
);

// Obtener estadísticas del sistema
router.get('/stats', 
  authenticateToken, 
  requireRole(['admin', 'director_rrhh']), 
  async (req, res) => {
    try {
      // Obtener estadísticas básicas
      const { getConnection } = await import('../db.js');
      const pool = await getConnection();
      
      if (!pool) {
        return res.status(503).json({
          success: false,
          message: 'Base de datos no disponible'
        });
      }

      // Contar usuarios activos
      const usersResult = await pool.request()
        .query('SELECT COUNT(*) as total FROM Usuarios WHERE Estado = 1');
      
      // Contar roles
      const rolesResult = await pool.request()
        .query('SELECT COUNT(*) as total FROM Roles');
      
      // Contar módulos
      const modulosResult = await pool.request()
        .query('SELECT COUNT(*) as total FROM Modulos');

      res.json({
        success: true,
        stats: {
          usuariosActivos: usersResult.recordset[0].total,
          totalRoles: rolesResult.recordset[0].total,
          totalModulos: modulosResult.recordset[0].total,
          fechaConsulta: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo estadísticas del sistema'
      });
    }
  }
);

export default router;