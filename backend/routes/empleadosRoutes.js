import express from 'express';
import {
  getEmpleados,
  createEmpleado,
  updateEmpleado,
  deleteEmpleado
} from '../controllers/empleadosController.js';

const router = express.Router();

// Listar empleados
router.get('/list', getEmpleados);

// Crear nuevo empleado
router.post('/create', createEmpleado);

// Actualizar empleado
router.put('/update/:EmpleadoID', updateEmpleado);

// Eliminar empleado
router.delete('/delete/:EmpleadoID', deleteEmpleado);

export default router;
