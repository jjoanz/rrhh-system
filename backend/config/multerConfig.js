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

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const fieldName = file.fieldname;
    cb(null, `${fieldName}-${uniqueSuffix}${ext}`);
  }
});

// Filtro de archivos
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    'cv': ['.pdf', '.doc', '.docx'],
    'fotoCedula': ['.jpg', '.jpeg', '.png', '.pdf'],
    'foto2x2': ['.jpg', '.jpeg', '.png']
  };

  const ext = path.extname(file.originalname).toLowerCase();
  const fieldName = file.fieldname;

  if (allowedTypes[fieldName] && allowedTypes[fieldName].includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido para ${fieldName}. Permitidos: ${allowedTypes[fieldName]?.join(', ')}`));
  }
};

// Límites
const limits = {
  fileSize: 5 * 1024 * 1024 // 5MB
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: limits
});

export default upload;