import { poolPromise } from '../db.js';

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
    const {
      Nombre,
      Apellido,
      Cedula,
      Email,
      Telefono,
      Direccion,
      Cargo,
      Salario,
      FechaIngreso,
      Estado,
      DepartamentoID
    } = req.body;

    const pool = await poolPromise;

    const result = await pool.request()
      .input("Nombre", Nombre)
      .input("Apellido", Apellido)
      .input("Cedula", Cedula)
      .input("Email", Email)
      .input("Telefono", Telefono)
      .input("Direccion", Direccion)
      .input("Cargo", Cargo)
      .input("Salario", Salario)
      .input("FechaIngreso", FechaIngreso)
      .input("Estado", Estado)
      .input("DepartamentoID", DepartamentoID)
      .query(`
        INSERT INTO Empleados
        (NOMBRE, APELLIDO, CEDULA, Email, Telefono, Direccion, CARGO, Salario, FECHAINGRESO, ESTADO, DEPARTAMENTOID)
        VALUES
        (@Nombre, @Apellido, @Cedula, @Email, @Telefono, @Direccion, @Cargo, @Salario, @FechaIngreso, @Estado, @DepartamentoID);
        SELECT SCOPE_IDENTITY() AS EmpleadoID;
      `);

    res.status(201).json({ 
      message: "Empleado creado exitosamente", 
      EmpleadoID: result.recordset[0].EmpleadoID 
    });
  } catch (err) {
    console.error('Error al crear empleado:', err);
    res.status(500).json({ error: err.message });
  }
};

// Actualizar empleado
export const updateEmpleado = async (req, res) => {
  try {
    const { EmpleadoID } = req.params;
    const {
      Nombre,
      Apellido,
      Cedula,
      Email,
      Telefono,
      Direccion,
      Cargo,
      Salario,
      FechaIngreso,
      Estado,
      DepartamentoID
    } = req.body;

    const pool = await poolPromise;

    await pool.request()
      .input("EmpleadoID", EmpleadoID)
      .input("Nombre", Nombre)
      .input("Apellido", Apellido)
      .input("Cedula", Cedula)
      .input("Email", Email)
      .input("Telefono", Telefono)
      .input("Direccion", Direccion)
      .input("Cargo", Cargo)
      .input("Salario", Salario)
      .input("FechaIngreso", FechaIngreso)
      .input("Estado", Estado)
      .input("DepartamentoID", DepartamentoID)
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
    res.status(500).json({ error: err.message });
  }
};

// Eliminar empleado
export const deleteEmpleado = async (req, res) => {
  try {
    const { EmpleadoID } = req.params;
    const pool = await poolPromise;

    await pool.request()
      .input("EmpleadoID", EmpleadoID)
      .query("DELETE FROM Empleados WHERE EmpleadoID=@EmpleadoID");

    res.json({ message: "Empleado eliminado correctamente" });
  } catch (err) {
    console.error('Error al eliminar empleado:', err);
    res.status(500).json({ error: err.message });
  }
};