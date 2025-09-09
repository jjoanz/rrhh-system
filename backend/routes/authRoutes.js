import express from 'express';
import { login, verifyToken, forgotPassword, resetPassword } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Rutas protegidas
router.get('/verify', authenticateToken, verifyToken);

export default router;
