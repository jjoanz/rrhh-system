import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe ser usado dentro de un AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cargar sección activa desde localStorage
  useEffect(() => {
    const savedSection = localStorage.getItem('rrhh_active_section');
    if (savedSection) {
      setActiveSection(savedSection);
    }
  }, []);

  // Funciones para manejo de secciones
  const navigateToSection = (section) => {
    setActiveSection(section);
    localStorage.setItem('rrhh_active_section', section);
    // Cerrar sidebar en móvil al navegar
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // Funciones para manejo de notificaciones
  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now(),
      timestamp: new Date(),
      read: false,
      ...notification
    };
    setNotifications(prev => [newNotification, ...prev]);
    return newNotification.id;
  };

  const markNotificationAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const removeNotification = (id) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== id)
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Funciones de mensajes rápidos
  const showSuccessMessage = (message, title = 'Éxito') => {
    addNotification({
      type: 'success',
      title,
      message,
      autoClose: true
    });
  };

  const showErrorMessage = (message, title = 'Error') => {
    addNotification({
      type: 'error',
      title,
      message,
      autoClose: false
    });
  };

  const showInfoMessage = (message, title = 'Información') => {
    addNotification({
      type: 'info',
      title,
      message,
      autoClose: true
    });
  };

  // Estado de la aplicación móvil
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const value = {
    activeSection,
    sidebarOpen,
    isMobile,
    notifications,
    unreadNotifications: notifications.filter(n => !n.read).length,
    loading,
    navigateToSection,
    toggleSidebar,
    closeSidebar,
    addNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    removeNotification,
    clearAllNotifications,
    showSuccessMessage,
    showErrorMessage,
    showInfoMessage,
    showLoading: () => setLoading(true),
    hideLoading: () => setLoading(false)
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};