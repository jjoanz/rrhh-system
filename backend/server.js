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
import postulacionesPublicasRoutes from './routes/postulacionesPublicasRoutes.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import reportesRoutes from "./routes/reportesRoutes.js";
import vacantesRoutes from './routes/vacantesRoutes.js';
import vacacionesRoutes from './routes/vacacionesRoutes.js';
import perfilRoutes from './routes/perfilRoutes.js';
import accionesPersonalRoutes from './routes/accionesPersonalRoutes.js';

// Importar middleware de autenticación
import { authenticateToken } from './middleware/auth.js';

// --- INICIALIZAR EXPRESS ---
const app = express();

// Aumentar límite para reportes grandes
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS configurado correctamente
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

// --- VARIABLES DE ENTORNO ---
const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 5000;

// --- CONFIGURAR __dirname PARA ES MODULES ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- SERVIR ARCHIVOS ESTÁTICOS (UPLOADS) ---
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log('📁 Carpeta uploads creada');
}
app.use('/uploads', express.static(uploadsPath));
console.log('📂 Sirviendo archivos desde:', uploadsPath);

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

// --- MIDDLEWARE PARA HACER POOL DISPONIBLE EN TODAS LAS RUTAS ---
app.use(async (req, res, next) => {
  try {
    const pool = await poolPromise;
    req.app.locals.db = pool;
    next();
  } catch (error) {
    console.error('Error obteniendo pool:', error.message);
    req.app.locals.db = null;
    next();
  }
});

// --- RUTAS PÚBLICAS (SIN AUTENTICACIÓN) ---
app.use('/api/auth', authRoutes);
app.use('/api/postulaciones-publicas', postulacionesPublicasRoutes);

// --- RUTA DE SALUD DEL SERVIDOR (SIN PROTECCIÓN) ---
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: process.env.DB_SERVER || 'Not configured',
    server: `${HOST}:${PORT}`,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Endpoint de prueba para reportes
app.get('/api/test-reportes', authenticateToken, (req, res) => {
  res.json({
    message: 'Módulo de reportes cargado correctamente',
    endpoints: [
      '/api/reportes/empleados',
      '/api/reportes/departamentos',
      '/api/reportes/vacantes',
      '/api/reportes/nomina',
      '/api/reportes/metricas',
      '/api/reportes/guardados',
      '/api/reportes/custom',
      '/api/reportes/export'
    ]
  });
});

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
    console.error('Error obteniendo usuarios:', err);
    res.status(500).json({ error: err.message });
  }
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
app.use('/api/vacantes', authenticateToken, vacantesRoutes);
app.use('/api/vacaciones', authenticateToken, vacacionesRoutes);
app.use('/api/perfil', authenticateToken, perfilRoutes);
app.use('/api/acciones-personal', authenticateToken, accionesPersonalRoutes);

// --- MANEJO DE ERRORES GLOBAL ---
app.use((err, req, res, next) => {
  console.error('❌ Error no manejado:', err);
  console.error('Stack:', err.stack);
  
  // Si es un error de SQL
  if (err.name === 'RequestError') {
    return res.status(500).json({
      message: 'Error en la base de datos',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Error en consulta',
      code: err.code
    });
  }

  // Error genérico
  res.status(err.status || 500).json({
    message: err.message || 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno',
  });
});

// --- SERVIR REACT BUILD ---
const frontendBuildPath = path.join(__dirname, '..', 'frontend', 'build');

console.log('\n🔍 Verificando frontend build:');
console.log('Ruta build:', frontendBuildPath);
console.log('Existe build?', fs.existsSync(frontendBuildPath));

if (fs.existsSync(frontendBuildPath)) {
  console.log('✅ Frontend build encontrado, sirviendo archivos estáticos...');

  // Servir archivos estáticos
  app.use(express.static(frontendBuildPath));

  // CATCH-ALL para React Router
  app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ 
        message: 'API endpoint not found',
        path: req.path,
        method: req.method
      });
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
      res.status(404).json({ 
        message: 'API endpoint not found',
        path: req.path,
        method: req.method
      });
    } else {
      res.status(200).json({
        message: 'Backend API funcionando correctamente',
        status: 'OK',
        version: '1.0.0',
        architecture: {
          webServer: HOST,
          webPort: PORT,
          databaseServer: process.env.DB_SERVER || 'Not configured',
          databaseName: process.env.DB_NAME || 'Not configured'
        },
        endpoints: {
          auth: '/api/auth',
          health: '/api/health',
          admin: '/api/admin',
          nomina: '/api/nomina',
          empleados: '/api/empleados',
          departamentos: '/api/departamentos',
          puestos: '/api/puestos',
          postulaciones: '/api/postulaciones',
          postulacionesPublicas: '/api/postulaciones-publicas',
          reportes: '/api/reportes',
          vacantes: '/api/vacantes',
          vacaciones: '/api/vacaciones',
          perfil: '/api/perfil',
          accionesPersonal: '/api/acciones-personal'
        },
        reportesEndpoints: {
          empleados: 'POST /api/reportes/empleados',
          departamentos: 'POST /api/reportes/departamentos',
          vacantes: 'POST /api/reportes/vacantes',
          nomina: 'POST /api/reportes/nomina',
          metricas: 'GET /api/reportes/metricas',
          guardados: 'GET /api/reportes/guardados',
          custom: 'POST /api/reportes/custom',
          export: 'POST /api/reportes/export'
        }
      });
    }
  });
}

// --- INICIAR SERVIDOR ---
const server = app.listen(PORT, HOST, () => {
  console.log('\n🚀 ========================================');
  console.log(`   Servidor iniciado correctamente`);
  console.log('   ========================================');
  console.log(`   URL:        http://${HOST}:${PORT}`);
  console.log(`   Base de datos: ${process.env.DB_SERVER || 'Not configured'}`);
  console.log(`   Ambiente:   ${process.env.NODE_ENV || 'development'}`);
  console.log('   ========================================');
  console.log('\n📡 Endpoints principales:');
  console.log(`   🔐 Auth:       http://${HOST}:${PORT}/api/auth`);
  console.log(`   🛡️  Admin:      http://${HOST}:${PORT}/api/admin`);
  console.log(`   💼 Vacantes:   http://${HOST}:${PORT}/api/vacantes`);
  console.log(`   📋 Reportes:   http://${HOST}:${PORT}/api/reportes`);
  console.log(`   👤 Perfil:     http://${HOST}:${PORT}/api/perfil`);
  console.log(`   📁 Uploads:    http://${HOST}:${PORT}/uploads`);
  console.log(`   ⚡ Health:     http://${HOST}:${PORT}/api/health`);
  console.log(`   📝 Acciones:   http://${HOST}:${PORT}/api/acciones-personal`);
  console.log('\n📊 Endpoints de Reportes:');
  console.log(`   POST http://${HOST}:${PORT}/api/reportes/empleados`);
  console.log(`   POST http://${HOST}:${PORT}/api/reportes/departamentos`);
  console.log(`   POST http://${HOST}:${PORT}/api/reportes/vacantes`);
  console.log(`   POST http://${HOST}:${PORT}/api/reportes/nomina`);
  console.log(`   GET  http://${HOST}:${PORT}/api/reportes/metricas`);
  console.log('   ========================================\n');
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

  // Timeout de 10 segundos
  setTimeout(() => {
    console.error('❌ Timeout: Forzando cierre del servidor');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Log inicial de configuración
console.log('\n⚙️  Configuración del servidor:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`   DB_SERVER: ${process.env.DB_SERVER || 'Not configured'}`);
console.log(`   DB_NAME: ${process.env.DB_NAME || 'Not configured'}`);
console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Configurado' : '❌ No configurado'}`);
console.log('');