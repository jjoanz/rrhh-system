import axios from "axios";

// ✅ USAR TU IP REAL DEL SERVIDOR
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://192.168.0.239:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor → añade token automáticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("rrhh_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ Error en request interceptor:', error);
    return Promise.reject(error);
  }
);

// Response interceptor → si expira el token, limpiar localStorage
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('⚠️ Token expirado o inválido - Redirigiendo a login');
      localStorage.removeItem("rrhh_token");
      // opcional → window.location = "/login";
    }
    console.error('❌ Error en response interceptor:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;