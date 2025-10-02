import express from 'express';
import PostulacionesController from '../controllers/postulacionesController.js';
import upload from '../config/multerConfig.js';

const router = express.Router();

// ===============================
// RUTAS PÚBLICAS (SIN AUTENTICACIÓN)
// ===============================

// Obtener vacantes públicas disponibles
router.get('/vacantes', PostulacionesController.getVacantesPublicas);

// Crear postulación con archivos
router.post(
  '/postular',
  upload.fields([
    { name: 'cv', maxCount: 1 },
    { name: 'fotoCedula', maxCount: 1 },
    { name: 'foto2x2', maxCount: 1 }
  ]),
  PostulacionesController.crearPostulacionPublica
);

// Manejo de errores
router.use((error, req, res, next) => {
  console.error('Error en rutas públicas de postulaciones:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'Archivo demasiado grande. Tamaño máximo: 5MB'
      });
    }
    return res.status(400).json({
      error: 'Error al subir archivo: ' + error.message
    });
  }
  
  res.status(500).json({ 
    error: 'Error al procesar la solicitud',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Algo salió mal'
  });
});

export default router;