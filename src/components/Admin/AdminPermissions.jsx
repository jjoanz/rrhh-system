import React, { useEffect, useState } from 'react';
import { Users, Settings, Shield, Check, X, Save, AlertCircle, Eye, Plus, Edit, Trash2, EyeOff } from 'lucide-react';

// 🔑 URLs de API
const API_BASE_URL = 'http://localhost:5000/api';
const AUTH_API_URL = `${API_BASE_URL}/auth`;
const ADMIN_API_URL = `${API_BASE_URL}/admin`;

// ✅ Función para obtener el token
const getToken = () => {
  return localStorage.getItem('token') || localStorage.getItem('rrhh_token');
};

// 📋 Módulos predefinidos del sistema
const MODULOS_SISTEMA = [
  { id: 1, nombre: 'empleados', descripcion: 'Gestión de empleados' },
  { id: 2, nombre: 'vacantes', descripcion: 'Gestión de vacantes' },
  { id: 3, nombre: 'postulaciones', descripcion: 'Gestión de postulaciones' },
  { id: 4, nombre: 'nomina', descripcion: 'Gestión de nómina' },
  { id: 5, nombre: 'vacaciones', descripcion: 'Gestión de vacaciones' },
  { id: 6, nombre: 'capacitaciones', descripcion: 'Gestión de capacitaciones' },
  { id: 7, nombre: 'asistencia', descripcion: 'Control de asistencias' },
  { id: 8, nombre: 'departamentos', descripcion: 'Gestión de departamentos' },
  { id: 9, nombre: 'puestos', descripción: 'Gestión de puestos' },
  { id: 10, nombre: 'reportes', descripcion: 'Reportes del sistema' },
  { id: 11, nombre: 'admin', descripcion: 'Administración de usuarios y permisos' }
];

const AdminPermissions = () => {
  const [activeTab, setActiveTab] = useState('usuarios');
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedRol, setSelectedRol] = useState(null);
  const [selectedRolName, setSelectedRolName] = useState('');
  const [permisos, setPermisos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [changedRoles, setChangedRoles] = useState({});

  // Lista de roles disponibles
  const rolesDisponibles = [
    'colaborador',
    'gerente', 
    'director',
    'rrhh',
    'gerente_rrhh',
    'director_rrhh',
    'admin'
  ];

  // --- Función helper para manejar errores de API ---
  const handleApiError = (error, response) => {
    console.error('Error de API:', { error, status: response?.status });
    
    if (response?.status === 401) {
      setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
    } else if (response?.status === 403) {
      setError('No tienes permisos para realizar esta acción.');
    } else if (response?.status === 404) {
      setError('Endpoint no encontrado. Verifica la configuración del servidor.');
    } else {
      setError(error.message || 'Error interno del servidor');
    }
  };

  // --- Debug de token ---
  const debugToken = () => {
    const token = getToken();
    console.log('🔐 Token encontrado:', token ? 'SÍ' : 'NO');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('📋 Payload del token:', payload);
      } catch (e) {
        console.error('❌ Token malformado:', e);
      }
    }
  };

  // --- Inicializar permisos para un rol ---
  const initializePermisosForRole = () => {
    return MODULOS_SISTEMA.map((modulo, index) => ({
      PermisoID: `temp_${index}`,
      ModuloID: modulo.id,
      NombreModulo: modulo.nombre,
      DescripcionModulo: modulo.descripcion,
      EstaVisible: true,
      PuedeVer: false,
      PuedeCrear: false,
      PuedeEditar: false,
      PuedeEliminar: false
    }));
  };

  // --- Cargar usuarios (CORREGIDO) ---
  const loadUsuarios = async () => {
    setLoading(true);
    setError(null);
    
    debugToken(); // Debug del token
    
    try {
      // Intentar múltiples endpoints hasta encontrar uno que funcione
      const endpoints = [
        `${AUTH_API_URL}/users`,
        `${API_BASE_URL}/usuarios`, 
        `${ADMIN_API_URL}/users`,
        `${API_BASE_URL}/admin/usuarios`
      ];
      
      let res = null;
      let usedEndpoint = null;
      
      for (const endpoint of endpoints) {
        console.log('📡 Intentando endpoint:', endpoint);
        try {
          res = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${getToken()}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (res.ok) {
            usedEndpoint = endpoint;
            console.log('✅ Endpoint funciona:', endpoint);
            break;
          } else {
            console.log(`❌ Endpoint ${endpoint} falló con status:`, res.status);
          }
        } catch (err) {
          console.log(`💥 Error en endpoint ${endpoint}:`, err.message);
          continue;
        }
      }
      
      if (!res || !res.ok) {
        const errorText = res ? await res.text() : 'Ningún endpoint funcionó';
        console.error('❌ Todos los endpoints fallaron:', errorText);
        handleApiError(new Error(`No se pudo conectar: ${errorText}`), res);
        return;
      }

      console.log('📊 Usando endpoint exitoso:', usedEndpoint);
      console.log('📊 Respuesta del servidor:', {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok
      });

      const data = await res.json();
      console.log('📋 Datos recibidos:', data);

      // Mapear la respuesta a la estructura esperada
      let usuariosData = [];
      
      if (data.usuarios) {
        // Si viene en formato { usuarios: [...] } - TU CASO
        usuariosData = data.usuarios;
        console.log('🎯 Usando data.usuarios:', usuariosData.length);
      } else if (data.users) {
        // Si viene en formato { users: [...] }
        usuariosData = data.users;
        console.log('🎯 Usando data.users:', usuariosData.length);
      } else if (Array.isArray(data)) {
        // Si viene directamente como array
        usuariosData = data;
        console.log('🎯 Usando data directamente:', usuariosData.length);
      } else if (data.recordset) {
        // Si viene en formato de recordset de SQL Server
        usuariosData = data.recordset;
        console.log('🎯 Usando data.recordset:', usuariosData.length);
      }

      console.log('📊 usuariosData antes de normalizar:', usuariosData);

      // Normalizar la estructura de datos
      const usuariosNormalizados = usuariosData.map(user => ({
        id: user.UsuarioID || user.id,
        username: user.Username || user.username,
        email: user.Email || user.email,
        rol: user.Rol || user.role || user.rol,
        estado: user.Estado || user.estado || 1,
        empleadoId: user.EmpleadoID || user.empleadoId
      }));

      console.log('👥 Usuarios normalizados:', usuariosNormalizados);
      setUsuarios(usuariosNormalizados);

    } catch (err) {
      console.error('💥 Error cargando usuarios:', err);
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  // --- Cargar roles ---
  const loadRoles = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📡 Cargando roles desde:', `${ADMIN_API_URL}/roles`);
      
      const res = await fetch(`${ADMIN_API_URL}/roles`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📊 Respuesta roles:', { status: res.status, ok: res.ok });

      // Si no existe el endpoint, usar roles por defecto
      if (!res.ok && res.status === 404) {
        console.log('⚠️ Endpoint de roles no encontrado, usando roles por defecto');
        const defaultRoles = rolesDisponibles.map((rol, index) => ({
          RolID: index + 1,
          NombreRol: rol,
          Descripcion: `Rol de ${rol.replace('_', ' ')}`
        }));
        setRoles(defaultRoles);
        return;
      }

      if (!res.ok) {
        handleApiError(new Error(`Error ${res.status}: ${res.statusText}`), res);
        return;
      }

      const data = await res.json();
      console.log('📋 Datos de roles:', data);
      
      let rolesData = data.roles || data.recordset || data;
      setRoles(rolesData);
      
    } catch (err) {
      console.error('💥 Error cargando roles:', err);
      // Usar roles por defecto en caso de error
      const defaultRoles = rolesDisponibles.map((rol, index) => ({
        RolID: index + 1,
        NombreRol: rol,
        Descripcion: `Rol de ${rol.replace('_', ' ')}`
      }));
      setRoles(defaultRoles);
    } finally {
      setLoading(false);
    }
  };

  // --- Cargar permisos de un rol específico ---
  const loadPermisos = async (rolId) => {
    if (!rolId) return;
    
    setLoading(true);
    try {
      console.log('📡 Cargando permisos para rol:', rolId);
      
      const res = await fetch(`${ADMIN_API_URL}/permisos/${rolId}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 Respuesta permisos:', { status: res.status, ok: res.ok });
      
      if (!res.ok && res.status !== 404) {
        handleApiError(new Error(`Error ${res.status}: ${res.statusText}`), res);
        return;
      }

      let data = { permisos: [] };
      if (res.ok) {
        data = await res.json();
        console.log('📋 Permisos recibidos:', data);
      }
      
      // Si no hay permisos existentes, inicializar con todos los módulos
      if (!data.permisos || data.permisos.length === 0) {
        console.log('⚠️ No hay permisos, inicializando por defecto');
        setPermisos(initializePermisosForRole());
      } else {
        // Combinar permisos existentes con módulos del sistema
        const permisosExistentes = data.permisos;
        const permisosCompletos = MODULOS_SISTEMA.map((modulo, index) => {
          const permisoExistente = permisosExistentes.find(p => 
            p.ModuloID === modulo.id || p.NombreModulo === modulo.nombre
          );
          
          return {
            PermisoID: permisoExistente?.PermisoID || `temp_${index}`,
            ModuloID: modulo.id,
            NombreModulo: modulo.nombre,
            DescripcionModulo: modulo.descripcion,
            EstaVisible: permisoExistente?.EstaVisible !== false,
            PuedeVer: permisoExistente?.PuedeVer || false,
            PuedeCrear: permisoExistente?.PuedeCrear || false,
            PuedeEditar: permisoExistente?.PuedeEditar || false,
            PuedeEliminar: permisoExistente?.PuedeEliminar || false
          };
        });
        
        setPermisos(permisosCompletos);
      }
    } catch (err) {
      console.error('💥 Error cargando permisos:', err);
      setPermisos(initializePermisosForRole());
    } finally {
      setLoading(false);
    }
  };

  // --- Manejar cambio temporal de rol ---
  const handleRoleChange = (userId, nuevoRol) => {
    setChangedRoles(prev => ({
      ...prev,
      [userId]: nuevoRol
    }));
  };

  // --- Actualizar rol de usuario ---
  const updateUserRole = async (userId, nuevoRol) => {
    console.log('🔄 Actualizando rol:', { userId, nuevoRol });
    try {
      const usuario = usuarios.find(u => u.id === userId);
      if (!usuario) {
        throw new Error('Usuario no encontrado');
      }

      const res = await fetch(`${AUTH_API_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          username: usuario.username,
          email: usuario.email,
          role: nuevoRol,
          estado: usuario.estado
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Error ${res.status}: ${errorText}`);
      }
      
      setMessage({ type: 'success', text: 'Rol actualizado correctamente' });
      
      // Limpiar cambios pendientes para este usuario
      setChangedRoles(prev => {
        const newChanges = { ...prev };
        delete newChanges[userId];
        return newChanges;
      });
      
      // Recargar usuarios
      await loadUsuarios();
    } catch (err) {
      console.error('💥 Error actualizando rol:', err);
      setMessage({ type: 'error', text: err.message });
    }
  };

  // --- Guardar todos los cambios de roles ---
  const saveAllRoleChanges = async () => {
    const changeCount = Object.keys(changedRoles).length;
    if (changeCount === 0) {
      setMessage({ type: 'error', text: 'No hay cambios pendientes para guardar' });
      return;
    }

    setLoading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const [userId, nuevoRol] of Object.entries(changedRoles)) {
        try {
          await updateUserRole(parseInt(userId), nuevoRol);
          successCount++;
        } catch (error) {
          errorCount++;
          console.error(`Error actualizando usuario ${userId}:`, error);
        }
      }

      if (errorCount === 0) {
        setMessage({ type: 'success', text: `Se actualizaron ${successCount} roles correctamente` });
        setChangedRoles({});
      } else {
        setMessage({ type: 'error', text: `${successCount} exitosos, ${errorCount} fallaron` });
      }
    } finally {
      setLoading(false);
    }
  };

  // --- Cancelar cambios ---
  const cancelRoleChanges = () => {
    setChangedRoles({});
    setMessage({ type: 'success', text: 'Cambios cancelados' });
  };

  // --- Obtener el rol actual (con cambios pendientes) ---
  const getCurrentRole = (usuario) => {
    return changedRoles[usuario.id] || usuario.rol;
  };

  // --- Actualizar permisos ---
  const updatePermisos = async () => {
    if (!selectedRol) return;

    try {
      const permisosData = permisos.map(p => ({
        moduloId: p.ModuloID,
        nombreModulo: p.NombreModulo,
        descripcionModulo: p.DescripcionModulo,
        estaVisible: p.EstaVisible,
        puedeVer: p.PuedeVer,
        puedeCrear: p.PuedeCrear,
        puedeEditar: p.PuedeEditar,
        puedeEliminar: p.PuedeEliminar
      }));

      const res = await fetch(`${ADMIN_API_URL}/permisos/${selectedRol}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ permisos: permisosData })
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Error ${res.status}: ${errorText}`);
      }
      
      setMessage({ type: 'success', text: 'Permisos actualizados correctamente' });
    } catch (err) {
      console.error('💥 Error actualizando permisos:', err);
      setMessage({ type: 'error', text: err.message });
    }
  };

  // --- Cambiar permiso específico ---
  const togglePermiso = (permisoId, campo) => {
    setPermisos(prev => 
      prev.map(p => 
        p.PermisoID === permisoId 
          ? { ...p, [campo]: !p[campo] }
          : p
      )
    );
  };

  // --- Toggle visibilidad del módulo ---
  const toggleVisibilidad = (permisoId) => {
    setPermisos(prev => 
      prev.map(p => 
        p.PermisoID === permisoId 
          ? { 
              ...p, 
              EstaVisible: !p.EstaVisible,
              PuedeVer: !p.EstaVisible ? p.PuedeVer : false,
              PuedeCrear: !p.EstaVisible ? p.PuedeCrear : false,
              PuedeEditar: !p.EstaVisible ? p.PuedeEditar : false,
              PuedeEliminar: !p.EstaVisible ? p.PuedeEliminar : false
            }
          : p
      )
    );
  };

  // --- Seleccionar rol para editar permisos ---
  const selectRol = (rolId, rolName) => {
    setSelectedRol(rolId);
    setSelectedRolName(rolName);
    loadPermisos(rolId);
  };

  // --- Cargar datos al inicio ---
  useEffect(() => {
    console.log('🚀 Componente montado, tab activo:', activeTab);
    
    if (activeTab === 'usuarios') {
      loadUsuarios();
    } else if (activeTab === 'permisos') {
      loadRoles();
    }
  }, [activeTab]);

  // Limpiar mensajes después de 5 segundos
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (loading && usuarios.length === 0 && roles.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200 px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Shield className="mr-3 h-7 w-7 text-blue-600" />
              Gestión de Roles y Permisos
            </h1>
            <p className="text-gray-600 mt-1">Administra usuarios, roles y permisos del sistema</p>
          </div>

          {/* Debug Info */}
          

          {/* Mensaje de estado */}
          {message.text && (
            <div className={`mx-6 mt-4 p-4 rounded-md flex items-center ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <AlertCircle className="mr-2 h-5 w-5" />
              {message.text}
            </div>
          )}

          {/* Error global */}
          {error && (
            <div className="mx-6 mt-4 p-4 rounded-md bg-red-50 border border-red-200 text-red-800 flex items-center">
              <AlertCircle className="mr-2 h-5 w-5" />
              Error: {error}
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex px-6">
              <button
                onClick={() => setActiveTab('usuarios')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'usuarios'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="inline-block mr-2 h-4 w-4" />
                Gestión de Usuarios
              </button>
              <button
                onClick={() => setActiveTab('permisos')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'permisos'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Settings className="inline-block mr-2 h-4 w-4" />
                Configuración de Permisos
              </button>
              <button
                onClick={() => setActiveTab('info')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'info'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Eye className="inline-block mr-2 h-4 w-4" />
                Información del Sistema
              </button>
            </nav>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            {/* Tab Usuarios */}
            {activeTab === 'usuarios' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Usuarios del Sistema
                  </h2>
                  <div className="flex items-center gap-4">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {usuarios.length} usuarios
                    </span>
                    
                    {/* Botones para cambios pendientes */}
                    {Object.keys(changedRoles).length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                          {Object.keys(changedRoles).length} cambios pendientes
                        </span>
                        <button
                          onClick={saveAllRoleChanges}
                          disabled={loading}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50"
                        >
                          <Save className="mr-1.5 h-4 w-4" />
                          Guardar Todo
                        </button>
                        <button
                          onClick={cancelRoleChanges}
                          disabled={loading}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                          <X className="mr-1.5 h-4 w-4" />
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Usuario
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rol Actual
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {usuarios.map((usuario) => (
                        <tr key={usuario.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-sm">
                                  {usuario.username?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {usuario.username}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ID: {usuario.id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {usuario.email || 'Sin email'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                changedRoles[usuario.id] 
                                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {getCurrentRole(usuario)}
                              </span>
                              {changedRoles[usuario.id] && (
                                <span className="ml-2 text-xs text-yellow-600 font-medium">
                                  (Pendiente)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              usuario.estado === 1 || usuario.estado === 2 || usuario.estado === 'activo'
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {usuario.estado === 1 || usuario.estado === 2 || usuario.estado === 'activo' ? 'Activo' : 'Inactivo'}
                              <span className="ml-1 text-xs">({usuario.estado})</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <select
                                value={getCurrentRole(usuario)}
                                onChange={(e) => handleRoleChange(usuario.id, e.target.value)}
                                disabled={loading}
                                className={`border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                  loading ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'
                                } ${
                                  changedRoles[usuario.id] ? 'border-yellow-400 bg-yellow-50' : ''
                                }`}
                              >
                                {rolesDisponibles.map(rol => (
                                  <option key={rol} value={rol}>
                                    {rol.charAt(0).toUpperCase() + rol.slice(1).replace('_', ' ')}
                                  </option>
                                ))}
                              </select>
                              
                              {changedRoles[usuario.id] && (
                                <button
                                  onClick={() => updateUserRole(usuario.id, changedRoles[usuario.id])}
                                  disabled={loading}
                                  className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50"
                                  title="Guardar este cambio"
                                >
                                  <Check className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {usuarios.length === 0 && (
                    <div className="text-center py-12">
                      <Users className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No hay usuarios</h3>
                      <p className="mt-1 text-sm text-gray-500">No se encontraron usuarios en el sistema.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab Permisos */}
            {activeTab === 'permisos' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Configuración de Permisos por Rol
                  </h2>
                  {selectedRol && (
                    <button
                      onClick={updatePermisos}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Guardar Cambios
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Lista de Roles */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">
                      Seleccionar Rol
                    </h3>
                    <div className="space-y-2">
                      {roles.map((rol) => (
                        <button
                          key={rol.RolID}
                          onClick={() => selectRol(rol.RolID, rol.NombreRol)}
                          className={`w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                            selectedRol === rol.RolID
                              ? 'bg-blue-100 text-blue-700 border border-blue-300 shadow-sm'
                              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{rol.NombreRol}</span>
                            {selectedRol === rol.RolID && (
                              <Check className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                          {rol.Descripcion && (
                            <p className="text-xs text-gray-500 mt-1">{rol.Descripcion}</p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tabla de Permisos */}
                  <div className="lg:col-span-2">
                    {selectedRol ? (
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-4">
                          Permisos para: <span className="text-blue-600">{selectedRolName}</span>
                        </h3>
                        {loading ? (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                            <p className="text-gray-600">Cargando permisos...</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Módulo
                                  </th>
                                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <div className="flex flex-col items-center">
                                      <EyeOff className="h-4 w-4 mx-auto" />
                                      <span className="mt-1">Visible</span>
                                    </div>
                                  </th>
                                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <div className="flex flex-col items-center">
                                      <Eye className="h-4 w-4 mx-auto" />
                                      <span className="mt-1">Ver</span>
                                    </div>
                                  </th>
                                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <div className="flex flex-col items-center">
                                      <Plus className="h-4 w-4 mx-auto" />
                                      <span className="mt-1">Crear</span>
                                    </div>
                                  </th>
                                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <div className="flex flex-col items-center">
                                      <Edit className="h-4 w-4 mx-auto" />
                                      <span className="mt-1">Editar</span>
                                    </div>
                                  </th>
                                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <div className="flex flex-col items-center">
                                      <Trash2 className="h-4 w-4 mx-auto" />
                                      <span className="mt-1">Eliminar</span>
                                    </div>
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {permisos.map((permiso) => (
                                  <tr key={permiso.PermisoID} className={`hover:bg-gray-50 transition-colors ${
                                    !permiso.EstaVisible ? 'bg-gray-100 opacity-60' : ''
                                  }`}>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <div className="text-sm font-medium text-gray-900 flex items-center">
                                        <span className={`${!permiso.EstaVisible ? 'line-through text-gray-500' : ''}`}>
                                          {permiso.NombreModulo}
                                        </span>
                                        {!permiso.EstaVisible && (
                                          <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                                            OCULTO
                                          </span>
                                        )}
                                      </div>
                                      <div className={`text-sm ${!permiso.EstaVisible ? 'text-gray-400 line-through' : 'text-gray-500'}`}>
                                        {permiso.DescripcionModulo}
                                      </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-center">
                                      <button
                                        onClick={() => toggleVisibilidad(permiso.PermisoID)}
                                        className={`p-2 rounded-full transition-colors ${
                                          permiso.EstaVisible 
                                            ? 'text-green-600 bg-green-100 hover:bg-green-200' 
                                            : 'text-red-600 bg-red-100 hover:bg-red-200'
                                        }`}
                                        title={permiso.EstaVisible ? 'Módulo visible - Click para ocultar' : 'Módulo oculto - Click para mostrar'}
                                      >
                                        {permiso.EstaVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                      </button>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-center">
                                      <button
                                        onClick={() => togglePermiso(permiso.PermisoID, 'PuedeVer')}
                                        disabled={!permiso.EstaVisible}
                                        className={`p-2 rounded-full transition-colors ${
                                          !permiso.EstaVisible 
                                            ? 'text-gray-300 bg-gray-100 cursor-not-allowed'
                                            : permiso.PuedeVer 
                                              ? 'text-green-600 bg-green-100 hover:bg-green-200' 
                                              : 'text-gray-400 bg-gray-100 hover:bg-gray-200'
                                        }`}
                                        title={!permiso.EstaVisible ? 'Módulo oculto' : permiso.PuedeVer ? 'Permitido' : 'No permitido'}
                                      >
                                        {permiso.PuedeVer ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                                      </button>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-center">
                                      <button
                                        onClick={() => togglePermiso(permiso.PermisoID, 'PuedeCrear')}
                                        disabled={!permiso.EstaVisible}
                                        className={`p-2 rounded-full transition-colors ${
                                          !permiso.EstaVisible 
                                            ? 'text-gray-300 bg-gray-100 cursor-not-allowed'
                                            : permiso.PuedeCrear 
                                              ? 'text-green-600 bg-green-100 hover:bg-green-200' 
                                              : 'text-gray-400 bg-gray-100 hover:bg-gray-200'
                                        }`}
                                        title={!permiso.EstaVisible ? 'Módulo oculto' : permiso.PuedeCrear ? 'Permitido' : 'No permitido'}
                                      >
                                        {permiso.PuedeCrear ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                                      </button>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-center">
                                      <button
                                        onClick={() => togglePermiso(permiso.PermisoID, 'PuedeEditar')}
                                        disabled={!permiso.EstaVisible}
                                        className={`p-2 rounded-full transition-colors ${
                                          !permiso.EstaVisible 
                                            ? 'text-gray-300 bg-gray-100 cursor-not-allowed'
                                            : permiso.PuedeEditar 
                                              ? 'text-green-600 bg-green-100 hover:bg-green-200' 
                                              : 'text-gray-400 bg-gray-100 hover:bg-gray-200'
                                        }`}
                                        title={!permiso.EstaVisible ? 'Módulo oculto' : permiso.PuedeEditar ? 'Permitido' : 'No permitido'}
                                      >
                                        {permiso.PuedeEditar ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                                      </button>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-center">
                                      <button
                                        onClick={() => togglePermiso(permiso.PermisoID, 'PuedeEliminar')}
                                        disabled={!permiso.EstaVisible}
                                        className={`p-2 rounded-full transition-colors ${
                                          !permiso.EstaVisible 
                                            ? 'text-gray-300 bg-gray-100 cursor-not-allowed'
                                            : permiso.PuedeEliminar 
                                              ? 'text-green-600 bg-green-100 hover:bg-green-200' 
                                              : 'text-gray-400 bg-gray-100 hover:bg-gray-200'
                                        }`}
                                        title={!permiso.EstaVisible ? 'Módulo oculto' : permiso.PuedeEliminar ? 'Permitido' : 'No permitido'}
                                      >
                                        {permiso.PuedeEliminar ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>

                            {permisos.length === 0 && (
                              <div className="text-center py-8">
                                <Settings className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">Cargando módulos del sistema</h3>
                                <p className="mt-1 text-sm text-gray-500">Preparando todos los módulos para este rol...</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-16 text-gray-500">
                        <Shield className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Selecciona un rol</h3>
                        <p className="text-sm">Elige un rol de la lista para ver y editar sus permisos</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab Información */}
            {activeTab === 'info' && (
              <div className="space-y-8">
                {/* Módulos del Sistema */}
                <section>
                  <div className="flex items-center mb-4">
                    <Settings className="h-5 w-5 text-purple-600 mr-2" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      Módulos del Sistema ({MODULOS_SISTEMA.length})
                    </h2>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="text-blue-800 font-medium">Información del Sistema</span>
                    </div>
                    <p className="text-blue-700 mt-2 text-sm">
                      Todos los roles tienen acceso a estos módulos por defecto. Como administrador, puedes controlar la visibilidad y permisos específicos de cada módulo para cada rol.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {MODULOS_SISTEMA.map((modulo) => (
                      <div key={modulo.id} className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-purple-800">
                            {modulo.nombre}
                          </span>
                          <span className="text-xs text-purple-600 bg-purple-200 px-2 py-1 rounded">
                            Sistema
                          </span>
                        </div>
                        <p className="text-sm text-purple-700">{modulo.descripcion}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Roles */}
                <section>
                  <div className="flex items-center mb-4">
                    <Shield className="h-5 w-5 text-blue-600 mr-2" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      Roles del Sistema ({roles.length})
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {roles.map((rol) => (
                      <div key={rol.RolID} className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-green-800">
                            {rol.NombreRol}
                          </span>
                          <span className="text-xs text-green-600 bg-green-200 px-2 py-1 rounded">
                            ID: {rol.RolID}
                          </span>
                        </div>
                        {rol.Descripcion && (
                          <p className="text-sm text-green-700">{rol.Descripcion}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                {/* Estadísticas del Sistema */}
                <section>
                  <div className="flex items-center mb-4">
                    <Eye className="h-5 w-5 text-indigo-600 mr-2" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      Estadísticas del Sistema
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                      <div className="text-3xl font-bold text-blue-600">{usuarios.length}</div>
                      <div className="text-sm text-gray-500 mt-1">Usuarios Totales</div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                      <div className="text-3xl font-bold text-green-600">{roles.length}</div>
                      <div className="text-sm text-gray-500 mt-1">Roles Configurados</div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                      <div className="text-3xl font-bold text-purple-600">{MODULOS_SISTEMA.length}</div>
                      <div className="text-sm text-gray-500 mt-1">Módulos del Sistema</div>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPermissions;