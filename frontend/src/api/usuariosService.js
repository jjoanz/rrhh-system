// src/api/api.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.1.100:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: añade token desde localStorage automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rrhh_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor: si recibimos 401, limpiamos token (no hacemos logout UI aquí)
api.interceptors.response.use((response) => response, (error) => {
  if (error.response && error.response.status === 401) {
    localStorage.removeItem('rrhh_token');
    // opcional: window.location = '/login';
  }
  return Promise.reject(error);
});

export default api;
