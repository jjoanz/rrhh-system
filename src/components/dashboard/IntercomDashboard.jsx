import React, { useState, useEffect } from 'react';

const IntercomDashboard = () => {
  // Simular datos del contexto para demostración
  const [moduleNotifications, setModuleNotifications] = useState([
    {
      id: 1,
      from: 'empleados',
      type: 'data_update',
      dataKey: 'empleadosData',
      timestamp: new Date(Date.now() - 5000).toISOString(),
      affectedModules: ['nomina', 'asistencia', 'vacaciones', 'dashboard']
    },
    {
      id: 2,
      from: 'configuracion',
      type: 'data_update',
      dataKey: 'parametrosNomina',
      timestamp: new Date(Date.now() - 15000).toISOString(),
      affectedModules: ['nomina']
    },
    {
      id: 3,
      from: 'asistencia',
      type: 'data_update',
      dataKey: 'registrosHoy',
      timestamp: new Date(Date.now() - 30000).toISOString(),
      affectedModules: ['nomina', 'dashboard']
    }
  ]);

  // Simular funciones del contexto
  const getIntercomStatus = () => ({
    activeModules: ['empleados', 'configuracion', 'nomina', 'asistencia', 'vacaciones', 'dashboard'],
    recentNotifications: moduleNotifications,
    dataFlows: [
      { module: 'empleados', hasData: true, lastUpdate: new Date(Date.now() - 5000).toISOString() },
      { module: 'configuracion', hasData: true, lastUpdate: new Date(Date.now() - 15000).toISOString() },
      { module: 'nomina', hasData: true, lastUpdate: new Date(Date.now() - 10000).toISOString() },
      { module: 'asistencia', hasData: true, lastUpdate: new Date(Date.now() - 30000).toISOString() },
      { module: 'vacaciones', hasData: true, lastUpdate: new Date(Date.now() - 45000).toISOString() },
      { module: 'capacitacion', hasData: false, lastUpdate: null },
      { module: 'vacantes', hasData: false, lastUpdate: null },
      { module: 'perfil', hasData: true, lastUpdate: new Date(Date.now() - 60000).toISOString() },
      { module: 'dashboard', hasData: true, lastUpdate: new Date(Date.now() - 5000).toISOString() },
      { module: 'reportes', hasData: false, lastUpdate: null }
    ]
  });

  const forceSyncAllModules = () => {
    alert('🔄 Sincronización forzada ejecutada - En implementación real esto actualizaría todos los módulos');
  };

  const getModuleData = (module) => {
    const sampleData = {
      empleados: {
        empleadosData: [
          { id: 1, nombre: 'Ana García', departamento: 'RRHH' },
          { id: 2, nombre: 'Carlos Rodríguez', departamento: 'Tecnología' }
        ],
        datosPersonales: { 'ana@empresa.com': { nombre: 'Ana', cargo: 'Gerente' } }
      },
      nomina: {
        calculosActuales: [
          { empleadoId: 1, salarioNeto: 85000 },
          { empleadoId: 2, salarioNeto: 75000 }
        ]
      },
      configuracion: {
        parametrosNomina: { impuestos: { isr: 0.15 }, bonificaciones: { navidad: 1 } }
      }
    };
    return sampleData[module] || {};
  };
  
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [selectedModule, setSelectedModule] = useState(null);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  // Estado del sistema de intercomunicación
  const [intercomStatus, setIntercomStatus] = useState({
    activeModules: [],
    recentNotifications: [],
    dataFlows: []
  });

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
  }, [isAutoRefresh, refreshInterval]);

  // Mapeo de colores para módulos
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

  const renderDataFlowVisualization = () => {
    const connections = [
      // Empleados alimenta a todos
      { from: 'empleados', to: ['nomina', 'asistencia', 'vacaciones', 'capacitacion', 'vacantes', 'perfil', 'dashboard', 'reportes'] },
      // Configuración alimenta a operacionales
      { from: 'configuracion', to: ['nomina', 'asistencia', 'vacaciones', 'capacitacion', 'vacantes'] },
      // Intercomunicación entre operacionales
      { from: 'asistencia', to: ['nomina', 'dashboard'] },
      { from: 'vacaciones', to: ['nomina', 'asistencia'] },
      { from: 'capacitacion', to: ['vacantes'] },
      { from: 'vacantes', to: ['empleados'] },
      // Hacia consumidores finales
      { from: 'nomina', to: ['dashboard', 'reportes'] },
      { from: 'perfil', to: ['empleados'] }
    ];

    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Flujo de Datos entre Módulos</h3>
        <div className="relative">
          <svg width="100%" height="400" className="overflow-visible">
            {/* Módulos */}
            {Object.keys(moduleIcons).map((module, index) => {
              const x = 100 + (index % 5) * 120;
              const y = 50 + Math.floor(index / 5) * 80;
              const isActive = intercomStatus.dataFlows.find(df => df.module === module)?.hasData;
              
              return (
                <g key={module}>
                  <circle
                    cx={x}
                    cy={y}
                    r="25"
                    fill={isActive ? moduleColors[module].replace('bg-', '#') : '#e5e7eb'}
                    className="stroke-white stroke-2"
                  />
                  <text
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="16"
                  >
                    {moduleIcons[module]}
                  </text>
                  <text
                    x={x}
                    y={y + 40}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#6b7280"
                  >
                    {moduleNames[module]}
                  </text>
                </g>
              );
            })}
            
            {/* Conexiones */}
            {connections.map((connection, connIndex) => {
              const fromIndex = Object.keys(moduleIcons).indexOf(connection.from);
              const fromX = 100 + (fromIndex % 5) * 120;
              const fromY = 50 + Math.floor(fromIndex / 5) * 80;
              
              return connection.to.map((toModule, toIndex) => {
                const toModuleIndex = Object.keys(moduleIcons).indexOf(toModule);
                const toX = 100 + (toModuleIndex % 5) * 120;
                const toY = 50 + Math.floor(toModuleIndex / 5) * 80;
                
                const isActive = intercomStatus.dataFlows.find(df => df.module === connection.from)?.hasData;
                
                return (
                  <line
                    key={`${connection.from}-${toModule}`}
                    x1={fromX}
                    y1={fromY}
                    x2={toX}
                    y2={toY}
                    stroke={isActive ? '#3b82f6' : '#e5e7eb'}
                    strokeWidth={isActive ? "2" : "1"}
                    strokeDasharray={isActive ? "none" : "5,5"}
                    opacity={isActive ? "0.8" : "0.3"}
                  />
                );
              });
            })}
          </svg>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-1 bg-blue-500"></div>
              <span>Datos activos</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-1 bg-gray-300 border-dashed border border-gray-400"></div>
              <span>Sin datos</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
          
          {/* Controles globales */}
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

      {/* Visualización de flujo de datos */}
      <div className="mb-8">
        {renderDataFlowVisualization()}
      </div>

      {/* Grid de módulos y panel de actividad */}
      <div className="grid grid-cols-3 gap-6">
        {/* Lista de módulos */}
        <div className="col-span-2">
          <h2 className="text-xl font-semibold mb-4">Estado de Módulos</h2>
          <div className="grid grid-cols-2 gap-4">
            {intercomStatus.dataFlows.map(dataFlow => 
              renderModuleCard(dataFlow.module, dataFlow)
            )}
          </div>
        </div>
        
        {/* Panel de notificaciones */}
        <div>
          {renderNotificationsPanel()}
        </div>
      </div>

      {/* Modal de detalles del módulo */}
      {renderModuleDetails()}
    </div>
  );
};

export default IntercomDashboard;