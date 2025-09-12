import express from 'express';
import { 
  login, 
  verifyToken, 
  forgotPassword, 
  resetPassword,
  changePassword,
  getUserPermissions,
  getUsuariosConRoles
} from '../controllers/authController.js';
import { 
  authenticateToken, 
  requireAdmin,
  getVisibleModules 
} from '../middleware/auth.js';

const router = express.Router();

// ======================================
// RUTAS PÚBLICAS
// ======================================
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// ======================================
// RUTAS PROTEGIDAS
// ======================================
router.get('/verify', authenticateToken, verifyToken);

// ======================================
// RUTAS DE INFORMACIÓN DEL USUARIO
// ======================================

// Obtener permisos del usuario actual
router.get('/mis-permisos', authenticateToken, async (req, res) => {
  try {
    const modulosVisibles = getVisibleModules(req);
    
    res.json({
      success: true,
      permisos: req.user.permisos,
      modulosVisibles: modulosVisibles,
      rol: req.user.rol,
      usuario: {
        id: req.user.userId,
        username: req.user.username,
        email: req.user.email
      }
    });
  } catch (error) {
    console.error('Error obteniendo permisos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener información del usuario actual
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user.userId,
        username: req.user.username,
        email: req.user.email,
        rol: req.user.rol,
        empleadoId: req.user.empleadoId
      }
    });
  } catch (error) {
    console.error('Error obteniendo información del usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Cambiar contraseña (usando la función del authController)
router.put('/change-password', authenticateToken, changePassword);

// ======================================
// RUTAS DE ADMINISTRACIÓN
// ======================================

// Obtener todos los usuarios (usando authController)
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Redirigir a la función del authController pero mapear la respuesta
    const result = await getUsuariosConRoles(req, res);
    
    // Si la respuesta ya fue enviada, no hacer nada más
    if (res.headersSent) {
      return;
    }
    
    // Si hay algún problema, manejarlo aquí
    res.status(500).json({ message: 'Error procesando usuarios' });
  } catch (error) {
    if (!res.headersSent) {
      console.error('Error obteniendo usuarios:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
});

// Crear usuario simplificado (solo admin)
router.post('/register', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { username, email, password, role, empleadoId } = req.body;

    // Validaciones básicas
    if (!username || !email || !password) {
      return res.status(400).json({ 
        message: 'Username, email y contraseña son requeridos' 
      });
    }

    // Importar funciones necesarias dinámicamente para evitar errores circulares
    const { createUser, findUserByEmail, findUserByUsername } = await import('../models/User.js');

    // Verificar si el usuario ya existe
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'El email ya está registrado' });
    }

    const existingUsername = await findUserByUsername(username);
    if (existingUsername) {
      return res.status(400).json({ message: 'El username ya está en uso' });
    }

    // Crear usuario
    const newUser = await createUser({
      username,
      email,
      password,
      role: role || 'colaborador',
      empleadoId
    });

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      user: {
        id: newUser.UsuarioID,
        username: newUser.Username,
        email: newUser.Email,
        rol: newUser.Rol
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Actualizar usuario (básico)
router.put('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { username, email, role, estado } = req.body;

    if (!username || !email || !role) {
      return res.status(400).json({ 
        message: 'Username, email y rol son requeridos' 
      });
    }

    // Importar función dinámicamente
    const { updateUser } = await import('../models/User.js');
    
    const success = await updateUser(userId, {
      username,
      email,
      role,
      estado: estado !== undefined ? estado : 1
    });
    
    if (success) {
      res.json({
        success: true,
        message: 'Usuario actualizado exitosamente'
      });
    } else {
      res.status(404).json({ message: 'Usuario no encontrado' });
    }
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Eliminar usuario (soft delete)
router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // No permitir que el admin se elimine a sí mismo
    if (userId === req.user.userId) {
      return res.status(400).json({ 
        message: 'No puedes eliminar tu propia cuenta' 
      });
    }

    // Importar función dinámicamente
    const { deleteUser } = await import('../models/User.js');
    
    const success = await deleteUser(userId);
    
    if (success) {
      res.json({
        success: true,
        message: 'Usuario eliminado exitosamente'
      });
    } else {
      res.status(404).json({ message: 'Usuario no encontrado' });
    }
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

export default router;