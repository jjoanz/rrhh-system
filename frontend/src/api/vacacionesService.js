import api from './api';

const vacacionesService = {
  // Obtener solicitudes según rol
  async getSolicitudes(usuarioID, rol) {
    try {
      const response = await api.get(`/vacaciones?usuarioID=${usuarioID}&rol=${rol}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener solicitudes:', error);
      throw error;
    }
  },

  // Crear nueva solicitud
  async crearSolicitud(datos) {
    try {
      const response = await api.post('/vacaciones', datos);
      return response.data;
    } catch (error) {
      console.error('Error al crear solicitud:', error);
      throw error;
    }
  },

  // Procesar solicitud (aprobar/rechazar)
  async procesarSolicitud(solicitudId, datos) {
    try {
      const response = await api.put(`/vacaciones/${solicitudId}/procesar`, datos);
      return response.data;
    } catch (error) {
      console.error('Error al procesar solicitud:', error);
      throw error;
    }
  },

  // Obtener estadísticas del empleado
  async getEstadisticas(empleadoId) {
    try {
      const response = await api.get(`/vacaciones/estadisticas/${empleadoId}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw error;
    }
  }
};

export default vacacionesService;