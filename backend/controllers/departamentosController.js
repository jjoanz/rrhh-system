import { poolPromise } from '../db.js';

export const getDepartamentos = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query("SELECT * FROM Departamentos ORDER BY Nombre");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
