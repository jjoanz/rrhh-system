import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  Play, 
  Download, 
  Save, 
  TrendingUp, 
  Users, 
  Building, 
  FileText, 
  DollarSign,
  Plus,
  Edit,
  Trash2,
  BarChart3,
  Activity,
  PieChart as PieChartIcon
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://192.168.0.239:5000/api';

// Colores para gráficos
const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

const ReportesVisualModule = () => {
  const { getStoredToken } = useAuth();
  
  const [tipoReporte, setTipoReporte] = useState('');
  const [configuracion, setConfiguracion] = useState({});
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [metricas, setMetricas] = useState(null);
  const [chartType, setChartType] = useState('bar');
  const [reportesGuardados, setReportesGuardados] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [nombreReporte, setNombreReporte] = useState('');

  // Cargar métricas y reportes guardados al inicio
  useEffect(() => {
    cargarMetricas();
    cargarReportesGuardados();
  }, []);

  const cargarMetricas = async () => {
    try {
      const response = await fetch(`${API_URL}/reportes/metricas`, {
        headers: { Authorization: `Bearer ${getStoredToken()}` }
      });
      const result = await response.json();
      if (result.success) {
        setMetricas(result.data);
      }
    } catch (error) {
      console.error('Error cargando métricas:', error);
    }
  };

  const cargarReportesGuardados = async () => {
    try {
      const response = await fetch(`${API_URL}/reportes/guardados`, {
        headers: { Authorization: `Bearer ${getStoredToken()}` }
      });
      if (response.ok) {
        const data = await response.json();
        setReportesGuardados(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error cargando reportes guardados:', error);
      setReportesGuardados([]);
    }
  };

  const TIPOS_REPORTES = [
    {
      id: 'empleados',
      nombre: 'Reporte de Empleados',
      descripcion: 'Información detallada del personal',
      icono: Users,
      color: 'blue',
      configuraciones: [
        {
          campo: 'campos',
          label: 'Información a mostrar',
          tipo: 'multiselect',
          opciones: [
            { value: 'nombre', label: 'Nombre' },
            { value: 'apellido', label: 'Apellido' },
            { value: 'email', label: 'Email' },
            { value: 'cargo', label: 'Cargo' },
            { value: 'salario', label: 'Salario' },
            { value: 'fechaIngreso', label: 'Fecha de Ingreso' },
            { value: 'departamento', label: 'Departamento' },
            { value: 'estado', label: 'Estado' },
            { value: 'cedula', label: 'Cédula' }
          ],
          default: ['nombre', 'apellido', 'cargo', 'departamento']
        },
        {
          campo: 'filtros.estado',
          label: 'Estado del empleado',
          tipo: 'select',
          opciones: [
            { value: 'todos', label: 'Todos' },
            { value: 'activo', label: 'Solo Activos' },
            { value: 'inactivo', label: 'Solo Inactivos' }
          ],
          default: 'activo'
        },
        {
          campo: 'filtros.departamentoId',
          label: 'Departamento',
          tipo: 'select-departamentos',
          default: null
        },
        {
          campo: 'ordenamiento.campo',
          label: 'Ordenar por',
          tipo: 'select',
          opciones: [
            { value: 'nombre', label: 'Nombre' },
            { value: 'apellido', label: 'Apellido' },
            { value: 'fechaIngreso', label: 'Fecha de Ingreso' },
            { value: 'salario', label: 'Salario' }
          ],
          default: 'nombre'
        },
        {
          campo: 'ordenamiento.direccion',
          label: 'Dirección',
          tipo: 'select',
          opciones: [
            { value: 'ASC', label: 'Ascendente' },
            { value: 'DESC', label: 'Descendente' }
          ],
          default: 'ASC'
        }
      ]
    },
    {
      id: 'departamentos',
      nombre: 'Reporte de Departamentos',
      descripcion: 'Análisis por departamento',
      icono: Building,
      color: 'green',
      configuraciones: [
        {
          campo: 'incluirEstadisticas',
          label: '¿Incluir estadísticas de empleados?',
          tipo: 'checkbox',
          default: true
        }
      ]
    },
    {
      id: 'vacantes',
      nombre: 'Reporte de Vacantes',
      descripcion: 'Estado de vacantes y postulaciones',
      icono: FileText,
      color: 'purple',
      configuraciones: [
        {
          campo: 'estado',
          label: 'Estado de vacantes',
          tipo: 'select',
          opciones: [
            { value: 'Todas', label: 'Todas' },
            { value: 'Abierta', label: 'Solo Abiertas' },
            { value: 'Cerrada', label: 'Solo Cerradas' }
          ],
          default: 'Abierta'
        },
        {
          campo: 'incluirPostulaciones',
          label: '¿Incluir estadísticas de postulaciones?',
          tipo: 'checkbox',
          default: true
        }
      ]
    },
    {
      id: 'nomina',
      nombre: 'Reporte de Nómina',
      descripcion: 'Severance, salarios y aumentos',
      icono: DollarSign,
      color: 'orange',
      configuraciones: [
        {
          campo: 'tipo',
          label: 'Tipo de reporte',
          tipo: 'select',
          opciones: [
            { value: 'severance', label: 'Cálculo de Severance' },
            { value: 'salarios', label: 'Análisis de Salarios' }
          ],
          default: 'severance'
        },
        {
          campo: 'departamentoId',
          label: 'Departamento',
          tipo: 'select-departamentos',
          default: null
        }
      ]
    }
  ];

  const ejecutarReporte = async () => {
    if (!tipoReporte) {
      alert('Selecciona un tipo de reporte');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/reportes/${tipoReporte}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getStoredToken()}`
        },
        body: JSON.stringify(configuracion)
      });

      const result = await response.json();
      if (result.success) {
        setData(Array.isArray(result.data) ? result.data : []);
      } else {
        alert('Error generando reporte: ' + (result.error || 'Error desconocido'));
        setData([]);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error ejecutando reporte');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const exportarReporte = async (formato) => {
    if (!Array.isArray(data) || data.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/reportes/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getStoredToken()}`
        },
        body: JSON.stringify({
          formato,
          data,
          nombre: `reporte_${tipoReporte}_${new Date().toISOString().split('T')[0]}`
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error en exportación:', errorText);
        alert('Error al exportar el reporte');
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const extensiones = {
        'excel': 'xlsx',
        'csv': 'csv',
        'pdf': 'pdf'
      };
      
      a.download = `reporte_${tipoReporte}_${new Date().toISOString().split('T')[0]}.${extensiones[formato] || formato}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exportando:', error);
      alert('Error al exportar');
    }
  };

  const guardarReporte = async () => {
    if (!nombreReporte.trim()) {
      alert('Por favor ingresa un nombre para el reporte');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/reportes/guardados`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getStoredToken()}`
        },
        body: JSON.stringify({
          nombre: nombreReporte,
          origen: 'personalizado',
          descripcion: `Reporte de ${tipoReporte}`,
          configuracion: {
            tipo: tipoReporte,
            config: configuracion
          }
        })
      });

      if (response.ok) {
        alert('Reporte guardado exitosamente');
        setShowSaveModal(false);
        setNombreReporte('');
        cargarReportesGuardados();
      } else {
        alert('Error guardando reporte');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar reporte');
    }
  };

  const cargarReporteGuardado = (reporte) => {
    if (reporte.configuracion && reporte.configuracion.tipo) {
      setTipoReporte(reporte.configuracion.tipo);
      setConfiguracion(reporte.configuracion.config || {});
    }
  };

  const eliminarReporteGuardado = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este reporte?')) return;

    try {
      const response = await fetch(`${API_URL}/reportes/guardados/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${getStoredToken()}`
        }
      });

      if (response.ok) {
        alert('Reporte eliminado');
        cargarReportesGuardados();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const reporteSeleccionado = TIPOS_REPORTES.find(r => r.id === tipoReporte);

  function obtenerValorConfig(config, campo) {
    const campos = campo.split('.');
    let valor = config;
    for (const c of campos) {
      valor = valor?.[c];
    }
    return valor;
  }

  function actualizarConfiguracion(campo, valor) {
    const campos = campo.split('.');
    const nuevaConfig = { ...configuracion };
    
    let ref = nuevaConfig;
    for (let i = 0; i < campos.length - 1; i++) {
      if (!ref[campos[i]]) ref[campos[i]] = {};
      ref = ref[campos[i]];
    }
    
    ref[campos[campos.length - 1]] = valor;
    setConfiguracion(nuevaConfig);
  }

  function formatearNombreColumna(nombre) {
    return nombre
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  function formatearValor(key, value) {
    if (value === null || value === undefined) return '-';
    
    if (key.toLowerCase().includes('fecha') && value) {
      return new Date(value).toLocaleDateString('es-DO');
    }
    
    if (key.toLowerCase().includes('salario') || 
        key.toLowerCase().includes('preaviso') ||
        key.toLowerCase().includes('cesantia') ||
        key.toLowerCase().includes('vacaciones') ||
        key.toLowerCase().includes('regalia') ||
        key.toLowerCase().includes('total') ||
        key.toLowerCase().includes('promedio') ||
        key.toLowerCase().includes('maximo') ||
        key.toLowerCase().includes('minimo') ||
        key.toLowerCase().includes('masa')) {
      return `$${parseFloat(value).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    
    if (typeof value === 'number') {
      return value.toLocaleString('es-DO');
    }
    
    return value;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">📊 Reportes RRHH</h1>
        <p className="text-gray-600">Sistema de reportería visual profesional</p>
      </div>

      {/* Dashboard de Métricas */}
      {metricas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Empleados</p>
                <p className="text-3xl font-bold text-gray-900">{metricas.totalEmpleados || 0}</p>
              </div>
              <Users className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Contrataciones (30d)</p>
                <p className="text-3xl font-bold text-gray-900">{metricas.contratacionesUltimos30Dias || 0}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Salario Promedio</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${(metricas.salarioPromedio || 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-12 h-12 text-purple-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Vacantes Abiertas</p>
                <p className="text-3xl font-bold text-gray-900">{metricas.vacantesAbiertas || 0}</p>
              </div>
              <FileText className="w-12 h-12 text-orange-500 opacity-20" />
            </div>
          </div>
        </div>
      )}

      {/* Reportes Guardados */}
      {Array.isArray(reportesGuardados) && reportesGuardados.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">📁 Mis Reportes Guardados</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reportesGuardados.map(reporte => (
              <div key={reporte.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-900">{reporte.nombre}</h4>
                  <button
                    onClick={() => eliminarReporteGuardado(reporte.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-3">{reporte.descripcion}</p>
                <button
                  onClick={() => cargarReporteGuardado(reporte)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                >
                  <Play className="w-4 h-4" />
                  Cargar Reporte
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selección de Tipo de Reporte */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Selecciona el tipo de reporte</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {TIPOS_REPORTES.map(tipo => {
            const Icon = tipo.icono;
            const isSelected = tipoReporte === tipo.id;
            return (
              <button
                key={tipo.id}
                onClick={() => {
                  setTipoReporte(tipo.id);
                  setConfiguracion({});
                  setData([]);
                }}
                className={`p-6 rounded-xl border-2 transition-all text-left ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <Icon className={`w-10 h-10 mb-3 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                <h3 className="font-semibold text-gray-900 mb-1">{tipo.nombre}</h3>
                <p className="text-sm text-gray-600">{tipo.descripcion}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Configuración del Reporte */}
      {reporteSeleccionado && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Configurar {reporteSeleccionado.nombre}
          </h2>
          
          <div className="space-y-6">
            {reporteSeleccionado.configuraciones.map((config, index) => (
              <ConfiguracionCampo
                key={index}
                config={config}
                valor={obtenerValorConfig(configuracion, config.campo)}
                onChange={(valor) => actualizarConfiguracion(config.campo, valor)}
              />
            ))}
          </div>

          <div className="flex gap-3 mt-6 pt-6 border-t">
            <button
              onClick={ejecutarReporte}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 font-medium shadow-lg"
            >
              <Play className="w-5 h-5" />
              {loading ? 'Generando...' : 'Generar Reporte'}
            </button>
            
            {Array.isArray(data) && data.length > 0 && (
              <>
                <button
                  onClick={() => setShowSaveModal(true)}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-all flex items-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Guardar
                </button>
                <button
                  onClick={() => exportarReporte('excel')}
                  className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-all flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Excel
                </button>
                <button
                  onClick={() => exportarReporte('pdf')}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-all flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  PDF
                </button>
                <button
                  onClick={() => exportarReporte('csv')}
                  className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-all flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  CSV
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Resultados */}
      {Array.isArray(data) && data.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              📊 Resultados ({data.length} registros)
            </h3>
          </div>
          
          <div className="p-6">
            {/* Selector de Tipo de Gráfico */}
            {data.length > 0 && Object.keys(data[0]).length >= 2 && (
              <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-sm font-medium text-gray-700">Tipo de gráfico:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setChartType('bar')}
                      className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                        chartType === 'bar' 
                          ? 'bg-blue-600 text-white shadow-md' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <BarChart3 className="w-4 h-4" />
                      Barras
                    </button>
                    <button
                      onClick={() => setChartType('line')}
                      className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                        chartType === 'line' 
                          ? 'bg-blue-600 text-white shadow-md' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Activity className="w-4 h-4" />
                      Líneas
                    </button>
                    <button
                      onClick={() => setChartType('pie')}
                      className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                        chartType === 'pie' 
                          ? 'bg-blue-600 text-white shadow-md' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <PieChartIcon className="w-4 h-4" />
                      Circular
                    </button>
                    <button
                      onClick={() => setChartType('area')}
                      className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                        chartType === 'area' 
                          ? 'bg-blue-600 text-white shadow-md' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <TrendingUp className="w-4 h-4" />
                      Área
                    </button>
                  </div>
                </div>

                <GraficoRenderer tipo={chartType} data={data} />
              </div>
            )}

            {/* Tabla de datos */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    {Object.keys(data[0] || {}).map((key) => (
                      <th key={key} className="border-b-2 border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        {formatearNombreColumna(key)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 100).map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      {Object.entries(row).map(([key, value], cellIndex) => (
                        <td key={cellIndex} className="border-b border-gray-100 px-4 py-3 text-sm text-gray-900">
                          {formatearValor(key, value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.length > 100 && (
                <p className="text-sm text-gray-500 mt-3 text-center">
                  Mostrando primeros 100 de {data.length} registros
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal para guardar reporte */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Guardar Reporte</h3>
            <input
              type="text"
              value={nombreReporte}
              onChange={(e) => setNombreReporte(e.target.value)}
              placeholder="Nombre del reporte"
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={guardarReporte}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente de Configuración de Campos
const ConfiguracionCampo = ({ config, valor, onChange }) => {
  const [departamentos, setDepartamentos] = useState([]);
  const { getStoredToken } = useAuth();

  useEffect(() => {
    if (config.tipo === 'select-departamentos') {
      cargarDepartamentos();
    }
  }, [config.tipo]);

  const cargarDepartamentos = async () => {
    try {
      const response = await fetch(`${API_URL}/departamentos`, {
        headers: { Authorization: `Bearer ${getStoredToken()}` }
      });
      const data = await response.json();
      setDepartamentos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando departamentos:', error);
      setDepartamentos([]);
    }
  };

  if (config.tipo === 'multiselect') {
    const valoresSeleccionados = valor || config.default || [];
    
    return (
      <div>
        <label className="block font-medium text-gray-700 mb-3">{config.label}</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {config.opciones.map(opcion => {
            const isSelected = valoresSeleccionados.includes(opcion.value);
            return (
              <button
                key={opcion.value}
                onClick={() => {
                  const nuevosValores = isSelected
                    ? valoresSeleccionados.filter(v => v !== opcion.value)
                    : [...valoresSeleccionados, opcion.value];
                  onChange(nuevosValores);
                }}
                className={`p-3 rounded-lg border-2 text-sm text-left transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-blue-300 text-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{opcion.label}</span>
                  {isSelected && <span className="text-blue-600 font-bold">✓</span>}
                </div>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {valoresSeleccionados.length} seleccionado(s)
        </p>
      </div>
    );
  }

  if (config.tipo === 'select') {
    return (
      <div>
        <label className="block font-medium text-gray-700 mb-2">{config.label}</label>
        <select
          value={valor || config.default}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {config.opciones.map(opcion => (
            <option key={opcion.value} value={opcion.value}>
              {opcion.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (config.tipo === 'select-departamentos') {
    return (
      <div>
        <label className="block font-medium text-gray-700 mb-2">{config.label}</label>
        <select
          value={valor || ''}
          onChange={(e) => onChange(e.target.value || null)}
          className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Todos los departamentos</option>
          {departamentos.map(dept => (
            <option key={dept.DepartamentoID} value={dept.DepartamentoID}>
              {dept.Nombre}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (config.tipo === 'checkbox') {
    return (
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={valor !== undefined ? valor : config.default}
          onChange={(e) => onChange(e.target.checked)}
          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label className="ml-3 font-medium text-gray-700">{config.label}</label>
      </div>
    );
  }

  if (config.tipo === 'date') {
    return (
      <div>
        <label className="block font-medium text-gray-700 mb-2">{config.label}</label>
        <input
          type="date"
          value={valor || config.default || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    );
  }

  return null;
};

// Componente Renderizador de Gráficos
const GraficoRenderer = ({ tipo, data }) => {
  if (!Array.isArray(data) || data.length === 0) return null;

  const keys = Object.keys(data[0]);
  if (keys.length < 2) return null;

  const xKey = keys[0];
  const yKey = keys[1];
  
  // Limitar datos para mejor visualización
  const chartData = data.slice(0, 15);

  if (tipo === 'bar') {
    return (
      <div className="bg-gray-50 p-6 rounded-lg">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <XAxis 
              dataKey={xKey} 
              angle={-45}
              textAnchor="end"
              height={100}
              style={{ fontSize: '12px' }}
            />
            <YAxis style={{ fontSize: '12px' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey={yKey} fill="#3B82F6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (tipo === 'line') {
    return (
      <div className="bg-gray-50 p-6 rounded-lg">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <XAxis 
              dataKey={xKey} 
              angle={-45}
              textAnchor="end"
              height={100}
              style={{ fontSize: '12px' }}
            />
            <YAxis style={{ fontSize: '12px' }} />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey={yKey} 
              stroke="#3B82F6" 
              strokeWidth={3}
              dot={{ fill: '#3B82F6', r: 5 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (tipo === 'pie') {
    return (
      <div className="bg-gray-50 p-6 rounded-lg">
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey={yKey}
              nameKey={xKey}
              cx="50%"
              cy="50%"
              outerRadius={120}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              labelLine={true}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (tipo === 'area') {
    return (
      <div className="bg-gray-50 p-6 rounded-lg">
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={chartData}>
            <XAxis 
              dataKey={xKey} 
              angle={-45}
              textAnchor="end"
              height={100}
              style={{ fontSize: '12px' }}
            />
            <YAxis style={{ fontSize: '12px' }} />
            <Tooltip />
            <Legend />
            <Area 
              type="monotone" 
              dataKey={yKey} 
              stroke="#3B82F6" 
              fill="#3B82F6" 
              fillOpacity={0.6}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return null;
};

export default ReportesVisualModule;