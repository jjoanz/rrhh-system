// frontend/src/api/postulacionesService.js
import api from './api';

const postulacionesService = {
  // Obtener todas las postulaciones con filtros
  async getPostulaciones(filtros = {}) {
    try {
      console.log('📋 Obteniendo postulaciones con filtros:', filtros);
      const params = new URLSearchParams();
      
      Object.keys(filtros).forEach(key => {
        if (filtros[key] !== '' && filtros[key] !== null && filtros[key] !== undefined) {
          params.append(key, filtros[key]);
        }
      });
      
      const response = await api.get(`/postulaciones?${params.toString()}`);
      console.log('✅ Postulaciones obtenidas:', response.data?.length || 0);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener postulaciones:', error.response?.data || error.message);
      throw error;
    }
  },

  // Obtener postulación por ID
  async getPostulacionById(id) {
    try {
      console.log('🔍 Obteniendo postulación:', id);
      const response = await api.get(`/postulaciones/${id}`);
      console.log('✅ Postulación obtenida:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener postulación:', error.response?.data || error.message);
      throw error;
    }
  },

  // Crear nueva postulación
  async crearPostulacion(postulacion) {
    try {
      console.log('➕ Creando postulación:', postulacion);
      const response = await api.post('/postulaciones', postulacion);
      console.log('✅ Postulación creada:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al crear postulación:', error.response?.data || error.message);
      throw error;
    }
  },

  // Actualizar postulación
  async actualizarPostulacion(id, datos) {
    try {
      console.log('✏️ Actualizando postulación:', id, datos);
      const response = await api.put(`/postulaciones/${id}`, datos);
      console.log('✅ Postulación actualizada:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al actualizar postulación:', error.response?.data || error.message);
      throw error;
    }
  },

  // Cambiar estado
  async cambiarEstado(id, estado, comentarios = '', revisadoPor = null) {
    try {
      console.log('🔄 Cambiando estado de postulación:', id, 'a', estado);
      const response = await api.put(`/postulaciones/${id}/estado`, { 
        estado, 
        comentarios,
        revisadoPor
      });
      console.log('✅ Estado cambiado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al cambiar estado:', error.response?.data || error.message);
      throw error;
    }
  },

  // Calificar postulación
  async calificar(id, calificacion, comentarios = '', revisadoPor = null) {
    try {
      console.log('⭐ Calificando postulación:', id, 'con', calificacion);
      const response = await api.put(`/postulaciones/${id}/calificar`, { 
        calificacion, 
        comentarios,
        revisadoPor
      });
      console.log('✅ Calificación registrada:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al calificar:', error.response?.data || error.message);
      throw error;
    }
  },

  // Eliminar postulación
  async eliminar(id) {
    try {
      console.log('🗑️ Eliminando postulación:', id);
      const response = await api.delete(`/postulaciones/${id}`);
      console.log('✅ Postulación eliminada:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al eliminar postulación:', error.response?.data || error.message);
      throw error;
    }
  },

  // Obtener estadísticas
  async getEstadisticas(vacanteId = null) {
    try {
      console.log('📊 Obteniendo estadísticas de postulaciones');
      const params = vacanteId ? `?vacanteId=${vacanteId}` : '';
      const response = await api.get(`/postulaciones/estadisticas${params}`);
      console.log('✅ Estadísticas obtenidas:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener estadísticas:', error.response?.data || error.message);
      throw error;
    }
  }
};

export default postulacionesService;