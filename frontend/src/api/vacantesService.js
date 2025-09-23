// src/api/vacantesService.js
// frontend/src/api/vacantesService.js
import api from './api';

const vacantesService = {
  // ===============================
  // VACANTES
  // ===============================
  
  async getVacantesActivas() {
    try {
      console.log('Obteniendo vacantes activas...');
      const response = await api.get('/vacantes');
      console.log('Vacantes obtenidas:', response.data?.length || 0);
      return response.data;
    } catch (error) {
      console.error('Error al obtener vacantes:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  },

  async crearVacante(vacante) {
    try {
      console.log('Creando vacante:', vacante.titulo);
      const response = await api.post('/vacantes', vacante);
      console.log('Vacante creada:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al crear vacante:', error.response?.data || error.message);
      throw error;
    }
  },

  async buscarVacantes(filtros) {
    try {
      console.log('Buscando vacantes con filtros:', filtros);
      const params = new URLSearchParams();
      Object.keys(filtros).forEach(key => {
        if (filtros[key] !== '' && filtros[key] !== null && filtros[key] !== undefined) {
          params.append(key, filtros[key]);
        }
      });
      const response = await api.get(`/vacantes/buscar?${params.toString()}`);
      console.log('Búsqueda completada:', response.data?.length || 0);
      return response.data;
    } catch (error) {
      console.error('Error al buscar vacantes:', error.response?.data || error.message);
      throw error;
    }
  },

  async getVacantePorId(id) {
    try {
      console.log('Obteniendo vacante por ID:', id);
      const response = await api.get(`/vacantes/${id}`);
      console.log('Vacante obtenida:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al obtener vacante por ID:', error.response?.data || error.message);
      throw error;
    }
  },

  async actualizarVacante(id, datos) {
    try {
      console.log('Actualizando vacante:', id);
      const response = await api.put(`/vacantes/${id}`, datos);
      console.log('Vacante actualizada:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar vacante:', error.response?.data || error.message);
      throw error;
    }
  },

  async cerrarVacante(id, motivo) {
    try {
      console.log('Cerrando vacante:', id);
      const response = await api.put(`/vacantes/${id}/cerrar`, { motivo });
      console.log('Vacante cerrada:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al cerrar vacante:', error.response?.data || error.message);
      throw error;
    }
  },

  // ===============================
  // SOLICITUDES
  // ===============================
  
  async getSolicitudes(usuarioID, rol) {
    try {
      console.log('Obteniendo solicitudes para usuario:', usuarioID, 'rol:', rol);
      const params = new URLSearchParams();
      if (usuarioID) params.append('usuarioID', usuarioID);
      if (rol) params.append('rol', rol);
      const response = await api.get(`/vacantes/solicitudes?${params.toString()}`);
      console.log('Solicitudes obtenidas:', response.data?.length || 0);
      return response.data;
    } catch (error) {
      console.error('Error al obtener solicitudes:', error.response?.data || error.message);
      throw error;
    }
  },

  async crearSolicitud(solicitud) {
    try {
      console.log('Creando solicitud:', solicitud);
      const response = await api.post('/vacantes/solicitudes', solicitud);
      console.log('Solicitud creada:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al crear solicitud:', error.response?.data || error.message);
      throw error;
    }
  },

  async aprobarSolicitud(solicitudId, comentarios = '') {
    try {
      console.log('Aprobando solicitud:', solicitudId, comentarios);
      const response = await api.put(`/vacantes/solicitudes/${solicitudId}/aprobar`, { comentarios });
      console.log('Solicitud aprobada:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al aprobar solicitud:', error.response?.data || error.message);
      throw error;
    }
  },

  async rechazarSolicitud(solicitudId, comentarios = '') {
    try {
      console.log('Rechazando solicitud:', solicitudId, comentarios);
      const response = await api.put(`/vacantes/solicitudes/${solicitudId}/rechazar`, { comentarios });
      console.log('Solicitud rechazada:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al rechazar solicitud:', error.response?.data || error.message);
      throw error;
    }
  },

  async getSolicitudPorId(id) {
    try {
      console.log('Obteniendo solicitud por ID:', id);
      const response = await api.get(`/vacantes/solicitudes/${id}`);
      console.log('Solicitud obtenida:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al obtener solicitud por ID:', error.response?.data || error.message);
      throw error;
    }
  },

  async actualizarSolicitud(id, datos) {
    try {
      console.log('Actualizando solicitud:', id, datos);
      const response = await api.put(`/vacantes/solicitudes/${id}`, datos);
      console.log('Solicitud actualizada:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar solicitud:', error.response?.data || error.message);
      throw error;
    }
  },

  // ===============================
  // POSTULACIONES
  // ===============================
  
  async getPostulaciones(usuarioID, rol) {
    try {
      console.log('Obteniendo postulaciones para usuario:', usuarioID, 'rol:', rol);
      const params = new URLSearchParams();
      if (usuarioID) params.append('usuarioID', usuarioID);
      if (rol) params.append('rol', rol);
      const response = await api.get(`/vacantes/postulaciones?${params.toString()}`);
      console.log('Postulaciones obtenidas:', response.data?.length || 0);
      return response.data;
    } catch (error) {
      console.error('Error al obtener postulaciones:', error.response?.data || error.message);
      throw error;
    }
  },

  async crearPostulacion(postulacion) {
    try {
      console.log('Creando postulación:', postulacion);
      const response = await api.post('/vacantes/postulaciones', postulacion);
      console.log('Postulación creada:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al crear postulación:', error.response?.data || error.message);
      throw error;
    }
  },

  async cambiarEstadoPostulacion(postulacionId, estado, comentarios = '') {
    try {
      console.log('Cambiando estado de postulación:', postulacionId, 'a', estado);
      const response = await api.put(`/vacantes/postulaciones/${postulacionId}/estado`, { estado, comentarios });
      console.log('Estado cambiado:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al cambiar estado de postulación:', error.response?.data || error.message);
      throw error;
    }
  },

  async getPostulacionPorId(id) {
    try {
      console.log('Obteniendo postulación por ID:', id);
      const response = await api.get(`/vacantes/postulaciones/${id}`);
      console.log('Postulación obtenida:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al obtener postulación por ID:', error.response?.data || error.message);
      throw error;
    }
  },

  async getPostulacionesPorVacante(vacanteId) {
    try {
      console.log('Obteniendo postulaciones para vacante:', vacanteId);
      const response = await api.get(`/vacantes/${vacanteId}/postulaciones`);
      console.log('Postulaciones de vacante obtenidas:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al obtener postulaciones por vacante:', error.response?.data || error.message);
      throw error;
    }
  },

  // ===============================
  // ESTADÍSTICAS Y REPORTES
  // ===============================
  
  async getEstadisticas() {
    try {
      console.log('Obteniendo estadísticas...');
      const response = await api.get('/vacantes/estadisticas');
      console.log('Estadísticas obtenidas:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error.response?.data || error.message);
      throw error;
    }
  },

  async getReportesResumen() {
    try {
      console.log('Obteniendo resumen de reportes...');
      const response = await api.get('/vacantes/reportes/resumen');
      console.log('Resumen de reportes obtenido:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al obtener resumen de reportes:', error.response?.data || error.message);
      throw error;
    }
  },

  async exportarReporte(formato, tipo) {
    try {
      console.log('Exportando reporte:', formato, tipo);
      const response = await api.post('/vacantes/reportes/exportar', { formato, tipo });
      console.log('Reporte exportado:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al exportar reporte:', error.response?.data || error.message);
      throw error;
    }
  },

  async getMetricasAvanzadas() {
    try {
      console.log('Obteniendo métricas avanzadas...');
      const response = await api.get('/vacantes/metricas');
      console.log('Métricas avanzadas obtenidas:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al obtener métricas avanzadas:', error.response?.data || error.message);
      throw error;
    }
  },

  async getReportePorTipo(tipo, parametros = {}) {
    try {
      console.log('Obteniendo reporte por tipo:', tipo, parametros);
      const params = new URLSearchParams();
      Object.keys(parametros).forEach(key => {
        if (parametros[key] !== '' && parametros[key] !== null && parametros[key] !== undefined) {
          params.append(key, parametros[key]);
        }
      });
      const response = await api.get(`/vacantes/reportes/${tipo}?${params.toString()}`);
      console.log('Reporte obtenido:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al obtener reporte por tipo:', error.response?.data || error.message);
      throw error;
    }
  },

  // ===============================
  // DATOS AUXILIARES
  // ===============================
  
  async getDepartamentos() {
    try {
      console.log('Obteniendo departamentos...');
      const response = await api.get('/vacantes/departamentos');
      console.log('Departamentos obtenidos:', response.data?.length || 0);
      return response.data;
    } catch (error) {
      console.error('Error al obtener departamentos:', error.response?.data || error.message);
      throw error;
    }
  },

  async getUsuarios() {
    try {
      console.log('Obteniendo usuarios...');
      const response = await api.get('/vacantes/usuarios');
      console.log('Usuarios obtenidos:', response.data?.length || 0);
      return response.data;
    } catch (error) {
      console.error('Error al obtener usuarios:', error.response?.data || error.message);
      throw error;
    }
  },

  async getRoles() {
    try {
      console.log('Obteniendo roles...');
      const response = await api.get('/vacantes/roles');
      console.log('Roles obtenidos:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al obtener roles:', error.response?.data || error.message);
      throw error;
    }
  },

  async getConfiguracion() {
    try {
      console.log('Obteniendo configuración...');
      const response = await api.get('/vacantes/configuracion');
      console.log('Configuración obtenida:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al obtener configuración:', error.response?.data || error.message);
      throw error;
    }
  },

  // ===============================
  // UTILIDADES Y TESTING
  // ===============================

  async testConexion() {
    try {
      console.log('Probando conexión con la API...');
      const response = await api.get('/vacantes/health');
      console.log('Conexión exitosa:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error de conexión:', error.response?.data || error.message);
      throw error;
    }
  },

  async getVersion() {
    try {
      console.log('Obteniendo versión de la API...');
      const response = await api.get('/vacantes/version');
      console.log('Versión obtenida:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al obtener versión:', error.response?.data || error.message);
      throw error;
    }
  },

  // ===============================
  // NOTIFICACIONES
  // ===============================

  async getNotificaciones(usuarioID) {
    try {
      console.log('Obteniendo notificaciones para usuario:', usuarioID);
      const response = await api.get(`/vacantes/notificaciones?usuarioID=${usuarioID}`);
      console.log('Notificaciones obtenidas:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al obtener notificaciones:', error.response?.data || error.message);
      throw error;
    }
  },

  async marcarNotificacionLeida(notificacionId) {
    try {
      console.log('Marcando notificación como leída:', notificacionId);
      const response = await api.put(`/vacantes/notificaciones/${notificacionId}/leida`);
      console.log('Notificación marcada como leída:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error.response?.data || error.message);
      throw error;
    }
  },

  // ===============================
  // ARCHIVOS Y DOCUMENTOS
  // ===============================

  async subirArchivo(archivo, tipo = 'documento') {
    try {
      console.log('Subiendo archivo:', archivo.name, 'tipo:', tipo);
      const formData = new FormData();
      formData.append('archivo', archivo);
      formData.append('tipo', tipo);
      
      const response = await api.post('/vacantes/archivos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Archivo subido:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al subir archivo:', error.response?.data || error.message);
      throw error;
    }
  },

  async descargarArchivo(archivoId) {
    try {
      console.log('Descargando archivo:', archivoId);
      const response = await api.get(`/vacantes/archivos/${archivoId}`, {
        responseType: 'blob',
      });
      console.log('Archivo descargado');
      return response.data;
    } catch (error) {
      console.error('Error al descargar archivo:', error.response?.data || error.message);
      throw error;
    }
  },

  async eliminarArchivo(archivoId) {
    try {
      console.log('Eliminando archivo:', archivoId);
      const response = await api.delete(`/vacantes/archivos/${archivoId}`);
      console.log('Archivo eliminado:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar archivo:', error.response?.data || error.message);
      throw error;
    }
  },

  // ===============================
  // MÉTODOS DE CONVENIENCIA
  // ===============================

  // Test rápido de conectividad
  async ping() {
    try {
      const response = await api.get('/vacantes/health');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  },

  // Obtener todas las vacantes con postulaciones
  async getVacantesConPostulaciones() {
    try {
      const [vacantes, postulaciones] = await Promise.all([
        this.getVacantesActivas(),
        this.getPostulaciones()
      ]);

      return vacantes.map(vacante => ({
        ...vacante,
        postulacionesDetalle: postulaciones.filter(p => p.vacanteId === vacante.id)
      }));
    } catch (error) {
      console.error('Error al obtener vacantes con postulaciones:', error.message);
      throw error;
    }
  },

  // Estadísticas completas del dashboard
  async getDashboardCompleto() {
    try {
      const [estadisticas, metricas] = await Promise.all([
        this.getEstadisticas(),
        this.getMetricasAvanzadas().catch(() => ({}))
      ]);

      return {
        ...estadisticas,
        ...metricas,
        fechaActualizacion: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error al obtener dashboard completo:', error.message);
      throw error;
    }
  },

  // Búsqueda global en vacantes
  async busquedaGlobal(termino) {
    try {
      const filtros = {
        cargo: termino,
        departamento: termino
      };
      return await this.buscarVacantes(filtros);
    } catch (error) {
      console.error('Error en búsqueda global:', error.message);
      throw error;
    }
  }
};

export default vacantesService;