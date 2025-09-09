import express from 'express';
import { poolPromise } from './db.js';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import fs from 'fs';

// ✅ Importar las rutas de los módulos
import nominaRoutes from './routes/nominaRoutes.js';
import empleadosRoutes from './routes/empleadosRoutes.js';
import capacitacionRoutes from './routes/capacitacionRoutes.js';
import asistenciaRoutes from './routes/asistenciaRoutes.js';
import departamentosRoutes from './routes/departamentosRoutes.js';
import puestosRoutes from './routes/puestosRoutes.js';
import authRoutes from './routes/authRoutes.js';

// ✅ Importar middleware de autenticación
import { authenticateToken } from './middleware/auth.js';

// --- INICIALIZAR EXPRESS ---
const app = express();
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

const PORT = 5000;

// --- RUTAS DE AUTENTICACIÓN (SIN PROTECCIÓN) ---
app.use('/api/auth', authRoutes);

// --- RUTAS DE API PROTEGIDAS ---
app.get('/api/usuarios', authenticateToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT UsuarioID, Username, Email, Rol, Estado, UltimoLogin, FechaCreacion, EmpleadoID 
      FROM Usuarios
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- RUTA DE SALUD DEL SERVIDOR (SIN PROTECCIÓN) ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ✅ Conectar los módulos PROTEGIDOS
app.use('/api/nomina', authenticateToken, nominaRoutes);
app.use('/api/empleados', authenticateToken, empleadosRoutes);
app.use('/api/capacitacion', authenticateToken, capacitacionRoutes);
app.use('/api/asistencia', authenticateToken, asistenciaRoutes);
app.use('/api/departamentos', authenticateToken, departamentosRoutes);
app.use('/api/puestos', authenticateToken, puestosRoutes);

// --- MANEJO DE ERRORES GLOBAL ---
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ 
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
  });
});

// --- SERVIR REACT BUILD (si existe) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendBuildPath = path.join(__dirname, '../frontend/build');

if (fs.existsSync(frontendBuildPath)) {
  app.use(express.static(frontendBuildPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
}

// --- INICIAR SERVIDOR ---
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
  console.log(`📱 Frontend React en: http://localhost:3000`);
  console.log(`🔐 Endpoints de auth: http://localhost:${PORT}/api/auth`);
});