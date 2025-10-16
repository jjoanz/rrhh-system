import { apiRequest } from './apiClient';

// Obtener todas las acciones
export const getAcciones = async () => {
  try {
    return await apiRequest('/acciones-personal');
  } catch (error) {
    console.error('Error al obtener acciones:', error);
    return { success: false, message: error.message };
  }
};

// Obtener estadísticas
export const getEstadisticas = async () => {
  try {
    return await apiRequest('/acciones-personal/estadisticas');
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return { success: false, message: error.message };
  }
};

// Obtener acciones pendientes
export const getAccionesPendientes = async () => {
  try {
    return await apiRequest('/acciones-personal/pendientes');
  } catch (error) {
    console.error('Error al obtener acciones pendientes:', error);
    return { success: false, message: error.message };
  }
};

// Obtener detalle de una acción específica
export const getAccionDetalle = async (accionId) => {
  try {
    return await apiRequest(`/acciones-personal/${accionId}`);
  } catch (error) {
    console.error('Error al obtener detalle de acción:', error);
    return { success: false, message: error.message };
  }
};

// Crear nueva acción
export const crearAccion = async (datosAccion) => {
  try {
    return await apiRequest('/acciones-personal', {
      method: 'POST',
      body: JSON.stringify(datosAccion)
    });
  } catch (error) {
    console.error('Error al crear acción:', error);
    return { success: false, message: error.message };
  }
};

// Aprobar acción
export const aprobarAccion = async (accionId, comentarios) => {
  try {
    return await apiRequest(`/acciones-personal/${accionId}/aprobar`, {
      method: 'POST',
      body: JSON.stringify({ comentarios })
    });
  } catch (error) {
    console.error('Error al aprobar acción:', error);
    return { success: false, message: error.message };
  }
};

// Rechazar acción
export const rechazarAccion = async (accionId, motivo) => {
  try {
    return await apiRequest(`/acciones-personal/${accionId}/rechazar`, {
      method: 'POST',
      body: JSON.stringify({ motivo })
    });
  } catch (error) {
    console.error('Error al rechazar acción:', error);
    return { success: false, message: error.message };
  }
};

// Ejecutar acción
export const ejecutarAccion = async (accionId) => {
  try {
    return await apiRequest(`/acciones-personal/${accionId}/ejecutar`, {
      method: 'POST'
    });
  } catch (error) {
    console.error('Error al ejecutar acción:', error);
    return { success: false, message: error.message };
  }
};