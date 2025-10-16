// backend/controllers/puestosController.js
import { poolPromise } from '../db.js';

// Obtener todos los puestos
export const getPuestos = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        PuestoID as id, 
        NOMBRE as nombre,
        Descripcion as descripcion,
        SalarioMinimo as salarioMinimo,
        SalarioMaximo as salarioMaximo,
        DepartamentoID as departamentoID,
        Estado as estado
      FROM Puestos 
      WHERE Estado = 1
      ORDER BY NOMBRE
    `);
    
    res.json({
      success: true,
      puestos: result.recordset
    });
  } catch (error) {
    console.error("Error al obtener puestos:", error);
    res.status(500).json({ 
      success: false,
      message: "Error al obtener puestos" 
    });
  }
};

// Crear un nuevo puesto
export const createPuesto = async (req, res) => {
  try {
    const { nombre, descripcion, salarioMinimo, salarioMaximo, departamentoID } = req.body;
    
    if (!nombre) {
      return res.status(400).json({ 
        success: false,
        message: "El nombre es obligatorio" 
      });
    }

    const pool = await poolPromise;
    await pool.request()
      .input('nombre', nombre)
      .input('descripcion', descripcion || null)
      .input('salarioMinimo', salarioMinimo || null)
      .input('salarioMaximo', salarioMaximo || null)
      .input('departamentoID', departamentoID || null)
      .query(`
        INSERT INTO Puestos (NOMBRE, Descripcion, SalarioMinimo, SalarioMaximo, DepartamentoID, Estado, FechaCreacion) 
        VALUES (@nombre, @descripcion, @salarioMinimo, @salarioMaximo, @departamentoID, 1, GETDATE())
      `);
    
    res.json({ 
      success: true,
      message: "Puesto creado correctamente" 
    });
  } catch (error) {
    console.error("Error al crear puesto:", error);
    res.status(500).json({ 
      success: false,
      message: "Error al crear puesto" 
    });
  }
};

// Actualizar un puesto
export const updatePuesto = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, salarioMinimo, salarioMaximo, departamentoID } = req.body;

    if (!nombre) {
      return res.status(400).json({ 
        success: false,
        message: "El nombre es obligatorio" 
      });
    }

    const pool = await poolPromise;
    await pool.request()
      .input('id', id)
      .input('nombre', nombre)
      .input('descripcion', descripcion || null)
      .input('salarioMinimo', salarioMinimo || null)
      .input('salarioMaximo', salarioMaximo || null)
      .input('departamentoID', departamentoID || null)
      .query(`
        UPDATE Puestos 
        SET NOMBRE = @nombre,
            Descripcion = @descripcion,
            SalarioMinimo = @salarioMinimo,
            SalarioMaximo = @salarioMaximo,
            DepartamentoID = @departamentoID
        WHERE PuestoID = @id
      `);
    
    res.json({ 
      success: true,
      message: "Puesto actualizado correctamente" 
    });
  } catch (error) {
    console.error("Error al actualizar puesto:", error);
    res.status(500).json({ 
      success: false,
      message: "Error al actualizar puesto" 
    });
  }
};

// Eliminar un puesto (soft delete)
export const deletePuesto = async (req, res) => {
  try {
    const { id } = req.params;
    
    const pool = await poolPromise;
    await pool.request()
      .input('id', id)
      .query("UPDATE Puestos SET Estado = 0 WHERE PuestoID = @id");
    
    res.json({ 
      success: true,
      message: "Puesto eliminado correctamente" 
    });
  } catch (error) {
    console.error("Error al eliminar puesto:", error);
    res.status(500).json({ 
      success: false,
      message: "Error al eliminar puesto" 
    });
  }
};