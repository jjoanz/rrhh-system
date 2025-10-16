// backend/routes/departamentos.js
import express from 'express';
import { getDepartamentos } from '../controllers/departamentosController.js';

const router = express.Router();

// ✅ Solo '/' porque el authenticateToken ya está en server.js
router.get('/', getDepartamentos);

export default router;