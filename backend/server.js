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


// --- INICIALIZAR EXPRESS ---
const app = express();
app.use(express.json()); // <-- AGREGAR ESTA LÍNEA
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));


const PORT = 5000;

// --- RUTAS DE API ---
app.get('/api/usuarios', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Usuarios');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Conectar los módulos
app.use('/api/nomina', nominaRoutes);
app.use('/api/empleados', empleadosRoutes);
app.use('/api/capacitacion', capacitacionRoutes);
app.use('/api/asistencia', asistenciaRoutes);
app.use('/api/departamentos', departamentosRoutes);
app.use('/api/puestos', puestosRoutes);

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
});

