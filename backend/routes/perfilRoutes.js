import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  getPerfil,
  updatePerfil,
  cambiarPassword,
  getEstadisticas,
  subirFotoPerfil
} from '../controllers/perfilController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Configurar multer para subir fotos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'perfil-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif)'));
    }
  }
});

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener perfil completo
router.get('/', getPerfil);

// Obtener estadísticas
router.get('/estadisticas', getEstadisticas);

// Actualizar información personal
router.put('/', updatePerfil);

// Cambiar contraseña
router.put('/cambiar-password', cambiarPassword);

// Subir foto de perfil
router.post('/foto', upload.single('foto'), subirFotoPerfil);

export default router;