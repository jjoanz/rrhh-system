// src/api/empleadosService.js
import api from './api';

// Obtener todos los empleados
const getEmpleados = async () => {
  try {
    const response = await api.get('/empleados/list');
    return response.data;
  } catch (error) {
    console.error('Error al obtener empleados:', error);
    throw error;
  }
};

// Exportar empleados
const exportEmpleados = async () => {
  try {
    const response = await api.get('/empleados/export');
    return response.data;
  } catch (error) {
    console.error('Error al exportar empleados:', error);
    throw error;
  }
};

// ============================================
// FUNCIONES DE EXPEDIENTES
// ============================================

// Obtener expediente de un empleado
const getExpedienteByEmpleado = async (empleadoId) => {
  try {
    const response = await api.get(`/empleados/${empleadoId}/expediente`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener expediente:', error);
    throw error;
  }
};

// Obtener documentos del expediente
const getDocumentosExpediente = async (expedienteId) => {
  try {
    const response = await api.get(`/empleados/expediente/${expedienteId}/documentos`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener documentos:', error);
    throw error;
  }
};

// Subir documento al expediente
const uploadDocumento = async (expedienteId, formData) => {
  try {
    const response = await api.post(`/empleados/expediente/${expedienteId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al subir documento:', error);
    throw error;
  }
};

// Descargar documento
const downloadDocumento = (documentoId) => {
  return `${api.defaults.baseURL}/empleados/documento/${documentoId}/download`;
};

// Eliminar documento
const deleteDocumento = async (documentoId) => {
  try {
    const response = await api.delete(`/empleados/documento/${documentoId}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar documento:', error);
    throw error;
  }
};

// Obtener categorías de documentos
const getCategorias = async () => {
  try {
    const response = await api.get('/empleados/categorias/documentos');
    return response.data;
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    throw error;
  }
};

// Exportación default como objeto
const empleadosService = {
  getEmpleados,
  exportEmpleados,
  getExpedienteByEmpleado,
  getDocumentosExpediente,
  uploadDocumento,
  downloadDocumento,
  deleteDocumento,
  getCategorias
};

export default empleadosService;