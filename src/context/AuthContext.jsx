import React, { createContext, useContext, useState, useEffect } from 'react';
import { validateCredentials } from '../data/users';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar usuario desde localStorage al inicializar
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const savedUser = localStorage.getItem('rrhh_user');
        const savedToken = localStorage.getItem('rrhh_token');
        
        if (savedUser && savedToken) {
          const userData = JSON.parse(savedUser);
          if (isValidToken(savedToken)) {
            setUser(userData);
          } else {
            localStorage.removeItem('rrhh_user');
            localStorage.removeItem('rrhh_token');
          }
        }
      } catch (error) {
        console.error('Error al cargar usuario:', error);
        localStorage.removeItem('rrhh_user');
        localStorage.removeItem('rrhh_token');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Función para simular validación de token
  const isValidToken = (token) => {
    try {
      const tokenData = JSON.parse(atob(token));
      return tokenData.exp > Date.now();
    } catch {
      return false;
    }
  };

  // Función para generar token simulado
  const generateToken = (userData) => {
    const tokenData = {
      userId: userData.id,
      role: userData.role,
      exp: Date.now() + (24 * 60 * 60 * 1000) // 24 horas
    };
    return btoa(JSON.stringify(tokenData));
  };

  // Función de login
  const login = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 1000));

      const userData = validateCredentials(email, password);
      
      if (userData) {
        const token = generateToken(userData);
        
        // Guardar en localStorage
        localStorage.setItem('rrhh_user', JSON.stringify(userData));
        localStorage.setItem('rrhh_token', token);
        
        setUser(userData);
        return { success: true, user: userData };
      } else {
        const errorMsg = 'Credenciales incorrectas';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      const errorMsg = 'Error en el servidor. Intenta nuevamente.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Función de logout
  const logout = () => {
    setUser(null);
    setError(null);
    localStorage.removeItem('rrhh_user');
    localStorage.removeItem('rrhh_token');
  };

  // Función para verificar permisos
  const hasPermission = (requiredRole) => {
    if (!user) return false;
    
    // Jerarquía de permisos
    const roleHierarchy = {
    admin: 7,
    director_rrhh: 6,
    gerente_rrhh: 5,
    director: 4,
    rrhh: 3,
    gerente: 2,
    colaborador: 1
  };

    const userLevel = roleHierarchy[user.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    return userLevel >= requiredLevel;
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    hasPermission,
    clearError: () => setError(null)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};