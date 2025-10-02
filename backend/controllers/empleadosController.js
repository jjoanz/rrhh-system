import { poolPromise } from '../db.js';
import sql from 'mssql';

// Listar empleados
export const getEmpleados = async (req, res) => {
  try {
    const pool = await poolPromise;
    
    // Consulta con JOIN para obtener nombre del departamento
    const result = await pool.request().query(`
      SELECT 
        e.EmpleadoID,
        e.NOMBRE,
        e.APELLIDO,
        e.CEDULA,
        e.Email,
        e.Telefono,
        e.Direccion,
        e.CARGO,
        e.Salario,
        e.FECHAINGRESO,
        e.ESTADO,
        e.DEPARTAMENTOID,
        e.FechaCreacion,
        e.FechaModificacion,
        d.Nombre as DEPARTAMENTO_NOMBRE
      FROM Empleados e
      LEFT JOIN Departamentos d ON e.DEPARTAMENTOID = d.DepartamentoID
      ORDER BY e.EmpleadoID
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error('Error al obtener empleados:', error);
    res.status(500).json({ 
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

    // Validación de campos obligatorios
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
      empleadoId: result.recordset[0].EmpleadoID,  // ← minúscula para coincidir con frontend
      id: result.recordset[0].EmpleadoID,          // ← alternativa
      EmpleadoID: result.recordset[0].EmpleadoID   // ← formato SQL Server
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

    // Validación de campos obligatorios
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