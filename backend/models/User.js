import bcrypt from "bcrypt";
import sql from "mssql";
import { executeQuery, getConnection } from "../db.js";

const ROLES = [
  "admin",
  "director_rrhh", 
  "gerente_rrhh",
  "rrhh",
  "director",
  "gerente",
  "colaborador",
];

// ======================================
// FUNCIONES DE USUARIO PRINCIPALES
// ======================================

export const createUser = async ({ username, email, password, role, empleadoId = null }) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const result = await executeQuery(
    `INSERT INTO Usuarios (Username, Email, PasswordHash, Rol, EmpleadoID, Estado, FechaCreacion) 
     OUTPUT INSERTED.* 
     VALUES (@username, @email, @password, @role, @empleadoId, 1, GETDATE())`,
    [
      { name: "username", type: sql.NVarChar, value: username },
      { name: "email", type: sql.NVarChar, value: email },
      { name: "password", type: sql.NVarChar, value: hashedPassword },
      { name: "role", type: sql.NVarChar, value: role || "colaborador" },
      { name: "empleadoId", type: sql.Int, value: empleadoId },
    ]
  );

  return result.recordset[0];
};

export const findUserByEmail = async (email) => {
  const result = await executeQuery(
    "SELECT * FROM Usuarios WHERE Email = @email AND Estado = 1",
    [{ name: "email", type: sql.NVarChar, value: email }]
  );
  return result.recordset[0] || null;
};

export const findUserByUsername = async (username) => {
  const result = await executeQuery(
    "SELECT * FROM Usuarios WHERE Username = @username AND Estado = 1",
    [{ name: "username", type: sql.NVarChar, value: username }]
  );
  return result.recordset[0] || null;
};

export const matchPassword = async (enteredPassword, hashedPassword) => {
  return await bcrypt.compare(enteredPassword, hashedPassword);
};

// ======================================
// FUNCIONES DE PERMISOS
// ======================================

export const getRoleId = async (roleName) => {
  const result = await executeQuery(
    'SELECT RolID FROM Roles WHERE NombreRol = @roleName',
    [{ name: "roleName", type: sql.NVarChar, value: roleName }]
  );
  return result.recordset[0]?.RolID || null;
};

export const getUserPermissions = async (userId) => {
  const pool = await getConnection();
  
  try {
    // Obtener rol del usuario
    const userResult = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT Rol FROM Usuarios 
        WHERE UsuarioID = @userId AND Estado = 1
      `);

    if (userResult.recordset.length === 0) {
      return [];
    }

    const userRole = userResult.recordset[0].Rol;
    const roleId = await getRoleId(userRole);

    if (!roleId) {
      return [];
    }

    // Obtener permisos del rol
    const permissionsResult = await pool.request()
      .input('rolId', sql.Int, roleId)
      .query(`
        SELECT 
          p.ModuloID,
          m.NombreModulo,
          p.EstaVisible,
          p.PuedeVer,
          p.PuedeCrear,
          p.PuedeEditar,
          p.PuedeEliminar
        FROM RolPermisos p
        INNER JOIN Modulos m ON p.ModuloID = m.ModuloID
        WHERE p.RolID = @rolId
      `);

    return permissionsResult.recordset;
  } catch (error) {
    console.error('Error obteniendo permisos:', error);
    return [];
  }
};

export const hasPermission = async (userId, moduleName, action = 'PuedeVer') => {
  const permissions = await getUserPermissions(userId);
  
  const modulePermission = permissions.find(
    p => p.NombreModulo === moduleName
  );

  return modulePermission && 
         modulePermission.EstaVisible && 
         modulePermission[action];
};

// ======================================
// FUNCIONES DE ADMINISTRACIÓN
// ======================================

export const getAllUsers = async () => {
  const result = await executeQuery(
    `SELECT 
      UsuarioID,
      Username,
      Email,
      Rol,
      EmpleadoID,
      Estado,
      FechaCreacion
    FROM Usuarios 
    ORDER BY FechaCreacion DESC`
  );
  return result.recordset;
};

export const updateUser = async (userId, updates) => {
  const { username, email, role, estado } = updates;
  
  const result = await executeQuery(
    `UPDATE Usuarios 
     SET Username = @username,
         Email = @email,
         Rol = @role,
         Estado = @estado
     WHERE UsuarioID = @userId`,
    [
      { name: "userId", type: sql.Int, value: userId },
      { name: "username", type: sql.NVarChar, value: username },
      { name: "email", type: sql.NVarChar, value: email },
      { name: "role", type: sql.NVarChar, value: role },
      { name: "estado", type: sql.Bit, value: estado },
    ]
  );
  
  return result.rowsAffected[0] > 0;
};

export const deleteUser = async (userId) => {
  // Soft delete
  const result = await executeQuery(
    `UPDATE Usuarios 
    SET PasswordHash = @password 
    WHERE UsuarioID = @userId`,
    [{ name: "userId", type: sql.Int, value: userId }]
  );
  
  return result.rowsAffected[0] > 0;
};

export const changePassword = async (userId, newPassword) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  const result = await executeQuery(
    `UPDATE Usuarios 
     SET Password = @password 
     WHERE UsuarioID = @userId`,
    [
      { name: "userId", type: sql.Int, value: userId },
      { name: "password", type: sql.NVarChar, value: hashedPassword },
    ]
  );
  
  return result.rowsAffected[0] > 0;
};