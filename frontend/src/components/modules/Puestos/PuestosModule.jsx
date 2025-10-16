import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../../context/AuthContext";
import { Briefcase, Plus, Trash2, AlertCircle, CheckCircle } from "lucide-react";

const API_URL = process.env.REACT_APP_API_URL || "http://192.168.0.239:5000/api";

const PuestosModule = () => {
  const { getStoredToken } = useAuth();
  const [puestos, setPuestos] = useState([]);
  const [nuevoPuesto, setNuevoPuesto] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const fetchPuestos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = getStoredToken();
      const res = await axios.get(`${API_URL}/puestos`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 Datos recibidos de puestos:', res.data);
      
      // ✅ VALIDAR FORMATO DE RESPUESTA
      if (res.data.puestos && Array.isArray(res.data.puestos)) {
        setPuestos(res.data.puestos);
      } else if (Array.isArray(res.data)) {
        setPuestos(res.data);
      } else {
        console.error('Formato inesperado:', res.data);
        setPuestos([]);
        setError('Formato de datos inesperado');
      }
      
    } catch (err) {
      console.error('Error cargando puestos:', err);
      setError(err.response?.data?.message || 'Error cargando puestos');
      setPuestos([]);
    } finally {
      setLoading(false);
    }
  };

  const agregarPuesto = async () => {
    if (!nuevoPuesto.trim()) {
      setError('El nombre del puesto es requerido');
      return;
    }
    
    setLoading(true);
    setError(null);
    setMessage(null);
    
    try {
      const token = getStoredToken();
      await axios.post(
        `${API_URL}/puestos`, 
        { nombre: nuevoPuesto.trim() },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setNuevoPuesto("");
      setMessage('Puesto agregado exitosamente');
      await fetchPuestos();
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMessage(null), 3000);
      
    } catch (err) {
      console.error('Error agregando puesto:', err);
      setError(err.response?.data?.message || 'Error agregando puesto');
    } finally {
      setLoading(false);
    }
  };

  const eliminarPuesto = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este puesto?')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setMessage(null);
    
    try {
      const token = getStoredToken();
      await axios.delete(`${API_URL}/puestos/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setMessage('Puesto eliminado exitosamente');
      await fetchPuestos();
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMessage(null), 3000);
      
    } catch (err) {
      console.error('Error eliminando puesto:', err);
      setError(err.response?.data?.message || 'Error eliminando puesto');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      agregarPuesto();
    }
  };

  useEffect(() => {
    fetchPuestos();
  }, []);

  // Limpiar mensajes después de 5 segundos
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Briefcase className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Gestión de Puestos</h2>
          </div>
          <p className="text-gray-600 text-sm">
            Administra los puestos de trabajo disponibles en la organización
          </p>
        </div>

        {/* Mensajes de estado */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-800">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Formulario para agregar puesto */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Agregar Nuevo Puesto</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={nuevoPuesto}
              onChange={(e) => setNuevoPuesto(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nombre del puesto (ej: Desarrollador Senior)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              onClick={agregarPuesto}
              disabled={loading || !nuevoPuesto.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
            >
              <Plus className="w-5 h-5" />
              {loading ? 'Agregando...' : 'Agregar'}
            </button>
          </div>
        </div>

        {/* Lista de puestos */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Puestos Registrados ({Array.isArray(puestos) ? puestos.length : 0})
            </h3>
          </div>

          {loading && puestos.length === 0 ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando puestos...</p>
            </div>
          ) : Array.isArray(puestos) && puestos.length === 0 ? (
            <div className="p-8 text-center">
              <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No hay puestos registrados</p>
              <p className="text-gray-500 text-sm mt-1">Agrega el primer puesto usando el formulario de arriba</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {Array.isArray(puestos) && puestos.map((puesto) => (
                <li
                  key={puesto.id || puesto.PuestoID || puesto.PUESTO_ID}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Briefcase className="w-5 h-5 text-gray-600" />
                    </div>
                    <span className="text-gray-900 font-medium">
                      {puesto.nombre || puesto.Nombre || puesto.NOMBRE || 'Sin nombre'}
                    </span>
                  </div>
                  <button
                    onClick={() => eliminarPuesto(puesto.id || puesto.PuestoID || puesto.PUESTO_ID)}
                    disabled={loading}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default PuestosModule;