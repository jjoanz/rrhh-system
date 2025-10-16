import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, Search, Building2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://192.168.0.239:5000/api';

const FormularioCambioDepartamento = ({ onClose, onSuccess }) => {
  const [empleados, setEmpleados] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [supervisores, setSupervisores] = useState([]);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const [formData, setFormData] = useState({
    empleadoId: '',
    departamentoActual: '',
    departamentoNuevo: '',
    supervisorNuevo: '',
    fechaEfectiva: '',
    justificacion: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const token = localStorage.getItem('token');

      // Cargar empleados
      const empRes = await fetch(`${API_URL}/empleados`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const empData = await empRes.json();
      if (empData.success) {
        const activos = empData.empleados.filter(e => e.Estado === 1);
        setEmpleados(activos);
        setSupervisores(activos);
      }

      // Cargar departamentos
      const deptRes = await fetch(`${API_URL}/departamentos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const deptData = await deptRes.json();
      if (deptData.success) {
        setDepartamentos(deptData.departamentos);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    }
  };

  const seleccionarEmpleado = (empleado) => {
    setEmpleadoSeleccionado(empleado);
    setFormData(prev => ({
      ...prev,
      empleadoId: empleado.EmpleadoID,
      departamentoActual: empleado.DEPARTAMENTOID || ''
    }));
    setBusqueda('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.empleadoId || !formData.departamentoNuevo || !formData.fechaEfectiva || !formData.justificacion) {
      setMensaje({ tipo: 'error', texto: 'Complete todos los campos obligatorios' });
      return;
    }

    try {
      setLoading(true);
      setMensaje({ tipo: '', texto: '' });

      const token = localStorage.getItem('token');

      const payload = {
        tipoAccion: 'CAMBIO_DEPTO',
        empleadoId: parseInt(formData.empleadoId),
        fechaEfectiva: formData.fechaEfectiva,
        justificacion: formData.justificacion,
        datosAnteriores: {
          departamentoId: parseInt(formData.departamentoActual)
        },
        datosNuevos: {
          nuevoDepartamentoId: parseInt(formData.departamentoNuevo),
          nuevoSupervisorId: formData.supervisorNuevo ? parseInt(formData.supervisorNuevo) : null
        }
      };

      const response = await fetch(`${API_URL}/acciones-personal`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        setMensaje({ tipo: 'success', texto: 'Cambio de departamento creado exitosamente' });
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setMensaje({ tipo: 'error', texto: data.message || 'Error al crear la acción' });
      }
    } catch (error) {
      console.error('Error:', error);
      setMensaje({ tipo: 'error', texto: 'Error al crear el cambio de departamento' });
    } finally {
      setLoading(false);
    }
  };

  const empleadosFiltrados = empleados.filter(emp => {
    const searchLower = busqueda.toLowerCase();
    return (
      emp.NOMBRE.toLowerCase().includes(searchLower) ||
      emp.APELLIDO.toLowerCase().includes(searchLower) ||
      emp.CEDULA.includes(busqueda)
    );
  });

  const getDepartamentoNombre = (id) => {
    const dept = departamentos.find(d => d.DepartamentoID === id);
    return dept ? dept.Nombre : 'N/A';
  };

  return (
    <form onSubmit={handleSubmit}>
      {mensaje.texto && (
        <div style={{
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          background: mensaje.tipo === 'success' ? '#d1fae5' : '#fee2e2',
          color: mensaje.tipo === 'success' ? '#065f46' : '#991b1b',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertCircle size={20} />
          <span>{mensaje.texto}</span>
        </div>
      )}

      {/* Selección de Empleado */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: '#1f2937',
          marginBottom: '1rem',
          paddingBottom: '0.5rem',
          borderBottom: '2px solid #e5e7eb'
        }}>
          Seleccionar Empleado
        </h3>

        {!empleadoSeleccionado ? (
          <>
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <Search 
                size={18} 
                style={{ 
                  position: 'absolute', 
                  left: '0.75rem', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: '#9ca3af' 
                }} 
              />
              <input
                type="text"
                placeholder="Buscar por nombre o cédula..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.75rem 0.625rem 2.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.875rem'
                }}
              />
            </div>

            {busqueda && (
              <div style={{
                maxHeight: '300px',
                overflowY: 'auto',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                background: 'white'
              }}>
                {empleadosFiltrados.length === 0 ? (
                  <p style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>
                    No se encontraron empleados
                  </p>
                ) : (
                  empleadosFiltrados.map(emp => (
                    <div
                      key={emp.EmpleadoID}
                      onClick={() => seleccionarEmpleado(emp)}
                      style={{
                        padding: '1rem',
                        borderBottom: '1px solid #f3f4f6',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#f9fafb'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                    >
                      <p style={{ fontWeight: '600', color: '#1f2937', margin: 0 }}>
                        {emp.NOMBRE} {emp.APELLIDO}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0.25rem 0 0' }}>
                        {emp.CEDULA} • {emp.DEPARTAMENTO_NOMBRE || 'Sin departamento'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        ) : (
          <div style={{
            padding: '1rem',
            background: '#eff6ff',
            borderRadius: '8px',
            border: '1px solid #bfdbfe',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <p style={{ fontWeight: '600', color: '#1f2937', margin: 0 }}>
                {empleadoSeleccionado.NOMBRE} {empleadoSeleccionado.APELLIDO}
              </p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0' }}>
                {empleadoSeleccionado.CARGO} • {getDepartamentoNombre(empleadoSeleccionado.DEPARTAMENTOID)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEmpleadoSeleccionado(null);
                setFormData(prev => ({
                  ...prev,
                  empleadoId: '',
                  departamentoActual: ''
                }));
              }}
              style={{
                padding: '0.5rem 1rem',
                background: 'white',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Cambiar
            </button>
          </div>
        )}
      </div>

      {/* Información del Cambio */}
      {empleadoSeleccionado && (
        <>
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '1rem',
              paddingBottom: '0.5rem',
              borderBottom: '2px solid #e5e7eb'
            }}>
              Datos del Cambio de Departamento
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Departamento Actual
                </label>
                <input
                  type="text"
                  value={getDepartamentoNombre(formData.departamentoActual)}
                  disabled
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    background: '#f9fafb',
                    color: '#6b7280'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Nuevo Departamento <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  name="departamentoNuevo"
                  value={formData.departamentoNuevo}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="">Seleccionar departamento</option>
                  {departamentos.map(dept => (
                    <option key={dept.DepartamentoID} value={dept.DepartamentoID}>
                      {dept.Nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Nuevo Supervisor (Opcional)
                </label>
                <select
                  name="supervisorNuevo"
                  value={formData.supervisorNuevo}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="">Sin cambio de supervisor</option>
                  {supervisores.map(sup => (
                    <option key={sup.EmpleadoID} value={sup.EmpleadoID}>
                      {sup.NOMBRE} {sup.APELLIDO}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Fecha Efectiva <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="date"
                  name="fechaEfectiva"
                  value={formData.fechaEfectiva}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              {/* Vista previa del cambio */}
              {formData.departamentoNuevo && (
                <div style={{
                  gridColumn: 'span 2',
                  padding: '1.5rem',
                  background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                  borderRadius: '12px',
                  border: '2px solid #fbbf24'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <Building2 size={24} color="#92400e" />
                    <p style={{ fontSize: '1rem', color: '#92400e', fontWeight: '600', margin: 0 }}>
                      Resumen del Movimiento
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '0.75rem', color: '#92400e', margin: 0 }}>De:</p>
                      <p style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#78350f', margin: '0.25rem 0 0' }}>
                        {getDepartamentoNombre(formData.departamentoActual)}
                      </p>
                    </div>
                    <div style={{ fontSize: '2rem', color: '#92400e' }}>→</div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '0.75rem', color: '#92400e', margin: 0 }}>A:</p>
                      <p style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#78350f', margin: '0.25rem 0 0' }}>
                        {getDepartamentoNombre(parseInt(formData.departamentoNuevo))}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Justificación */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Justificación <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              name="justificacion"
              value={formData.justificacion}
              onChange={handleChange}
              placeholder="Explique los motivos del cambio de departamento (reorganización, nuevas responsabilidades, etc.)..."
              required
              rows={4}
              style={{
                width: '100%',
                padding: '0.625rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem',
                resize: 'vertical'
              }}
            />
          </div>
        </>
      )}

      {/* Botones */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '1rem',
        paddingTop: '1rem',
        borderTop: '1px solid #e5e7eb'
      }}>
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          style={{
            padding: '0.625rem 1.5rem',
            background: '#f3f4f6',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1
          }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading || !empleadoSeleccionado}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1.5rem',
            background: (loading || !empleadoSeleccionado) ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: (loading || !empleadoSeleccionado) ? 'not-allowed' : 'pointer',
            boxShadow: (loading || !empleadoSeleccionado) ? 'none' : '0 4px 6px rgba(59, 130, 246, 0.3)'
          }}
        >
          {loading ? (
            <>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid white',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              Guardando...
            </>
          ) : (
            <>
              <Save size={18} />
              Crear Cambio de Departamento
            </>
          )}
        </button>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </form>
  );
};

export default FormularioCambioDepartamento;