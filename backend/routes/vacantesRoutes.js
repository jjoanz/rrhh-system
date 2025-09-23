// backend/routes/vacantesRoutes.js
import express from 'express';
import sql from 'mssql';
import VacantesController from '../controllers/VacantesController.js';

const router = express.Router();

// Middleware básico
const authenticateToken = (req, res, next) => {
  next();
};

const authorizeRoles = (roles) => {
  return (req, res, next) => {
    next();
  };
};

// ===============================
// RUTAS ESPECÍFICAS PRIMERO
// ===============================

// Health check
router.get('/health', VacantesController.healthCheck);

// Estadísticas
router.get('/estadisticas', authenticateToken, VacantesController.getEstadisticas);

// Búsqueda con filtros
router.get('/buscar', VacantesController.buscarVacantes);

// Departamentos
router.get('/departamentos', VacantesController.getDepartamentos);

// Usuarios
router.get('/usuarios', authenticateToken, VacantesController.getUsuarios);

// ===============================
// SOLICITUDES
// ===============================

router.get('/solicitudes', authenticateToken, VacantesController.getSolicitudes);
router.post('/solicitudes', authenticateToken, authorizeRoles(['director', 'admin']), VacantesController.crearSolicitud);
router.put('/solicitudes/:id/aprobar', authenticateToken, authorizeRoles(['rrhh', 'admin']), VacantesController.aprobarSolicitud);
router.put('/solicitudes/:id/rechazar', authenticateToken, authorizeRoles(['rrhh', 'admin']), VacantesController.rechazarSolicitud);

// ===============================
// POSTULACIONES
// ===============================

router.get('/postulaciones', authenticateToken, VacantesController.getPostulaciones);
router.post('/postulaciones', VacantesController.crearPostulacion);
router.put('/postulaciones/:id/estado', authenticateToken, authorizeRoles(['rrhh', 'admin']), VacantesController.cambiarEstadoPostulacion);

// ===============================
// REPORTES
// ===============================

router.get('/reportes/resumen', authenticateToken, authorizeRoles(['rrhh', 'admin']), VacantesController.getReportesResumen);
router.post('/reportes/exportar', authenticateToken, authorizeRoles(['rrhh', 'admin']), VacantesController.exportarReporte);

// ===============================
// VACANTES GENERALES (AL FINAL)
// ===============================

// Listar todas las vacantes
router.get('/', VacantesController.getVacantesActivas);

// Crear nueva vacante
router.post('/', authenticateToken, authorizeRoles(['rrhh', 'admin']), VacantesController.crearVacante);

// ===============================
// MANEJO DE ERRORES
// ===============================

router.use((error, req, res, next) => {
  console.error('Error en rutas de vacantes:', error);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Algo salió mal'
  });
});

export default router;