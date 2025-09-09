// src/api/nominaService.js
// src/api/nominaService.js
import api from './api'; // usa la instancia unificada con token e interceptores

// Obtener todas las nóminas con filtros opcionales
export const getNominas = async (filtros = {}) => {
  try {
    const params = new URLSearchParams();
    if (filtros.periodo) params.append('periodo', filtros.periodo);
    if (filtros.empleadoId) params.append('empleadoId', filtros.empleadoId);
    if (filtros.estado) params.append('estado', filtros.estado);

    const response = await api.get(`/nomina/list?${params}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener nóminas:', error);
    throw error;
  }
};

// Obtener detalle de nómina por ID
export const getNominaById = async (id) => {
  try {
    const response = await api.get(`/nomina/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener detalle de nómina:', error);
    throw error;
  }
};

// Procesar nueva nómina
export const procesarNomina = async (data) => {
  try {
    const response = await api.post('/nomina/procesar', data);
    return response.data;
  } catch (error) {
    console.error('Error al procesar nómina:', error);
    throw error;
  }
};

// Marcar nóminas como pagadas
export const marcarNominaPagada = async (data) => {
  try {
    const response = await api.put('/nomina/pagar', data);
    return response.data;
  } catch (error) {
    console.error('Error al marcar nómina como pagada:', error);
    throw error;
  }
};

// Generar reporte de nómina
export const generarReporteNomina = async (filtros = {}) => {
  try {
    const params = new URLSearchParams();
    if (filtros.periodo) params.append('periodo', filtros.periodo);
    if (filtros.tipo) params.append('tipo', filtros.tipo);

    const response = await api.get(`/nomina/reportes/generar?${params}`);
    return response.data;
  } catch (error) {
    console.error('Error al generar reporte:', error);
    throw error;
  }
};

// Eliminar nómina
export const eliminarNomina = async (id) => {
  try {
    const response = await api.delete(`/nomina/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar nómina:', error);
    throw error;
  }
};

// Obtener empleados activos para nómina
export const getEmpleadosActivos = async () => {
  try {
    const response = await api.get('/nomina/empleados-activos');
    return response.data;
  } catch (error) {
    console.error('Error al obtener empleados activos:', error);
    throw error;
  }
};
