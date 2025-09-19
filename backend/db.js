// backend/db.js
import sql from 'mssql';
import dotenv from 'dotenv';
dotenv.config();

// Configuración SQL Server mejorada
const config = {
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  
  // Timeouts extendidos para conexiones problemáticas
  requestTimeout: 60000,        // 60 segundos para queries
  connectionTimeout: 30000,     // 30 segundos para conectar (aumentado de 8s)
  cancelTimeout: 10000,         // 10 segundos para cancelar
  
  options: {
    encrypt: false,                    // Para SQL Server local
    trustServerCertificate: true,      // Evita error de certificado
    enableArithAbort: true,
    abortTransactionOnError: true,
    useUTC: false,                     // Mantener timezone local
    dateFirst: 1,
    connectTimeout: 30000,             // Timeout adicional
    packetSize: 4096,                  // Tamaño de paquete optimizado
    instanceName: process.env.DB_INSTANCE || '', // Para instancias nombradas
  },
  
  pool: {
    max: 10,                    // Aumentado para mejor concurrencia
    min: 2,                     // Mantener 2 conexiones mínimas
    idleTimeoutMillis: 30000,   // 30 segundos antes de cerrar conexión idle
    acquireTimeoutMillis: 30000, // 30 segundos para obtener conexión del pool
    createTimeoutMillis: 30000,  // 30 segundos para crear nueva conexión
    destroyTimeoutMillis: 5000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 500,
  }
};

let pool = null;
let isConnecting = false;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 5;
const RETRY_DELAY_BASE = 2000; // 2 segundos base para backoff exponencial

// Función para diagnosticar problemas de conexión
const diagnoseConnectionIssue = (error) => {
  console.log('\nDIAGNÓSTICO DE CONEXIÓN:');
  console.log(`Servidor: ${config.server}:${config.port}`);
  console.log(`Base de datos: ${config.database}`);
  console.log(`Usuario: ${config.user}`);
  console.log(`Contraseña: ${config.password ? 'Configurada' : 'NO CONFIGURADA'}`);
  
  if (error.code === 'ETIMEOUT' || error.message.includes('timeout')) {
    console.log('\nPROBLEMA: TIMEOUT DE CONEXIÓN');
    console.log('Soluciones posibles:');
    console.log('   1. Verificar que SQL Server esté ejecutándose');
    console.log('   2. Comprobar que el puerto 1433 esté abierto');
    console.log('   3. Verificar configuración de firewall');
    console.log('   4. Probar conexión con telnet: telnet 192.168.0.240 1433');
    console.log('   5. Verificar SQL Server Browser si usa instancia nombrada');
  }
  
  if (error.code === 'ENOTFOUND') {
    console.log('\nPROBLEMA: SERVIDOR NO ENCONTRADO');
    console.log('Soluciones posibles:');
    console.log('   1. Verificar la IP/nombre del servidor');
    console.log('   2. Hacer ping al servidor: ping 192.168.0.240');
    console.log('   3. Verificar resolución DNS si usa nombre');
  }
  
  if (error.code === 'ECONNREFUSED') {
    console.log('\nPROBLEMA: CONEXIÓN RECHAZADA');
    console.log('Soluciones posibles:');
    console.log('   1. SQL Server no está escuchando en el puerto');
    console.log('   2. Verificar SQL Server Configuration Manager');
    console.log('   3. Habilitar TCP/IP en SQL Server Network Configuration');
  }
  
  if (error.message.includes('login') || error.message.includes('Login')) {
    console.log('\nPROBLEMA: ERROR DE AUTENTICACIÓN');
    console.log('Soluciones posibles:');
    console.log('   1. Verificar usuario y contraseña');
    console.log('   2. Verificar que el usuario tenga acceso a la BD');
    console.log('   3. Comprobar modo de autenticación SQL Server');
  }
  
  console.log('\n');
};

// ===================== OBTENER POOL CON REINTENTOS =====================
async function getPool() {
  // Si ya tenemos un pool válido, devolverlo
  if (pool && pool.connected && !pool.connecting && !pool.closed) {
    return pool;
  }

  // Si ya se está conectando, esperar
  if (isConnecting) {
    let attempts = 0;
    while (isConnecting && attempts < 300) { // 30 segundos máximo
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (isConnecting) {
      throw new Error('Timeout esperando conexión en progreso');
    }
    
    // Intentar devolver el pool después de esperar
    if (pool && pool.connected) {
      return pool;
    }
  }

  // Verificar límite de intentos
  if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
    throw new Error(`Se agotaron los ${MAX_CONNECTION_ATTEMPTS} intentos de conexión`);
  }

  isConnecting = true;
  connectionAttempts++;

  try {
    console.log(`\nIntento de conexión ${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS}...`);
    console.log(`Conectando a: ${config.server}:${config.port}`);
    console.log(`Base de datos: ${config.database}`);

    // Cerrar pool existente si hay problemas
    if (pool) {
      try {
        if (!pool.closed) {
          await pool.close();
        }
      } catch (e) {
        console.warn('Error cerrando pool anterior:', e.message);
      }
      pool = null;
    }

    // Crear nuevo pool
    pool = new sql.ConnectionPool(config);

    // Configurar eventos antes de conectar
    pool.on('error', (err) => {
      console.error('Error en pool SQL:', err.message);
      pool = null;
      isConnecting = false;
    });

    pool.on('close', () => {
      console.log('Pool de SQL Server cerrado');
      pool = null;
      isConnecting = false;
    });

    // Intentar conexión con timeout personalizado
    const connectionPromise = pool.connect();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout de conexión después de ${config.connectionTimeout/1000} segundos`)), config.connectionTimeout);
    });

    await Promise.race([connectionPromise, timeoutPromise]);

    console.log('Conectado exitosamente a SQL Server');
    console.log(`Pool configurado: min=${config.pool.min}, max=${config.pool.max}`);
    
    // Reset contadores en conexión exitosa
    connectionAttempts = 0;
    isConnecting = false;
    
    return pool;

  } catch (error) {
    isConnecting = false;
    
    console.error(`Error de conexión SQL (intento ${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS}):`);
    console.error(`   ${error.message}`);
    
    // Diagnosticar el problema
    diagnoseConnectionIssue(error);
    
    // Limpiar pool fallido
    if (pool) {
      try {
        await pool.close();
      } catch (e) {
        // Ignorar errores al cerrar
      }
      pool = null;
    }

    // Si no hemos llegado al límite, reintentar con backoff exponencial
    if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
      const delay = RETRY_DELAY_BASE * Math.pow(2, connectionAttempts - 1);
      console.log(`Reintentando en ${delay/1000} segundos...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return getPool(); // Llamada recursiva
    }

    throw error;
  }
}

// ===================== INICIALIZACIÓN DEL POOL =====================
export const poolPromise = getPool()
  .then(p => {
    console.log('Pool de SQL Server inicializado correctamente');
    return p;
  })
  .catch(err => {
    console.error('Falló inicialización del pool:', err.message);
    console.log('El servidor continuará funcionando, pero las funciones de BD no estarán disponibles');
    return null;
  });

// ===================== OBTENER CONEXIÓN =====================
export const getConnection = async () => {
  try {
    const connection = await getPool();
    
    if (!connection || connection.closed) {
      console.warn('No hay conexión disponible, reintentando...');
      pool = null;
      isConnecting = false;
      return await getPool();
    }
    
    return connection;
    
  } catch (error) {
    console.error('Error obteniendo conexión:', error.message);
    
    // Resetear estado en casos específicos
    if (['ETIMEOUT', 'ENOTFOUND', 'ECONNREFUSED'].includes(error.code) || 
        error.message.includes('timeout') || 
        error.message.includes('connection')) {
      pool = null;
      isConnecting = false;
      connectionAttempts = 0; // Reset para permitir nuevos intentos después de un tiempo
    }
    
    return null;
  }
};

// ===================== EJECUTAR QUERY CON REINTENTOS =====================
export const executeQuery = async (queryText, inputs = []) => {
  let connection;
  let retries = 0;
  const maxRetries = 3;

  while (retries <= maxRetries) {
    try {
      connection = await getConnection();
      
      if (!connection) {
        throw new Error('No hay conexión disponible a la base de datos');
      }

      const request = connection.request();
      
      // Agregar parámetros de entrada
      inputs.forEach(input => {
        if (input.type) {
          request.input(input.name, input.type, input.value);
        } else {
          request.input(input.name, input.value);
        }
      });

      // Log de la query (solo los primeros 200 caracteres)
      const queryPreview = queryText.length > 200 ? 
        queryText.substring(0, 200) + '...' : queryText;
      console.log('Ejecutando query:', queryPreview);

      const startTime = Date.now();
      const result = await request.query(queryText);
      const executionTime = Date.now() - startTime;

      console.log(`Query ejecutado exitosamente en ${executionTime}ms`);
      console.log(`Registros devueltos: ${result.recordset?.length || 0}`);

      return result;

    } catch (error) {
      retries++;
      console.error(`Error ejecutando query (intento ${retries}/${maxRetries + 1}):`, error.message);
      
      // Si es error de conexión, resetear y reintentar
      if (error.code === 'ETIMEOUT' || 
          error.code === 'ENOTFOUND' || 
          error.code === 'ECONNREFUSED' ||
          error.message.includes('connection') || 
          error.message.includes('timeout') ||
          error.message.includes('socket')) {
        
        console.log('Error de conexión detectado, reseteando pool...');
        pool = null;
        isConnecting = false;
        
        if (retries <= maxRetries) {
          const delay = 1000 * retries; // Delay progresivo
          console.log(`Esperando ${delay/1000}s antes del reintento...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      // Log del error para debugging
      if (retries > maxRetries) {
        console.error('Query falló después de todos los reintentos');
        console.error('Query que falló:', queryText.substring(0, 500));
        console.error('Parámetros:', inputs);
      }
      
      throw error;
    }
  }
};

// ===================== VERIFICAR CONEXIÓN =====================
export const checkConnection = async () => {
  try {
    console.log('Verificando conectividad de base de datos...');
    const connection = await getConnection();
    
    if (!connection) {
      console.log('No se pudo obtener conexión');
      return false;
    }
    
    const result = await connection.request().query('SELECT 1 as test, GETDATE() as fecha_servidor');
    const isConnected = result.recordset && result.recordset.length > 0;
    
    if (isConnected) {
      const serverDate = result.recordset[0].fecha_servidor;
      console.log(`Conexión verificada. Fecha del servidor: ${serverDate}`);
    }
    
    return isConnected;
    
  } catch (error) {
    console.error('Error verificando conexión:', error.message);
    return false;
  }
};

// ===================== OBTENER INFORMACIÓN DEL SERVIDOR =====================
export const getServerInfo = async () => {
  try {
    const result = await executeQuery(`
      SELECT 
        @@VERSION as version_info,
        @@SERVERNAME as server_name,
        DB_NAME() as current_database,
        SYSTEM_USER as current_user,
        GETDATE() as server_time
    `);
    
    return result.recordset[0];
  } catch (error) {
    console.error('Error obteniendo info del servidor:', error.message);
    return null;
  }
};

// ===================== CERRAR POOL =====================
export const closePool = async () => {
  try {
    if (pool && !pool.closed) {
      console.log('Cerrando pool de SQL Server...');
      await pool.close();
      console.log('Pool cerrado correctamente');
    }
    pool = null;
    isConnecting = false;
    connectionAttempts = 0;
  } catch (error) {
    console.error('Error cerrando pool:', error.message);
    pool = null;
    isConnecting = false;
    connectionAttempts = 0;
  }
};

// ===================== FUNCIÓN DE HEALTH CHECK =====================
export const healthCheck = async () => {
  const health = {
    database: {
      connected: false,
      server: config.server,
      database: config.database,
      port: config.port,
      lastError: null,
      connectionAttempts,
      poolStatus: null
    }
  };

  try {
    const isConnected = await checkConnection();
    health.database.connected = isConnected;
    
    if (pool) {
      health.database.poolStatus = {
        connected: pool.connected,
        connecting: pool.connecting,
        closed: pool.closed
      };
    }

    if (isConnected) {
      const serverInfo = await getServerInfo();
      health.database.serverInfo = serverInfo;
    }
    
  } catch (error) {
    health.database.lastError = error.message;
  }

  return health;
};

// ===================== CIERRE GRACIOSO =====================
const gracefulShutdown = async (signal) => {
  console.log(`\nRecibida señal ${signal}, cerrando aplicación...`);
  try {
    await closePool();
    console.log('Base de datos cerrada correctamente');
    console.log('Aplicación cerrada correctamente');
    process.exit(0);
  } catch (error) {
    console.error('Error durante cierre:', error.message);
    process.exit(1);
  }
};

// Eventos de proceso
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('uncaughtException', error => {
  console.error('Error no capturado:', error);
  gracefulShutdown('uncaughtException');
});
process.on('unhandledRejection', (reason) => {
  console.error('Promesa rechazada no manejada:', reason);
  gracefulShutdown('unhandledRejection');
});

// Verificación periódica de conexión (cada 5 minutos)
setInterval(async () => {
  if (pool && pool.connected) {
    try {
      await checkConnection();
    } catch (error) {
      console.warn('Verificación periódica falló:', error.message);
      pool = null;
    }
  }
}, 5 * 60 * 1000);

export default sql;