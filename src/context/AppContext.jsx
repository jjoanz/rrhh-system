import React, { createContext, useState, useEffect, useContext } from 'react';

const AppContext = createContext();

const AppProvider = ({ children }) => {
  // Estados principales
  const [empleados, setEmpleados] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  // Estados de navegación/UI (FALTABAN ESTOS)
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Sistema de intercomunicación entre módulos
  const [moduleData, setModuleData] = useState({
    // Datos del módulo de Empleados (FUENTE PRINCIPAL)
    empleados: {
      empleadosData: [],
      datosPersonales: {},
      candidatosInternos: []
    },
    
    // Datos del módulo de Configuración (CEREBRO)
    configuracion: {
      parametrosNomina: {
        impuestos: { isr: 0.15, seguroSocial: 0.0287 },
        bonificaciones: { navidad: 1, vacaciones: 0.5 },
        descuentos: { seguroMedico: 2500, cooperativa: 0 }
      },
      politicasVacaciones: {
        diasMinimos: 14,
        diasMaximos: 30,
        anticipoMaximo: 90
      },
      configuracionAsistencia: {
        horaEntrada: '08:00',
        horaSalida: '17:00',
        tolerancia: 15,
        horasCompletas: 8
      },
      settingsCapacitacion: {
        presupuestoAnual: 50000,
        horasMinimas: 40
      },
      flujosAprobacion: {
        vacaciones: ['supervisor', 'rrhh'],
        contrataciones: ['rrhh', 'gerencia']
      },
      organizacion: {
        departamentos: [],
        jerarquia: {}
      }
    },
    
    // Datos operacionales de cada módulo
    nomina: {
      empleadosData: [],
      calculosActuales: [],
      historicoNomina: []
    },
    
    asistencia: {
      empleadosActivos: [],
      registrosHoy: [],
      estadisticasSemana: {}
    },
    
    vacaciones: {
      empleadosVacaciones: [],
      solicitudesPendientes: [],
      calendarioAusencias: {}
    },
    
    capacitacion: {
      perfilesProfesionales: [],
      cursosActivos: [],
      certificaciones: []
    },
    
    vacantes: {
      candidatosInternos: [],
      posicionesAbiertas: [],
      nuevasContrataciones: []
    },
    
    perfil: {
      datosPersonales: {},
      actualizaciones: {},
      preferencias: {}
    },
    
    dashboard: {
      empleadosStats: {},
      metricas: {},
      alertas: []
    },
    
    reportes: {
      datosOrganizacionales: {},
      metricas: {},
      reportesGenerados: []
    }
  });

  // Estado de notificaciones entre módulos
  const [moduleNotifications, setModuleNotifications] = useState([]);

  // Funciones de navegación/UI (FALTABAN ESTAS)
  const navigateToSection = (sectionId) => {
    setActiveSection(sectionId);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // Función para actualizar datos de un módulo específico
  const updateModuleData = (moduleName, dataKey, newData) => {
    setModuleData(prevData => ({
      ...prevData,
      [moduleName]: {
        ...prevData[moduleName],
        [dataKey]: newData
      }
    }));

    // Crear notificación de actualización
    const notification = {
      id: Date.now(),
      from: moduleName,
      type: 'data_update',
      dataKey,
      timestamp: new Date().toISOString(),
      affectedModules: getAffectedModules(moduleName, dataKey)
    };

    setModuleNotifications(prev => [...prev, notification]);

    // Trigger efectos en módulos dependientes
    triggerModuleEffects(moduleName, dataKey, newData);
  };

  // Función para obtener datos de un módulo específico
  const getModuleData = (moduleName, dataKey = null) => {
    if (dataKey) {
      return moduleData[moduleName]?.[dataKey];
    }
    return moduleData[moduleName];
  };

  // Función para determinar qué módulos se ven afectados por una actualización
  const getAffectedModules = (sourceModule, dataKey) => {
    const dependencies = {
      empleados: {
        empleadosData: ['nomina', 'asistencia', 'vacaciones', 'capacitacion', 'vacantes', 'perfil', 'dashboard', 'reportes'],
        datosPersonales: ['perfil', 'dashboard'],
        candidatosInternos: ['vacantes']
      },
      configuracion: {
        parametrosNomina: ['nomina'],
        politicasVacaciones: ['vacaciones'],
        configuracionAsistencia: ['asistencia'],
        settingsCapacitacion: ['capacitacion'],
        flujosAprobacion: ['vacantes', 'vacaciones'],
        organizacion: ['empleados', 'dashboard', 'reportes']
      },
      asistencia: {
        registrosHoy: ['nomina', 'dashboard'],
        estadisticasSemana: ['reportes']
      },
      vacaciones: {
        solicitudesPendientes: ['dashboard', 'asistencia'],
        calendarioAusencias: ['nomina', 'reportes']
      },
      capacitacion: {
        certificaciones: ['empleados', 'vacantes'],
        cursosActivos: ['dashboard']
      },
      vacantes: {
        nuevasContrataciones: ['empleados'],
        posicionesAbiertas: ['dashboard']
      },
      perfil: {
        actualizaciones: ['empleados'],
        preferencias: ['dashboard']
      }
    };

    return dependencies[sourceModule]?.[dataKey] || [];
  };

  // Función para ejecutar efectos en módulos dependientes
  const triggerModuleEffects = (sourceModule, dataKey, newData) => {
    const affectedModules = getAffectedModules(sourceModule, dataKey);
    
    affectedModules.forEach(targetModule => {
      // Aquí se ejecutarían las actualizaciones específicas para cada módulo
      console.log(`Actualizando ${targetModule} debido a cambios en ${sourceModule}.${dataKey}`);
      
      // Ejemplos de efectos específicos:
      if (sourceModule === 'empleados' && dataKey === 'empleadosData') {
        if (targetModule === 'dashboard') {
          updateDashboardStats(newData);
        } else if (targetModule === 'nomina') {
          updateNominaEmployeeData(newData);
        }
      }
      
      if (sourceModule === 'asistencia' && targetModule === 'nomina') {
        calculatePayrollFromAttendance(newData);
      }
    });
  };

  // Funciones específicas de integración
  const updateDashboardStats = (empleadosData) => {
    const stats = {
      totalEmpleados: empleadosData.length,
      empleadosActivos: empleadosData.filter(emp => emp.estado === 'activo').length,
      nuevosEmpleadosMes: empleadosData.filter(emp => {
        const fechaIngreso = new Date(emp.fechaIngreso);
        const hoy = new Date();
        return fechaIngreso.getMonth() === hoy.getMonth() && fechaIngreso.getFullYear() === hoy.getFullYear();
      }).length,
      departamentos: [...new Set(empleadosData.map(emp => emp.departamento))].length,
      promedioSalarial: empleadosData.reduce((sum, emp) => sum + (emp.salarioBase || 0), 0) / empleadosData.length
    };

    updateModuleData('dashboard', 'empleadosStats', stats);
  };

  const updateNominaEmployeeData = (empleadosData) => {
    const nominaData = empleadosData.map(emp => ({
      empleadoId: emp.id,
      nombre: `${emp.nombre} ${emp.apellido}`,
      salarioBase: emp.salarioBase,
      tipoContrato: emp.tipoContrato,
      departamento: emp.departamento,
      fechaIngreso: emp.fechaIngreso,
      estado: emp.estado
    }));

    updateModuleData('nomina', 'empleadosData', nominaData);
  };

  const calculatePayrollFromAttendance = (asistenciaData) => {
    // Lógica para calcular nómina basada en asistencia
    const calculosNomina = asistenciaData.map(registro => ({
      empleadoId: registro.empleadoId,
      horasTrabajadas: registro.horasTrabajadas,
      horasExtras: Math.max(0, registro.horasTrabajadas - 8),
      descuentosTardanza: registro.tardanzas * 100 // Ejemplo: $100 por tardanza
    }));

    updateModuleData('nomina', 'calculosActuales', calculosNomina);
  };

  // Sistema de suscripciones para módulos
  const [moduleSubscriptions, setModuleSubscriptions] = useState({});

  const subscribeToModule = (subscriberModule, targetModule, dataKey, callback) => {
    const subscriptionKey = `${subscriberModule}_${targetModule}_${dataKey}`;
    setModuleSubscriptions(prev => ({
      ...prev,
      [subscriptionKey]: callback
    }));
  };

  const unsubscribeFromModule = (subscriberModule, targetModule, dataKey) => {
    const subscriptionKey = `${subscriberModule}_${targetModule}_${dataKey}`;
    setModuleSubscriptions(prev => {
      const { [subscriptionKey]: removed, ...rest } = prev;
      return rest;
    });
  };

  // Hook para sincronización automática
  useEffect(() => {
    // Ejecutar callbacks de suscripciones cuando hay cambios
    Object.entries(moduleSubscriptions).forEach(([key, callback]) => {
      const [subscriber, target, dataKey] = key.split('_');
      const data = getModuleData(target, dataKey);
      if (data) {
        callback(data);
      }
    });
  }, [moduleData, moduleSubscriptions, getModuleData]);

  // Función para obtener el estado de intercomunicación
  const getIntercomStatus = () => {
    return {
      activeModules: Object.keys(moduleData).filter(module => 
        Object.values(moduleData[module]).some(data => 
          Array.isArray(data) ? data.length > 0 : Object.keys(data || {}).length > 0
        )
      ),
      recentNotifications: moduleNotifications.slice(-10),
      dataFlows: Object.keys(moduleData).map(module => ({
        module,
        hasData: Object.values(moduleData[module]).some(data => 
          Array.isArray(data) ? data.length > 0 : Object.keys(data || {}).length > 0
        ),
        lastUpdate: moduleNotifications
          .filter(notif => notif.from === module)
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0]?.timestamp
      }))
    };
  };

  // Función para limpiar notificaciones antiguas
  const clearOldNotifications = () => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    setModuleNotifications(prev => 
      prev.filter(notif => new Date(notif.timestamp) > oneDayAgo)
    );
  };

  // Limpiar notificaciones antiguas cada hora
  useEffect(() => {
    const interval = setInterval(clearOldNotifications, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Función para forzar sincronización completa
  const forceSyncAllModules = () => {
    const empleadosData = getModuleData('empleados', 'empleadosData');
    if (empleadosData && empleadosData.length > 0) {
      // Re-enviar datos a todos los módulos
      updateModuleData('empleados', 'empleadosData', empleadosData);
    }
  };

  const value = {
    // Estados principales
    empleados,
    setEmpleados,
    departments,
    setDepartments,
    
    // Estados de navegación/UI ✅ AGREGADOS
    activeSection,
    setActiveSection,
    sidebarOpen,
    setSidebarOpen,
    
    // Funciones de navegación/UI ✅ AGREGADAS
    navigateToSection,
    toggleSidebar,
    closeSidebar,
    
    // Sistema de intercomunicación
    moduleData,
    updateModuleData,
    getModuleData,
    
    // Notificaciones
    moduleNotifications,
    
    // Suscripciones
    subscribeToModule,
    unsubscribeFromModule,
    
    // Utilidades
    getIntercomStatus,
    forceSyncAllModules,
    
    // Funciones específicas de integración
    updateDashboardStats,
    updateNominaEmployeeData,
    calculatePayrollFromAttendance
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Hook personalizado para usar el contexto más fácilmente
const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export { AppContext, AppProvider, useApp };