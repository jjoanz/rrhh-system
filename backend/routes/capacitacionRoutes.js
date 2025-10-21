import express from 'express';
import * as capacitacionController from '../controllers/capacitacionController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ==========================================
// MIDDLEWARE DE AUTORIZACIÓN
// ==========================================

// Verificar si puede crear solicitudes (todos excepto RRHH)
const puedeCrearSolicitudes = (req, res, next) => {
  const rolesRRHH = ['rrhh', 'director_rrhh', 'gerente_rrhh'];
  if (rolesRRHH.includes(req.user.rol)) {
    return res.status(403).json({ 
      success: false, 
      message: 'RRHH no puede crear solicitudes. Debe crear cursos disponibles.' 
    });
  }
  next();
};

// Verificar si puede crear cursos (solo RRHH y Admin)
const puedeCrearCursos = (req, res, next) => {
  const rolesPermitidos = ['rrhh', 'director_rrhh', 'gerente_rrhh', 'admin'];
  if (!rolesPermitidos.includes(req.user.rol)) {
    return res.status(403).json({ 
      success: false, 
      message: 'Solo RRHH y Administradores pueden gestionar cursos' 
    });
  }
  next();
};

// Verificar si puede aprobar solicitudes
const puedeAprobar = (req, res, next) => {
  const rolesPermitidos = ['gerente', 'director', 'rrhh', 'director_rrhh', 'gerente_rrhh', 'admin'];
  if (!rolesPermitidos.includes(req.user.rol)) {
    return res.status(403).json({ 
      success: false, 
      message: 'No tienes permisos para aprobar solicitudes' 
    });
  }
  next();
};

// Verificar si es RRHH
const esRRHH = (req, res, next) => {
  const rolesRRHH = ['rrhh', 'director_rrhh', 'gerente_rrhh', 'admin'];
  if (!rolesRRHH.includes(req.user.rol)) {
    return res.status(403).json({ 
      success: false, 
      message: 'Solo RRHH tiene acceso a esta funcionalidad' 
    });
  }
  next();
};

// ==========================================
// RUTAS DE SOLICITUDES DE CAPACITACIÓN
// ==========================================

// Crear nueva solicitud (todos menos RRHH)
router.post('/solicitudes', authenticateToken, puedeCrearSolicitudes, capacitacionController.crearSolicitud);

router.post('/cursos-disponibles/:id/inscribir-empleados', authenticateToken, capacitacionController.inscribirEmpleadosManualmente);

// Obtener MIS solicitudes
router.get('/solicitudes/mis-solicitudes', authenticateToken, capacitacionController.obtenerMisSolicitudes);

// Obtener solicitudes PENDIENTES de aprobar según mi rol
router.get('/solicitudes/pendientes', authenticateToken, puedeAprobar, capacitacionController.obtenerSolicitudesPendientes);

// Obtener TODAS las solicitudes (histórico)
router.get('/solicitudes/todas', authenticateToken, puedeAprobar, capacitacionController.obtenerTodasSolicitudes);
// Para colaboradores y todos
router.get('/mis-capacitaciones', authenticateToken, capacitacionController.obtenerMisCapacitaciones);

// Para RRHH ver participantes
router.get('/:id/participantes', authenticateToken, esRRHH, capacitacionController.obtenerParticipantes);
// Ver detalle de solicitud con comentarios
router.get('/solicitudes/:id', authenticateToken, capacitacionController.obtenerDetalleSolicitud);

// Aprobar solicitud
router.put('/solicitudes/:id/aprobar', authenticateToken, puedeAprobar, capacitacionController.aprobarSolicitud);

// Rechazar solicitud
router.put('/solicitudes/:id/rechazar', authenticateToken, puedeAprobar, capacitacionController.rechazarSolicitud);



// ==========================================
// RUTAS DE CURSOS DISPONIBLES
// ==========================================

// Obtener todos los cursos disponibles (todos pueden ver)
router.get('/cursos-disponibles', authenticateToken, capacitacionController.obtenerCursosDisponibles);

// Crear nuevo curso (solo RRHH y Admin)
router.post('/cursos-disponibles', authenticateToken, puedeCrearCursos, capacitacionController.crearCurso);

// Editar curso (solo RRHH y Admin)
router.put('/cursos-disponibles/:id', authenticateToken, puedeCrearCursos, capacitacionController.editarCurso);

// Eliminar curso (solo RRHH y Admin)
router.delete('/cursos-disponibles/:id', authenticateToken, puedeCrearCursos, capacitacionController.eliminarCurso);

// ==========================================
// RUTAS DE INSCRIPCIONES A CURSOS
// ==========================================

// Inscribirse a un curso disponible (todos)
router.post('/inscripciones', authenticateToken, capacitacionController.inscribirseCurso);

// Obtener MIS cursos inscritos
router.get('/inscripciones/mis-cursos', authenticateToken, capacitacionController.obtenerMisCursos);

// Actualizar progreso de curso
router.put('/inscripciones/:id/progreso', authenticateToken, capacitacionController.actualizarProgreso);

// ==========================================
// RUTAS DE CERTIFICADOS
// ==========================================

// Obtener MIS certificados
router.get('/certificados/mis-certificados', authenticateToken, capacitacionController.obtenerMisCertificados);

// Descargar certificado
router.get('/certificados/:id/descargar', authenticateToken, capacitacionController.descargarCertificado);

// Crear certificado manual (solo RRHH)
router.post('/certificados', authenticateToken, esRRHH, capacitacionController.crearCertificado);

// ==========================================
// RUTAS DE ESTADÍSTICAS Y DASHBOARD
// ==========================================

// Obtener estadísticas según rol
router.get('/estadisticas', authenticateToken, capacitacionController.obtenerEstadisticas);

// Obtener progreso del equipo (Gerente/Director)
router.get('/progreso-equipo', authenticateToken, capacitacionController.obtenerProgresoEquipo);

// Obtener progreso global (RRHH)
router.get('/progreso-global', authenticateToken, esRRHH, capacitacionController.obtenerProgresoGlobal);

// ==========================================
// RUTA PARA OBTENER TODOS LOS EMPLEADOS
// ==========================================
router.get('/usuarios/empleados', authenticateToken, esRRHH, capacitacionController.obtenerEmpleados);


export default router;