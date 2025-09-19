// server.js
import express from 'express';
import { poolPromise } from './db.js';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import fs from 'fs';

// Importar las rutas de los módulos
import nominaRoutes from './routes/nominaRoutes.js';
import empleadosRoutes from './routes/empleadosRoutes.js';
import capacitacionRoutes from './routes/capacitacionRoutes.js';
import asistenciaRoutes from './routes/asistenciaRoutes.js';
import departamentosRoutes from './routes/departamentosRoutes.js';
import puestosRoutes from './routes/puestosRoutes.js';
import postulacionesRoutes from './routes/postulacionesRoutes.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import reportesRoutes from "./routes/reportesRoutes.js";

// Importar middleware de autenticación
import { authenticateToken } from './middleware/auth.js';

// --- INICIALIZAR EXPRESS ---
const app = express();
app.use(express.json());
app.use(cors());

// --- VARIABLES DE ENTORNO ---
const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 5000;

// --- MANEJO DE ERRORES PARA PATH-TO-REGEXP ---
process.on('uncaughtException', (error) => {
  console.error('❌ Error no capturado:', error.message);
  if (
    error.message.includes('pathToRegexpError') ||
    error.message.includes('Missing parameter name')
  ) {
    console.error(
      '🔍 Error relacionado con rutas malformadas. Revisa las definiciones de rutas.'
    );
  }
  process.exit(1);
});

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
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: process.env.DB_SERVER,
    server: `${HOST}:${PORT}`,
  });
});

// --- CONECTAR LOS MÓDULOS PROTEGIDOS ---
app.use('/api/nomina', authenticateToken, nominaRoutes);
app.use('/api/empleados', authenticateToken, empleadosRoutes);
app.use('/api/capacitacion', authenticateToken, capacitacionRoutes);
app.use('/api/asistencia', authenticateToken, asistenciaRoutes);
app.use('/api/departamentos', authenticateToken, departamentosRoutes);
app.use('/api/puestos', authenticateToken, puestosRoutes);
app.use('/api/postulaciones', authenticateToken, postulacionesRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);
app.use("/api/reportes", authenticateToken, reportesRoutes);

// --- MANEJO DE ERRORES GLOBAL ---
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({
    message: 'Error interno del servidor',
    error:
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'Error interno',
  });
});

// --- SERVIR REACT BUILD ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔑 Ajuste para que funcione con backend en carpeta separada
const frontendBuildPath = path.join(__dirname, '..', 'frontend', 'build');

console.log('Ruta build usada por Express:', frontendBuildPath);
console.log('Existe build?', fs.existsSync(frontendBuildPath));

if (fs.existsSync(frontendBuildPath)) {
  console.log('✅ Frontend build encontrado, sirviendo archivos estáticos...');

  // Servir archivos estáticos
  app.use(express.static(frontendBuildPath));

  // CATCH-ALL para React Router
  app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ message: 'API endpoint not found' });
    }
    const indexPath = path.join(frontendBuildPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Frontend index.html not found');
    }
  });
} else {
  console.log('⚠️  Frontend build no encontrado, solo sirviendo API...');

  app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
      res.status(404).json({ message: 'API endpoint not found' });
    } else {
      res.status(200).json({
        message: 'Backend API funcionando correctamente',
        status: 'OK',
        architecture: {
          webServer: `${HOST}`,
          databaseServer: process.env.DB_SERVER,
        },
        endpoints: {
          auth: '/api/auth',
          health: '/api/health',
          admin: '/api/admin',
          nomina: '/api/nomina',
          empleados: '/api/empleados',
          puestos: '/api/puestos',
          postulaciones: '/api/postulaciones',
          reportes: '/api/reportes',
        },
      });
    }
  });
}

// --- INICIAR SERVIDOR ---
const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor web corriendo en http://${HOST}:${PORT}`);
  console.log(`🗄️  Conectando a base de datos: ${process.env.DB_SERVER}`);
  console.log(`🔐 Endpoints de auth: http://${HOST}:${PORT}/api/auth`);
  console.log(`🛡️  Endpoints de admin: http://${HOST}:${PORT}/api/admin`);
  console.log(`⚡ API Health check: http://${HOST}:${PORT}/api/health`);
});

// --- MANEJO GRACEFUL DE SHUTDOWN ---
const gracefulShutdown = async () => {
  console.log('\n🛑 Cerrando servidor...');
  server.close(async () => {
    try {
      const pool = await poolPromise;
      if (pool && pool.close) {
        await pool.close();
        console.log('✅ Pool de base de datos cerrado correctamente');
      }
      console.log('✅ Servidor cerrado correctamente');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error cerrando recursos:', error.message);
      process.exit(1);
    }
  });
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);



