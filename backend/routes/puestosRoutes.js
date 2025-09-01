import express from 'express';
import { getPuestos } from '../controllers/puestosController.js';

const router = express.Router();

router.get('/list', getPuestos);

export default router;
