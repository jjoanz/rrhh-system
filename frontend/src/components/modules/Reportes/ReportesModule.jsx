// src/components/modules/Reportes/ReportesModule.jsx
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useAuth } from "../../../context/AuthContext";

// ------------------ CONFIG ------------------
const API_URL = process.env.REACT_APP_API_URL || "http://192.168.0.239:5000/api";
const apiClient = axios.create({ baseURL: API_URL, timeout: 10000 });
const setupAxiosInterceptors = (getStoredToken, logout) => {
  apiClient.interceptors.request.use((config) => {
    const token = getStoredToken?.();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  apiClient.interceptors.response.use(
    (res) => res,
    (err) => { if (err.response?.status === 401) logout?.(); return Promise.reject(err); }
  );
};

// ------------------ DRAG & DROP ------------------
const DraggableCard = ({ name, table }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "FIELD",
    item: { name, table },
    collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
  }));
  return (
    <div
      ref={drag}
      className={`p-2 m-1 border rounded shadow cursor-move bg-white text-sm ${
        isDragging ? "opacity-50" : "opacity-100"
      }`}
    >
      {table}.{name}
    </div>
  );
};

const DropZoneCards = ({ title, fields, onDrop }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "FIELD",
    drop: (item) => onDrop(item),
    collect: (monitor) => ({ isOver: !!monitor.isOver() }),
  }));
  return (
    <div
      ref={drop}
      className={`min-h-[80px] p-2 rounded border mb-4 ${
        isOver ? "bg-green-100" : "bg-gray-50"
      }`}
    >
      <h4 className="font-semibold mb-2">{title}</h4>
      <div className="flex flex-wrap">{fields.map((f, i) => (
        <span key={i} className="px-2 py-1 m-1 bg-blue-200 rounded">{f.table}.{f.name}</span>
      ))}</div>
    </div>
  );
};

// ------------------ MODAL NUEVO REPORTE ------------------
const NuevoReporteModal = ({ show, onClose, onGuardar, metadata }) => {
  const [nombre, setNombre] = useState("");
  const [origen, setOrigen] = useState("");
  const [predeterminado, setPredeterminado] = useState(false);
  const [eliminarDuplicados, setEliminarDuplicados] = useState(false);
  if (!show) return null;

  const fuentes = Object.keys(metadata);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-20 z-50">
      <div className="bg-white p-6 rounded shadow w-96">
        <h3 className="text-lg font-bold mb-4">Nuevo Reporte</h3>
        <div className="mb-2">
          <label className="block font-semibold mb-1">Nombre</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full border p-2 rounded"/>
        </div>
        <div className="mb-2">
          <label className="block font-semibold mb-1">Origen del informe</label>
          <select value={origen} onChange={(e) => setOrigen(e.target.value)} className="w-full border p-2 rounded">
            <option value="">Seleccionar</option>
            {fuentes.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div className="mb-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={predeterminado} onChange={() => setPredeterminado(!predeterminado)}/> Incluir configuración predeterminada
          </label>
          <label className="flex items-center gap-2 mt-1">
            <input type="checkbox" checked={eliminarDuplicados} onChange={() => setEliminarDuplicados(!eliminarDuplicados)}/> Eliminar filas duplicadas
          </label>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-1 bg-gray-300 rounded">Cancelar</button>
          <button onClick={() => onGuardar({ nombre, origen, predeterminado, eliminarDuplicados })} className="px-4 py-1 bg-blue-500 text-white rounded">Guardar</button>
        </div>
      </div>
    </div>
  );
};

// ------------------ MODULO PRINCIPAL ------------------
const ReportesModule = () => {
  const { user, getStoredToken, logout } = useAuth();
  const [metadata, setMetadata] = useState({});
  const [rows, setRows] = useState([]);
  const [cols, setCols] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportesGuardados, setReportesGuardados] = useState([]);
  const [showNuevoModal, setShowNuevoModal] = useState(false);
  const [sqlQuery, setSqlQuery] = useState("");

  useEffect(() => setupAxiosInterceptors(getStoredToken, logout), [getStoredToken, logout]);

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        setLoading(true);
        const resMeta = await apiClient.get("/reportes/metadata");
        setMetadata(resMeta.data);
        const resReportes = await apiClient.get("/reportes/guardados");
        setReportesGuardados(resReportes.data);
      } catch (err) {
        setError(err.response?.data?.message || "Error cargando datos");
      } finally { setLoading(false); }
    };
    loadData();
  }, [user]);

  const addUnique = (arr, item) => (!arr.find(f => f.table === item.table && f.name === item.name) ? [...arr, item] : arr);

  const generarSQL = () => {
    if (!rows.length || !metrics.length) return "";
    const tablas = Array.from(new Set([...rows, ...cols, ...metrics].map(f => f.table)));
    const select = [...rows, ...cols, ...metrics].map(f => `${f.table}.${f.name}`);
    return `SELECT ${select.join(", ")} FROM ${tablas.join(", ")} /* relaciones automáticas */`;
  };

  const ejecutarReporte = async () => {
    const query = generarSQL();
    if (!query) return setError("Selecciona al menos una fila y una métrica");
    try {
      setLoading(true);
      const res = await apiClient.post("/reportes/custom", { sqlQuery: query });
      setData(res.data);
    } catch { setError("Error al ejecutar reporte dinámico"); } finally { setLoading(false); }
  };

  const guardarReporte = async (nuevo) => {
    if (!nuevo.nombre || !nuevo.origen) return setError("Nombre y origen son requeridos");
    try {
      setLoading(true);
      const res = await apiClient.post("/reportes/guardados", nuevo);
      setReportesGuardados([...reportesGuardados, res.data]);
      setShowNuevoModal(false);
    } catch { setError("Error guardando reporte"); } finally { setLoading(false); }
  };

  const exportar = async (formato) => {
    try {
      setLoading(true);
      const res = await apiClient.post("/reportes/export", { formato, data }, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `reporte.${formato}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch { setError("Error exportando el reporte"); } finally { setLoading(false); }
  };

  const memoMetadata = useMemo(() => Object.entries(metadata), [metadata]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Reportes Visuales</h2>

        {error && <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error} <button onClick={() => setError(null)}>×</button></div>}
        {loading && <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">Cargando...</div>}

        {/* Lista reportes guardados */}
        <div className="mb-6 flex justify-between items-center">
          <h3 className="font-semibold">Reportes Guardados</h3>
          <button onClick={() => setShowNuevoModal(true)} className="px-4 py-1 bg-green-500 text-white rounded">Nuevo Reporte</button>
        </div>
        <table className="table-auto border-collapse border border-gray-400 w-full mb-6">
          <thead className="bg-gray-200">
            <tr>
              <th className="border px-2 py-1">Nombre</th>
              <th className="border px-2 py-1">Origen</th>
              <th className="border px-2 py-1">Creación</th>
              <th className="border px-2 py-1">Modificación</th>
              <th className="border px-2 py-1">Modificado por</th>
            </tr>
          </thead>
          <tbody>
            {reportesGuardados.map((r,i) => (
              <tr key={i}>
                <td className="border px-2 py-1">{r.nombre}</td>
                <td className="border px-2 py-1">{r.origen}</td>
                <td className="border px-2 py-1">{r.fechaCreacion}</td>
                <td className="border px-2 py-1">{r.fechaModificacion}</td>
                <td className="border px-2 py-1">{r.modificadoPor}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* SQL + Constructor visual */}
        <div className="flex gap-4">
          <textarea
            rows={16}
            className="border w-1/3 p-2 h-[400px] resize-none"
            placeholder="SQL generado automáticamente..."
            value={generarSQL()}
            readOnly
          />
          <div className="flex-1 grid grid-cols-1 gap-2">
            <div className="border p-2 rounded h-[400px] overflow-auto">
              <h4 className="font-semibold mb-2">Campos disponibles</h4>
              {memoMetadata.length === 0 ? <p className="text-gray-500">Cargando...</p>
                : memoMetadata.map(([table, fields]) => (
                  <div key={table} className="mb-2">
                    <h4 className="font-bold">{table}</h4>
                    {fields.map(f => <DraggableCard key={f} table={table} name={f} />)}
                  </div>
                ))
              }
            </div>

            <DropZoneCards title="Filas" fields={rows} onDrop={(item) => setRows(addUnique(rows,item))} />
            <DropZoneCards title="Columnas" fields={cols} onDrop={(item) => setCols(addUnique(cols,item))} />
            <DropZoneCards title="Métricas" fields={metrics} onDrop={(item) => setMetrics(addUnique(metrics,item))} />

            <button onClick={ejecutarReporte} className="px-4 py-2 bg-blue-600 text-white rounded">Generar Reporte</button>
          </div>
        </div>

        {/* Resultados */}
        {data.length > 0 && (
          <div>
            <div className="mb-4 flex gap-2">
              <button onClick={() => exportar("csv")} className="px-4 py-1 bg-gray-600 text-white rounded">CSV</button>
              <button onClick={() => exportar("excel")} className="px-4 py-1 bg-yellow-600 text-white rounded">Excel</button>
              <button onClick={() => exportar("pdf")} className="px-4 py-1 bg-red-600 text-white rounded">PDF</button>
            </div>

            <table className="table-auto border-collapse border border-gray-400 w-full mb-6">
              <thead>
                <tr>{Object.keys(data[0]).map(k => <th key={k} className="border px-2 py-1">{k}</th>)}</tr>
              </thead>
              <tbody>{data.map((r,i) => <tr key={i}>{Object.values(r).map((v,j) => <td key={j} className="border px-2 py-1">{v}</td>)}</tr>)}</tbody>
            </table>

            <div style={{ width:"100%", height:400 }}>
              <ResponsiveContainer>
                <BarChart data={data}>
                  <XAxis dataKey={Object.keys(data[0])[0]} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey={Object.keys(data[0])[1]} fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <NuevoReporteModal show={showNuevoModal} onClose={() => setShowNuevoModal(false)} onGuardar={guardarReporte} metadata={metadata} />
      </div>
    </DndProvider>
  );
};

export default ReportesModule;
