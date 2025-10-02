import express from 'express';
import VacacionesController from '../controllers/vacacionesController.js';

const router = express.Router();

// Middleware básico de autenticación
const authenticateToken = (req, res, next) => {
  // Por ahora pasa sin validación, ajusta según tu sistema de auth
  next();
};

const authorizeRoles = (roles) => {
  return (req, res, next) => {
    // Validación de roles si es necesario
    next();
  };
};

// ===============================
// RUTAS DE SOLICITUDES DE VACACIONES
// ===============================

// Obtener solicitudes según rol y jerarquía
// GET /api/vacaciones?usuarioID=123&rol=gerente
router.get(
  '/', 
  authenticateToken, 
  VacacionesController.getSolicitudes
);

// Crear nueva solicitud de vacaciones
// POST /api/vacaciones
router.post(
  '/', 
  authenticateToken, 
  VacacionesController.crearSolicitud
);

// Procesar solicitud (aprobar/rechazar)
// PUT /api/vacaciones/:id/procesar
router.put(
  '/:id/procesar', 
  authenticateToken, 
  VacacionesController.procesarSolicitud
);

// Obtener detalles de una solicitud específica
// GET /api/vacaciones/:id
router.get(
  '/:id', 
  authenticateToken, 
  VacacionesController.getSolicitudById
);

// Obtener estadísticas de vacaciones del empleado
// GET /api/vacaciones/estadisticas/:empleadoId
router.get(
  '/estadisticas/:empleadoId', 
  authenticateToken, 
  VacacionesController.getEstadisticas
);

// ===============================
// MANEJO DE ERRORES
// ===============================

router.use((error, req, res, next) => {
  console.error('Error en rutas de vacaciones:', error);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Algo salió mal'
  });
});

export default router;