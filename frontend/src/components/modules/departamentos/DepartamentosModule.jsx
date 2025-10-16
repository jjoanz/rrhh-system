import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../../context/AuthContext";
import { Building, Plus, Trash2, Edit, AlertCircle, CheckCircle, X, Save, Search, Filter } from "lucide-react";

const API_URL = process.env.REACT_APP_API_URL || "http://192.168.0.239:5000/api";

const DepartamentosModule = () => {
  const { getStoredToken } = useAuth();
  const [departamentos, setDepartamentos] = useState([]);
  const [filteredDepartamentos, setFilteredDepartamentos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingDepartamento, setEditingDepartamento] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: ""
  });

  const fetchDepartamentos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = getStoredToken();
      const res = await axios.get(`${API_URL}/departamentos`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 Datos recibidos de departamentos:', res.data);
      
      if (res.data.departamentos && Array.isArray(res.data.departamentos)) {
        setDepartamentos(res.data.departamentos);
        setFilteredDepartamentos(res.data.departamentos);
      } else if (Array.isArray(res.data)) {
        setDepartamentos(res.data);
        setFilteredDepartamentos(res.data);
      } else {
        console.error('Formato inesperado:', res.data);
        setDepartamentos([]);
        setFilteredDepartamentos([]);
        setError('Formato de datos inesperado');
      }
      
    } catch (err) {
      console.error('Error cargando departamentos:', err);
      setError(err.response?.data?.message || 'Error cargando departamentos');
      setDepartamentos([]);
      setFilteredDepartamentos([]);
    } finally {
      setLoading(false);
    }
  };

  // Función de búsqueda
  const handleSearch = (value) => {
    setSearchTerm(value);
    
    if (!value.trim()) {
      setFilteredDepartamentos(departamentos);
      return;
    }

    const searchLower = value.toLowerCase();
    const filtered = departamentos.filter(dept => {
      const nombre = (dept.nombre || dept.Nombre || dept.NOMBRE || '').toLowerCase();
      const descripcion = (dept.descripcion || dept.Descripcion || dept.DESCRIPCION || '').toLowerCase();
      
      return nombre.includes(searchLower) || descripcion.includes(searchLower);
    });
    
    setFilteredDepartamentos(filtered);
  };

  const handleOpenModal = (departamento = null) => {
    if (departamento) {
      setEditingDepartamento(departamento);
      setFormData({
        nombre: departamento.nombre || departamento.Nombre || departamento.NOMBRE || "",
        descripcion: departamento.descripcion || departamento.Descripcion || departamento.DESCRIPCION || ""
      });
    } else {
      setEditingDepartamento(null);
      setFormData({ nombre: "", descripcion: "" });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDepartamento(null);
    setFormData({ nombre: "", descripcion: "" });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      setError('El nombre del departamento es requerido');
      return;
    }
    
    setLoading(true);
    setError(null);
    setMessage(null);
    
    try {
      const token = getStoredToken();
      
      console.log('📤 Enviando datos:', {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        editando: !!editingDepartamento
      });
      
      if (editingDepartamento) {
        const id = editingDepartamento.id || editingDepartamento.DepartamentoID || editingDepartamento.DEPARTAMENTO_ID;
        
        console.log('✏️ Editando departamento ID:', id);
        
        const response = await axios.put(
          `${API_URL}/departamentos/${id}`,
          {
            nombre: formData.nombre.trim(),
            descripcion: formData.descripcion.trim()
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('✅ Respuesta edición:', response.data);
        setMessage('Departamento actualizado exitosamente');
        
      } else {
        console.log('➕ Creando nuevo departamento');
        
        const response = await axios.post(
          `${API_URL}/departamentos`,
          {
            nombre: formData.nombre.trim(),
            descripcion: formData.descripcion.trim()
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('✅ Respuesta creación:', response.data);
        setMessage('Departamento creado exitosamente');
      }
      
      handleCloseModal();
      await fetchDepartamentos();
      
      setTimeout(() => setMessage(null), 3000);
      
    } catch (err) {
      console.error('❌ Error completo:', err);
      
      let errorMsg = 'Error guardando departamento';
      
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      } else if (err.response?.status === 404) {
        errorMsg = 'Endpoint no encontrado. Verifica la configuración del backend.';
      } else if (err.response?.status === 401) {
        errorMsg = 'No autorizado. Tu sesión puede haber expirado.';
      } else if (err.response?.status === 403) {
        errorMsg = 'No tienes permisos para realizar esta acción.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este departamento?')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setMessage(null);
    
    try {
      const token = getStoredToken();
      
      console.log('🗑️ Eliminando departamento ID:', id);
      
      await axios.delete(`${API_URL}/departamentos/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Departamento eliminado');
      setMessage('Departamento eliminado exitosamente');
      await fetchDepartamentos();
      
      setTimeout(() => setMessage(null), 3000);
      
    } catch (err) {
      console.error('❌ Error eliminando:', err);
      
      let errorMsg = 'Error eliminando departamento';
      
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartamentos();
  }, []);

  useEffect(() => {
    if (error || message) {
      const timer = setTimeout(() => {
        setError(null);
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, message]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header con diseño mejorado */}
        <div className="bg-white rounded-xl shadow-lg mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Building className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white mb-1">Gestión de Departamentos</h2>
                  <p className="text-blue-100 text-sm">
                    Administra la estructura organizativa de tu empresa
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleOpenModal()}
                className="px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-all duration-200 flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                Nuevo Departamento
              </button>
            </div>
          </div>

          {/* Barra de búsqueda profesional */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o descripción..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => handleSearch("")}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-lg">
                <Filter className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  {filteredDepartamentos.length} de {departamentos.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Mensajes de estado mejorados */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-center gap-3 text-red-800 shadow-md animate-fade-in">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            </div>
            <span className="font-medium">{error}</span>
          </div>
        )}

        {message && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg flex items-center gap-3 text-green-800 shadow-md animate-fade-in">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            </div>
            <span className="font-medium">{message}</span>
          </div>
        )}

        {/* Lista de departamentos con diseño mejorado */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {loading && departamentos.length === 0 ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Cargando departamentos...</p>
            </div>
          ) : filteredDepartamentos.length === 0 ? (
            <div className="p-12 text-center">
              <div className="p-6 bg-purple-50 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <Building className="w-12 h-12 text-purple-300" />
              </div>
              <p className="text-gray-700 font-semibold text-lg mb-2">
                {searchTerm ? 'No se encontraron resultados' : 'No hay departamentos registrados'}
              </p>
              <p className="text-gray-500 text-sm">
                {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Crea el primer departamento usando el botón de arriba'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {filteredDepartamentos.map((dept) => {
                const id = dept.id || dept.DepartamentoID || dept.DEPARTAMENTO_ID;
                const nombre = dept.nombre || dept.Nombre || dept.NOMBRE || 'Sin nombre';
                const descripcion = dept.descripcion || dept.Descripcion || dept.DESCRIPCION || 'Sin descripción';
                
                return (
                  <div
                    key={id}
                    className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl">
                          <Building className="w-6 h-6 text-purple-600" />
                        </div>
                        <h4 className="font-bold text-gray-900 text-lg">{nombre}</h4>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-6 line-clamp-3 leading-relaxed">
                      {descripcion}
                    </p>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleOpenModal(dept)}
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-semibold border border-blue-200 hover:border-blue-300"
                      >
                        <Edit className="w-4 h-4" />
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(id)}
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-semibold border border-red-200 hover:border-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                        Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal mejorado */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full transform animate-scale-in">
            <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-xl">
              <h3 className="text-xl font-bold">
                {editingDepartamento ? 'Editar Departamento' : 'Nuevo Departamento'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre del Departamento *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Recursos Humanos"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Describe las funciones y responsabilidades del departamento"
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all duration-200"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold shadow-lg hover:shadow-xl"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Guardando...' : editingDepartamento ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartamentosModule;