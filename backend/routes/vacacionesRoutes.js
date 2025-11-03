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

// IMPORTANTE: Rutas específicas ANTES de rutas con parámetros

// Obtener estadísticas detalladas con períodos
// GET /api/vacaciones/estadisticas-detalladas/:empleadoId
router.get(
  '/estadisticas-detalladas/:empleadoId', 
  authenticateToken, 
  VacacionesController.getEstadisticasDetalladas
);

// Crear nueva solicitud de vacaciones
// POST /api/vacaciones
router.post(
  '/', 
  authenticateToken, 
  VacacionesController.crearSolicitud
);

// Procesar solicitud (aprobar/rechazar)
// POST /api/vacaciones/:solicitudID/aprobar
router.post(
  '/:solicitudID/aprobar', 
  authenticateToken, 
  VacacionesController.aprobarSolicitud
);

// Obtener detalles de una solicitud específica
// GET /api/vacaciones/:id
// NOTA: Esta ruta DEBE estar al final para evitar conflictos
router.get(
  '/:id', 
  authenticateToken, 
  VacacionesController.getSolicitudById
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