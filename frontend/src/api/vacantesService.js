// src/api/vacantesService.js
import api from './api';

const vacantesService = {
  // ===============================
  // VACANTES
  // ===============================
  
  // Obtener todas las vacantes activas
  async getVacantesActivas() {
    try {
      const response = await api.get('/vacantes');
      return response.data;
    } catch (error) {
      console.error('Error al obtener vacantes:', error?.response?.data || error.message);
      throw error;
    }
  },

  // Crear nueva vacante
  async crearVacante(vacante) {
    try {
      const response = await api.post('/vacantes', vacante);
      return response.data;
    } catch (error) {
      console.error('Error al crear vacante:', error?.response?.data || error.message);
      throw error;
    }
  },

  // Buscar vacantes con filtros
  async buscarVacantes(filtros) {
    try {
      const params = new URLSearchParams();
      Object.keys(filtros).forEach(key => {
        if (filtros[key] !== '' && filtros[key] !== null && filtros[key] !== undefined) {
          params.append(key, filtros[key]);
        }
      });
      const response = await api.get(`/vacantes/buscar?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error al buscar vacantes:', error?.response?.data || error.message);
      throw error;
    }
  },

  // ===============================
  // SOLICITUDES
  // ===============================
  
  async getSolicitudes(usuarioID, rol) {
    try {
      const params = new URLSearchParams();
      if (usuarioID) params.append('usuarioID', usuarioID);
      if (rol) params.append('rol', rol);
      const response = await api.get(`/vacantes/solicitudes?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener solicitudes:', error?.response?.data || error.message);
      throw error;
    }
  },

  async crearSolicitud(solicitud) {
    try {
      const response = await api.post('/vacantes/solicitudes', solicitud);
      return response.data;
    } catch (error) {
      console.error('Error al crear solicitud:', error?.response?.data || error.message);
      throw error;
    }
  },

  async aprobarSolicitud(solicitudId, comentarios = '') {
    try {
      const response = await api.put(`/vacantes/solicitudes/${solicitudId}/aprobar`, { comentarios });
      return response.data;
    } catch (error) {
      console.error('Error al aprobar solicitud:', error?.response?.data || error.message);
      throw error;
    }
  },

  async rechazarSolicitud(solicitudId, comentarios = '') {
    try {
      const response = await api.put(`/vacantes/solicitudes/${solicitudId}/rechazar`, { comentarios });
      return response.data;
    } catch (error) {
      console.error('Error al rechazar solicitud:', error?.response?.data || error.message);
      throw error;
    }
  },

  // ===============================
  // POSTULACIONES
  // ===============================
  
  async getPostulaciones(usuarioID, rol) {
    try {
      const params = new URLSearchParams();
      if (usuarioID) params.append('usuarioID', usuarioID);
      if (rol) params.append('rol', rol);
      const response = await api.get(`/vacantes/postulaciones?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener postulaciones:', error?.response?.data || error.message);
      throw error;
    }
  },

  async crearPostulacion(postulacion) {
    try {
      const response = await api.post('/vacantes/postulaciones', postulacion);
      return response.data;
    } catch (error) {
      console.error('Error al crear postulación:', error?.response?.data || error.message);
      throw error;
    }
  },

  async cambiarEstadoPostulacion(postulacionId, estado, comentarios = '') {
    try {
      const response = await api.put(`/vacantes/postulaciones/${postulacionId}/estado`, { estado, comentarios });
      return response.data;
    } catch (error) {
      console.error('Error al cambiar estado de postulación:', error?.response?.data || error.message);
      throw error;
    }
  },

  // ===============================
  // ESTADÍSTICAS Y REPORTES
  // ===============================
  
  async getEstadisticas() {
    try {
      const response = await api.get('/vacantes/estadisticas');
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error?.response?.data || error.message);
      throw error;
    }
  },

  async getReportesResumen() {
    try {
      const response = await api.get('/vacantes/reportes/resumen');
      return response.data;
    } catch (error) {
      console.error('Error al obtener resumen de reportes:', error?.response?.data || error.message);
      throw error;
    }
  },

  async exportarReporte(formato, tipo) {
    try {
      const response = await api.post('/vacantes/reportes/exportar', { formato, tipo });
      return response.data;
    } catch (error) {
      console.error('Error al exportar reporte:', error?.response?.data || error.message);
      throw error;
    }
  },

  // ===============================
  // DATOS AUXILIARES
  // ===============================
  
  async getDepartamentos() {
    try {
      const response = await api.get('/vacantes/departamentos');
      return response.data;
    } catch (error) {
      console.error('Error al obtener departamentos:', error?.response?.data || error.message);
      throw error;
    }
  },

  async getUsuarios() {
    try {
      const response = await api.get('/vacantes/usuarios');
      return response.data;
    } catch (error) {
      console.error('Error al obtener usuarios:', error?.response?.data || error.message);
      throw error;
    }
  }
};

export default vacantesService;
