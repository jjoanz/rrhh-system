const API_URL = process.env.REACT_APP_API_URL || 'http://192.168.0.239:5000/api';

export const getAuthHeaders = () => {
  // ✅ La variable debe llamarse 'token', no 'rrhh_token'
  const token = localStorage.getItem('rrhh_token');
  
  if (!token) {
    return {
      'Content-Type': 'application/json'
    };
  }

  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  
  const config = {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers
    }
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en la petición:', error);
    throw error;
  }
};

export default API_URL;