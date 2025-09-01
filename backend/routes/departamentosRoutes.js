import express from 'express';
import { getDepartamentos } from '../controllers/departamentosController.js';

const router = express.Router();

router.get('/list', getDepartamentos);

export default router;
