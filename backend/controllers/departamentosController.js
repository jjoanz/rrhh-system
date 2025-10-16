// backend/controllers/departamentosController.js
import { poolPromise } from '../db.js';

export const getDepartamentos = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        DepartamentoID,
        Nombre,
        Descripcion,
        Estado
      FROM Departamentos
      WHERE Estado = 1
      ORDER BY Nombre
    `);
    
    res.json({
      success: true,
      departamentos: result.recordset
    });
  } catch (error) {
    console.error("Error al obtener departamentos:", error);
    res.status(500).json({ 
      success: false,
      message: "Error al obtener departamentos" 
    });
  }
};