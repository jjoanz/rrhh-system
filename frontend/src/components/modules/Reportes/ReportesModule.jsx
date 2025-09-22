import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { Play, Save, Plus, Database, Download, FileText, BarChart3, X, Users, Building } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

const API_URL = process.env.REACT_APP_API_URL || "http://192.168.0.239:5000/api";

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

        -- Preaviso (según años de servicio)
        CASE 
            WHEN DATEDIFF(MONTH, e.FechaIngreso, GETDATE()) < 3 THEN 0
            WHEN DATEDIFF(MONTH, e.FechaIngreso, GETDATE()) < 6 THEN ROUND((e.Salario / 30) * 7, 2)
            WHEN DATEDIFF(MONTH, e.FechaIngreso, GETDATE()) < 12 THEN ROUND((e.Salario / 30) * 14, 2)
            ELSE ROUND((e.Salario / 30) * 28, 2)
        END AS Preaviso,

        -- Cesantía (según años de servicio)
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

        -- Vacaciones (14 días de salario por año trabajado)
        ROUND((e.Salario / 30) * 14, 2) AS Vacaciones,

        -- Regalía (2/3 de salario, ajusta a 1.0 si quieres salario completo)
        ROUND(e.Salario * 0.6667, 2) AS Regalia,

        -- Total beneficios
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
}

  
];

// Modal para crear nuevo reporte
const NuevoReporteModal = ({ show, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    plantilla: "",
    sqlPersonalizado: ""
  });

  const [usarPlantilla, setUsarPlantilla] = useState(true);

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
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion.trim(),
      origen: "personalizado",
      configuracion: {
        tipo: usarPlantilla ? 'plantilla' : 'personalizado',
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
          <h3 className="text-xl font-bold text-gray-800">Crear Nuevo Reporte</h3>
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
            Crear Reporte
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente principal
const ReportesModule = () => {
  const { getStoredToken } = useAuth();
  
  // Estados principales
  const [reportes, setReportes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [sqlQuery, setSqlQuery] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Estados para plantillas rápidas
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState("");

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

  // Guardar reporte
  const guardarReporte = async (nuevoReporte) => {
    try {
      const response = await fetch(`${API_URL}/reportes/guardados`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getStoredToken()}`
        },
        body: JSON.stringify(nuevoReporte)
      });

      if (response.ok) {
        const saved = await response.json();
        setReportes(prev => [...prev, saved]);
        setShowModal(false);
        alert("Reporte guardado exitosamente");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.details || `Error ${response.status}`);
      }
    } catch (err) {
      console.error("Error guardando reporte:", err);
      alert("Error guardando reporte: " + err.message);
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

  // Exportar datos
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
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
                    <td className="px-6 py-4 text-gray-600">{reporte.fechaCreacion || "-"}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => cargarReporte(reporte)}
                          className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium"
                        >
                          Ejecutar
                        </button>
                        <button className="text-green-600 hover:text-green-800 hover:underline text-sm font-medium">
                          Editar
                        </button>
                        <button className="text-red-600 hover:text-red-800 hover:underline text-sm font-medium">
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
            {/* Gráfico simple */}
            {data.length > 0 && Object.keys(data[0]).length >= 2 && (
              <div className="mb-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.slice(0, 10)}>
                    <XAxis dataKey={Object.keys(data[0])[0]} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey={Object.keys(data[0])[1]} fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
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
                          {value}
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

      {/* Modal */}
      <NuevoReporteModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSave={guardarReporte}
      />
    </div>
  );
};

export default ReportesModule;