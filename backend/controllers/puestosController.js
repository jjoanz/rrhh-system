import { poolPromise } from '../db.js';

export const getPuestos = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query("SELECT * FROM Puestos ORDER BY Nombre");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
