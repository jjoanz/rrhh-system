import { poolPromise } from '../db.js';

// Listar asistencia
export const getAsistencia = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT TOP 50 * FROM Asistencia ORDER BY Fecha DESC");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Registrar asistencia
export const createAsistencia = async (req, res) => {
  try {
    const { empleadoId, fecha, estado } = req.body;
    const pool = await poolPromise;

    await pool.request()
      .input("empleadoId", empleadoId)
      .input("fecha", fecha)
      .input("estado", estado)
      .query("INSERT INTO Asistencia (EmpleadoId, Fecha, Estado) VALUES (@empleadoId, @fecha, @estado)");

    res.status(201).json({ message: "Asistencia registrada exitosamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
