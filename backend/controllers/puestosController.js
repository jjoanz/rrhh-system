// backend/controllers/puestosController.js
import { poolPromise } from '../db.js'; 

// Obtener todos los puestos
export const getPuestos = async (req, res) => {
  try {
    const [rows] = await poolPromise.query("SELECT id, nombre FROM puestos ORDER BY nombre");
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener puestos:", error);
    res.status(500).json({ message: "Error al obtener puestos" });
  }
};

// Crear un nuevo puesto
export const createPuesto = async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ message: "El nombre es obligatorio" });

    await poolPromise.query("INSERT INTO puestos (nombre) VALUES (?)", [nombre]);
    res.json({ message: "Puesto creado correctamente" });
  } catch (error) {
    console.error("Error al crear puesto:", error);
    res.status(500).json({ message: "Error al crear puesto" });
  }
};

// Eliminar un puesto
export const deletePuesto = async (req, res) => {
  try {
    const { id } = req.params;
    await poolPromise.query("DELETE FROM puestos WHERE id = ?", [id]);
    res.json({ message: "Puesto eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar puesto:", error);
    res.status(500).json({ message: "Error al eliminar puesto" });
  }
};
