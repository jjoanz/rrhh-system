import { poolPromise } from '../db.js';

// Listar nómina
export const getNomina = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT TOP 50 * FROM Nomina ORDER BY FechaPago DESC");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Registrar pago en nómina
export const createNomina = async (req, res) => {
  try {
    const { empleadoId, monto, fechaPago } = req.body;
    const pool = await poolPromise;

    await pool.request()
      .input("empleadoId", empleadoId)
      .input("monto", monto)
      .input("fechaPago", fechaPago)
      .query("INSERT INTO Nomina (EmpleadoId, Monto, FechaPago) VALUES (@empleadoId, @monto, @fechaPago)");

    res.status(201).json({ message: "Registro de nómina creado exitosamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
