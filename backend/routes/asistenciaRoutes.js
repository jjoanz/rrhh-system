import express from 'express';
import { getAsistencia } from '../controllers/asistenciaController.js';

const router = express.Router();
router.get('/list', getAsistencia);

export default router;
