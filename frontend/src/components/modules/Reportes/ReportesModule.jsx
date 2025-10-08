import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { Play, Save, Plus, Database, Download, FileText, BarChart3, X, Users, Building, Edit3, Trash2, TrendingUp } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

const API_URL = process.env.REACT_APP_API_URL || "http://192.168.0.239:5000/api";

// Colores para gráficos
const CHART_COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

// Plantillas predefinidas para RRHH
const PLANTILLAS_RRHH = [
  {
    id: "empleados_activos",
    nombre: "Empleados Activos",
    descripcion: "Lista de todos los empleados activos",
    sql: "SELECT e.Nombre, e.Apellido, e.Email, e.Cargo as Puesto, d.Nombre as Departamento FROM Empleados e LEFT JOIN Departamentos d ON e.DepartamentoID = d.DepartamentoID WHERE e.Estado = 1"
  },
  {
    id: "empleados_por_departamento", 
    nombre: "Empleados por Departamento",
    descripcion: "Cantidad de empleados por departamento",
    sql: "SELECT d.Nombre as Departamento, COUNT(e.EmpleadoID) as Total_Empleados FROM Departamentos d LEFT JOIN Empleados e ON d.DepartamentoID = e.DepartamentoID WHERE e.Estado = 1 GROUP BY d.Nombre ORDER BY Total_Empleados DESC"
  },
  {
    id: "contrataciones_recientes",
    nombre: "Contrataciones Recientes", 
    descripcion: "Empleados contratados en los últimos 90 días",
    sql: "SELECT e.Nombre, e.Apellido, e.Email, e.Cargo as Puesto, e.FechaIngreso, d.Nombre as Departamento FROM Empleados e LEFT JOIN Departamentos d ON e.DepartamentoID = d.DepartamentoID WHERE e.FechaIngreso >= DATEADD(day, -90, GETDATE()) ORDER BY e.FechaIngreso DESC"
  },
  {
    id: "salarios_promedio",
    nombre: "Salarios Promedio por Departamento",
    descripcion: "Salario promedio por departamento",
    sql: "SELECT d.Nombre as Departamento, AVG(CAST(e.Salario AS FLOAT)) as Salario_Promedio, COUNT(e.EmpleadoID) as Cantidad_Empleados FROM Departamentos d LEFT JOIN Empleados e ON d.DepartamentoID = e.DepartamentoID WHERE e.Estado = 1 GROUP BY d.Nombre ORDER BY Salario_Promedio DESC"
  },
  {
    id: "Severance",
    nombre: "Reporte Severance",
    descripcion: "Detalle de Preaviso, Cesantía, Vacaciones, Regalía y Total por empleado",
    sql: `
      SELECT 
          ROW_NUMBER() OVER (ORDER BY e.Cedula) AS No,
          e.Nombre + ' ' + e.Apellido AS [Colaborador (a)],
          e.Cedula,
          e.Cargo AS Puesto, 
          FORMAT(e.FechaIngreso, 'dd-MMM-yy', 'es-DO') AS [Fecha de Ingreso],
          e.Salario,
          CASE 
              WHEN DATEDIFF(MONTH, e.FechaIngreso, GETDATE()) < 3 THEN 0
              WHEN DATEDIFF(MONTH, e.FechaIngreso, GETDATE()) < 6 THEN ROUND((e.Salario / 30) * 7, 2)
              WHEN DATEDIFF(MONTH, e.FechaIngreso, GETDATE()) < 12 THEN ROUND((e.Salario / 30) * 14, 2)
              ELSE ROUND((e.Salario / 30) * 28, 2)
          END AS Preaviso,
          CASE 
              WHEN DATEDIFF(MONTH, e.FechaIngreso, GETDATE()) < 3 THEN 0
              WHEN DATEDIFF(MONTH, e.FechaIngreso, GETDATE()) BETWEEN 3 AND 5 
                  THEN ROUND((e.Salario / 30) * 6 * DATEDIFF(YEAR, e.FechaIngreso, GETDATE()), 2)
              WHEN DATEDIFF(YEAR, e.FechaIngreso, GETDATE()) < 1 
                  THEN ROUND((e.Salario / 30) * 13, 2)
              WHEN DATEDIFF(YEAR, e.FechaIngreso, GETDATE()) BETWEEN 1 AND 5 
                  THEN ROUND((e.Salario / 30) * 21 * DATEDIFF(YEAR, e.FechaIngreso, GETDATE()), 2)
              ELSE ROUND((e.Salario / 30) * 23 * DATEDIFF(YEAR, e.FechaIngreso, GETDATE()), 2)
          END AS Cesantia,
          ROUND((e.Salario / 30) * 14, 2) AS Vacaciones,
          ROUND(e.Salario * 0.6667, 2) AS Regalia,
          (
              CASE 
                  WHEN DATEDIFF(MONTH, e.FechaIngreso, GETDATE()) < 3 THEN 0
                  WHEN DATEDIFF(MONTH, e.FechaIngreso, GETDATE()) < 6 THEN ROUND((e.Salario / 30) * 7, 2)
                  WHEN DATEDIFF(MONTH, e.FechaIngreso, GETDATE()) < 12 THEN ROUND((e.Salario / 30) * 14, 2)
                  ELSE ROUND((e.Salario / 30) * 28, 2)
              END 
              +
              CASE 
                  WHEN DATEDIFF(MONTH, e.FechaIngreso, GETDATE()) < 3 THEN 0
                  WHEN DATEDIFF(MONTH, e.FechaIngreso, GETDATE()) BETWEEN 3 AND 5 
                      THEN ROUND((e.Salario / 30) * 6 * DATEDIFF(YEAR, e.FechaIngreso, GETDATE()), 2)
                  WHEN DATEDIFF(YEAR, e.FechaIngreso, GETDATE()) < 1 
                      THEN ROUND((e.Salario / 30) * 13, 2)
                  WHEN DATEDIFF(YEAR, e.FechaIngreso, GETDATE()) BETWEEN 1 AND 5 
                      THEN ROUND((e.Salario / 30) * 21 * DATEDIFF(YEAR, e.FechaIngreso, GETDATE()), 2)
                  ELSE ROUND((e.Salario / 30) * 23 * DATEDIFF(YEAR, e.FechaIngreso, GETDATE()), 2)
              END 
              + ROUND((e.Salario / 30) * 14, 2)
              + ROUND(e.Salario * 0.6667, 2)
          ) AS Total
      FROM dbo.Empleados e
      WHERE e.Estado = 1
      ORDER BY e.Cedula;
    `
  },
{
  id: "historico-vacantes-cerradas",
  nombre: "Histórico de Vacantes Cerradas",
  descripcion: "Detalle completo de vacantes cerradas con motivo y estadísticas",
  sql: `
    SELECT 
      v.VacanteID AS ID,
      v.Titulo AS Vacante,
      d.Nombre AS Departamento,
      v.FechaPublicacion,
      v.FechaCierre,
      DATEDIFF(DAY, v.FechaPublicacion, v.FechaCierre) AS DiasActiva,
      CONCAT(e.NOMBRE, ' ', e.APELLIDO) AS CerradaPor,
      v.MotivoCierre,
      COUNT(p.PostulacionID) AS TotalPostulaciones
    FROM Vacantes v
    LEFT JOIN Departamentos d ON v.DepartamentoID = d.DepartamentoID
    LEFT JOIN Empleados e ON v.CerradoPor = e.EmpleadoID
    LEFT JOIN Postulaciones p ON v.VacanteID = p.VacanteID
    WHERE v.Estado = 'Cerrada'
    GROUP BY 
      v.VacanteID, v.Titulo, d.Nombre, v.FechaPublicacion, 
      v.FechaCierre, e.NOMBRE, e.APELLIDO, v.MotivoCierre
    ORDER BY v.FechaCierre DESC
  `
}
];

// Modal de confirmación para eliminar
const ConfirmDeleteModal = ({ show, onClose, onConfirm, reporteName }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-96">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Eliminar Reporte</h3>
            <p className="text-sm text-gray-600">Esta acción no se puede deshacer</p>
          </div>
        </div>
        
        <p className="text-gray-700 mb-6">
          ¿Estás seguro de que deseas eliminar el reporte <strong>"{reporteName}"</strong>?
        </p>
        
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal para crear/editar reporte
const ReporteModal = ({ show, onClose, onSave, editingReport = null }) => {
  const [formData, setFormData] = React.useState({
    nombre: "",
    descripcion: "",
    plantilla: "",
    sqlPersonalizado: ""
  });

  const [usarPlantilla, setUsarPlantilla] = React.useState(true);

  // Cargar datos del reporte si estamos editando
  useEffect(() => {
    if (editingReport) {
      setFormData({
        nombre: editingReport.nombre || "",
        descripcion: editingReport.descripcion || "",
        plantilla: editingReport.configuracion?.plantillaId || "",
        sqlPersonalizado: editingReport.configuracion?.sqlQuery || ""
      });
      setUsarPlantilla(editingReport.configuracion?.tipo === "plantilla");
    } else {
      resetForm();
    }
  }, [editingReport]);

  const handleSave = () => {
    if (!formData.nombre.trim()) {
      alert("El nombre del reporte es obligatorio");
      return;
    }

    let sqlFinal = "";
    if (usarPlantilla && formData.plantilla) {
      const plantilla = PLANTILLAS_RRHH.find(p => p.id === formData.plantilla);
      sqlFinal = plantilla ? plantilla.sql : "";
    } else {
      sqlFinal = formData.sqlPersonalizado;
    }

    if (!sqlFinal.trim()) {
      alert("Debe seleccionar una plantilla o escribir SQL personalizado");
      return;
    }

    const reporte = {
      id: editingReport?.id,
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion.trim(),
      origen: "personalizado",
      configuracion: {
        tipo: usarPlantilla ? "plantilla" : "personalizado",
        plantillaId: formData.plantilla,
        sqlQuery: sqlFinal
      }
    };

    onSave(reporte);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      nombre: "",
      descripcion: "",
      plantilla: "",
      sqlPersonalizado: ""
    });
    setUsarPlantilla(true);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-[600px] max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">
            {editingReport ? "Editar Reporte" : "Crear Nuevo Reporte"}
          </h3>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Información básica */}
          <div>
            <label className="block font-medium mb-2 text-gray-700">Nombre del Reporte *</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: Reporte Mensual de Empleados"
            />
          </div>

          <div>
            <label className="block font-medium mb-2 text-gray-700">Descripción</label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Describe brevemente este reporte..."
            />
          </div>

          {/* Selector de tipo */}
          <div className="border-t pt-4">
            <label className="block font-medium mb-3 text-gray-700">Tipo de Reporte</label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  checked={usarPlantilla}
                  onChange={() => setUsarPlantilla(true)}
                  className="mr-2"
                />
                <span>Usar plantilla predefinida</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  checked={!usarPlantilla}
                  onChange={() => setUsarPlantilla(false)}
                  className="mr-2"
                />
                <span>SQL personalizado</span>
              </label>
            </div>
          </div>

          {/* Plantillas predefinidas */}
          {usarPlantilla && (
            <div>
              <label className="block font-medium mb-2 text-gray-700">Seleccionar Plantilla *</label>
              <select
                value={formData.plantilla}
                onChange={(e) => setFormData(prev => ({ ...prev, plantilla: e.target.value }))}
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Seleccione una plantilla --</option>
                {PLANTILLAS_RRHH.map(plantilla => (
                  <option key={plantilla.id} value={plantilla.id}>
                    {plantilla.nombre} - {plantilla.descripcion}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* SQL personalizado */}
          {!usarPlantilla && (
            <div>
              <label className="block font-medium mb-2 text-gray-700">Consulta SQL *</label>
              <textarea
                value={formData.sqlPersonalizado}
                onChange={(e) => setFormData(prev => ({ ...prev, sqlPersonalizado: e.target.value }))}
                className="w-full border border-gray-300 p-3 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={6}
                placeholder="SELECT columna1, columna2 FROM tabla WHERE condicion..."
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {editingReport ? "Actualizar" : "Crear"} Reporte
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente para selector de tipo de gráfico
const ChartTypeSelector = ({ currentType, onTypeChange, data }) => {
  const chartTypes = [
    { id: 'bar', name: 'Barras', icon: BarChart3 },
    { id: 'line', name: 'Líneas', icon: TrendingUp },
    { id: 'pie', name: 'Circular', icon: Users },
    { id: 'area', name: 'Área', icon: Building }
  ];

  if (!data || data.length === 0 || Object.keys(data[0]).length < 2) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-sm font-medium text-gray-700">Tipo de gráfico:</span>
      <div className="flex gap-1">
        {chartTypes.map(type => {
          const Icon = type.icon;
          return (
            <button
              key={type.id}
              onClick={() => onTypeChange(type.id)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                currentType === type.id 
                  ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-3 h-3" />
              {type.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Componente para renderizar gráficos
const ChartRenderer = ({ type, data, height = 300 }) => {
  if (!data || data.length === 0) return null;

  const keys = Object.keys(data[0]);
  const xKey = keys[0];
  const yKey = keys[1];
  const chartData = data.slice(0, 10); // Limitar a 10 elementos para mejor visualización

  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey={yKey}
          nameKey={xKey}
          cx="50%"
          cy="50%"
          outerRadius={80}
          label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );

  switch (type) {
    case 'line':
      return (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData}>
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey={yKey} stroke="#3B82F6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      );
    
    case 'pie':
      return renderPieChart();
    
    case 'area':
      return (
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={chartData}>
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey={yKey} stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
          </AreaChart>
        </ResponsiveContainer>
      );
    
    default: // bar
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData}>
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={yKey} fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      );
  }
};

// Componente principal
const ReportesModule = () => {
  const { getStoredToken } = useAuth();
  
  // Estados principales
  const [reportes, setReportes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [deletingReport, setDeletingReport] = useState(null);
  const [sqlQuery, setSqlQuery] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chartType, setChartType] = useState('bar');

  // Cargar reportes guardados
  useEffect(() => {
    cargarReportes();
  }, []);

  const cargarReportes = async () => {
    try {
      const token = getStoredToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/reportes/guardados`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReportes(Array.isArray(data) ? data : []);
      } else if (response.status !== 403) {
        console.warn("Error cargando reportes:", response.status);
      }
    } catch (err) {
      console.warn("Error conectando:", err.message);
    }
  };

  // Ejecutar consulta
  const ejecutarConsulta = async (sql = null) => {
    const queryToExecute = sql || sqlQuery;
    
    if (!queryToExecute.trim()) {
      alert("Escriba una consulta SQL o seleccione una plantilla");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/reportes/custom`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getStoredToken()}`
        },
        body: JSON.stringify({ sqlQuery: queryToExecute })
      });

      if (response.ok) {
        const result = await response.json();
        setData(result.data || []);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.details || `Error ${response.status}`);
      }
    } catch (err) {
      setError(err.message);
      console.error("Error ejecutando consulta:", err);
    } finally {
      setLoading(false);
    }
  };

  // Guardar/actualizar reporte
  const guardarReporte = async (reporteData) => {
    try {
      const isEdit = !!reporteData.id;
      const method = isEdit ? "PUT" : "POST";
      const endpoint = isEdit ? `${API_URL}/reportes/guardados/${reporteData.id}` : `${API_URL}/reportes/guardados`;

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getStoredToken()}`
        },
        body: JSON.stringify(reporteData)
      });

      if (response.ok) {
        const saved = await response.json();
        if (isEdit) {
          setReportes(prev => prev.map(r => r.id === saved.id ? saved : r));
          alert("Reporte actualizado exitosamente");
        } else {
          setReportes(prev => [...prev, saved]);
          alert("Reporte guardado exitosamente");
        }
        setShowModal(false);
        setEditingReport(null);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.details || `Error ${response.status}`);
      }
    } catch (err) {
      console.error("Error guardando reporte:", err);
      alert("Error guardando reporte: " + err.message);
    }
  };

  // Eliminar reporte
  const eliminarReporte = async (reporteId) => {
    try {
      const response = await fetch(`${API_URL}/reportes/guardados/${reporteId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getStoredToken()}`
        }
      });

      if (response.ok) {
        setReportes(prev => prev.filter(r => r.id !== reporteId));
        alert("Reporte eliminado exitosamente");
        setShowDeleteModal(false);
        setDeletingReport(null);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.details || `Error ${response.status}`);
      }
    } catch (err) {
      console.error("Error eliminando reporte:", err);
      alert("Error eliminando reporte: " + err.message);
    }
  };

  // Ejecutar plantilla rápida
  const ejecutarPlantilla = (plantillaId) => {
    const plantilla = PLANTILLAS_RRHH.find(p => p.id === plantillaId);
    if (plantilla) {
      setSqlQuery(plantilla.sql);
      ejecutarConsulta(plantilla.sql);
    }
  };

  // Exportar datos (incluyendo PDF)
  const exportarDatos = async (formato) => {
    if (data.length === 0) {
      alert("No hay datos para exportar");
      return;
    }

    setExportLoading(true);

    try {
      const response = await fetch(`${API_URL}/reportes/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getStoredToken()}`
        },
        body: JSON.stringify({
          formato,
          data,
          nombre: `reporte_rrhh_${new Date().toISOString().split('T')[0]}`
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        const extensions = {
          excel: 'xlsx',
          csv: 'csv',
          pdf: 'pdf',
          json: 'json'
        };
        
        link.download = `reporte_rrhh_${new Date().toISOString().split('T')[0]}.${extensions[formato]}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error(`Error ${response.status}`);
      }
    } catch (err) {
      console.error("Error exportando:", err);
      alert("Error al exportar: " + err.message);
    } finally {
      setExportLoading(false);
    }
  };

  // Cargar reporte guardado
  const cargarReporte = (reporte) => {
    if (reporte.configuracion && reporte.configuracion.sqlQuery) {
      setSqlQuery(reporte.configuracion.sqlQuery);
      ejecutarConsulta(reporte.configuracion.sqlQuery);
    }
  };

  // Manejar edición
  const handleEditReport = (reporte) => {
    setEditingReport(reporte);
    setShowModal(true);
  };

  // Manejar eliminación
  const handleDeleteReport = (reporte) => {
    setDeletingReport(reporte);
    setShowDeleteModal(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto" style={{ background: '#ffffff', minHeight: '100vh' }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-800">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            Reportes RRHH
          </h1>
          <p className="text-gray-600 mt-2">Genera reportes personalizados para recursos humanos</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Nuevo Reporte
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span className="text-red-700">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Plantillas rápidas */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
            <Users className="w-5 h-5 text-blue-600" />
            Plantillas Rápidas
          </h3>
          <p className="text-sm text-gray-600 mt-1">Reportes predefinidos más utilizados</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLANTILLAS_RRHH.map(plantilla => (
              <button
                key={plantilla.id}
                onClick={() => ejecutarPlantilla(plantilla.id)}
                disabled={loading}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all disabled:opacity-50 text-left group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Building className="w-4 h-4 text-blue-600 group-hover:text-blue-700" />
                  <h4 className="font-medium text-gray-800 group-hover:text-blue-700">
                    {plantilla.nombre}
                  </h4>
                </div>
                <p className="text-sm text-gray-600 group-hover:text-gray-700">
                  {plantilla.descripcion}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Editor SQL */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
            <Database className="w-5 h-5 text-green-600" />
            Editor de Consultas
          </h3>
          <p className="text-sm text-gray-600 mt-1">Escribe tu consulta SQL personalizada</p>
        </div>
        <div className="p-6">
          <textarea
            value={sqlQuery}
            onChange={(e) => setSqlQuery(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-4 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={8}
            placeholder="SELECT e.Nombre, e.Apellido, d.Nombre as Departamento 
FROM Empleados e 
LEFT JOIN Departamentos d ON e.DepartamentoID = d.DepartamentoID 
WHERE e.Estado = 1"
          />
          
          <div className="flex justify-between items-center mt-4">
            <div className="flex gap-2">
              <button
                onClick={() => ejecutarConsulta()}
                disabled={loading || !sqlQuery.trim()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                {loading ? "Ejecutando..." : "Ejecutar Consulta"}
              </button>
              
              <button
                onClick={() => setSqlQuery("")}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Limpiar
              </button>
            </div>

            {data.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => exportarDatos('excel')}
                  disabled={exportLoading}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  Excel
                </button>
                <button
                  onClick={() => exportarDatos('csv')}
                  disabled={exportLoading}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </button>
                <button
                  onClick={() => exportarDatos('pdf')}
                  disabled={exportLoading}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reportes guardados */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
            <FileText className="w-5 h-5 text-purple-600" />
            Reportes Guardados ({reportes.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Nombre</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Descripción</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Fecha Creación</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reportes.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                    No hay reportes guardados. Crea tu primer reporte personalizado.
                  </td>
                </tr>
              ) : (
                reportes.map((reporte) => (
                  <tr key={reporte.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{reporte.nombre}</td>
                    <td className="px-6 py-4 text-gray-600">{reporte.descripcion || "-"}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {reporte.fechaCreacion ? new Date(reporte.fechaCreacion).toLocaleDateString('es-DO') : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3">
                        <button 
                          onClick={() => cargarReporte(reporte)}
                          className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium flex items-center gap-1"
                        >
                          <Play className="w-3 h-3" />
                          Ejecutar
                        </button>
                        <button 
                          onClick={() => handleEditReport(reporte)}
                          className="text-green-600 hover:text-green-800 hover:underline text-sm font-medium flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          Editar
                        </button>
                        <button 
                          onClick={() => handleDeleteReport(reporte)}
                          className="text-red-600 hover:text-red-800 hover:underline text-sm font-medium flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resultados */}
      {data.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">
                Resultados ({data.length} registros)
              </h3>
              <div className="text-sm text-gray-600">
                Consulta ejecutada exitosamente
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {/* Selector de tipo de gráfico */}
            <ChartTypeSelector 
              currentType={chartType}
              onTypeChange={setChartType}
              data={data}
            />

            {/* Gráfico */}
            {data.length > 0 && Object.keys(data[0]).length >= 2 && (
              <div className="mb-6">
                <ChartRenderer 
                  type={chartType}
                  data={data}
                  height={300}
                />
              </div>
            )}

            {/* Tabla de datos */}
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(data[0] || {}).map((key) => (
                      <th key={key} className="border-b border-gray-200 px-4 py-3 text-left font-medium text-sm text-gray-700">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 100).map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      {Object.values(row).map((value, cellIndex) => (
                        <td key={cellIndex} className="border-b border-gray-100 px-4 py-3 text-sm text-gray-900">
                          {typeof value === 'number' ? value.toLocaleString('es-DO') : value}
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

      {/* Modal para crear/editar */}
      <ReporteModal
        show={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingReport(null);
        }}
        onSave={guardarReporte}
        editingReport={editingReport}
      />

      {/* Modal de confirmación para eliminar */}
      <ConfirmDeleteModal
        show={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingReport(null);
        }}
        onConfirm={() => eliminarReporte(deletingReport?.id)}
        reporteName={deletingReport?.nombre}
      />
    </div>
  );
};

export default ReportesModule;