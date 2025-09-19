// backend/controllers/postulacionesController.js
import { poolPromise } from '../db.js';


// Obtener todas las postulaciones (con filtro opcional)
export const getPostulaciones = async (req, res) => {
  try {
    const { filtro } = req.query;
    let query = `
      SELECT p.id, c.nombre, pu.nombre AS puesto, p.fecha, p.estado
      FROM postulaciones p
      INNER JOIN candidatos c ON p.candidato_id = c.id
      INNER JOIN puestos pu ON p.puesto_id = pu.id
      ORDER BY p.fecha DESC
    `;
    let params = [];

    if (filtro) {
      query = `
        SELECT p.id, c.nombre, pu.nombre AS puesto, p.fecha, p.estado
        FROM postulaciones p
        INNER JOIN candidatos c ON p.candidato_id = c.id
        INNER JOIN puestos pu ON p.puesto_id = pu.id
        WHERE c.nombre LIKE ? OR pu.nombre LIKE ?
        ORDER BY p.fecha DESC
      `;
      params = [`%${filtro}%`, `%${filtro}%`];
    }

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener postulaciones:", error);
    res.status(500).json({ message: "Error al obtener postulaciones" });
  }
};

// Crear una nueva postulación
export const createPostulacion = async (req, res) => {
  try {
    const { candidato_id, puesto_id, estado } = req.body;
    if (!candidato_id || !puesto_id) {
      return res.status(400).json({ message: "Faltan datos obligatorios" });
    }

    await db.query(
      "INSERT INTO postulaciones (candidato_id, puesto_id, fecha, estado) VALUES (?, ?, NOW(), ?)",
      [candidato_id, puesto_id, estado || "Pendiente"]
    );

    res.json({ message: "Postulación creada correctamente" });
  } catch (error) {
    console.error("Error al crear postulación:", error);
    res.status(500).json({ message: "Error al crear postulación" });
  }
};
