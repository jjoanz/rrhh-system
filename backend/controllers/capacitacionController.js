import { poolPromise } from '../db.js';

// Listar capacitaciones
export const getCapacitaciones = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT TOP 50 * FROM Capacitacion ORDER BY Fecha DESC");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Crear capacitación
export const createCapacitacion = async (req, res) => {
  try {
    const { titulo, descripcion, fecha } = req.body;
    const pool = await poolPromise;

    await pool.request()
      .input("titulo", titulo)
      .input("descripcion", descripcion)
      .input("fecha", fecha)
      .query("INSERT INTO Capacitacion (Titulo, Descripcion, Fecha) VALUES (@titulo, @descripcion, @fecha)");

    res.status(201).json({ message: "Capacitación creada exitosamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
