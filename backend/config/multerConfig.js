// backend/config/multerConfig.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Crear carpeta uploads si no existe
const uploadsDir = path.join(__dirname, '../uploads/postulaciones');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuración de almacenamiento en disco
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generar nombre único para evitar conflictos
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const fieldName = file.fieldname;
    const sanitizedName = `${fieldName}-${uniqueSuffix}${ext}`;
    cb(null, sanitizedName);
  }
});

// Filtro de tipos de archivo permitidos
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    'cv': ['.pdf', '.doc', '.docx'],
    'fotoCedula': ['.jpg', '.jpeg', '.png', '.pdf'],
    'foto2x2': ['.jpg', '.jpeg', '.png']
  };

  const ext = path.extname(file.originalname).toLowerCase();
  const fieldName = file.fieldname;

  // Verificar si el tipo de archivo es permitido
  if (allowedTypes[fieldName] && allowedTypes[fieldName].includes(ext)) {
    cb(null, true);
  } else {
    const allowedExts = allowedTypes[fieldName]?.join(', ') || 'ninguno';
    cb(new Error(`Tipo de archivo no permitido para ${fieldName}. Tipos permitidos: ${allowedExts}`));
  }
};

// Límites de tamaño
const limits = {
  fileSize: 5 * 1024 * 1024, // 5MB máximo por archivo
  files: 3 // Máximo 3 archivos totales
};

// Configuración principal de Multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: limits
});

export default upload;