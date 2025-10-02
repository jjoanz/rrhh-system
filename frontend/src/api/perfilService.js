const API_URL = process.env.REACT_APP_API_URL || 'http://192.168.0.239:5000/api';

const getToken = () => localStorage.getItem('rrhh_token');

export const perfilApi = {
  // Obtener perfil
  getPerfil: async () => {
    const response = await fetch(`${API_URL}/perfil`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Error al obtener perfil');
    }
    
    return response.json();
  },

  // Actualizar perfil
  updatePerfil: async (data) => {
    const response = await fetch(`${API_URL}/perfil`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('Error al actualizar perfil');
    }
    
    return response.json();
  },

  // Cambiar contraseña
  cambiarPassword: async (passwords) => {
    const response = await fetch(`${API_URL}/perfil/cambiar-password`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(passwords)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al cambiar contraseña');
    }
    
    return response.json();
  },

  // Obtener estadísticas
  getEstadisticas: async () => {
    const response = await fetch(`${API_URL}/perfil/estadisticas`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Error al obtener estadísticas');
    }
    
    return response.json();
  }
};