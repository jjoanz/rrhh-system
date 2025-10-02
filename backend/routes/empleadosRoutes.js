import express from 'express';
import sql from 'mssql';
import {
  getEmpleados,
  createEmpleado,
  updateEmpleado,
  deleteEmpleado
} from '../controllers/empleadosController.js';

const router = express.Router();

// Listar empleados
router.get('/list', getEmpleados);

// Obtener empleado por ID - NUEVA RUTA
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = req.app.locals.db;
    
    const result = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query(`
        SELECT 
          e.EmpleadoID,
          e.NOMBRE,
          e.APELLIDO,
          e.CORREO,
          e.TELEFONO,
          e.ROL,
          e.DEPARTAMENTOID,
          e.PUESTOID,
          d.Nombre as Departamento,
          p.NOMBRE as Puesto
        FROM Empleados e
        LEFT JOIN Departamentos d ON e.DEPARTAMENTOID = d.DepartamentoID
        LEFT JOIN Puestos p ON e.PUESTOID = p.PuestoID
        WHERE e.EmpleadoID = @id
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }
    
    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error al obtener empleado:', error);
    res.status(500).json({ error: error.message });
  }
});

// Crear nuevo empleado
router.post('/create', createEmpleado);

// Actualizar empleado
router.put('/update/:EmpleadoID', updateEmpleado);

// Eliminar empleado
router.delete('/delete/:EmpleadoID', deleteEmpleado);

export default router;