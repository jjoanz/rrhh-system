// src/context/AuthContext.jsx
// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permisos, setPermisos] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // =========================
  // VERIFICAR SI TOKEN ES VÁLIDO
  // =========================
  const isTokenValid = (token) => {
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      // Verificar si el token ha expirado
      if (payload.exp < currentTime) {
        console.log('Token expirado');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Token malformado:', error);
      return false;
    }
  };

  // =========================
  // MAPEO DEL ESTADO (CORREGIDO PARA SQL SERVER BIT)
  // =========================
  const mapEstado = (estado) => {
    // SQL Server bit: 1 = Activo, 0 = Inactivo
    return (estado === 1 || estado === true) ? 'Activo' : 'Inactivo';
  };

  const formatUser = (userData) => ({
    id: userData.id,
    name: `${userData.nombre} ${userData.apellido}`.trim() || 'Usuario',
    position: userData.puesto || userData.rol || '',
    role: userData.rol || 'Sistema',
    email: userData.email,
    empleadoId: userData.empleadoId,
    estado: mapEstado(userData.estado)
  });

  // =========================
  // LOGIN
  // =========================
  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { token, user: userData, permisos: permisosData } = res.data;

      localStorage.setItem('rrhh_token', token);

      setUser(formatUser(userData));
      setPermisos(permisosData || []);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al iniciar sesión'
      };
    }
  };

  // =========================
  // LOGOUT
  // =========================
  const logout = () => {
    localStorage.removeItem('rrhh_token');
    setUser(null);
    setPermisos([]);
  };

  // =========================
  // VERIFICAR TOKEN (CORREGIDO)
  // =========================
  const verifyUser = async () => {
    const token = localStorage.getItem('rrhh_token');
    
    if (!token) {
      setLoading(false);
      return;
    }

    // Verificar si el token es válido antes de hacer la llamada
    if (!isTokenValid(token)) {
      console.log('Token inválido o expirado, limpiando localStorage');
      logout();
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get(`${API_URL}/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { user: userData, permisos: permisosData } = res.data;

      setUser(formatUser(userData));
      setPermisos(permisosData || []);
    } catch (error) {
      console.error('Verify user error:', error);
      
      // Si es error 401 (no autorizado), limpiar token
      if (error.response?.status === 401) {
        console.log('Token rechazado por el servidor, limpiando localStorage');
      }
      
      logout();
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // FORGOT PASSWORD
  // =========================
  const forgotPassword = async (email) => {
    try {
      const res = await axios.post(`${API_URL}/auth/forgot-password`, { email });
      return res.data;
    } catch (error) {
      console.error('Forgot password error:', error);
      return { success: false, error: error.response?.data?.message || 'Error al enviar email' };
    }
  };

  // =========================
  // RESET PASSWORD
  // =========================
  const resetPassword = async (token, newPassword) => {
    try {
      const res = await axios.post(`${API_URL}/auth/reset-password`, { token, newPassword });
      return res.data;
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, error: error.response?.data?.message || 'Error al restablecer contraseña' };
    }
  };

  // =========================
  // CAMBIO DE CONTRASEÑA (USER LOGUEADO)
  // =========================
  const changePassword = async (currentPassword, newPassword) => {
    const token = localStorage.getItem('rrhh_token');
    
    if (!token || !isTokenValid(token)) {
      return { success: false, error: 'No estás autenticado o tu sesión ha expirado' };
    }

    try {
      const res = await axios.post(
        `${API_URL}/auth/change-password`,
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    } catch (error) {
      console.error('Change password error:', error);
      
      // Si es error 401, limpiar token
      if (error.response?.status === 401) {
        logout();
        return { success: false, error: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.' };
      }
      
      return { success: false, error: error.response?.data?.message || 'Error cambiando contraseña' };
    }
  };

  useEffect(() => {
    verifyUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        permisos,
        login,
        logout,
        forgotPassword,
        resetPassword,
        changePassword,
        loading,
        isTokenValid
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);