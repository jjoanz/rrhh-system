import { poolPromise } from '../db.js';
import sql from 'mssql';

// Listar empleados
export const getEmpleados = async (req, res) => {
  try {
    const pool = await poolPromise;
    
    const result = await pool.request().query(`
      SELECT 
        e.EmpleadoID,
        e.NOMBRE as Nombre,
        e.APELLIDO as Apellido,
        e.CEDULA,
        e.Email,
        e.Telefono,
        e.Direccion,
        e.CARGO as NombrePuesto,
        e.Salario,
        e.FECHAINGRESO,
        e.ESTADO,
        e.DEPARTAMENTOID,
        e.FechaCreacion,
        e.FechaModificacion,
        d.Nombre as DEPARTAMENTO_NOMBRE
      FROM Empleados e
      LEFT JOIN Departamentos d ON e.DEPARTAMENTOID = d.DepartamentoID
      WHERE e.ESTADO = 1
      ORDER BY e.NOMBRE, e.APELLIDO
    `);

    res.json({
      success: true,
      empleados: result.recordset
    });
  } catch (error) {
    console.error('Error al obtener empleados:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener empleados',
      error: error.message 
    });
  }
};

// Crear empleado
export const createEmpleado = async (req, res) => {
  try {
    console.log('Datos recibidos en el backend:', req.body);

    const {
      nombre,
      apellido,
      cedula,
      email,
      telefono,
      direccion,
      cargo,
      salario,
      fechaIngreso,
      estado,
      departamentoID
    } = req.body;

    if (!nombre || !apellido) {
      return res.status(400).json({ 
        error: 'Los campos nombre y apellido son obligatorios' 
      });
    }

    if (!cedula) {
      return res.status(400).json({ 
        error: 'La cédula es obligatoria' 
      });
    }

    const pool = await poolPromise;

    const result = await pool.request()
      .input("Nombre", sql.NVarChar, nombre)
      .input("Apellido", sql.NVarChar, apellido)
      .input("Cedula", sql.NVarChar, cedula)
      .input("Email", sql.NVarChar, email || null)
      .input("Telefono", sql.NVarChar, telefono || null)
      .input("Direccion", sql.NVarChar, direccion || null)
      .input("Cargo", sql.NVarChar, cargo || null)
      .input("Salario", sql.Decimal(10, 2), salario || null)
      .input("FechaIngreso", sql.Date, fechaIngreso || null)
      .input("Estado", sql.Bit, estado !== undefined ? parseInt(estado) || 1 : 1)
      .input("DepartamentoID", sql.Int, departamentoID || null)
      .query(`
        INSERT INTO Empleados
        (NOMBRE, APELLIDO, CEDULA, Email, Telefono, Direccion, CARGO, Salario, FECHAINGRESO, ESTADO, DEPARTAMENTOID)
        VALUES
        (@Nombre, @Apellido, @Cedula, @Email, @Telefono, @Direccion, @Cargo, @Salario, @FechaIngreso, @Estado, @DepartamentoID);
        SELECT SCOPE_IDENTITY() AS EmpleadoID;
      `);

    res.status(201).json({ 
      message: "Empleado creado exitosamente", 
      empleadoId: result.recordset[0].EmpleadoID,
      id: result.recordset[0].EmpleadoID,
      EmpleadoID: result.recordset[0].EmpleadoID
    });
  } catch (err) {
    console.error('Error al crear empleado:', err);
    res.status(500).json({ 
      error: 'Error al crear empleado',
      detalles: err.message 
    });
  }
};

// Actualizar empleado
export const updateEmpleado = async (req, res) => {
  try {
    const { EmpleadoID } = req.params;
    
    console.log('Actualizando empleado:', EmpleadoID);
    console.log('Datos recibidos:', req.body);

    const {
      nombre,
      apellido,
      cedula,
      email,
      telefono,
      direccion,
      cargo,
      salario,
      fechaIngreso,
      estado,
      departamentoID
    } = req.body;

    if (!nombre || !apellido) {
      return res.status(400).json({ 
        error: 'Los campos nombre y apellido son obligatorios' 
      });
    }

    const pool = await poolPromise;

    await pool.request()
      .input("EmpleadoID", sql.Int, EmpleadoID)
      .input("Nombre", sql.NVarChar, nombre)
      .input("Apellido", sql.NVarChar, apellido)
      .input("Cedula", sql.NVarChar, cedula)
      .input("Email", sql.NVarChar, email || null)
      .input("Telefono", sql.NVarChar, telefono || null)
      .input("Direccion", sql.NVarChar, direccion || null)
      .input("Cargo", sql.NVarChar, cargo || null)
      .input("Salario", sql.Decimal(10, 2), salario || null)
      .input("FechaIngreso", sql.Date, fechaIngreso || null)
      .input("Estado", sql.Bit, estado !== undefined ? parseInt(estado) || 1 : 1)
      .input("DepartamentoID", sql.Int, departamentoID || null)
      .query(`
        UPDATE Empleados
        SET NOMBRE=@Nombre,
            APELLIDO=@Apellido,
            CEDULA=@Cedula,
            Email=@Email,
            Telefono=@Telefono,
            Direccion=@Direccion,
            CARGO=@Cargo,
            Salario=@Salario,
            FECHAINGRESO=@FechaIngreso,
            ESTADO=@Estado,
            DEPARTAMENTOID=@DepartamentoID,
            FechaModificacion=GETDATE()
        WHERE EmpleadoID=@EmpleadoID
      `);

    res.json({ message: "Empleado actualizado correctamente" });
  } catch (err) {
    console.error('Error al actualizar empleado:', err);
    res.status(500).json({ 
      error: 'Error al actualizar empleado',
      detalles: err.message 
    });
  }
};

// Eliminar empleado
export const deleteEmpleado = async (req, res) => {
  try {
    const { EmpleadoID } = req.params;
    
    console.log('Eliminando empleado:', EmpleadoID);
    
    const pool = await poolPromise;

    await pool.request()
      .input("EmpleadoID", sql.Int, EmpleadoID)
      .query("DELETE FROM Empleados WHERE EmpleadoID=@EmpleadoID");

    res.json({ message: "Empleado eliminado correctamente" });
  } catch (err) {
    console.error('Error al eliminar empleado:', err);
    res.status(500).json({ 
      error: 'Error al eliminar empleado',
      detalles: err.message 
    });
  }
};

// ============================================
// FUNCIONES DE EXPEDIENTES
// ============================================

// Obtener expediente por empleado
export const getExpedienteByEmpleado = async (req, res) => {
  try {
    const { empleadoId } = req.params;
    const pool = await poolPromise;

    const result = await pool.request()
      .input('EmpleadoID', sql.Int, empleadoId)
      .query(`
        SELECT 
          e.ExpedienteID,
          e.NumeroExpediente,
          e.EmpleadoID,
          e.FechaCreacion,
          e.Estado,
          (SELECT COUNT(*) FROM DocumentosExpediente WHERE ExpedienteID = e.ExpedienteID AND Estado = 'activo') AS TotalDocumentos
        FROM Expedientes e
        WHERE e.EmpleadoID = @EmpleadoID
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Expediente no encontrado' 
      });
    }

    res.json({
      success: true,
      expediente: result.recordset[0]
    });
  } catch (error) {
    console.error('Error al obtener expediente:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener expediente',
      error: error.message 
    });
  }
};

// Obtener documentos de un expediente
export const getDocumentosExpediente = async (req, res) => {
  try {
    const { expedienteId } = req.params;
    const pool = await poolPromise;

    const result = await pool.request()
      .input('ExpedienteID', sql.Int, expedienteId)
      .query(`
        SELECT 
          d.DocumentoID,
          d.NombreOriginal,
          d.TipoArchivo,
          d.Tamaño,
          d.FechaCarga,
          d.Descripcion,
          d.FechaVencimiento,
          c.Nombre AS Categoria,
          c.Color AS CategoriaColor
        FROM DocumentosExpediente d
        LEFT JOIN CategoriasDocumento c ON d.CategoriaID = c.CategoriaID
        WHERE d.ExpedienteID = @ExpedienteID AND d.Estado = 'activo'
        ORDER BY d.FechaCarga DESC
      `);

    res.json({
      success: true,
      documentos: result.recordset
    });
  } catch (error) {
    console.error('Error al obtener documentos:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener documentos',
      error: error.message 
    });
  }
};

// Obtener categorías de documentos
export const getCategorias = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT CategoriaID, Nombre, Color, Icono
      FROM CategoriasDocumento
      WHERE Activo = 1
      ORDER BY Orden
    `);

    res.json({
      success: true,
      categorias: result.recordset
    });
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener categorías',
      error: error.message 
    });
  }
};