import { poolPromise } from './db.js';

async function testQuery() {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT 1 AS result');
    console.log('✅ Query de prueba exitosa:', result.recordset);
  } catch (err) {
    console.error('❌ Error en query de prueba:', err);
  }
}

testQuery();
