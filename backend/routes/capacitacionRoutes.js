import express from 'express';
import { getCapacitaciones } from '../controllers/capacitacionController.js';

const router = express.Router();
router.get('/list', getCapacitaciones);

export default router;
