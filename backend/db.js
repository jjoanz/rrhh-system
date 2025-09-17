import sql from 'mssql';
import dotenv from 'dotenv';
dotenv.config();

const config = {
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT, 10),
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  requestTimeout: 60000,
  connectionTimeout: 8000,
  options: {
    encrypt: false,               // Para SQL Server local
    trustServerCertificate: true, // Evita error de certificado
    enableArithAbort: true,
    abortTransactionOnError: true
  },
  pool: {
    max: 5,
    min: 0,
    idleTimeoutMillis: 15000,
    acquireTimeoutMillis: 8000
  }
};

let pool;
let isConnecting = false;

async function getPool() {
  if (pool && !pool.connecting && !pool.closed) return pool;

  if (isConnecting) {
    let attempts = 0;
    while (isConnecting && attempts < 100) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    if (isConnecting) throw new Error('Timeout esperando conexión');
    return getPool();
  }

  try {
    isConnecting = true;

    if (pool) {
      try { await pool.close(); } catch (e) {}
      pool = null;
    }

    pool = new sql.ConnectionPool(config);

    await Promise.race([
      pool.connect(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout después de 8 segundos')), 8000))
    ]);

    console.log('✅ Conectado a SQL Server (SQL Authentication)');

    pool.on('error', err => {
      console.error('❌ Error en pool SQL:', err.message);
      if (pool && !pool.closed) pool.close().catch(() => {});
      pool = null;
    });

    pool.on('close', () => {
      console.log('🔒 Pool de SQL Server se cerró');
      pool = null;
    });

    isConnecting = false;
    return pool;

  } catch (error) {
    isConnecting = false;
    console.error('❌ Error de conexión SQL:', error.message);
    if (pool) { try { await pool.close(); } catch (e) {} pool = null; }
    throw error;
  }
}

export const poolPromise = getPool()
  .then(p => { console.log('🎉 Pool de SQL Server inicializado correctamente'); return p; })
  .catch(err => { console.error('⚠️ Falló inicialización del pool:', err.message); return null; });

export const getConnection = async () => {
  try {
    const connection = await getPool();
    if (!connection || connection.closed) { pool = null; return null; }
    return connection;
  } catch (error) {
    console.error('❌ Error obteniendo conexión:', error.message);
    if (['ETIMEOUT','ENOTFOUND','ECONNREFUSED'].includes(error.code)) { pool = null; isConnecting = false; }
    return null;
  }
};

export const executeQuery = async (queryText, inputs = []) => {
  let connection;
  let retries = 0;
  const maxRetries = 2;

  while (retries <= maxRetries) {
    try {
      connection = await getConnection();
      if (!connection) throw new Error('No hay conexión disponible a la base de datos');

      const request = connection.request();
      inputs.forEach(input => request.input(input.name, input.type || undefined, input.value));

      const result = await request.query(queryText);
      return result;

    } catch (error) {
      retries++;
      console.error(`❌ Error ejecutando consulta (intento ${retries}):`, error.message);
      if (error.code === 'ETIMEOUT' || error.code === 'ENOTFOUND' || error.message.includes('connection') || error.message.includes('timeout')) {
        pool = null; isConnecting = false;
        if (retries <= maxRetries) { await new Promise(r => setTimeout(r, 1000)); continue; }
      }
      throw error;
    }
  }
};

export const checkConnection = async () => {
  try {
    const connection = await getConnection();
    if (!connection) return false;
    const result = await connection.request().query('SELECT 1 as test');
    return result.recordset.length > 0;
  } catch (error) {
    console.error('❌ Error verificando conexión:', error.message);
    return false;
  }
};

export const closePool = async () => {
  try {
    if (pool && !pool.closed) { await pool.close(); console.log('🔒 Pool de SQL Server cerrado correctamente'); }
    pool = null; isConnecting = false;
  } catch (error) {
    console.error('❌ Error cerrando pool:', error.message);
    pool = null; isConnecting = false;
  }
};

const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Recibida señal ${signal}, cerrando aplicación...`);
  try { await closePool(); console.log('✅ Aplicación cerrada correctamente'); process.exit(0); }
  catch (error) { console.error('❌ Error durante cierre:', error.message); process.exit(1); }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('uncaughtException', error => { console.error('❌ Error no capturado:', error); gracefulShutdown('uncaughtException'); });
process.on('unhandledRejection', (reason) => { console.error('❌ Promesa rechazada no manejada:', reason); gracefulShutdown('unhandledRejection'); });

export default sql;
