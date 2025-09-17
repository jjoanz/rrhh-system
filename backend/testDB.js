import sql from 'mssql';
import dotenv from 'dotenv';
dotenv.config();

const config = {
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT, 10),
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

async function testConnection() {
  try {
    const pool = await sql.connect(config);
    console.log('✅ Conexión exitosa a SQL Server');
    
    const result = await pool.request().query('SELECT 1 AS test');
    console.log('Resultado prueba:', result.recordset);

    await pool.close();
  } catch (err) {
    console.error('❌ Error conectando a SQL Server:', err.message);
  }
}

testConnection();

