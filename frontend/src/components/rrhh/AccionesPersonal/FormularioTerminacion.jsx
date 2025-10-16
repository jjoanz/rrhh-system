import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, Search, UserX } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://192.168.0.239:5000/api';

const FormularioTerminacion = ({ tipo, onClose, onSuccess }) => {
  const [empleados, setEmpleados] = useState([]);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const [formData, setFormData] = useState({
    empleadoId: '',
    tipoTerminacion: 'Renuncia Voluntaria',
    fechaSalida: '',
    motivoSalida: '',
    justificacion: ''
  });

  useEffect(() => {
    cargarEmpleados();
  }, []);

  const cargarEmpleados = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/empleados`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setEmpleados(data.empleados.filter(e => e.Estado === 1));
      }
    } catch (error) {
      console.error('Error al cargar empleados:', error);
    }
  };

  const seleccionarEmpleado = (empleado) => {
    setEmpleadoSeleccionado(empleado);
    setFormData(prev => ({
      ...prev,
      empleadoId: empleado.EmpleadoID
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
    
    if (!formData.empleadoId || !formData.fechaSalida || !formData.motivoSalida || !formData.justificacion) {
      setMensaje({ tipo: 'error', texto: 'Complete todos los campos obligatorios' });
      return;
    }

    try {
      setLoading(true);
      setMensaje({ tipo: '', texto: '' });

      const token = localStorage.getItem('token');

      const payload = {
        tipoAccion: tipo,
        empleadoId: parseInt(formData.empleadoId),
        fechaEfectiva: formData.fechaSalida,
        justificacion: formData.justificacion,
        datosNuevos: {
          fechaSalida: formData.fechaSalida,
          motivoSalida: `${formData.tipoTerminacion}: ${formData.motivoSalida}`
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
        setMensaje({ tipo: 'success', texto: 'Terminación creada exitosamente' });
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setMensaje({ tipo: 'error', texto: data.message || 'Error al crear la acción' });
      }
    } catch (error) {
      console.error('Error:', error);
      setMensaje({ tipo: 'error', texto: 'Error al crear la terminación' });
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

      {/* Advertencia */}
      <div style={{
        padding: '1rem',
        background: '#fef3c7',
        border: '1px solid #fde68a',
        borderRadius: '8px',
        marginBottom: '2rem',
        display: 'flex',
        gap: '0.75rem'
      }}>
        <AlertCircle size={20} color="#92400e" style={{ flexShrink: 0, marginTop: '0.125rem' }} />
        <div>
          <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#92400e', margin: 0 }}>
            Acción Importante
          </p>
          <p style={{ fontSize: '0.875rem', color: '#92400e', margin: '0.25rem 0 0', lineHeight: '1.5' }}>
            Esta acción finalizará la relación laboral del empleado. Una vez ejecutada, el empleado será marcado como inactivo en el sistema.
          </p>
        </div>
      </div>

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
                        {emp.CEDULA} • {emp.CARGO} • Ingreso: {new Date(emp.FECHAINGRESO).toLocaleDateString('es-DO')}
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
            background: '#fee2e2',
            borderRadius: '8px',
            border: '1px solid #fecaca',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <p style={{ fontWeight: '600', color: '#1f2937', margin: 0 }}>
                {empleadoSeleccionado.NOMBRE} {empleadoSeleccionado.APELLIDO}
              </p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0' }}>
                {empleadoSeleccionado.CARGO} • Ingreso: {new Date(empleadoSeleccionado.FECHAINGRESO).toLocaleDateString('es-DO')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEmpleadoSeleccionado(null);
                setFormData(prev => ({
                  ...prev,
                  empleadoId: ''
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

      {/* Información de la Terminación */}
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
              Datos de la Terminación
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Tipo de Terminación <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  name="tipoTerminacion"
                  value={formData.tipoTerminacion}
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
                  <option value="Renuncia Voluntaria">Renuncia Voluntaria</option>
                  <option value="Despido con Causa Justificada">Despido con Causa Justificada</option>
                  <option value="Despido sin Causa (Desahucio)">Despido sin Causa (Desahucio)</option>
                  <option value="Mutuo Acuerdo">Mutuo Acuerdo</option>
                  <option value="Abandono de Trabajo">Abandono de Trabajo</option>
                  <option value="Fin de Contrato Temporal">Fin de Contrato Temporal</option>
                  <option value="Fallecimiento">Fallecimiento</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Fecha de Salida <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="date"
                  name="fechaSalida"
                  value={formData.fechaSalida}
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

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Motivo Detallado <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  name="motivoSalida"
                  value={formData.motivoSalida}
                  onChange={handleChange}
                  placeholder="Describa el motivo específico de la terminación..."
                  required
                  rows={3}
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
            </div>
          </div>

          {/* Justificación */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Justificación / Observaciones <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              name="justificacion"
              value={formData.justificacion}
              onChange={handleChange}
              placeholder="Incluya toda la información relevante sobre esta terminación (documentos, procesos legales, liquidación, etc.)..."
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
            background: (loading || !empleadoSeleccionado) ? '#9ca3af' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: (loading || !empleadoSeleccionado) ? 'not-allowed' : 'pointer',
            boxShadow: (loading || !empleadoSeleccionado) ? 'none' : '0 4px 6px rgba(239, 68, 68, 0.3)'
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
              <UserX size={18} />
              Crear Terminación
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

export default FormularioTerminacion;