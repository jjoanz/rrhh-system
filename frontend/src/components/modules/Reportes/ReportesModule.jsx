// src/modules/ReportesModule.jsx
import React, { useState, useEffect } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, PieChart, Pie
} from "recharts";
import {
  Play, Save, Plus, Database,
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

  // Cargar metadata y reportes guardados
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = getStoredToken();
        const [metaRes, repRes] = await Promise.all([
          fetch(`${API_URL}/reportes/metadata`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/reportes`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const meta = await metaRes.json();
        const reps = await repRes.json();
        setMetadata(meta);
        setReportes(reps);
      } catch (err) {
        console.error("Error cargando datos:", err);
      }
    };
    fetchData();
  }, [getStoredToken]);

  // Generar SQL dinámico
  useEffect(() => {
    if (rows.length === 0 && columns.length === 0 && metrics.length === 0) return;
    const allFields = [...rows, ...columns, ...metrics];
    const tables = [...new Set(allFields.map((f) => f.table))];
    const selectFields = allFields.map((f) => `${f.table}.${f.name}`).join(", ");
    let query = `SELECT ${selectFields} FROM ${tables.join(", ")}`;
    if (rows.length || columns.length) {
      query += ` GROUP BY ${[...rows, ...columns].map((f) => `${f.table}.${f.name}`).join(", ")}`;
    }
    setSqlQuery(query);
  }, [rows, columns, metrics]);

  // Ejecutar reporte
  const ejecutarReporte = async () => {
    const query = customSql || sqlQuery;
    if (!query.trim()) return alert("No hay consulta para ejecutar");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/reportes/ejecutar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getStoredToken()}`,
        },
        body: JSON.stringify({ sql: query }),
      });
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error("Error ejecutando reporte:", err);
    } finally {
      setLoading(false);
    }
  };

  // Guardar reporte
  const guardarReporte = async (nuevo) => {
    try {
      const res = await fetch(`${API_URL}/reportes`, {
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
      const saved = await res.json();
      setReportes([...reportes, saved]);
      setShowModal(false);
    } catch (err) {
      console.error("Error guardando reporte:", err);
    }
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

        {/* Tabla de reportes guardados */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-600" /> Reportes Guardados ({reportes.length})
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
                {reportes.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="p-2">{r.nombre}</td>
                    <td className="p-2">{r.origen}</td>
                    <td className="p-2">{r.descripcion}</td>
                    <td className="p-2 flex gap-1">
                      <button className="text-blue-600 hover:underline" type="button">Ver</button>
                      <button className="text-green-600 hover:underline" type="button">Editar</button>
                      <button className="text-red-600 hover:underline" type="button">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Editor SQL */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Database className="w-5 h-5" /> Editor SQL
          </h3>
          <textarea
            value={sqlQuery}
            readOnly
            className="w-full border p-2 mb-2 text-sm font-mono bg-gray-50"
            rows={3}
          />
          <textarea
            value={customSql}
            onChange={(e) => setCustomSql(e.target.value)}
            className="w-full border p-2 mb-4 text-sm font-mono"
            rows={3}
          />
          <button
            onClick={ejecutarReporte}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
            type="button"
          >
            <Play className="w-4 h-4" /> Ejecutar
          </button>
        </div>

        {/* Campos disponibles y DropZones */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <GripVertical className="w-5 h-5" /> Campos
            </h3>
            {Object.entries(metadata).map(([table, fields]) => (
              <div key={table} className="mb-4">
                <h4 className="font-medium">{table}</h4>
                {fields.map((f) => (
                  <DraggableField key={f} table={table} name={f} />
                ))}
              </div>
            ))}
          </div>

          <div className="lg:col-span-2 space-y-4">
            <DropZone title="Filas" fields={rows} onDrop={(f) => setRows([...rows, f])} onRemove={(i) => setRows(rows.filter((_, idx) => idx !== i))} icon={<Filter className="w-4 h-4" />} />
            <DropZone title="Columnas" fields={columns} onDrop={(f) => setColumns([...columns, f])} onRemove={(i) => setColumns(columns.filter((_, idx) => idx !== i))} icon={<BarChart3 className="w-4 h-4" />} />
            <DropZone title="Métricas" fields={metrics} onDrop={(f) => setMetrics([...metrics, f])} onRemove={(i) => setMetrics(metrics.filter((_, idx) => idx !== i))} icon={<Database className="w-4 h-4" />} />
          </div>
        </div>

        {/* Resultados */}
        {data.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4 mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Resultados</h3>
              <select value={chartType} onChange={(e) => setChartType(e.target.value)} className="border p-1 rounded text-sm">
                <option value="bar">Barras</option>
                <option value="line">Líneas</option>
                <option value="pie">Circular</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={300}>{renderChart()}</ResponsiveContainer>
          </div>
        )}

        {/* Modal */}
        <NuevoReporteModal show={showModal} onClose={() => setShowModal(false)} onSave={guardarReporte} metadata={metadata} />
      </div>
    </DndProvider>
  );
};

export default ReportesModule;

