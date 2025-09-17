import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const closeSidebar = () => setSidebarOpen(false);
  const navigateToSection = (section) => setActiveSection(section);

  return (
    <AppContext.Provider value={{ sidebarOpen, toggleSidebar, closeSidebar, activeSection, navigateToSection }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
