// backend/routes/departamentosRoutes.js
import express from 'express';
import { authenticateToken } from '../middleware/auth.js'; // ✅ IMPORTAR
import { 
  getDepartamentos,
  createDepartamento,
  updateDepartamento,
  deleteDepartamento 
} from '../controllers/departamentosController.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/departamentos - Obtener todos
router.get('/', getDepartamentos);

// POST /api/departamentos - Crear nuevo
router.post('/', createDepartamento);

// PUT /api/departamentos/:id - Actualizar
router.put('/:id', updateDepartamento);

// DELETE /api/departamentos/:id - Eliminar
router.delete('/:id', deleteDepartamento);

export default router;