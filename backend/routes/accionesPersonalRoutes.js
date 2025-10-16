import express from 'express';
import { 
  getAcciones,
  getAccionById,
  crearAccion,
  actualizarAccion,
  aprobarAccion,
  rechazarAccion,
  ejecutarAccion,
  eliminarAccion,
  getHistorialEmpleado,
  getAccionesPendientes,
  getEstadisticas,
  getTiposAccion,
  getDocumentosAccion,
  subirDocumento
} from '../controllers/accionesPersonalController.js';
import { authenticateToken } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Configuración de Multer para documentos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/acciones-personal/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'accion-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB máximo
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF, Word e imágenes'));
    }
  }
});

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener todas las acciones (con filtros)
router.get('/', getAcciones);

// Obtener estadísticas del dashboard
router.get('/estadisticas', getEstadisticas);

// Obtener tipos de acción disponibles
router.get('/tipos', getTiposAccion);

// Obtener acciones pendientes de aprobación
router.get('/pendientes', getAccionesPendientes);

// Obtener historial de un empleado
router.get('/historial/:empleadoId', getHistorialEmpleado);

// Obtener una acción específica
router.get('/:id', getAccionById);

// Crear nueva acción
router.post('/', crearAccion);

// Subir documentos a una acción
router.post('/:id/documentos', upload.single('documento'), subirDocumento);

// Obtener documentos de una acción
router.get('/:id/documentos', getDocumentosAccion);

// Actualizar acción (solo si está pendiente)
router.put('/:id', actualizarAccion);

// Aprobar acción
router.post('/:id/aprobar', aprobarAccion);

// Rechazar acción
router.post('/:id/rechazar', rechazarAccion);

// Ejecutar acción (aplicar cambios)
router.post('/:id/ejecutar', ejecutarAccion);

// Eliminar acción
router.delete('/:id', eliminarAccion);

export default router;