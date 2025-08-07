import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Users, 
  Clock, 
  MapPin, 
  DollarSign, 
  Send, 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Upload,
  User,
  Mail,
  Phone,
  GraduationCap,
  Paperclip,
  X,
  Search,
  Building,
  Calendar,
  TrendingUp,
  BarChart3,
  Star
} from 'lucide-react';

// Datos simulados
const datosIniciales = {
  usuarios: [
    { id: 1, nombre: 'Juan Pérez', email: 'juan.perez@empresa.com', rol: 'colaborador', departamento: 'Tecnología' },
    { id: 2, nombre: 'María García', email: 'maria.garcia@empresa.com', rol: 'director', departamento: 'Marketing' },
    { id: 3, nombre: 'Ana López', email: 'ana.lopez@empresa.com', rol: 'rrhh', departamento: 'Recursos Humanos' }
  ],
  solicitudes: [
    {
      id: 1,
      cargo: 'Desarrollador Frontend Senior',
      departamento: 'Tecnología',
      solicitante: 'María García',
      fechaSolicitud: '2025-07-15',
      estado: 'Pendiente',
      justificacion: 'Expansión del equipo de desarrollo para nuevos proyectos',
      salarioMin: 80000,
      salarioMax: 120000,
      modalidad: 'Híbrido'
    },
    {
      id: 2,
      cargo: 'Especialista en Marketing Digital',
      departamento: 'Marketing',
      solicitante: 'Carlos Rodríguez',
      fechaSolicitud: '2025-07-18',
      estado: 'Aprobada',
      justificacion: 'Reemplazo por renuncia del titular',
      salarioMin: 60000,
      salarioMax: 85000,
      modalidad: 'Presencial'
    }
  ],
  vacantes: [
    {
      id: 1,
      solicitudId: 2,
      cargo: 'Especialista en Marketing Digital',
      departamento: 'Marketing',
      descripcion: 'Buscamos un especialista para gestionar nuestras estrategias de marketing digital y redes sociales.',
      requisitos: [
        'Licenciatura en Marketing o afines',
        'Mínimo 2 años de experiencia',
        'Conocimientos en Google Ads y Analytics',
        'Experiencia en redes sociales'
      ],
      beneficios: [
        'Seguro médico completo',
        'Flexibilidad horaria',
        'Capacitación continua',
        'Bonos por desempeño'
      ],
      fechaPublicacion: '2025-07-19',
      fechaCierre: '2025-08-19',
      salarioMin: 60000,
      salarioMax: 85000,
      modalidad: 'Presencial',
      ubicacion: 'Santo Domingo',
      estado: 'Activa',
      postulaciones: 8
    }
  ],
  postulaciones: [
    {
      id: 1,
      vacanteId: 1,
      nombre: 'Pedro Martínez',
      email: 'pedro.martinez@email.com',
      telefono: '(809) 555-0123',
      experiencia: '3 años en marketing digital en agencia publicitaria',
      educacion: 'Licenciatura en Marketing',
      expectativaSalarial: 70000,
      fechaPostulacion: '2025-07-20',
      estado: 'Recibida',
      tipoPostulante: 'Externo'
    }
  ]
};

// Componente principal
const SistemaVacantes = () => {
  // Estados principales
  const [usuarioActual, setUsuarioActual] = useState(datosIniciales.usuarios[0]);
  const [vistaActiva, setVistaActiva] = useState('vacantes');
  const [solicitudes, setSolicitudes] = useState(datosIniciales.solicitudes);
  const [vacantes, setVacantes] = useState(datosIniciales.vacantes);
  const [postulaciones, setPostulaciones] = useState(datosIniciales.postulaciones);
  
  // Estados de modales
  const [modalSolicitud, setModalSolicitud] = useState(false);
  const [modalPostulacion, setModalPostulacion] = useState(false);
  const [vacanteSeleccionada, setVacanteSeleccionada] = useState(null);

  // Funciones de navegación
  const cambiarVista = (vista) => setVistaActiva(vista);
  const cambiarUsuario = (usuario) => setUsuarioActual(usuario);

  // Renderizar contenido según la vista activa
  const renderContenido = () => {
    switch (vistaActiva) {
      case 'vacantes':
        return <VistaVacantes 
          vacantes={vacantes} 
          onPostularse={(vacante) => {
            setVacanteSeleccionada(vacante);
            setModalPostulacion(true);
          }}
        />;
      case 'solicitudes':
        return <VistaSolicitudes 
          solicitudes={solicitudes}
          usuarioActual={usuarioActual}
          onCrearSolicitud={() => setModalSolicitud(true)}
          onAprobar={(id) => aprobarSolicitud(id)}
          onRechazar={(id) => rechazarSolicitud(id)}
        />;
      case 'postulaciones':
        return <VistaPostulaciones 
          postulaciones={postulaciones}
          usuarioActual={usuarioActual}
        />;
      case 'reportes':
        return <VistaReportes 
          solicitudes={solicitudes}
          vacantes={vacantes}
          postulaciones={postulaciones}
        />;
      default:
        return <VistaVacantes vacantes={vacantes} />;
    }
  };

  // Funciones de acción
  const aprobarSolicitud = (id) => {
    setSolicitudes(prev => prev.map(s => 
      s.id === id ? { ...s, estado: 'Aprobada' } : s
    ));
  };

  const rechazarSolicitud = (id) => {
    setSolicitudes(prev => prev.map(s => 
      s.id === id ? { ...s, estado: 'Rechazada' } : s
    ));
  };

  const crearSolicitud = (datos) => {
    const nuevaSolicitud = {
      id: Date.now(),
      ...datos,
      solicitante: usuarioActual.nombre,
      fechaSolicitud: new Date().toISOString().split('T')[0],
      estado: 'Pendiente'
    };
    setSolicitudes(prev => [...prev, nuevaSolicitud]);
    setModalSolicitud(false);
  };

  const crearPostulacion = (datos) => {
    const nuevaPostulacion = {
      id: Date.now(),
      vacanteId: vacanteSeleccionada.id,
      ...datos,
      fechaPostulacion: new Date().toISOString().split('T')[0],
      estado: 'Recibida',
      tipoPostulante: usuarioActual.rol === 'colaborador' ? 'Interno' : 'Externo'
    };
    setPostulaciones(prev => [...prev, nuevaPostulacion]);
    setVacantes(prev => prev.map(v => 
      v.id === vacanteSeleccionada.id 
        ? { ...v, postulaciones: v.postulaciones + 1 }
        : v
    ));
    setModalPostulacion(false);
    setVacanteSeleccionada(null);
  };

  // Obtener vistas disponibles según el rol
  const obtenerVistas = () => {
    const vistas = [
      { id: 'vacantes', nombre: 'Vacantes Disponibles', icono: Briefcase }
    ];

    if (usuarioActual.rol === 'director') {
      vistas.push({ id: 'solicitudes', nombre: 'Mis Solicitudes', icono: FileText });
    }

    if (usuarioActual.rol === 'rrhh') {
      vistas.push(
        { id: 'solicitudes', nombre: 'Gestionar Solicitudes', icono: FileText },
        { id: 'postulaciones', nombre: 'Postulaciones', icono: Users },
        { id: 'reportes', nombre: 'Reportes', icono: BarChart3 }
      );
    }

    if (usuarioActual.rol === 'colaborador') {
      vistas.push({ id: 'postulaciones', nombre: 'Mis Postulaciones', icono: Send });
    }

    return vistas;
  };

  const vistas = obtenerVistas();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', marginBottom: '1.5rem' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', 
          color: 'white', 
          padding: '1.5rem', 
          borderRadius: '0.5rem 0.5rem 0 0' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Briefcase size={40} />
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Sistema de Vacantes</h1>
                <p style={{ opacity: 0.9, margin: 0 }}>Gestión integral de oportunidades laborales</p>
              </div>
            </div>
            
            {/* Selector de usuario */}
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '0.5rem', padding: '0.75rem' }}>
              <select 
                value={usuarioActual.id}
                onChange={(e) => cambiarUsuario(datosIniciales.usuarios.find(u => u.id === parseInt(e.target.value)))}
                style={{
                  backgroundColor: 'transparent',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.25rem',
                  padding: '0.5rem 0.75rem'
                }}
              >
                {datosIniciales.usuarios.map(usuario => (
                  <option key={usuario.id} value={usuario.id} style={{ color: '#1f2937' }}>
                    {usuario.nombre} ({usuario.rol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stats rápidas */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem', 
            marginTop: '1.5rem' 
          }}>
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '0.5rem', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Briefcase size={20} />
                <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>Vacantes Activas</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{vacantes.filter(v => v.estado === 'Activa').length}</div>
            </div>
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '0.5rem', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Clock size={20} />
                <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>Solicitudes Pendientes</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{solicitudes.filter(s => s.estado === 'Pendiente').length}</div>
            </div>
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '0.5rem', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Users size={20} />
                <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>Total Postulaciones</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{postulaciones.length}</div>
            </div>
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '0.5rem', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <TrendingUp size={20} />
                <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>Tasa Aprobación</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {solicitudes.length > 0 ? Math.round((solicitudes.filter(s => s.estado === 'Aprobada').length / solicitudes.length) * 100) : 0}%
              </div>
            </div>
          </div>
        </div>

        {/* Navegación */}
        <div style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
          <div style={{ display: 'flex', overflowX: 'auto' }}>
            {vistas.map(vista => {
              const Icono = vista.icono;
              const activo = vistaActiva === vista.id;
              return (
                <button
                  key={vista.id}
                  onClick={() => cambiarVista(vista.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '1rem 1.5rem',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: activo ? '#3b82f6' : '#6b7280',
                    borderBottom: `2px solid ${activo ? '#3b82f6' : 'transparent'}`,
                    cursor: 'pointer',
                    fontWeight: activo ? '600' : '400',
                    whiteSpace: 'nowrap',
                    fontSize: '0.875rem'
                  }}
                >
                  <Icono size={18} />
                  {vista.nombre}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ padding: '1.5rem' }}>
          {renderContenido()}
        </div>
      </div>

      {/* Modales */}
      {modalSolicitud && (
        <ModalSolicitud 
          onClose={() => setModalSolicitud(false)}
          onGuardar={crearSolicitud}
        />
      )}

      {modalPostulacion && (
        <ModalPostulacion 
          vacante={vacanteSeleccionada}
          usuarioActual={usuarioActual}
          onClose={() => {
            setModalPostulacion(false);
            setVacanteSeleccionada(null);
          }}
          onGuardar={crearPostulacion}
        />
      )}
    </div>
  );
};

// Vista de Vacantes Disponibles
const VistaVacantes = ({ vacantes, onPostularse }) => {
  const [filtro, setFiltro] = useState('');

  const vacantesFiltradas = vacantes.filter(v => 
    v.cargo.toLowerCase().includes(filtro.toLowerCase()) ||
    v.departamento.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Vacantes Disponibles</h2>
          <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0' }}>Explora las oportunidades laborales disponibles</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={20} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="Buscar vacantes..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              style={{
                paddingLeft: '2.5rem',
                paddingRight: '1rem',
                paddingTop: '0.5rem',
                paddingBottom: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                outline: 'none',
                fontSize: '0.875rem'
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {vacantesFiltradas.map(vacante => (
          <TarjetaVacante 
            key={vacante.id} 
            vacante={vacante} 
            onPostularse={onPostularse}
          />
        ))}
      </div>

      {vacantesFiltradas.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <Briefcase size={48} style={{ margin: '0 auto 1rem', color: '#9ca3af' }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: '500', color: '#1f2937', marginBottom: '0.5rem' }}>No hay vacantes disponibles</h3>
          <p style={{ color: '#6b7280' }}>
            {filtro ? 'No se encontraron vacantes que coincidan con tu búsqueda' : 'No hay vacantes publicadas en este momento'}
          </p>
        </div>
      )}
    </div>
  );
};

// Componente Tarjeta de Vacante
const TarjetaVacante = ({ vacante, onPostularse }) => {
  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: '0.5rem',
      padding: '1.5rem',
      transition: 'box-shadow 0.2s',
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = 'none';
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', margin: '0 0 0.5rem 0' }}>{vacante.cargo}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.75rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Building size={14} />
              {vacante.departamento}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <MapPin size={14} />
              {vacante.ubicacion}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Users size={14} />
              {vacante.postulaciones} postulaciones
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#059669' }}>
            RD${vacante.salarioMin?.toLocaleString()} - RD${vacante.salarioMax?.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{vacante.modalidad}</div>
        </div>
      </div>

      <p style={{ color: '#374151', marginBottom: '1rem', lineHeight: '1.5' }}>{vacante.descripcion}</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <h4 style={{ fontWeight: '500', color: '#1f2937', margin: '0 0 0.5rem 0' }}>Requisitos:</h4>
          <ul style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0, paddingLeft: 0, listStyle: 'none' }}>
            {vacante.requisitos.slice(0, 3).map((req, index) => (
              <li key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{ width: '6px', height: '6px', backgroundColor: '#3b82f6', borderRadius: '50%', marginTop: '0.5rem', flexShrink: 0 }}></span>
                {req}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 style={{ fontWeight: '500', color: '#1f2937', margin: '0 0 0.5rem 0' }}>Beneficios:</h4>
          <ul style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0, paddingLeft: 0, listStyle: 'none' }}>
            {vacante.beneficios.slice(0, 3).map((beneficio, index) => (
              <li key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{ width: '6px', height: '6px', backgroundColor: '#10b981', borderRadius: '50%', marginTop: '0.5rem', flexShrink: 0 }}></span>
                {beneficio}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid #f3f4f6' }}>
        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          Publicado: {new Date(vacante.fechaPublicacion).toLocaleDateString()}
        </div>
        <button
          onClick={() => onPostularse(vacante)}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '0.5rem 1.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#3b82f6';
          }}
        >
          <Send size={16} />
          Postularme
        </button>
      </div>
    </div>
  );
};

// Vista de Solicitudes
const VistaSolicitudes = ({ solicitudes, usuarioActual, onCrearSolicitud, onAprobar, onRechazar }) => {
  const solicitudesFiltradas = usuarioActual.rol === 'director' 
    ? solicitudes.filter(s => s.solicitante === usuarioActual.nombre)
    : solicitudes;

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Pendiente': return { backgroundColor: '#fef3c7', color: '#92400e' };
      case 'Aprobada': return { backgroundColor: '#d1fae5', color: '#065f46' };
      case 'Rechazada': return { backgroundColor: '#fee2e2', color: '#991b1b' };
      default: return { backgroundColor: '#f3f4f6', color: '#374151' };
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
            {usuarioActual.rol === 'director' ? 'Mis Solicitudes' : 'Gestionar Solicitudes'}
          </h2>
          <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0' }}>
            {usuarioActual.rol === 'director' 
              ? 'Solicitudes de vacantes para tu departamento' 
              : 'Todas las solicitudes de vacantes pendientes de aprobación'
            }
          </p>
        </div>
        
        {usuarioActual.rol === 'director' && (
          <button
            onClick={onCrearSolicitud}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            <Plus size={16} />
            Nueva Solicitud
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {solicitudesFiltradas.map(solicitud => (
          <div key={solicitud.id} style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>{solicitud.cargo}</h3>
                <p style={{ color: '#6b7280', margin: '0.25rem 0 0 0' }}>{solicitud.departamento}</p>
              </div>
              <span style={{
                ...getEstadoColor(solicitud.estado),
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                {solicitud.estado}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>Solicitante:</p>
                <p style={{ fontWeight: '500', margin: 0 }}>{solicitud.solicitante}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>Fecha de Solicitud:</p>
                <p style={{ fontWeight: '500', margin: 0 }}>{new Date(solicitud.fechaSolicitud).toLocaleDateString()}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>Rango Salarial:</p>
                <p style={{ fontWeight: '500', margin: 0 }}>RD${solicitud.salarioMin?.toLocaleString()} - RD${solicitud.salarioMax?.toLocaleString()}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>Modalidad:</p>
                <p style={{ fontWeight: '500', margin: 0 }}>{solicitud.modalidad}</p>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>Justificación:</p>
              <p style={{ color: '#1f2937', margin: 0 }}>{solicitud.justificacion}</p>
            </div>

            {usuarioActual.rol === 'rrhh' && solicitud.estado === 'Pendiente' && (
              <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #f3f4f6' }}>
                <button
                  onClick={() => onAprobar(solicitud.id)}
                  style={{
                    backgroundColor: '#10b981',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                >
                  <CheckCircle size={16} />
                  Aprobar
                </button>
                <button
                  onClick={() => onRechazar(solicitud.id)}
                  style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                >
                  <XCircle size={16} />
                  Rechazar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {solicitudesFiltradas.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <FileText size={48} style={{ margin: '0 auto 1rem', color: '#9ca3af' }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: '500', color: '#1f2937', marginBottom: '0.5rem' }}>No hay solicitudes</h3>
          <p style={{ color: '#6b7280' }}>
            {usuarioActual.rol === 'director' 
              ? 'No has creado ninguna solicitud aún' 
              : 'No hay solicitudes pendientes de revisión'
            }
          </p>
        </div>
      )}
    </div>
  );
};

// Vista de Postulaciones
const VistaPostulaciones = ({ postulaciones, usuarioActual }) => {
  const postulacionesFiltradas = usuarioActual.rol === 'colaborador'
    ? postulaciones.filter(p => p.email === usuarioActual.email)
    : postulaciones;

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Recibida': return { backgroundColor: '#dbeafe', color: '#1e40af' };
      case 'En Revisión': return { backgroundColor: '#fef3c7', color: '#92400e' };
      case 'Entrevista': return { backgroundColor: '#e0e7ff', color: '#5b21b6' };
      case 'Aprobada': return { backgroundColor: '#d1fae5', color: '#065f46' };
      case 'Rechazada': return { backgroundColor: '#fee2e2', color: '#991b1b' };
      default: return { backgroundColor: '#f3f4f6', color: '#374151' };
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
          {usuarioActual.rol === 'colaborador' ? 'Mis Postulaciones' : 'Gestionar Postulaciones'}
        </h2>
        <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0' }}>
          {usuarioActual.rol === 'colaborador'
            ? 'Seguimiento de tus postulaciones a vacantes'
            : 'Todas las postulaciones recibidas'
          }
        </p>
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {postulacionesFiltradas.map(postulacion => (
          <div key={postulacion.id} style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: '0 0 0.25rem 0', color: '#1f2937' }}>{postulacion.nombre}</h3>
                <p style={{ color: '#6b7280', margin: 0 }}>{postulacion.email}</p>
              </div>
              <span style={{
                ...getEstadoColor(postulacion.estado),
                padding: '0.5rem 1rem',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                {postulacion.estado}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>Teléfono:</p>
                <p style={{ fontWeight: '500', margin: 0 }}>{postulacion.telefono}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>Fecha:</p>
                <p style={{ fontWeight: '500', margin: 0 }}>{new Date(postulacion.fechaPostulacion).toLocaleDateString()}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>Educación:</p>
                <p style={{ fontWeight: '500', margin: 0 }}>{postulacion.educacion}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>Expectativa Salarial:</p>
                <p style={{ fontWeight: '500', margin: 0 }}>RD${postulacion.expectativaSalarial?.toLocaleString()}</p>
              </div>
            </div>

            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>Experiencia:</p>
              <p style={{ color: '#1f2937', margin: 0 }}>{postulacion.experiencia}</p>
            </div>
          </div>
        ))}
      </div>

      {postulacionesFiltradas.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <Users size={48} style={{ margin: '0 auto 1rem', color: '#9ca3af' }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: '500', color: '#1f2937', marginBottom: '0.5rem' }}>No hay postulaciones</h3>
          <p style={{ color: '#6b7280' }}>
            {usuarioActual.rol === 'colaborador'
              ? 'No has enviado ninguna postulación aún'
              : 'No se han recibido postulaciones'
            }
          </p>
        </div>
      )}
    </div>
  );
};

// Vista de Reportes
const VistaReportes = ({ solicitudes, vacantes, postulaciones }) => {
  const stats = {
    totalSolicitudes: solicitudes.length,
    solicitudesPendientes: solicitudes.filter(s => s.estado === 'Pendiente').length,
    solicitudesAprobadas: solicitudes.filter(s => s.estado === 'Aprobada').length,
    vacantesActivas: vacantes.filter(v => v.estado === 'Activa').length,
    totalPostulaciones: postulaciones.length,
    postulacionesInternas: postulaciones.filter(p => p.tipoPostulante === 'Interno').length
  };

  const StatsCard = ({ titulo, valor, descripcion, icono: Icono, color }) => (
    <div style={{
      backgroundColor: `${color}10`,
      border: `1px solid ${color}30`,
      borderRadius: '0.5rem',
      padding: '1.5rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <Icono size={24} style={{ color }} />
        <h3 style={{ fontWeight: '600', color: `${color}`, fontSize: '0.875rem', margin: 0 }}>{titulo}</h3>
      </div>
      <p style={{ fontSize: '3rem', fontWeight: 'bold', color, margin: 0 }}>{valor}</p>
      <p style={{ fontSize: '0.875rem', color: `${color}CC`, margin: '0.25rem 0 0 0' }}>{descripcion}</p>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Reportes y Analytics</h2>
        <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0' }}>Métricas y estadísticas del sistema de vacantes</p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '1.5rem', 
        marginBottom: '2rem' 
      }}>
        <StatsCard
          titulo="Total Solicitudes"
          valor={stats.totalSolicitudes}
          descripcion={`${stats.solicitudesPendientes} pendientes`}
          icono={FileText}
          color="#3b82f6"
        />
        <StatsCard
          titulo="Vacantes Activas"
          valor={stats.vacantesActivas}
          descripcion={`De ${vacantes.length} total`}
          icono={Briefcase}
          color="#10b981"
        />
        <StatsCard
          titulo="Postulaciones"
          valor={stats.totalPostulaciones}
          descripcion={`${stats.postulacionesInternas} internas`}
          icono={Users}
          color="#8b5cf6"
        />
        <StatsCard
          titulo="Tasa de Aprobación"
          valor={`${stats.totalSolicitudes > 0 ? Math.round((stats.solicitudesAprobadas / stats.totalSolicitudes) * 100) : 0}%`}
          descripcion={`${stats.solicitudesAprobadas} de ${stats.totalSolicitudes}`}
          icono={TrendingUp}
          color="#f59e0b"
        />
        <StatsCard
          titulo="Tiempo Promedio"
          valor="5.2"
          descripcion="días para aprobación"
          icono={Clock}
          color="#6366f1"
        />
        <StatsCard
          titulo="Satisfacción"
          valor="4.8"
          descripcion="de 5.0 estrellas"
          icono={Star}
          color="#ec4899"
        />
      </div>

      <div style={{
        backgroundColor: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        padding: '1.5rem'
      }}>
        <h3 style={{ fontWeight: '600', color: '#1f2937', margin: '0 0 1rem 0' }}>Acciones de Reporte</h3>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem'
          }}>
            <Download size={16} />
            Exportar Excel
          </button>
          <button style={{
            backgroundColor: '#10b981',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem'
          }}>
            <FileText size={16} />
            Generar PDF
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal para Nueva Solicitud
const ModalSolicitud = ({ onClose, onGuardar }) => {
  const [datos, setDatos] = useState({
    cargo: '',
    departamento: '',
    justificacion: '',
    salarioMin: '',
    salarioMax: '',
    modalidad: 'Presencial'
  });

  const handleSubmit = () => {
    if (datos.cargo && datos.departamento && datos.justificacion && datos.salarioMin && datos.salarioMax) {
      onGuardar(datos);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        padding: '1.5rem',
        width: '100%',
        maxWidth: '28rem',
        margin: '1rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>Nueva Solicitud de Vacante</h3>
          <button onClick={onClose} style={{ 
            border: 'none', 
            background: 'none', 
            cursor: 'pointer', 
            color: '#9ca3af' 
          }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Cargo</label>
            <input
              type="text"
              value={datos.cargo}
              onChange={(e) => setDatos({...datos, cargo: e.target.value})}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                outline: 'none',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Departamento</label>
            <input
              type="text"
              value={datos.departamento}
              onChange={(e) => setDatos({...datos, departamento: e.target.value})}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                outline: 'none',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Salario Mín. (RD$)</label>
              <input
                type="number"
                value={datos.salarioMin}
                onChange={(e) => setDatos({...datos, salarioMin: parseInt(e.target.value)})}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  outline: 'none',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Salario Máx. (RD$)</label>
              <input
                type="number"
                value={datos.salarioMax}
                onChange={(e) => setDatos({...datos, salarioMax: parseInt(e.target.value)})}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  outline: 'none',
                  fontSize: '0.875rem'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Modalidad</label>
            <select
              value={datos.modalidad}
              onChange={(e) => setDatos({...datos, modalidad: e.target.value})}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                outline: 'none',
                fontSize: '0.875rem'
              }}
            >
              <option value="Presencial">Presencial</option>
              <option value="Remoto">Remoto</option>
              <option value="Híbrido">Híbrido</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Justificación</label>
            <textarea
              rows={3}
              value={datos.justificacion}
              onChange={(e) => setDatos({...datos, justificacion: e.target.value})}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                outline: 'none',
                fontSize: '0.875rem',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '1rem' }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '0.5rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                backgroundColor: 'white',
                color: '#374151',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              style={{
                flex: 1,
                padding: '0.5rem 1rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Crear Solicitud
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal para Postulación
const ModalPostulacion = ({ vacante, usuarioActual, onClose, onGuardar }) => {
  const [datos, setDatos] = useState({
    nombre: usuarioActual?.nombre || '',
    email: usuarioActual?.email || '',
    telefono: '',
    experiencia: '',
    educacion: '',
    expectativaSalarial: ''
  });

  const handleSubmit = () => {
    if (datos.nombre && datos.email && datos.telefono && datos.experiencia) {
      onGuardar(datos);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        padding: '1.5rem',
        width: '100%',
        maxWidth: '28rem',
        margin: '1rem',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>Postular a: {vacante?.cargo}</h3>
          <button onClick={onClose} style={{ 
            border: 'none', 
            background: 'none', 
            cursor: 'pointer', 
            color: '#9ca3af' 
          }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Nombre Completo</label>
            <input
              type="text"
              value={datos.nombre}
              onChange={(e) => setDatos({...datos, nombre: e.target.value})}
              disabled={usuarioActual?.rol === 'colaborador'}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                outline: 'none',
                fontSize: '0.875rem',
                backgroundColor: usuarioActual?.rol === 'colaborador' ? '#f9fafb' : 'white'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Correo Electrónico</label>
            <input
              type="email"
              value={datos.email}
              onChange={(e) => setDatos({...datos, email: e.target.value})}
              disabled={usuarioActual?.rol === 'colaborador'}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                outline: 'none',
                fontSize: '0.875rem',
                backgroundColor: usuarioActual?.rol === 'colaborador' ? '#f9fafb' : 'white'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Teléfono</label>
            <input
              type="tel"
              value={datos.telefono}
              onChange={(e) => setDatos({...datos, telefono: e.target.value})}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                outline: 'none',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Nivel Educativo</label>
            <select
              value={datos.educacion}
              onChange={(e) => setDatos({...datos, educacion: e.target.value})}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                outline: 'none',
                fontSize: '0.875rem'
              }}
            >
              <option value="">Seleccionar...</option>
              <option value="Secundario">Secundario</option>
              <option value="Técnico">Técnico</option>
              <option value="Universitario">Universitario</option>
              <option value="Postgrado">Postgrado</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Expectativa Salarial (RD$)</label>
            <input
              type="number"
              value={datos.expectativaSalarial}
              onChange={(e) => setDatos({...datos, expectativaSalarial: parseInt(e.target.value)})}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                outline: 'none',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Experiencia Relevante</label>
            <textarea
              rows={3}
              value={datos.experiencia}
              onChange={(e) => setDatos({...datos, experiencia: e.target.value})}
              placeholder="Describe tu experiencia relevante para esta posición..."
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                outline: 'none',
                fontSize: '0.875rem',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '1rem' }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '0.5rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                backgroundColor: 'white',
                color: '#374151',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              style={{
                flex: 1,
                padding: '0.5rem 1rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <Send size={16} />
              Enviar Postulación
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SistemaVacantes;