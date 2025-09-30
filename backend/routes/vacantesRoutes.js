// backend/routes/vacantesRoutes.js
import express from 'express';
import VacantesController from '../controllers/vacantesController.js';

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
router.post('/solicitudes', authenticateToken, authorizeRoles(['director', 'gerente', 'admin']), VacantesController.crearSolicitud);

// Rutas de aprobación por nivel jerárquico
router.post('/solicitudes/:id/aprobar-director-area', authenticateToken, authorizeRoles(['director', 'admin']), VacantesController.aprobarSolicitudDirectorArea);
router.post('/solicitudes/:id/aprobar-gerente-rrhh', authenticateToken, authorizeRoles(['gerente_rrhh', 'admin']), VacantesController.aprobarSolicitudGerenteRRHH);
router.post('/solicitudes/:id/aprobar-director-rrhh', authenticateToken, authorizeRoles(['director_rrhh', 'admin']), VacantesController.aprobarSolicitudDirectorRRHH);
router.post('/solicitudes/:id/asignar-responsable', authenticateToken, authorizeRoles(['director_rrhh', 'gerente_rrhh', 'admin']), VacantesController.asignarResponsablePublicacion);

// Rutas de publicación de vacante)
router.post('/solicitudes/:id/publicar', authenticateToken, authorizeRoles(['director_rrhh', 'gerente_rrhh', 'rrhh', 'admin']), VacantesController.publicarVacanteDesdeSolicitud);
// Rutas legacy (mantener compatibilidad)
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
// VACANTES - RUTAS GENERALES AL FINAL
// ===============================

// Listar todas las vacantes activas
router.get('/', VacantesController.getVacantesActivas);

// Obtener vacante por ID (debe ir antes de las rutas con parámetros dinámicos)
router.get('/:id', VacantesController.getVacanteById);

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