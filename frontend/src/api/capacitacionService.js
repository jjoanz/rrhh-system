import api from './api';

const capacitacionService = {
  // ==========================================
  // SOLICITUDES DE CAPACITACIÓN
  // ==========================================

  async crearSolicitud(datos) {
    try {
      const response = await api.post('/capacitacion/solicitudes', datos);
      return response.data;
    } catch (error) {
      console.error('Error al crear solicitud:', error);
      throw error;
    }
  },

  async getMisSolicitudes() {
    try {
      const response = await api.get('/capacitacion/solicitudes/mis-solicitudes');
      return response.data;
    } catch (error) {
      console.error('Error al obtener mis solicitudes:', error);
      throw error;
    }
  },

  async getSolicitudesPendientes() {
    try {
      const response = await api.get('/capacitacion/solicitudes/pendientes');
      return response.data;
    } catch (error) {
      console.error('Error al obtener solicitudes pendientes:', error);
      throw error;
    }
  },

  async getSolicitudById(solicitudId) {
    try {
      const response = await api.get(`/capacitacion/solicitudes/${solicitudId}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener detalle de solicitud:', error);
      throw error;
    }
  },

  async aprobarSolicitud(solicitudId, comentario = '') {
    try {
      const response = await api.put(`/capacitacion/solicitudes/${solicitudId}/aprobar`, { comentario });
      return response.data;
    } catch (error) {
      console.error('Error al aprobar solicitud:', error);
      throw error;
    }
  },

  async rechazarSolicitud(solicitudId, comentario = '') {
    try {
      const response = await api.put(`/capacitacion/solicitudes/${solicitudId}/rechazar`, { comentario });
      return response.data;
    } catch (error) {
      console.error('Error al rechazar solicitud:', error);
      throw error;
    }
  },

  // ==========================================
  // CURSOS DISPONIBLES
  // ==========================================

  async getCursosDisponibles() {
    try {
      const response = await api.get('/capacitacion/cursos-disponibles');
      return response.data;
    } catch (error) {
      console.error('Error al obtener cursos disponibles:', error);
      throw error;
    }
  },

  async crearCurso(datos) {
    try {
      const response = await api.post('/capacitacion/cursos-disponibles', datos);
      return response.data;
    } catch (error) {
      console.error('Error al crear curso:', error);
      throw error;
    }
  },

  async editarCurso(cursoId, datos) {
    try {
      const response = await api.put(`/capacitacion/cursos-disponibles/${cursoId}`, datos);
      return response.data;
    } catch (error) {
      console.error('Error al editar curso:', error);
      throw error;
    }
  },

  async eliminarCurso(cursoId) {
    try {
      const response = await api.delete(`/capacitacion/cursos-disponibles/${cursoId}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar curso:', error);
      throw error;
    }
  },

  // ==========================================
  // INSCRIPCIONES A CURSOS
  // ==========================================

  async inscribirseCurso(cursoID) {
    try {
      const response = await api.post('/capacitacion/inscripciones', { cursoID });
      return response.data;
    } catch (error) {
      console.error('Error al inscribirse al curso:', error);
      throw error;
    }
  },

  async getMisCursos() {
    try {
      const response = await api.get('/capacitacion/inscripciones/mis-cursos');
      return response.data;
    } catch (error) {
      console.error('Error al obtener mis cursos:', error);
      throw error;
    }
  },

  async actualizarProgreso(inscripcionId, progreso, calificacion = null) {
    try {
      const response = await api.put(`/capacitacion/inscripciones/${inscripcionId}/progreso`, {
        progreso,
        calificacion
      });
      return response.data;
    } catch (error) {
      console.error('Error al actualizar progreso:', error);
      throw error;
    }
  },

  // ==========================================
  // CERTIFICADOS
  // ==========================================

  async getMisCertificados() {
    try {
      const response = await api.get('/capacitacion/certificados/mis-certificados');
      return response.data;
    } catch (error) {
      console.error('Error al obtener certificados:', error);
      throw error;
    }
  },

  async descargarCertificado(certificadoId) {
    try {
      const response = await api.get(`/capacitacion/certificados/${certificadoId}/descargar`);
      return response.data;
    } catch (error) {
      console.error('Error al descargar certificado:', error);
      throw error;
    }
  },

  async crearCertificado(datos) {
    try {
      const response = await api.post('/capacitacion/certificados', datos);
      return response.data;
    } catch (error) {
      console.error('Error al crear certificado:', error);
      throw error;
    }
  },

  // ==========================================
  // ESTADÍSTICAS
  // ==========================================

  async getEstadisticas() {
    try {
      const response = await api.get('/capacitacion/estadisticas');
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw error;
    }
  },

  async getProgresoEquipo() {
    try {
      const response = await api.get('/capacitacion/progreso-equipo');
      return response.data;
    } catch (error) {
      console.error('Error al obtener progreso del equipo:', error);
      throw error;
    }
  },

  async getProgresoGlobal() {
    try {
      const response = await api.get('/capacitacion/progreso-global');
      return response.data;
    } catch (error) {
      console.error('Error al obtener progreso global:', error);
      throw error;
    }
  },

  async getTodasSolicitudes() {
    try {
      const response = await api.get('/capacitacion/solicitudes/todas');
      return response.data;
    } catch (error) {
      console.error('Error al obtener todas las solicitudes:', error);
      throw error;
    }
  },

  // Inscribir a un miembro del equipo (gerentes)
  inscribirEquipo: async (cursoId, empleadoId) => {
    try {
      const response = await api.post('/capacitacion/inscripciones/equipo', { 
        cursoID: cursoId,
        empleadoID: empleadoId 
      });
      return response.data;
    } catch (error) {
      console.error('Error al inscribir empleado:', error);
      throw error;
    }
  },

  // Obtener todos los empleados (para cursos cerrados)
  getEmpleados: async () => {
    try {
      const response = await api.get('/capacitacion/usuarios/empleados');
      return response.data;
    } catch (error) {
      console.error('Error al obtener empleados:', error);
      throw error;
    }
  },

  // Obtener mis capacitaciones (para colaboradores)
  getMisCapacitaciones: async () => {
    try {
      const response = await api.get('/capacitacion/mis-capacitaciones');
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener mis capacitaciones:', error);
      throw error;
    }
  },

  // Obtener participantes de un curso (para RRHH)
  getParticipantes: async (cursoId) => {
    try {
      const response = await api.get(`/capacitacion/${cursoId}/participantes`);
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener participantes:', error);
      throw error;
    }
  }

};

export default capacitacionService;