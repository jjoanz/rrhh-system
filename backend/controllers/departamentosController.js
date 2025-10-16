/// backend/controllers/departamentosController.js
import { poolPromise } from '../db.js';
import sql from 'mssql';

// GET - Obtener todos los departamentos
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

// POST - Crear un nuevo departamento
export const createDepartamento = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ 
        success: false,
        message: 'El nombre del departamento es requerido' 
      });
    }

    const pool = await poolPromise; // ✅ Usar poolPromise consistente
    
    const result = await pool.request()
      .input('nombre', sql.VarChar(100), nombre.trim())
      .input('descripcion', sql.VarChar(500), descripcion?.trim() || null)
      .query(`
        INSERT INTO Departamentos (Nombre, Descripcion, Estado) 
        OUTPUT INSERTED.DepartamentoID, INSERTED.Nombre, INSERTED.Descripcion
        VALUES (@nombre, @descripcion, 1)
      `);

    res.status(201).json({
      success: true,
      message: 'Departamento creado exitosamente',
      departamento: result.recordset[0]
    });

  } catch (error) {
    console.error('Error creando departamento:', error);
    
    if (error.number === 2627) { // Duplicate key
      return res.status(400).json({ 
        success: false,
        message: 'Ya existe un departamento con ese nombre' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error creando departamento',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// PUT - Actualizar un departamento
export const updateDepartamento = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ 
        success: false,
        message: 'El nombre del departamento es requerido' 
      });
    }

    const pool = await poolPromise; // ✅ Usar poolPromise consistente
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('nombre', sql.VarChar(100), nombre.trim())
      .input('descripcion', sql.VarChar(500), descripcion?.trim() || null)
      .query(`
        UPDATE Departamentos 
        SET Nombre = @nombre, Descripcion = @descripcion
        WHERE DepartamentoID = @id AND Estado = 1
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Departamento no encontrado' 
      });
    }

    res.json({
      success: true,
      message: 'Departamento actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error actualizando departamento:', error);
    
    if (error.number === 2627) { // Duplicate key
      return res.status(400).json({ 
        success: false,
        message: 'Ya existe un departamento con ese nombre' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error actualizando departamento',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// DELETE - Eliminar un departamento (soft delete)
export const deleteDepartamento = async (req, res) => {
  try {
    const { id } = req.params;

    const pool = await poolPromise; // ✅ Usar poolPromise consistente
    
    // Soft delete: cambiar Estado a 0 en lugar de eliminar
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        UPDATE Departamentos 
        SET Estado = 0 
        WHERE DepartamentoID = @id AND Estado = 1
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Departamento no encontrado' 
      });
    }

    res.json({
      success: true,
      message: 'Departamento eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando departamento:', error);
    
    if (error.number === 547) { // Foreign key constraint
      return res.status(400).json({ 
        success: false,
        message: 'No se puede eliminar el departamento porque tiene empleados asignados' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error eliminando departamento',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};