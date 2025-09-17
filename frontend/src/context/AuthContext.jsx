// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permisos, setPermisos] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ API_URL relativo (sirve para backend + frontend en producción)
  const API_URL = process.env.REACT_APP_API_URL || '/api';

  const isTokenValid = (token) => {
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch (error) {
      console.error('Token malformado:', error);
      return false;
    }
  };

  const mapEstado = (estado) => (estado === 1 || estado === true ? 'Activo' : 'Inactivo');

  const formatUser = (userData) => ({
    id: userData.id,
    name: `${userData.nombre} ${userData.apellido}`.trim() || 'Usuario',
    position: userData.puesto || userData.rol || '',
    role: userData.rol || 'Sistema',
    email: userData.email,
    empleadoId: userData.empleadoId,
    estado: mapEstado(userData.estado),
  });

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Error al iniciar sesión');
      }

      const data = await res.json();
      localStorage.setItem('rrhh_token', data.token);
      setUser(formatUser(data.user));
      setPermisos(data.permisos || []);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('rrhh_token');
    setUser(null);
    setPermisos([]);
  };

  const verifyUser = async () => {
    const token = localStorage.getItem('rrhh_token');
    if (!token || !isTokenValid(token)) {
      logout();
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 401) {
          logout();
        } else {
          console.error(`Error en verifyUser: ${res.status}`);
        }
        throw new Error(`HTTP error ${res.status}`);
      }

      const data = await res.json();
      setUser(formatUser(data.user));
      setPermisos(data.permisos || []);
    } catch (error) {
      console.error('Verify user error:', error);
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Error al enviar email');
      }

      return await res.json();
    } catch (error) {
      console.error('Forgot password error:', error);
      return { success: false, error: error.message };
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Error al restablecer contraseña');
      }

      return await res.json();
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, error: error.message };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    const token = localStorage.getItem('rrhh_token');
    if (!token || !isTokenValid(token)) return { success: false, error: 'No estás autenticado' };

    try {
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        if (res.status === 401) logout();
        const errData = await res.json();
        throw new Error(errData.message || 'Error cambiando contraseña');
      }

      return await res.json();
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, error: error.message };
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
        isTokenValid,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

