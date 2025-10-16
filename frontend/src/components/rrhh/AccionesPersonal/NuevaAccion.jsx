import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { crearAccion } from '../../../api/accionesPersonalApi';
import { getEmpleados, getDepartamentos, getPuestos } from '../../../api/catalogosApi';

const NuevaAccion = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    empleado_id: '',
    tipo_accion: '',
    fecha_efectiva: '',
    departamento_nuevo: '',
    puesto_nuevo: '',
    salario_nuevo: '',
    justificacion: '',
    nombre_empleado: '',
    apellido_empleado: '',
    cedula_empleado: '',
    email_empleado: '',
    telefono_empleado: '',
    datos_especificos: {}
  });

  const [empleados, setEmpleados] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [puestos, setPuestos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cargandoDatos, setCargandoDatos] = useState(true);

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const cargarDatosIniciales = async () => {
    try {
      setCargandoDatos(true);

      const [dataEmpleados, dataDepartamentos, dataPuestos] = await Promise.all([
        getEmpleados(),
        getDepartamentos(),
        getPuestos()
      ]);

      console.log('📦 Empleados:', dataEmpleados);
      console.log('📦 Departamentos:', dataDepartamentos);
      console.log('📦 Puestos:', dataPuestos);

      if (dataEmpleados.success && Array.isArray(dataEmpleados.empleados)) {
        setEmpleados(dataEmpleados.empleados);
      }

      if (dataDepartamentos.success && Array.isArray(dataDepartamentos.departamentos)) {
        setDepartamentos(dataDepartamentos.departamentos);
      }

      if (dataPuestos.success && Array.isArray(dataPuestos.puestos)) {
        setPuestos(dataPuestos.puestos);
      }

    } catch (error) {
      console.error('❌ Error al cargar datos:', error);
      setError('Error al cargar los datos necesarios');
    } finally {
      setCargandoDatos(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Preparar los datos según el formato que espera el backend
      const datosEnviar = {
        tipoAccion: formData.tipo_accion,
        empleadoId: formData.tipo_accion === 'INGRESO' ? null : parseInt(formData.empleado_id),
        fechaEfectiva: formData.fecha_efectiva,
        justificacion: formData.justificacion,
        datosAnteriores: {},  // Datos anteriores del empleado (si aplica)
        datosNuevos: construirDatosEspecificos()
      };

      console.log('📤 Datos a enviar:', datosEnviar);

      const resultado = await crearAccion(datosEnviar);
      
      console.log('📥 Respuesta del servidor:', resultado);
      
      if (resultado.success) {
        onSuccess();
        onClose();
      } else {
        setError(resultado.message || 'Error al crear la acción');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al crear la acción de personal');
    } finally {
      setLoading(false);
    }
  };

  const construirDatosEspecificos = () => {
    const datos = {};
    
    switch (formData.tipo_accion) {
      case 'INGRESO':
        datos.nombre = formData.nombre_empleado;
        datos.apellido = formData.apellido_empleado;
        datos.cedula = formData.cedula_empleado;
        datos.email = formData.email_empleado;
        datos.telefono = formData.telefono_empleado;
        datos.cargo = formData.puesto_nuevo;
        datos.salario = formData.salario_nuevo;
        datos.departamento = formData.departamento_nuevo;
        break;
        
      case 'PROMOCION':
        if (formData.puesto_nuevo) datos.nuevoCargo = formData.puesto_nuevo;
        if (formData.salario_nuevo) datos.nuevoSalario = formData.salario_nuevo;
        if (formData.departamento_nuevo) datos.nuevoDepartamento = formData.departamento_nuevo;
        break;
      
      case 'AJUSTE_SALARIAL':
        if (formData.salario_nuevo) datos.nuevoSalario = formData.salario_nuevo;
        break;
      
      case 'CAMBIO_DEPTO':
        if (formData.departamento_nuevo) datos.nuevoDepartamento = formData.departamento_nuevo;
        break;
      
      case 'CAMBIO_PUESTO':
        if (formData.puesto_nuevo) datos.nuevoCargo = formData.puesto_nuevo;
        break;
      
      case 'TERMINACION':
        datos.fechaSalida = formData.fecha_efectiva;
        datos.motivoSalida = formData.justificacion;
        break;
      
      default:
        break;
    }
    
    return datos;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const obtenerEmpleadoSeleccionado = () => {
    return empleados.find(emp => emp.EmpleadoID === parseInt(formData.empleado_id));
  };

  const mostrarCamposSalario = () => {
    return ['AJUSTE_SALARIAL', 'PROMOCION', 'INGRESO'].includes(formData.tipo_accion);
  };

  const mostrarCamposDepartamento = () => {
    return ['CAMBIO_DEPTO', 'PROMOCION', 'TRANSFERENCIA', 'INGRESO'].includes(formData.tipo_accion);
  };

  const mostrarCamposPuesto = () => {
    return ['CAMBIO_PUESTO', 'PROMOCION', 'INGRESO'].includes(formData.tipo_accion);
  };

  if (cargandoDatos) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '3rem',
          textAlign: 'center'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#6b7280' }}>Cargando formulario...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem',
      overflow: 'auto'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          color: 'white'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
            Nueva Acción de Personal
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '6px',
              padding: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: 'white'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div style={{
            margin: '1rem 1.5rem',
            padding: '1rem',
            background: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={20} color="#dc2626" />
            <span style={{ color: '#dc2626', fontSize: '0.875rem' }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', maxHeight: 'calc(90vh - 140px)' }}>
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Tipo de Acción <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                name="tipo_accion"
                value={formData.tipo_accion}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '0.625rem 0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              >
                <option value="">Seleccione el tipo</option>
                <option value="INGRESO">Ingreso de Personal</option>
                <option value="REINGRESO">Reingreso</option>
                <option value="PROMOCION">Promoción</option>
                <option value="CAMBIO_DEPTO">Cambio de Departamento</option>
                <option value="CAMBIO_PUESTO">Cambio de Puesto</option>
                <option value="AJUSTE_SALARIAL">Ajuste Salarial</option>
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="CAMBIO_SUPERVISOR">Cambio de Supervisor</option>
                <option value="CAMBIO_JORNADA">Cambio de Jornada</option>
                <option value="TERMINACION">Terminación</option>
              </select>
            </div>

            {formData.tipo_accion === 'INGRESO' ? (
              <>
                <div style={{
                  padding: '1rem',
                  background: '#f0fdf4',
                  border: '1px solid #86efac',
                  borderRadius: '8px'
                }}>
                  <p style={{ fontSize: '0.875rem', color: '#065f46', margin: 0, fontWeight: '600' }}>
                    📝 Datos del Nuevo Empleado
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Nombre <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      name="nombre_empleado"
                      value={formData.nombre_empleado}
                      onChange={handleChange}
                      required
                      placeholder="Nombre del empleado"
                      style={{
                        width: '100%',
                        padding: '0.625rem 0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Apellido <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      name="apellido_empleado"
                      value={formData.apellido_empleado}
                      onChange={handleChange}
                      required
                      placeholder="Apellido del empleado"
                      style={{
                        width: '100%',
                        padding: '0.625rem 0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Cédula <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      name="cedula_empleado"
                      value={formData.cedula_empleado}
                      onChange={handleChange}
                      required
                      placeholder="000-0000000-0"
                      style={{
                        width: '100%',
                        padding: '0.625rem 0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Email
                    </label>
                    <input
                      type="email"
                      name="email_empleado"
                      value={formData.email_empleado}
                      onChange={handleChange}
                      placeholder="email@ejemplo.com"
                      style={{
                        width: '100%',
                        padding: '0.625rem 0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      name="telefono_empleado"
                      value={formData.telefono_empleado}
                      onChange={handleChange}
                      placeholder="809-000-0000"
                      style={{
                        width: '100%',
                        padding: '0.625rem 0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </>
            ) : formData.tipo_accion ? (
              <>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Empleado <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    name="empleado_id"
                    value={formData.empleado_id}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                  >
                    <option value="">Seleccione un empleado</option>
                    {empleados.map(emp => (
                      <option key={emp.EmpleadoID} value={emp.EmpleadoID}>
                        {emp.Nombre} {emp.Apellido} - {emp.CEDULA}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.empleado_id && obtenerEmpleadoSeleccionado() && (
                  <div style={{
                    padding: '1rem',
                    background: '#f0f9ff',
                    borderRadius: '8px',
                    border: '1px solid #bfdbfe'
                  }}>
                    <p style={{ fontSize: '0.875rem', color: '#1e40af', margin: 0 }}>
                      <strong>Cargo Actual:</strong> {obtenerEmpleadoSeleccionado().NombrePuesto || obtenerEmpleadoSeleccionado().CARGO || 'N/A'}
                      {obtenerEmpleadoSeleccionado().Salario && (
                        <> • <strong>Salario:</strong> RD$ {parseFloat(obtenerEmpleadoSeleccionado().Salario).toLocaleString('es-DO')}</>
                      )}
                    </p>
                  </div>
                )}
              </>
            ) : null}

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Fecha Efectiva <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="date"
                name="fecha_efectiva"
                value={formData.fecha_efectiva}
                onChange={handleChange}
                required
                min={new Date().toISOString().split('T')[0]}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
            </div>

            {formData.tipo_accion && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                
                {mostrarCamposDepartamento() && (
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      {formData.tipo_accion === 'INGRESO' ? 'Departamento' : 'Nuevo Departamento'} 
                      {(formData.tipo_accion === 'CAMBIO_DEPTO' || formData.tipo_accion === 'INGRESO') && <span style={{ color: '#ef4444' }}>*</span>}
                    </label>
                    <select
                      name="departamento_nuevo"
                      value={formData.departamento_nuevo}
                      onChange={handleChange}
                      required={formData.tipo_accion === 'CAMBIO_DEPTO' || formData.tipo_accion === 'INGRESO'}
                      style={{
                        width: '100%',
                        padding: '0.625rem 0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        outline: 'none'
                      }}
                    >
                      <option value="">Seleccione</option>
                      {departamentos.map(dept => (
                        <option key={dept.DepartamentoID} value={dept.DepartamentoID}>
                          {dept.Nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {mostrarCamposPuesto() && (
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      {formData.tipo_accion === 'INGRESO' ? 'Puesto' : 'Nuevo Puesto'} 
                      {(formData.tipo_accion === 'CAMBIO_PUESTO' || formData.tipo_accion === 'INGRESO') && <span style={{ color: '#ef4444' }}>*</span>}
                    </label>
                    <select
                      name="puesto_nuevo"
                      value={formData.puesto_nuevo}
                      onChange={handleChange}
                      required={formData.tipo_accion === 'CAMBIO_PUESTO' || formData.tipo_accion === 'INGRESO'}
                      style={{
                        width: '100%',
                        padding: '0.625rem 0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        outline: 'none'
                      }}
                    >
                      <option value="">Seleccione</option>
                      {puestos.map(puesto => (
                        <option key={puesto.id} value={puesto.id}>
                          {puesto.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {mostrarCamposSalario() && (
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      {formData.tipo_accion === 'INGRESO' ? 'Salario (RD$)' : 'Nuevo Salario (RD$)'} 
                      {(formData.tipo_accion === 'AJUSTE_SALARIAL' || formData.tipo_accion === 'INGRESO') && <span style={{ color: '#ef4444' }}>*</span>}
                    </label>
                    <input
                      type="number"
                      name="salario_nuevo"
                      value={formData.salario_nuevo}
                      onChange={handleChange}
                      required={formData.tipo_accion === 'AJUSTE_SALARIAL' || formData.tipo_accion === 'INGRESO'}
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      style={{
                        width: '100%',
                        padding: '0.625rem 0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Justificación <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                name="justificacion"
                value={formData.justificacion}
                onChange={handleChange}
                required
                rows="4"
                placeholder="Describa la justificación de esta acción de personal..."
                style={{
                  width: '100%',
                  padding: '0.625rem 0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            </div>

          </div>

          <div style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '1rem',
            background: '#f9fafb'
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '0.625rem 1.25rem',
                background: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.625rem 1.25rem',
                background: loading ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 6px rgba(59, 130, 246, 0.3)'
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
                  Crear Acción
                </>
              )}
            </button>
          </div>
        </form>

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default NuevaAccion;