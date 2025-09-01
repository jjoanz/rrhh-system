import express from 'express';
import { getNomina } from '../controllers/nominaController.js';

const router = express.Router();
router.get('/list', getNomina);

export default router;
