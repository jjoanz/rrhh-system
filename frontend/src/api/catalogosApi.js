import { apiRequest } from './apiClient';

// Obtener todos los empleados
export const getEmpleados = async () => {
  try {
    // Usar /empleados/list según la ruta definida en el backend
    return await apiRequest('/empleados/list');
  } catch (error) {
    console.error('Error al obtener empleados:', error);
    return { success: false, message: error.message, empleados: [] };
  }
};

// Obtener todos los departamentos
export const getDepartamentos = async () => {
  try {
    return await apiRequest('/departamentos');
  } catch (error) {
    console.error('Error al obtener departamentos:', error);
    return { success: false, message: error.message, departamentos: [] };
  }
};

// Obtener todos los puestos
export const getPuestos = async () => {
  try {
    return await apiRequest('/puestos');
  } catch (error) {
    console.error('Error al obtener puestos:', error);
    return { success: false, message: error.message, puestos: [] };
  }
};