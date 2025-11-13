import express from 'express';
import VacacionesController from '../controllers/vacacionesController.js';

const router = express.Router();

// Middleware básico de autenticación
const authenticateToken = (req, res, next) => {
  next();
};

const authorizeRoles = (roles) => {
  return (req, res, next) => {
    next();
  };
};

// ===============================
// RUTAS DE SOLICITUDES DE VACACIONES
// ===============================

// 1️⃣ Obtener solicitudes según rol y jerarquía
// GET /api/vacaciones?usuarioID=123&rol=gerente
router.get(
  '/', 
  authenticateToken, 
  VacacionesController.getSolicitudes
);

// 2️⃣ Obtener estadísticas detalladas con períodos
// GET /api/vacaciones/estadisticas-detalladas/:empleadoId
// ⚠️ DEBE IR ANTES DE /:id PARA NO CHOCAR
router.get(
  '/estadisticas-detalladas/:empleadoId', 
  authenticateToken, 
  VacacionesController.getEstadisticasDetalladas
);


// 3️⃣ NUEVA - Crear solicitud CON selección de períodos
// POST /api/vacaciones/con-periodos
// ⚠️ DEBE IR ANTES DE POST / PARA NO CHOCAR
router.post(
  '/con-periodos', 
  authenticateToken, 
  VacacionesController.crearSolicitudConPeriodos
);

// 4️⃣ NUEVA - Aprobar solicitud (sin ID en URL)
// POST /api/vacaciones/aprobar
// ⚠️ CAMBIADO: Antes era /:solicitudID/aprobar
router.post(
  '/aprobar', 
  authenticateToken, 
  VacacionesController.aprobarSolicitud
);

// 5️⃣ Crear solicitud simple (sin períodos)
// POST /api/vacaciones
router.post(
  '/', 
  authenticateToken, 
  VacacionesController.crearSolicitud
);

// 6️⃣ Obtener detalles de una solicitud específica
// GET /api/vacaciones/:id
// ⚠️ DEBE ESTAR AL FINAL SIEMPRE
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