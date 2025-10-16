import React, { useState, useEffect } from 'react';
import { Save, X, AlertCircle, Upload } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://192.168.0.239:5000/api';

const FormularioIngreso = ({ tipo, onClose, onSuccess }) => {
  const [departamentos, setDepartamentos] = useState([]);
  const [supervisores, setSupervisores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    cedula: '',
    email: '',
    telefono: '',
    direccion: '',
    fechaNacimiento: '',
    genero: 'Masculino',
    estadoCivil: 'Soltero',
    cargo: '',
    departamentoId: '',
    salario: '',
    fechaIngreso: '',
    tipoContrato: 'Indefinido',
    jornada: 'Tiempo Completo',
    turno: 'Diurno',
    supervisorId: '',
    justificacion: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const token = localStorage.getItem('token');

      // Cargar departamentos
      const deptRes = await fetch(`${API_URL}/departamentos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const deptData = await deptRes.json();
      if (deptData.success) {
        setDepartamentos(deptData.departamentos);
      }

      // Cargar empleados activos para supervisores
      const empRes = await fetch(`${API_URL}/empleados`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const empData = await empRes.json();
      if (empData.success) {
        setSupervisores(empData.empleados.filter(e => e.Estado === 1));
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validarFormulario = () => {
    if (!formData.nombre || !formData.apellido || !formData.cedula) {
      setMensaje({ tipo: 'error', texto: 'Nombre, apellido y cédula son obligatorios' });
      return false;
    }
    if (!formData.email || !formData.telefono) {
      setMensaje({ tipo: 'error', texto: 'Email y teléfono son obligatorios' });
      return false;
    }
    if (!formData.cargo || !formData.departamentoId) {
      setMensaje({ tipo: 'error', texto: 'Cargo y departamento son obligatorios' });
      return false;
    }
    if (!formData.salario || parseFloat(formData.salario) <= 0) {
      setMensaje({ tipo: 'error', texto: 'Debe especificar un salario válido' });
      return false;
    }
    if (!formData.fechaIngreso) {
      setMensaje({ tipo: 'error', texto: 'Debe especificar la fecha de ingreso' });
      return false;
    }
    if (!formData.justificacion) {
      setMensaje({ tipo: 'error', texto: 'Debe incluir una justificación' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    try {
      setLoading(true);
      setMensaje({ tipo: '', texto: '' });

      const token = localStorage.getItem('token');

      const payload = {
        tipoAccion: tipo,
        empleadoId: null, // Es nuevo ingreso
        fechaEfectiva: formData.fechaIngreso,
        justificacion: formData.justificacion,
        datosNuevos: {
          nombre: formData.nombre,
          apellido: formData.apellido,
          cedula: formData.cedula,
          email: formData.email,
          telefono: formData.telefono,
          direccion: formData.direccion,
          fechaNacimiento: formData.fechaNacimiento || null,
          genero: formData.genero,
          estadoCivil: formData.estadoCivil,
          cargo: formData.cargo,
          departamentoId: parseInt(formData.departamentoId),
          salario: parseFloat(formData.salario),
          fechaIngreso: formData.fechaIngreso,
          tipoContrato: formData.tipoContrato,
          jornada: formData.jornada,
          turno: formData.turno,
          supervisorId: formData.supervisorId ? parseInt(formData.supervisorId) : null
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
        setMensaje({ tipo: 'success', texto: 'Acción de ingreso creada exitosamente' });
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setMensaje({ tipo: 'error', texto: data.message || 'Error al crear la acción' });
      }
    } catch (error) {
      console.error('Error:', error);
      setMensaje({ tipo: 'error', texto: 'Error al crear la acción de personal' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Mensajes */}
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

      {/* Información Personal */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: '#1f2937',
          marginBottom: '1rem',
          paddingBottom: '0.5rem',
          borderBottom: '2px solid #e5e7eb'
        }}>
          Información Personal
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Nombre <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
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

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Apellido <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              name="apellido"
              value={formData.apellido}
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

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Cédula <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              name="cedula"
              value={formData.cedula}
              onChange={handleChange}
              placeholder="000-0000000-0"
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

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Fecha de Nacimiento
            </label>
            <input
              type="date"
              name="fechaNacimiento"
              value={formData.fechaNacimiento}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.625rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Género
            </label>
            <select
              name="genero"
              value={formData.genero}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.625rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}
            >
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Estado Civil
            </label>
            <select
              name="estadoCivil"
              value={formData.estadoCivil}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.625rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}
            >
              <option value="Soltero">Soltero(a)</option>
              <option value="Casado">Casado(a)</option>
              <option value="Divorciado">Divorciado(a)</option>
              <option value="Viudo">Viudo(a)</option>
              <option value="Union Libre">Unión Libre</option>
            </select>
          </div>
        </div>
      </div>

      {/* Información de Contacto */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: '#1f2937',
          marginBottom: '1rem',
          paddingBottom: '0.5rem',
          borderBottom: '2px solid #e5e7eb'
        }}>
          Información de Contacto
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Email <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
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

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Teléfono <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              placeholder="(809) 000-0000"
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
              Dirección
            </label>
            <input
              type="text"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.625rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}
            />
          </div>
        </div>
      </div>

      {/* Información Laboral */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: '#1f2937',
          marginBottom: '1rem',
          paddingBottom: '0.5rem',
          borderBottom: '2px solid #e5e7eb'
        }}>
          Información Laboral
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Cargo <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              name="cargo"
              value={formData.cargo}
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

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Departamento <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              name="departamentoId"
              value={formData.departamentoId}
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
              Supervisor
            </label>
            <select
              name="supervisorId"
              value={formData.supervisorId}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.625rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}
            >
              <option value="">Sin supervisor asignado</option>
              {supervisores.map(sup => (
                <option key={sup.EmpleadoID} value={sup.EmpleadoID}>
                  {sup.NOMBRE} {sup.APELLIDO}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Salario <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="number"
              name="salario"
              value={formData.salario}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
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

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Fecha de Ingreso <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="date"
              name="fechaIngreso"
              value={formData.fechaIngreso}
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

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Tipo de Contrato
            </label>
            <select
              name="tipoContrato"
              value={formData.tipoContrato}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.625rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}
            >
              <option value="Indefinido">Indefinido</option>
              <option value="Temporal">Temporal</option>
              <option value="Por Proyecto">Por Proyecto</option>
              <option value="Prueba">Período de Prueba</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Jornada Laboral
            </label>
            <select
              name="jornada"
              value={formData.jornada}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.625rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}
            >
              <option value="Tiempo Completo">Tiempo Completo</option>
              <option value="Medio Tiempo">Medio Tiempo</option>
              <option value="Por Horas"></option><option value="Por Horas">Por Horas</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Turno
            </label>
            <select
              name="turno"
              value={formData.turno}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.625rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}
            >
              <option value="Diurno">Diurno (8am - 5pm)</option>
              <option value="Nocturno">Nocturno (8pm - 5am)</option>
              <option value="Rotativo">Rotativo</option>
              <option value="Mixto">Mixto</option>
            </select>
          </div>
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
          placeholder="Explique el motivo de esta contratación..."
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
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1.5rem',
            background: loading ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: '600',
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
              Crear Acción de Ingreso
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

export default FormularioIngreso;