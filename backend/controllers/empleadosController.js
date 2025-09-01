import { poolPromise } from '../db.js';

// Listar empleados
export const getEmpleados = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query("SELECT TOP 50 * FROM Empleados ORDER BY EmpleadoID DESC");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
        (Nombre, Apellido, Cedula, Email, Telefono, Direccion, Cargo, Salario, FechaIngreso, Estado, DepartamentoID)
        VALUES
        (@Nombre, @Apellido, @Cedula, @Email, @Telefono, @Direccion, @Cargo, @Salario, @FechaIngreso, @Estado, @DepartamentoID);
        SELECT SCOPE_IDENTITY() AS EmpleadoID;
      `);

    res.status(201).json({ message: "Empleado creado exitosamente", EmpleadoID: result.recordset[0].EmpleadoID });
  } catch (err) {
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
        SET Nombre=@Nombre,
            Apellido=@Apellido,
            Cedula=@Cedula,
            Email=@Email,
            Telefono=@Telefono,
            Direccion=@Direccion,
            Cargo=@Cargo,
            Salario=@Salario,
            FechaIngreso=@FechaIngreso,
            Estado=@Estado,
            DepartamentoID=@DepartamentoID,
            FechaModificacion=GETDATE()
        WHERE EmpleadoID=@EmpleadoID
      `);

    res.json({ message: "Empleado actualizado correctamente" });
  } catch (err) {
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
    res.status(500).json({ error: err.message });
  }
};
