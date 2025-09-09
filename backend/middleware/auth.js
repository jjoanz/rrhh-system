import jwt from 'jsonwebtoken';
import { poolPromise } from '../db.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token requerido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu-secret-key');
    
    // Verificar que el usuario existe y está activo
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', decoded.userId)
      .query('SELECT UsuarioID, Username, Rol, EmpleadoID FROM Usuarios WHERE UsuarioID = @userId AND Estado = 1');

    if (result.recordset.length === 0) {
      return res.status(401).json({ message: 'Usuario no válido' });
    }

    req.user = {
      userId: decoded.userId,
      rol: decoded.rol,
      empleadoId: decoded.empleadoId
    };
    
    next();
  } catch (error) {
    res.status(403).json({ message: 'Token inválido' });
  }
};