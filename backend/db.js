import sql from 'mssql';
import dotenv from 'dotenv';
dotenv.config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT, 10),
  database: process.env.DB_DATABASE,
  requestTimeout: 60000,
  connectionTimeout: 8000,
  options: {
    encrypt: false,
    trustServerCertificate: true,
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
  // ✅ VERIFICACIÓN MEJORADA DEL ESTADO DEL POOL
  if (pool && !pool.connecting && !pool.closed) {
    return pool;
  }
  
  // ✅ MANEJO MEJORADO DE ESPERA DURANTE CONEXIÓN
  if (isConnecting) {
    let attempts = 0;
    while (isConnecting && attempts < 100) { // máximo 10 segundos
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    if (isConnecting) {
      throw new Error('Timeout esperando conexión');
    }
    return getPool();
  }
  
  try {
    isConnecting = true;
    console.log('🔄 Conectando a SQL Server...');
    
    // ✅ LIMPIAR POOL ANTERIOR SI EXISTE
    if (pool) {
      try {
        await pool.close();
      } catch (e) {
        console.log('Pool anterior ya estaba cerrado');
      }
      pool = null;
    }
    
    pool = new sql.ConnectionPool(config);
    
    // ✅ TIMEOUT MEJORADO CON Promise.race
    await Promise.race([
      pool.connect(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout después de 8 segundos')), 8000)
      )
    ]);
    
    console.log('✅ Conectado a SQL Server (SQL Login)');
    
    // ✅ MANEJO MEJORADO DE ERRORES DEL POOL
    pool.on('error', err => {
      console.error('❌ Error en pool SQL:', err.message);
      if (pool && !pool.closed) {
        pool.close().catch(() => {}); // Cerrar silenciosamente
      }
      pool = null;
    });
    
    // ✅ MANEJO DE CIERRE INESPERADO
    pool.on('close', () => {
      console.log('🔒 Pool de SQL Server se cerró');
      pool = null;
    });
    
    isConnecting = false;
    return pool;
    
  } catch (error) {
    isConnecting = false;
    console.error('❌ Error de conexión SQL:', error.message);
    
    // ✅ LIMPIAR POOL EN CASO DE ERROR
    if (pool) {
      try {
        await pool.close();
      } catch (e) {
        // Ignorar errores al cerrar
      }
      pool = null;
    }
    
    throw error;
  }
}

// ✅ INICIALIZACIÓN MEJORADA DEL POOL
export const poolPromise = getPool()
  .then(p => {
    console.log('🎉 Pool de SQL Server inicializado correctamente');
    return p;
  })
  .catch(err => {
    console.error('⚠️ Falló inicialización del pool:', err.message);
    return null;
  });

// ✅ FUNCIÓN getConnection MEJORADA
export const getConnection = async () => {
  try {
    const connection = await getPool();
    
    // ✅ VERIFICACIÓN ADICIONAL DE LA CONEXIÓN
    if (!connection) {
      console.error('❌ No se pudo obtener conexión del pool');
      return null;
    }
    
    if (connection.closed) {
      console.error('❌ La conexión está cerrada');
      pool = null; // Resetear para forzar reconexión
      return null;
    }
    
    return connection;
    
  } catch (error) {
    console.error('❌ Error obteniendo conexión:', error.message);
    
    // ✅ RESETEAR POOL EN CASO DE ERROR CRÍTICO
    if (error.code === 'ETIMEOUT' || error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      pool = null;
      isConnecting = false;
    }
    
    return null;
  }
};

// ✅ FUNCIÓN executeQuery MEJORADA
export const executeQuery = async (queryText, inputs = []) => {
  let connection;
  let retries = 0;
  const maxRetries = 2;
  
  while (retries <= maxRetries) {
    try {
      connection = await getConnection();
      
      if (!connection) {
        throw new Error('No hay conexión disponible a la base de datos');
      }
      
      const request = connection.request();
      
      // ✅ AGREGAR INPUTS SI LOS HAY
      inputs.forEach(input => {
        if (input.type) {
          request.input(input.name, input.type, input.value);
        } else {
          request.input(input.name, input.value);
        }
      });
      
      const result = await request.query(queryText);
      return result;
      
    } catch (error) {
      retries++;
      console.error(`❌ Error ejecutando consulta (intento ${retries}):`, error.message);
      
      // ✅ RESETEAR CONEXIÓN EN ERRORES DE CONEXIÓN
      if (error.code === 'ETIMEOUT' || error.code === 'ENOTFOUND' || 
          error.message.includes('connection') || error.message.includes('timeout')) {
        pool = null;
        isConnecting = false;
        
        if (retries <= maxRetries) {
          console.log(`🔄 Reintentando consulta en 1 segundo...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
      }
      
      throw error;
    }
  }
};

// ✅ FUNCIÓN PARA VERIFICAR ESTADO DE LA CONEXIÓN
export const checkConnection = async () => {
  try {
    const connection = await getConnection();
    if (!connection) return false;
    
    // Test simple query
    const result = await connection.request().query('SELECT 1 as test');
    return result.recordset.length > 0;
  } catch (error) {
    console.error('❌ Error verificando conexión:', error.message);
    return false;
  }
};

// ✅ FUNCIÓN PARA CERRAR EL POOL MEJORADA
export const closePool = async () => {
  try {
    if (pool && !pool.closed) {
      await pool.close();
      console.log('🔒 Pool de SQL Server cerrado correctamente');
    }
    pool = null;
    isConnecting = false;
  } catch (error) {
    console.error('❌ Error cerrando pool:', error.message);
    pool = null;
    isConnecting = false;
  }
};

// ✅ MANEJO MEJORADO DE CIERRE DE APLICACIÓN
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Recibida señal ${signal}, cerrando aplicación...`);
  try {
    await closePool();
    console.log('✅ Aplicación cerrada correctamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante cierre:', error.message);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// ✅ MANEJO DE ERRORES NO CAPTURADOS
process.on('uncaughtException', (error) => {
  console.error('❌ Error no capturado:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
  gracefulShutdown('unhandledRejection');
});

export default sql;