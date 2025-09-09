import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const IntercomDashboard = () => {
  const { authenticatedFetch, user } = useAuth();

  // Estado para empleados reales
  const [empleadosData, setEmpleadosData] = useState([]);

  // Notificaciones simuladas (puedes luego reemplazar por API si lo deseas)
  const [moduleNotifications, setModuleNotifications] = useState([]);

  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [selectedModule, setSelectedModule] = useState(null);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  // Estado del sistema de intercomunicación
  const [intercomStatus, setIntercomStatus] = useState({
    activeModules: [],
    recentNotifications: [],
    dataFlows: []
  });

  // Colores, iconos y nombres de módulos
  const moduleColors = {
    empleados: 'bg-blue-500',
    configuracion: 'bg-purple-500',
    nomina: 'bg-green-500',
    asistencia: 'bg-yellow-500',
    vacaciones: 'bg-orange-500',
    capacitacion: 'bg-pink-500',
    vacantes: 'bg-indigo-500',
    perfil: 'bg-gray-500',
    dashboard: 'bg-red-500',
    reportes: 'bg-teal-500'
  };

  const moduleIcons = {
    empleados: '👥',
    configuracion: '⚙️',
    nomina: '💰',
    asistencia: '⏰',
    vacaciones: '🏖️',
    capacitacion: '📚',
    vacantes: '💼',
    perfil: '👤',
    dashboard: '📊',
    reportes: '📈'
  };

  const moduleNames = {
    empleados: 'Empleados',
    configuracion: 'Configuración',
    nomina: 'Nómina',
    asistencia: 'Asistencia',
    vacaciones: 'Vacaciones',
    capacitacion: 'Capacitación',
    vacantes: 'Vacantes',
    perfil: 'Perfil',
    dashboard: 'Dashboard',
    reportes: 'Reportes'
  };

  // Función para obtener el estado de intercomunicación (simulada)
  const getIntercomStatus = () => ({
    activeModules: ['empleados', 'configuracion', 'nomina', 'asistencia', 'vacaciones', 'dashboard'],
    recentNotifications: moduleNotifications,
    dataFlows: [
      { module: 'empleados', hasData: empleadosData.length > 0, lastUpdate: new Date().toISOString() },
      { module: 'configuracion', hasData: true, lastUpdate: new Date().toISOString() },
      { module: 'nomina', hasData: true, lastUpdate: new Date().toISOString() },
      { module: 'asistencia', hasData: true, lastUpdate: new Date().toISOString() },
      { module: 'vacaciones', hasData: true, lastUpdate: new Date().toISOString() },
      { module: 'capacitacion', hasData: false, lastUpdate: null },
      { module: 'vacantes', hasData: false, lastUpdate: null },
      { module: 'perfil', hasData: true, lastUpdate: new Date().toISOString() },
      { module: 'dashboard', hasData: true, lastUpdate: new Date().toISOString() },
      { module: 'reportes', hasData: false, lastUpdate: null }
    ]
  });

  // Forzar sincronización (placeholder)
  const forceSyncAllModules = () => {
    alert('🔄 Sincronización forzada ejecutada - En implementación real esto actualizaría todos los módulos');
  };

  // Obtener datos de un módulo
  const getModuleData = (module) => {
    if (module === 'empleados') return { empleadosData };
    return {};
  };

  // Actualizar estado de intercomunicación
  const updateIntercomStatus = () => {
    const status = getIntercomStatus();
    setIntercomStatus(status);
  };

  // Auto-refresh
  useEffect(() => {
    updateIntercomStatus();
    
    if (isAutoRefresh) {
      const interval = setInterval(updateIntercomStatus, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [isAutoRefresh, refreshInterval, empleadosData]);

  // Obtener empleados reales del backend
  useEffect(() => {
    if (!user) return;

    const fetchEmpleados = async () => {
      try {
        const response = await authenticatedFetch('http://localhost:5000/api/empleados/list');
        const data = await response.json();
        if (response.ok) {
          setEmpleadosData(data.empleados || []);
        } else {
          console.error('Error al obtener empleados:', data.message);
        }
      } catch (err) {
        console.error('Error de conexión:', err);
      }
    };

    fetchEmpleados();
  }, [user, authenticatedFetch]);

  // Renderizado de tarjeta de módulo
  const renderModuleCard = (module, dataFlow) => {
    const isActive = dataFlow.hasData;
    const lastUpdate = dataFlow.lastUpdate;
    const moduleData = getModuleData(module);
    const dataCount = Object.values(moduleData || {}).reduce((total, data) => {
      return total + (Array.isArray(data) ? data.length : Object.keys(data || {}).length);
    }, 0);

    return (
      <div
        key={module}
        onClick={() => setSelectedModule(module)}
        className={`bg-white rounded-lg shadow-sm p-4 cursor-pointer transition-all hover:shadow-md border-l-4 ${
          isActive ? moduleColors[module] : 'border-gray-300'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{moduleIcons[module]}</span>
            <div>
              <h3 className="font-medium text-gray-900">{moduleNames[module]}</h3>
              <p className="text-sm text-gray-500">
                {isActive ? `${dataCount} registros` : 'Sin datos'}
              </p>
            </div>
          </div>
          <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
        </div>
        {lastUpdate && (
          <div className="text-xs text-gray-500">
            Última actualización: {new Date(lastUpdate).toLocaleTimeString()}
          </div>
        )}
      </div>
    );
  };

  // Panel de notificaciones
  const renderNotificationsPanel = () => {
    const recentNotifications = moduleNotifications.slice(-10).reverse();
    
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Actividad Reciente</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
              className={`px-3 py-1 rounded-md text-sm ${
                isAutoRefresh 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {isAutoRefresh ? '🟢 Auto' : '⚪ Manual'}
            </button>
            <button
              onClick={updateIntercomStatus}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm hover:bg-blue-200"
            >
              🔄 Actualizar
            </button>
          </div>
        </div>
        
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {recentNotifications.length > 0 ? (
            recentNotifications.map(notification => (
              <div key={notification.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{moduleIcons[notification.from]}</span>
                  <div>
                    <div className="text-sm font-medium">
                      {moduleNames[notification.from]} actualizó {notification.dataKey}
                    </div>
                    <div className="text-xs text-gray-500">
                      Afecta a: {notification.affectedModules?.map(m => moduleNames[m]).join(', ')}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(notification.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📡</div>
              <p>No hay actividad reciente</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Modal de detalles de módulo
  const renderModuleDetails = () => {
    if (!selectedModule) return null;
    const moduleData = getModuleData(selectedModule);
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <span className="text-2xl">{moduleIcons[selectedModule]}</span>
              <span>Detalles de {moduleNames[selectedModule]}</span>
            </h3>
            <button
              onClick={() => setSelectedModule(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-4">
            {moduleData && Object.entries(moduleData).map(([key, data]) => (
              <div key={key} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{key}</h4>
                  <span className="text-sm text-gray-500">
                    {Array.isArray(data) ? `${data.length} registros` : `${Object.keys(data || {}).length} elementos`}
                  </span>
                </div>
                <div className="bg-gray-50 rounded p-3 text-xs text-gray-600 font-mono max-h-32 overflow-y-auto">
                  {JSON.stringify(data, null, 2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              🔄 Monitor de Intercomunicación
            </h1>
            <p className="text-gray-600 mt-2">
              Visualización en tiempo real del flujo de datos entre módulos
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={forceSyncAllModules}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔄 Sincronizar Todo
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas generales */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-blue-600">
              {intercomStatus.activeModules.length}
            </div>
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-900">Módulos Activos</div>
              <div className="text-sm text-gray-500">Con datos</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-green-600">
              {moduleNotifications.length}
            </div>
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-900">Notificaciones</div>
              <div className="text-sm text-gray-500">Últimas 24h</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-purple-600">
              {intercomStatus.dataFlows.filter(df => df.hasData).length}
            </div>
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-900">Flujos Activos</div>
              <div className="text-sm text-gray-500">Intercomunicando</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className={`text-2xl font-bold ${isAutoRefresh ? 'text-green-600' : 'text-gray-600'}`}>
              {isAutoRefresh ? '🟢' : '⚪'}
            </div>
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-900">Estado</div>
              <div className="text-sm text-gray-500">
                {isAutoRefresh ? 'Auto-actualización' : 'Manual'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de módulos y panel de actividad */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <h2 className="text-xl font-semibold mb-4">Estado de Módulos</h2>
          <div className="grid grid-cols-2 gap-4">
            {intercomStatus.dataFlows.map(dataFlow => 
              renderModuleCard(dataFlow.module, dataFlow)
            )}
          </div>
        </div>
        
        <div>
          {renderNotificationsPanel()}
        </div>
      </div>

      {/* Modal de detalles */}
      {renderModuleDetails()}
    </div>
  );
};

export default IntercomDashboard;
