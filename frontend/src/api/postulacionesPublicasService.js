// frontend/src/api/postulacionesPublicasService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const postulacionesPublicasService = {
  // Obtener vacantes públicas
  async getVacantesPublicas() {
    try {
      const response = await axios.get(`${API_URL}/postulaciones-publicas/vacantes`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener vacantes públicas:', error);
      throw error;
    }
  },

  // Enviar postulación con archivos
  async enviarPostulacion(datos, archivos) {
    try {
      const formData = new FormData();

      // Agregar todos los campos de datos
      Object.keys(datos).forEach(key => {
        if (datos[key] !== null && datos[key] !== undefined && datos[key] !== '') {
          formData.append(key, datos[key]);
        }
      });

      // Agregar archivos
      if (archivos.cv) {
        formData.append('cv', archivos.cv);
      }
      if (archivos.fotoCedula) {
        formData.append('fotoCedula', archivos.fotoCedula);
      }
      if (archivos.foto2x2) {
        formData.append('foto2x2', archivos.foto2x2);
      }

      const response = await axios.post(
        `${API_URL}/postulaciones-publicas/postular`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error al enviar postulación:', error);
      throw error;
    }
  }
};

export default postulacionesPublicasService;