import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export const getEmpleados = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/empleados`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener empleados:', error);
    throw error;
  }
};

export const exportEmpleados = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/empleados/export`);
    return response.data;
  } catch (error) {
    console.error('Error al exportar empleados:', error);
    throw error;
  }
};