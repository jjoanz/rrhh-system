// src/api/empleadosService.js
import api from './api'; // usa la instancia unificada con token e interceptores

// Obtener todos los empleados
export const getEmpleados = async () => {
  try {
    const response = await api.get('/empleados');
    return response.data;
  } catch (error) {
    console.error('Error al obtener empleados:', error);
    throw error;
  }
};

// Exportar empleados
export const exportEmpleados = async () => {
  try {
    const response = await api.get('/empleados/export');
    return response.data;
  } catch (error) {
    console.error('Error al exportar empleados:', error);
    throw error;
  }
};
