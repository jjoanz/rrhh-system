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
    // ✅ Normalizar nombres de campos para el backend
    const payload = {
      empleadoID: datos.empleadoId,  // Backend espera empleadoID
      fechaInicio: datos.fechaInicio,
      fechaFin: datos.fechaFin,
      dias: datos.dias,
      diasHabiles: datos.diasHabiles || datos.dias,
      motivo: datos.motivo,
      tipo: datos.tipo || 'vacaciones'
    };
    
    const response = await api.post('/vacaciones', payload);
    return response.data;
  } catch (error) {
    console.error('Error al crear solicitud:', error);
    throw error;
  }
},

  // Crear solicitud con períodos múltiples
  async crearSolicitudConPeriodos(datos) {
  try {
    // ✅ Normalizar nombres de campos
    const payload = {
      empleadoId: datos.empleadoId,  // Este endpoint usa empleadoId (camelCase)
      fechaInicio: datos.fechaInicio,
      fechaFin: datos.fechaFin,
      dias: datos.dias,
      diasHabiles: datos.diasHabiles || datos.dias,
      motivo: datos.motivo,
      tipo: datos.tipo || 'vacaciones',
      periodosSeleccionados: datos.periodosSeleccionados
    };
    
    const response = await api.post('/vacaciones/con-periodos', payload);
    return response.data;
  } catch (error) {
    console.error('Error al crear solicitud con períodos:', error);
    throw error;
  }
},

  // Procesar solicitud (aprobar/rechazar)
  // Procesar solicitud (aprobar/rechazar)
async procesarSolicitud(solicitudId, datos) {
  try {
    // ✅ CAMBIO: La ruta correcta es /vacaciones/aprobar
    const response = await api.post('/vacaciones/aprobar', {
      solicitudID: solicitudId,
      usuarioID: datos.usuarioID || datos.aprobadorId,  // Asegurar que envía usuarioID
      accion: datos.accion,
      esManual: datos.esManual,
      motivo: datos.motivoManual || datos.motivo || ''
    });
    return response.data;
  } catch (error) {
    console.error('Error al procesar solicitud:', error);
    throw error;
  }
},

  // Obtener estadísticas del empleado (simple)
  async getEstadisticas(empleadoId, anio = null) {
    try {
      const url = anio 
        ? `/vacaciones/estadisticas/${empleadoId}?anio=${anio}`
        : `/vacaciones/estadisticas/${empleadoId}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw error;
    }
  },

  // Obtener estadísticas detalladas con períodos
  async getEstadisticasDetalladas(empleadoId) {
    try {
      const response = await api.get(`/vacaciones/estadisticas-detalladas/${empleadoId}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas detalladas:', error);
      throw error;
    }
  },

  // Asignar días manualmente (solo RRHH)
  async asignarDias(empleadoId, anio, dias) {
    try {
      const response = await api.post('/vacaciones/asignar-dias', {
        empleadoId,
        anio,
        dias
      });
      return response.data;
    } catch (error) {
      console.error('Error al asignar días:', error);
      throw error;
    }
  },

  // Obtener detalles de una solicitud específica
  async getSolicitudById(solicitudId) {
    try {
      const response = await api.get(`/vacaciones/${solicitudId}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener solicitud:', error);
      throw error;
    }
  }
};

export default vacacionesService;