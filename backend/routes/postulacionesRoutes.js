// backend/routes/postulacionesRoutes.js
import express from 'express';
import PostulacionesController from '../controllers/postulacionesController.js';

const router = express.Router();

// Middleware básico (ajusta según tu implementación de autenticación)
const authenticateToken = (req, res, next) => {
  // TODO: Implementar validación de token JWT real
  // Por ahora pasa directo para desarrollo
  next();
};

const authorizeRoles = (roles) => {
  return (req, res, next) => {
    // TODO: Implementar validación de roles real
    // Por ahora pasa directo para desarrollo
    next();
  };
};

// ===============================
// RUTAS ESPECÍFICAS PRIMERO
// ===============================

// Obtener estadísticas de postulaciones
router.get('/estadisticas', 
  authenticateToken, 
  authorizeRoles(['rrhh', 'gerente_rrhh', 'director_rrhh', 'admin']), 
  PostulacionesController.getEstadisticasPostulaciones
);

// ===============================
// RUTAS DE POSTULACIONES
// ===============================

// Obtener todas las postulaciones (con filtros por query params)
router.get('/', 
  authenticateToken, 
  PostulacionesController.getPostulaciones
);

// Obtener postulación por ID
router.get('/:id', 
  authenticateToken, 
  PostulacionesController.getPostulacionById
);

// Crear nueva postulación (público o autenticado)
router.post('/', 
  PostulacionesController.crearPostulacion
);

// Actualizar postulación completa (solo RRHH)
router.put('/:id', 
  authenticateToken, 
  authorizeRoles(['rrhh', 'gerente_rrhh', 'director_rrhh', 'admin']), 
  PostulacionesController.actualizarPostulacion
);

// Cambiar estado de postulación
router.put('/:id/estado', 
  authenticateToken, 
  authorizeRoles(['rrhh', 'gerente_rrhh', 'director_rrhh', 'admin']), 
  PostulacionesController.cambiarEstadoPostulacion
);

// Calificar postulación
router.put('/:id/calificar', 
  authenticateToken, 
  authorizeRoles(['rrhh', 'gerente_rrhh', 'director_rrhh', 'admin']), 
  PostulacionesController.calificarPostulacion
);

// Eliminar postulación (solo admin)
router.delete('/:id', 
  authenticateToken, 
  authorizeRoles(['admin']), 
  PostulacionesController.eliminarPostulacion
);

// ===============================
// MANEJO DE ERRORES
// ===============================

router.use((error, req, res, next) => {
  console.error('Error en rutas de postulaciones:', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method
  });
  
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Algo salió mal',
    timestamp: new Date().toISOString()
  });
});

export default router;