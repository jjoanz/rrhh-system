import express from 'express';
import { 
  getNominas, 
  getNominaById, 
  procesarNomina,
  marcarNominaPagada,
  generarReporteNomina,
  eliminarNomina,
  getEmpleadosActivos,
  getConfiguracion,
  actualizarConfiguracion
} from '../controllers/nominaController.js';

const router = express.Router();

// ==========================================
// RUTAS ESPECÍFICAS PRIMERO
// ==========================================

// GET /api/nomina/configuracion - Obtener configuración de nómina (ISR, TSS, etc.)
router.get('/configuracion', getConfiguracion);

// PUT /api/nomina/configuracion - Actualizar configuración de nómina
// Body: { configuraciones: [{ codigo: 'TSS_AFP', porcentaje: 2.87, ... }] }
router.put('/configuracion', actualizarConfiguracion);

// GET /api/nomina/list - Listar todas las nóminas con filtros opcionales
// Query params: periodo, empleadoId, estado
router.get('/list', getNominas);

// GET /api/nomina/empleados-activos - Obtener empleados activos para nómina
router.get('/empleados-activos', getEmpleadosActivos);

// GET /api/nomina/reportes/generar - Generar reportes de nómina
// Query params: periodo?, tipo? (completo|resumen|aportes)
router.get('/reportes/generar', generarReporteNomina);

// POST /api/nomina/procesar - Procesar nueva nómina
// Body: { periodo: "2024-01", empleadosIds?: [1,2,3] }
router.post('/procesar', procesarNomina);

// PUT /api/nomina/pagar - Marcar nóminas como pagadas
// Body: { nominaIds: [1,2,3], fechaPago: "2024-01-31" }
router.put('/pagar', marcarNominaPagada);

// ==========================================
// RUTAS DINÁMICAS AL FINAL
// ==========================================

// GET /api/nomina/:id - Obtener detalle de una nómina específica
router.get('/:id', getNominaById);

// DELETE /api/nomina/:id - Eliminar nómina (solo si no está pagada)
router.delete('/:id', eliminarNomina);

export default router;