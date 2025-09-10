// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // ✅ NUEVOS ESTADOS PARA RESET PASSWORD
  const [resetMode, setResetMode] = useState(false);
  const [resetToken, setResetTokenState] = useState('');

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // ✅ FUNCIÓN PARA DETECTAR TOKEN DE RESET EN LA URL
  const checkForResetToken = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token && window.location.pathname.includes('reset-password')) {
      setResetMode(true);
      setResetTokenState(token);
      // Limpiar URL sin recargar la página
      window.history.replaceState({}, document.title, window.location.pathname);
      return true;
    }
    return false;
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // ✅ VERIFICAR TOKEN DE RESET PRIMERO
        if (checkForResetToken()) {
          return setLoading(false);
        }

        const token = localStorage.getItem('rrhh_token');
        if (!token) return setLoading(false);

        const response = await fetch(`${API_BASE_URL}/auth/verify`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          const data = await response.json();
          setUser({
            id: data.user.id,
            username: data.user.username,
            name: data.user.nombre && data.user.apellido 
              ? `${data.user.nombre} ${data.user.apellido}`
              : data.user.username,
            role: data.user.rol.toLowerCase(),
            empleadoId: data.user.empleadoId,
            permisos: data.permisos
          });
        } else {
          localStorage.removeItem('rrhh_token');
        }
      } catch (err) {
        console.error('Error al verificar token:', err);
        localStorage.removeItem('rrhh_token');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [API_BASE_URL]);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        const userData = {
          id: data.user.id,
          username: data.user.username,
          name: data.user.nombre && data.user.apellido 
            ? `${data.user.nombre} ${data.user.apellido}`
            : data.user.username,
          role: data.user.rol.toLowerCase(),
          empleadoId: data.user.empleadoId,
          permisos: data.permisos
        };

        localStorage.setItem('rrhh_token', data.token);
        setUser(userData);
        return { success: true, user: userData };
      } else {
        const errorMsg = data.message || 'Credenciales incorrectas';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      console.error('Error en login:', err);
      const errorMsg = 'Error de conexión con el servidor';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setError(null);
    localStorage.removeItem('rrhh_token');
  };

  const getToken = () => localStorage.getItem('rrhh_token');

  const authenticatedFetch = async (url, options = {}) => {
    const token = getToken();
    const config = { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } };
    if (token) config.headers.Authorization = `Bearer ${token}`;
    const response = await fetch(url, config);
    if (response.status === 401) logout();
    return response;
  };

  const hasPermission = (requiredRole) => {
    if (!user) return false;
    const roleHierarchy = { admin: 4, rrhh: 3, supervisor: 2, empleado: 1 };
    return (roleHierarchy[user.role] || 0) >= (roleHierarchy[requiredRole] || 0);
  };

  // ========================
  // FUNCIONES DE CONTRASEÑA
  // ========================
  
  const forgotPassword = async (email) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      return response.ok ? { success: true, message: data.message } : { success: false, error: data.message };
    } catch (err) {
      console.error('Error en forgotPassword:', err);
      return { success: false, error: 'Error de conexión con el servidor' };
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });
      const data = await response.json();
      return response.ok ? { success: true, message: data.message } : { success: false, error: data.message };
    } catch (err) {
      console.error('Error en resetPassword:', err);
      return { success: false, error: 'Error de conexión con el servidor' };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      login,
      logout,
      hasPermission,
      getToken,
      authenticatedFetch,
      forgotPassword,
      resetPassword,
      clearError: () => setError(null),
      // ✅ NUEVAS PROPIEDADES PARA RESET
      resetMode,
      setResetMode,
      resetToken,
      setResetToken: setResetTokenState,
      checkForResetToken
    }}>
      {children}
    </AuthContext.Provider>
  );
};