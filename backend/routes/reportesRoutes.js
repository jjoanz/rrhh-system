// routes/reportes.js
import express from 'express';
import { 
  getPredefinidos, 
  ejecutarQuery, 
  exportarReporte, 
  getMetadata,
  verificarToken 
} from '../controllers/reportesController.js';

const router = express.Router();

// ===================== APLICAR MIDDLEWARE DE AUTENTICACIÓN =====================
// Todas las rutas de reportes requieren autenticación
router.use(verificarToken);

// ===================== RUTAS =====================

// GET /api/reportes/metadata - Obtener estructura de la base de datos
router.get('/metadata', getMetadata);

// GET /api/reportes/predefinidos/:tipo - Reportes predefinidos
router.get('/predefinidos/:tipo', getPredefinidos);

// POST /api/reportes/custom - Ejecutar SQL personalizado
router.post('/custom', ejecutarQuery);

// POST /api/reportes/export - Exportar reportes
router.post('/export', exportarReporte);

// ===================== RUTA DE PRUEBA =====================
// Ruta para verificar que la autenticación funciona
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Autenticación exitosa', 
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

export default router;
