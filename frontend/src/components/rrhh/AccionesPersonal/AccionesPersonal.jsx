import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { 
  Users, TrendingUp, TrendingDown, ArrowRightLeft, 
  Clock, CheckCircle, XCircle, Eye, Plus, Filter,
  Calendar, FileText, AlertCircle, Search
} from 'lucide-react';
import NuevaAccion from './NuevaAccion';
import DetalleAccion from './DetalleAccion';

const API_URL = process.env.REACT_APP_API_URL || 'http://192.168.0.239:5000/api';

// Función para obtener el token limpio
const getAuthToken = () => {
  const token = localStorage.getItem('token');
  return token ? token.trim() : null;
};

const AccionesPersonal = () => {
  const [estadisticas, setEstadisticas] = useState(null);
  const [acciones, setAcciones] = useState([]);
  const [accionesPendientes, setAccionesPendientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    tipo: '',
    estado: '',
    busqueda: ''
  });
  const [mostrarNuevaAccion, setMostrarNuevaAccion] = useState(false);
  const [accionSeleccionada, setAccionSeleccionada] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('rrhh_token')?.trim();

      if (!token) {
        console.error('No hay token disponible');
        return;
      }

      // Cargar estadísticas
      const statsRes = await fetch(`${API_URL}/acciones-personal/estadisticas`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const statsData = await statsRes.json();
      if (statsData.success) {
        setEstadisticas(statsData.estadisticas);
      }

      // Cargar acciones pendientes
      const pendientesRes = await fetch(`${API_URL}/acciones-personal/pendientes`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const pendientesData = await pendientesRes.json();
      if (pendientesData.success) {
        setAccionesPendientes(pendientesData.acciones);
      }

      // Cargar todas las acciones
      const accionesRes = await fetch(`${API_URL}/acciones-personal`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const accionesData = await accionesRes.json();
      if (accionesData.success) {
        setAcciones(accionesData.acciones);
      }

    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...acciones];

    if (filtros.tipo) {
      resultado = resultado.filter(a => a.TipoAccion === filtros.tipo);
    }

    if (filtros.estado) {
      resultado = resultado.filter(a => a.Estado === filtros.estado);
    }

    if (filtros.busqueda) {
      resultado = resultado.filter(a => 
        a.NombreEmpleado.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
        a.CEDULA.includes(filtros.busqueda)
      );
    }

    return resultado;
  };

  const obtenerColorEstado = (estado) => {
    const colores = {
      'Pendiente': 'bg-yellow-100 text-yellow-800',
      'Aprobada': 'bg-green-100 text-green-800',
      'Rechazada': 'bg-red-100 text-red-800',
      'Ejecutada': 'bg-blue-100 text-blue-800'
    };
    return colores[estado] || 'bg-gray-100 text-gray-800';
  };

  const obtenerNombreTipo = (codigo) => {
    const tipos = {
      'INGRESO': 'Ingreso de Personal',
      'REINGRESO': 'Reingreso',
      'PROMOCION': 'Promoción',
      'CAMBIO_DEPTO': 'Cambio de Departamento',
      'CAMBIO_PUESTO': 'Cambio de Puesto',
      'AJUSTE_SALARIAL': 'Ajuste Salarial',
      'TRANSFERENCIA': 'Transferencia',
      'CAMBIO_SUPERVISOR': 'Cambio de Supervisor',
      'CAMBIO_JORNADA': 'Cambio de Jornada',
      'CAMBIO_TURNO': 'Cambio de Turno',
      'RENOVACION_CONTRATO': 'Renovación de Contrato',
      'CAMBIO_TIPO_CONTRATO': 'Cambio de Tipo de Contrato',
      'EXTENSION_PRUEBA': 'Extensión de Prueba',
      'AMONESTACION': 'Amonestación',
      'SUSPENSION': 'Suspensión',
      'SANCION': 'Sanción',
      'TERMINACION': 'Terminación',
      'JUBILACION': 'Jubilación'
    };
    return tipos[codigo] || codigo;
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#6b7280' }}>Cargando datos...</p>
        </div>
      </div>
    );
  }

  const accionesFiltradas = aplicarFiltros();

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f6f7faff', margin: 0 }}>
              Acciones de Personal
            </h1>
            <p style={{ color: '#c1c5ceff', marginTop: '0.5rem' }}>
              Gestión integral de movimientos de personal
            </p>
          </div>
          <button
            onClick={() => setMostrarNuevaAccion(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(59, 130, 246, 0.3)',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <Plus size={20} />
            Nueva Acción de Personal
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {/* Ingresos */}
          <div style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            padding: '1.5rem',
            borderRadius: '12px',
            color: 'white',
            boxShadow: '0 4px 6px rgba(16, 185, 129, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '0.875rem', opacity: 0.9, margin: 0 }}>Ingresos del Mes</p>
                <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '0.5rem 0' }}>
                  {estadisticas.IngresosMes}
                </p>
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '0.75rem',
                borderRadius: '10px'
              }}>
                <TrendingUp size={28} />
              </div>
            </div>
          </div>

          {/* Egresos */}
          <div style={{
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            padding: '1.5rem',
            borderRadius: '12px',
            color: 'white',
            boxShadow: '0 4px 6px rgba(239, 68, 68, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '0.875rem', opacity: 0.9, margin: 0 }}>Egresos del Mes</p>
                <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '0.5rem 0' }}>
                  {estadisticas.EgresosMes}
                </p>
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '0.75rem',
                borderRadius: '10px'
              }}>
                <TrendingDown size={28} />
              </div>
            </div>
          </div>

          {/* Movimientos */}
          <div style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            padding: '1.5rem',
            borderRadius: '12px',
            color: 'white',
            boxShadow: '0 4px 6px rgba(245, 158, 11, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '0.875rem', opacity: 0.9, margin: 0 }}>Movimientos del Mes</p>
                <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '0.5rem 0' }}>
                  {estadisticas.MovimientosMes}
                </p>
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '0.75rem',
                borderRadius: '10px'
              }}>
                <ArrowRightLeft size={28} />
              </div>
            </div>
          </div>

          {/* Pendientes */}
          <div style={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            padding: '1.5rem',
            borderRadius: '12px',
            color: 'white',
            boxShadow: '0 4px 6px rgba(139, 92, 246, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '0.875rem', opacity: 0.9, margin: 0 }}>Acciones Pendientes</p>
                <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '0.5rem 0' }}>
                  {estadisticas.AccionesPendientes}
                </p>
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '0.75rem',
                borderRadius: '10px'
              }}>
                <Clock size={28} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Acciones Pendientes de Aprobación */}
      {accionesPendientes.length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #fee2e2'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <AlertCircle size={20} color="#ef4444" />
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
              Acciones Pendientes de Aprobación ({accionesPendientes.length})
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {accionesPendientes.slice(0, 5).map(accion => (
              <div 
                key={accion.AccionID}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  background: '#fef3c7',
                  borderRadius: '8px',
                  border: '1px solid #fde68a'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: '600', color: '#1f2937' }}>
                      {accion.NombreEmpleado}
                    </span>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      background: '#dbeafe',
                      color: '#1e40af',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      {obtenerNombreTipo(accion.TipoAccion)}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                    Solicitado por: {accion.Solicitante} • Hace {accion.DiasEspera} días
                  </p>
                </div>
                <button
                  onClick={() => setAccionSeleccionada(accion.AccionID)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  <Eye size={16} />
                  Revisar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '2rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Filter size={20} color="#3b82f6" />
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
            Filtros
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          {/* Buscar */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Buscar Empleado
            </label>
            <div style={{ position: 'relative' }}>
              <Search 
                size={18} 
                style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} 
              />
              <input
                type="text"
                placeholder="Nombre o cédula..."
                value={filtros.busqueda}
                onChange={(e) => setFiltros({...filtros, busqueda: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.75rem 0.625rem 2.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Tipo */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Tipo de Acción
            </label>
            <select
              value={filtros.tipo}
              onChange={(e) => setFiltros({...filtros, tipo: e.target.value})}
              style={{
                width: '100%',
                padding: '0.625rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            >
              <option value="">Todos los tipos</option>
              <option value="INGRESO">Ingreso de Personal</option>
              <option value="PROMOCION">Promoción</option>
              <option value="AJUSTE_SALARIAL">Ajuste Salarial</option>
              <option value="CAMBIO_DEPTO">Cambio de Departamento</option>
              <option value="TERMINACION">Terminación</option>
            </select>
          </div>

          {/* Estado */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Estado
            </label>
            <select
              value={filtros.estado}
              onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
              style={{
                width: '100%',
                padding: '0.625rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            >
              <option value="">Todos los estados</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Aprobada">Aprobada</option>
              <option value="Rechazada">Rechazada</option>
              <option value="Ejecutada">Ejecutada</option>
            </select>
          </div>

          {/* Botón Limpiar */}
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              onClick={() => setFiltros({ tipo: '', estado: '', busqueda: '' })}
              style={{
                width: '100%',
                padding: '0.625rem 1rem',
                background: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de Acciones */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  Empleado
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  Tipo de Acción
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  Fecha Solicitud
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  Fecha Efectiva
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  Estado
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  Solicitante
                </th>
                <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {accionesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
                    <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                    <p style={{ margin: 0 }}>No se encontraron acciones</p>
                  </td>
                </tr>
              ) : (
                accionesFiltradas.map(accion => (
                  <tr key={accion.AccionID} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '1rem' }}>
                      <div>
                        <p style={{ fontWeight: '600', color: '#1f2937', margin: 0 }}>
                          {accion.NombreEmpleado}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0.25rem 0 0' }}>
                          {accion.CEDULA}
                        </p>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                        {obtenerNombreTipo(accion.TipoAccion)}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      {formatearFecha(accion.FechaSolicitud)}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      {formatearFecha(accion.FechaEfectiva)}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.375rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}
                      className={obtenerColorEstado(accion.Estado)}>
                        {accion.Estado}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      {accion.Solicitante}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <button
                        onClick={() => setAccionSeleccionada(accion.AccionID)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 1rem',
                          background: '#eff6ff',
                          color: '#2563eb',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        <Eye size={16} />
                        Ver
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Nueva Acción */}
      {mostrarNuevaAccion && (
        <NuevaAccion 
          onClose={() => setMostrarNuevaAccion(false)}
          onSuccess={cargarDatos}
        />
      )}

      {/* Modal de Detalle de Acción */}
      {accionSeleccionada && (
        <DetalleAccion 
          accionId={accionSeleccionada}
          onClose={() => setAccionSeleccionada(null)}
          onSuccess={cargarDatos}
        />
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .bg-yellow-100 { background-color: #fef3c7; }
        .text-yellow-800 { color: #92400e; }
        .bg-green-100 { background-color: #d1fae5; }
        .text-green-800 { color: #065f46; }
        .bg-red-100 { background-color: #fee2e2; }
        .text-red-800 { color: #991b1b; }
        .bg-blue-100 { background-color: #dbeafe; }
        .text-blue-800 { color: #1e40af; }
        .bg-gray-100 { background-color: #f3f4f6; }
        .text-gray-800 { color: #1f2937; }
      `}</style>
    </div>
  );
};

export default AccionesPersonal;