// src/modules/ReportesModule.jsx - Con funcionalidad de exportación
import React, { useState, useEffect } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, PieChart, Pie
} from "recharts";
import {
  Play, Save, Plus, Database, Download,
  Filter, FileText, BarChart3, GripVertical
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

const API_URL = process.env.REACT_APP_API_URL || "http://192.168.0.239:5000/api";

// Componente para campos arrastrables
const DraggableField = ({ name, table, type = "text" }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "FIELD",
    item: { name, table, type },
    collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
  }));
  return (
    <div
      ref={drag}
      className={`flex items-center gap-2 p-2 m-1 border rounded-lg shadow-sm cursor-move bg-white hover:bg-gray-50 transition-all ${
        isDragging ? "opacity-50 scale-95" : "opacity-100"
      }`}
      title={`${table}.${name} (${type})`}
    >
      <GripVertical className="w-4 h-4 text-gray-400" />
      <span className="text-xs text-gray-600 font-mono">{table}.</span>
      <span className="text-sm font-medium">{name}</span>
    </div>
  );
};

// DropZone para filas, columnas y métricas
const DropZone = ({ title, fields, onDrop, onRemove, icon }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "FIELD",
    drop: (item) => onDrop(item),
    collect: (monitor) => ({ isOver: !!monitor.isOver() }),
  }));
  return (
    <div
      ref={drop}
      className={`min-h-[100px] p-3 rounded-lg border-2 border-dashed transition-all ${
        isOver ? "bg-blue-50 border-blue-400" : "border-gray-300 bg-gray-50"
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h4 className="font-semibold text-gray-700">{title}</h4>
        <span className="text-xs text-gray-500">({fields.length})</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {fields.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Arrastra campos aquí</p>
        ) : (
          fields.map((field, index) => (
            <div
              key={`${field.table}-${field.name}-${index}`}
              className="flex items-center gap-2 px-3 py-1 bg-blue-100 border border-blue-200 rounded-full text-sm"
            >
              <span className="font-mono text-xs text-gray-600">{field.table}.</span>
              <span>{field.name}</span>
              <button
                onClick={() => onRemove(index)}
                className="text-red-500 hover:text-red-700 ml-1"
                type="button"
                aria-label="Quitar campo"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Modal para crear un nuevo reporte
const NuevoReporteModal = ({ show, onClose, onSave, metadata }) => {
  const [formData, setFormData] = useState({
    nombre: "",
    origen: "",
    descripcion: "",
  });

  const handleSave = () => {
    if (!formData.nombre.trim() || !formData.origen) {
      alert("Nombre y origen son requeridos");
      return;
    }
    onSave(formData);
    setFormData({ nombre: "", origen: "", descripcion: "" });
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-96">
        <div className="flex items-center gap-2 mb-4">
          <Plus className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-bold">Nuevo Reporte</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block font-medium mb-1">Nombre *</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Origen *</label>
            <select
              value={formData.origen}
              onChange={(e) => setFormData({ ...formData, origen: e.target.value })}
              className="w-full border p-2 rounded"
            >
              <option value="">Seleccionar</option>
              {Object.keys(metadata).map((table) => (
                <option key={table} value={table}>{table}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-medium mb-1">Descripción</label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="w-full border p-2 rounded"
              rows={3}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded" type="button">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2"
            type="button"
          >
            <Save className="w-4 h-4" /> Crear
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente para exportación
const ExportButtons = ({ data, onExport, loading }) => {
  const [showMenu, setShowMenu] = useState(false);
  
  const formats = [
    { key: 'excel', label: 'Excel (.xlsx)', icon: '📊' },
    { key: 'csv', label: 'CSV (.csv)', icon: '📄' },
    { key: 'pdf', label: 'PDF (.pdf)', icon: '📋' },
    { key: 'json', label: 'JSON (.json)', icon: '🔧' }
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={data.length === 0 || loading}
        className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        type="button"
      >
        <Download className="w-4 h-4" />
        Exportar
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-10">
          <div className="py-1">
            {formats.map((format) => (
              <button
                key={format.key}
                onClick={() => {
                  onExport(format.key);
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                type="button"
              >
                <span>{format.icon}</span>
                <span className="text-sm">{format.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Módulo principal de reportes
const ReportesModule = () => {
  const { user, getStoredToken } = useAuth();
  const [metadata, setMetadata] = useState({});
  const [reportes, setReportes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [sqlQuery, setSqlQuery] = useState("");
  const [customSql, setCustomSql] = useState("");
  const [data, setData] = useState([]);
  const [chartType, setChartType] = useState("bar");
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState(null);

  // CARGAR METADATA Y REPORTES GUARDADOS
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = getStoredToken();
        if (!token) {
          setError("No hay token de autenticación");
          return;
        }

        const headers = { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        const [metaRes, repRes] = await Promise.all([
          fetch(`${API_URL}/reportes/metadata`, { headers }),
          fetch(`${API_URL}/reportes/guardados`, { headers })
        ]);

        if (!metaRes.ok) {
          throw new Error(`Error metadata: ${metaRes.status}`);
        }
        if (!repRes.ok) {
          throw new Error(`Error reportes: ${repRes.status}`);
        }

        const metaData = await metaRes.json();
        const repData = await repRes.json();

        setMetadata(metaData.simplified || metaData);

        if (Array.isArray(repData)) {
          setReportes(repData);
        } else {
          console.warn("Respuesta de reportes no es un array:", repData);
          setReportes([]);
        }

        setError(null);
      } catch (err) {
        console.error("Error cargando datos:", err);
        setError(err.message);
      }
    };
    fetchData();
  }, [getStoredToken]);

  // Generar SQL dinámico
  useEffect(() => {
    if (rows.length === 0 && columns.length === 0 && metrics.length === 0) {
      setSqlQuery("");
      return;
    }
    const allFields = [...rows, ...columns, ...metrics];
    const tables = [...new Set(allFields.map((f) => f.table))];
    const selectFields = allFields.map((f) => `${f.table}.${f.name}`).join(", ");
    let query = `SELECT ${selectFields} FROM ${tables.join(", ")}`;
    if (rows.length || columns.length) {
      query += ` GROUP BY ${[...rows, ...columns].map((f) => `${f.table}.${f.name}`).join(", ")}`;
    }
    setSqlQuery(query);
  }, [rows, columns, metrics]);

  // EJECUTAR REPORTE
  const ejecutarReporte = async () => {
    const query = customSql || sqlQuery;
    if (!query.trim()) {
      alert("No hay consulta para ejecutar");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`${API_URL}/reportes/custom`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getStoredToken()}`,
        },
        body: JSON.stringify({ sqlQuery: query }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.details || `Error ${res.status}`);
      }

      const result = await res.json();
      setData(result.data || result);
    } catch (err) {
      console.error("Error ejecutando reporte:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // EXPORTAR REPORTE
  const exportarReporte = async (formato) => {
    if (data.length === 0) {
      alert("No hay datos para exportar");
      return;
    }

    setExportLoading(true);
    
    try {
      const res = await fetch(`${API_URL}/reportes/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getStoredToken()}`,
        },
        body: JSON.stringify({
          formato,
          data,
          nombre: `reporte_${new Date().toISOString().split('T')[0]}`
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.details || `Error ${res.status}`);
      }

      // Descargar archivo
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Determinar extensión del archivo
      const extensions = {
        excel: 'xlsx',
        csv: 'csv', 
        pdf: 'pdf',
        json: 'json'
      };
      
      link.download = `reporte_${new Date().toISOString().split('T')[0]}.${extensions[formato]}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log(`Archivo ${formato} descargado exitosamente`);
      
    } catch (err) {
      console.error("Error exportando reporte:", err);
      alert("Error al exportar: " + err.message);
    } finally {
      setExportLoading(false);
    }
  };

  // GUARDAR REPORTE
  const guardarReporte = async (nuevo) => {
    try {
      const res = await fetch(`${API_URL}/reportes/guardados`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getStoredToken()}`,
        },
        body: JSON.stringify({
          ...nuevo,
          configuracion: { rows, columns, metrics, sqlQuery: customSql || sqlQuery },
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.details || `Error ${res.status}`);
      }

      const saved = await res.json();
      setReportes([...reportes, saved]);
      setShowModal(false);
      alert("Reporte guardado exitosamente");
    } catch (err) {
      console.error("Error guardando reporte:", err);
      alert("Error guardando reporte: " + err.message);
    }
  };

  // Funciones helper para drag & drop
  const addFieldToArray = (array, setter) => (field) => {
    const exists = array.some(f => f.table === field.table && f.name === field.name);
    if (!exists) {
      setter([...array, field]);
    }
  };

  const removeFieldFromArray = (array, setter) => (index) => {
    setter(array.filter((_, i) => i !== index));
  };

  // Renderizar gráfico según tipo
  const renderChart = () => {
    if (data.length === 0) return null;
    const keys = Object.keys(data[0] || {});
    if (keys.length < 2) return null;
    
    switch (chartType) {
      case "line":
        return (
          <LineChart data={data} width={600} height={300}>
            <XAxis dataKey={keys[0]} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line dataKey={keys[1]} stroke="#8884d8" />
          </LineChart>
        );
      case "pie":
        return (
          <PieChart width={600} height={300}>
            <Pie data={data} dataKey={keys[1]} nameKey={keys[0]} label />
            <Tooltip />
          </PieChart>
        );
      default:
        return (
          <BarChart data={data} width={600} height={300}>
            <XAxis dataKey={keys[0]} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={keys[1]} fill="#8884d8" />
          </BarChart>
        );
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-blue-600" /> Generador de Reportes
          </h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2"
            type="button"
          >
            <Plus className="w-4 h-4" /> Nuevo Reporte
          </button>
        </div>

        {/* MOSTRAR ERRORES */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center justify-between">
            <span className="text-red-700">{error}</span>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">×</button>
          </div>
        )}

        {/* Tabla de reportes guardados */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-600" /> 
            Reportes Guardados ({Array.isArray(reportes) ? reportes.length : 0})
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 text-left">Nombre</th>
                  <th className="p-2 text-left">Origen</th>
                  <th className="p-2 text-left">Descripción</th>
                  <th className="p-2 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(reportes) && reportes.length > 0 ? (
                  reportes.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="p-2">{r.nombre}</td>
                      <td className="p-2">{r.origen}</td>
                      <td className="p-2">{r.descripcion || "-"}</td>
                      <td className="p-2 flex gap-1">
                        <button className="text-blue-600 hover:underline" type="button">Ver</button>
                        <button className="text-green-600 hover:underline" type="button">Editar</button>
                        <button className="text-red-600 hover:underline" type="button">Eliminar</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="p-4 text-center text-gray-500">
                      No hay reportes guardados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Editor SQL */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Database className="w-5 h-5" /> Editor SQL
          </h3>
          <div className="mb-2">
            <label className="block text-sm font-medium mb-1">SQL Generado automáticamente:</label>
            <textarea
              value={sqlQuery}
              readOnly
              className="w-full border p-2 text-sm font-mono bg-gray-50"
              rows={3}
              placeholder="Se genera automáticamente al arrastrar campos..."
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">SQL Personalizado:</label>
            <textarea
              value={customSql}
              onChange={(e) => setCustomSql(e.target.value)}
              className="w-full border p-2 text-sm font-mono"
              rows={3}
              placeholder="O escribe tu consulta personalizada aquí..."
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={ejecutarReporte}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 disabled:opacity-50"
              type="button"
            >
              <Play className="w-4 h-4" /> 
              {loading ? "Ejecutando..." : "Ejecutar"}
            </button>
            
            {/* Botón de exportación */}
            <ExportButtons 
              data={data} 
              onExport={exportarReporte} 
              loading={exportLoading} 
            />
          </div>
        </div>

        {/* Campos disponibles y DropZones */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <GripVertical className="w-5 h-5" /> Campos Disponibles
            </h3>
            <div className="max-h-96 overflow-y-auto">
              {Object.keys(metadata).length === 0 ? (
                <p className="text-gray-500 text-sm">Cargando campos...</p>
              ) : (
                Object.entries(metadata).map(([table, fields]) => (
                  <div key={table} className="mb-4">
                    <h4 className="font-medium text-gray-700 mb-2">{table}</h4>
                    <div className="space-y-1">
                      {Array.isArray(fields) ? fields.map((field) => (
                        <DraggableField key={`${table}-${field}`} table={table} name={field} />
                      )) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <DropZone 
              title="Filas" 
              fields={rows} 
              onDrop={addFieldToArray(rows, setRows)} 
              onRemove={removeFieldFromArray(rows, setRows)} 
              icon={<Filter className="w-4 h-4 text-blue-600" />} 
            />
            <DropZone 
              title="Columnas" 
              fields={columns} 
              onDrop={addFieldToArray(columns, setColumns)} 
              onRemove={removeFieldFromArray(columns, setColumns)} 
              icon={<BarChart3 className="w-4 h-4 text-green-600" />} 
            />
            <DropZone 
              title="Métricas" 
              fields={metrics} 
              onDrop={addFieldToArray(metrics, setMetrics)} 
              onRemove={removeFieldFromArray(metrics, setMetrics)} 
              icon={<Database className="w-4 h-4 text-purple-600" />} 
            />
          </div>
        </div>

        {/* Resultados */}
        {data.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4 mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Resultados ({data.length} registros)</h3>
              <div className="flex gap-2 items-center">
                <select 
                  value={chartType} 
                  onChange={(e) => setChartType(e.target.value)} 
                  className="border p-1 rounded text-sm"
                >
                  <option value="bar">Gráfico de Barras</option>
                  <option value="line">Gráfico de Líneas</option>
                  <option value="pie">Gráfico Circular</option>
                </select>
                
                <ExportButtons 
                  data={data} 
                  onExport={exportarReporte} 
                  loading={exportLoading} 
                />
              </div>
            </div>
            
            {/* Gráfico */}
            <div className="mb-6">
              <ResponsiveContainer width="100%" height={300}>
                {renderChart()}
              </ResponsiveContainer>
            </div>

            {/* Tabla de datos */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(data[0] || {}).map((key) => (
                      <th key={key} className="border p-2 text-left font-medium">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 50).map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      {Object.values(row).map((value, cellIndex) => (
                        <td key={cellIndex} className="border p-2">
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.length > 50 && (
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Mostrando primeros 50 de {data.length} registros
                </p>
              )}
            </div>
          </div>
        )}

        {/* Modal */}
        <NuevoReporteModal 
          show={showModal} 
          onClose={() => setShowModal(false)} 
          onSave={guardarReporte} 
          metadata={metadata} 
        />
      </div>
    </DndProvider>
  );
};

export default ReportesModule;

