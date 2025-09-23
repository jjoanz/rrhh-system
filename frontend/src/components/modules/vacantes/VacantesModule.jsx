import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import vacantesService from '../../../api/vacantesService';


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
  Star,
  Loader
} from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://192.168.0.239:5000/api';



// Componente principal
const VacantesModule = () => {
  const { user, loading, getStoredToken } = useAuth();
  const [vistaActiva, setVistaActiva] = useState('vacantes');
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [solicitudes, setSolicitudes] = useState([]);
  const [vacantes, setVacantes] = useState([]);
  const [postulaciones, setPostulaciones] = useState([]);
  const [estadisticas, setEstadisticas] = useState({
    vacantesActivas: 0,
    solicitudesPendientes: 0,
    totalPostulaciones: 0,
    tasaAprobacion: 0
  });
  const [departamentos, setDepartamentos] = useState([]);
  
  const [modalSolicitud, setModalSolicitud] = useState(false);
  const [modalPostulacion, setModalPostulacion] = useState(false);
  const [vacanteSeleccionada, setVacanteSeleccionada] = useState(null);

  // Debug
  useEffect(() => {
    const token = getStoredToken();
    console.log('Estado del usuario:', user);
    console.log('Token disponible:', token ? 'SÍ' : 'NO');
    console.log('Loading:', loading);
  }, [user, loading, getStoredToken]);

  useEffect(() => {
    if (!loading) {
      // Cargar datos independientemente del usuario para mostrar vacantes públicas
      cargarDatosIniciales();
      
      if (user) {
        cargarDatosPorUsuario();
      }
    }
  }, [user, loading]);

  const cargarDatosIniciales = async () => {
    try {
      setLoadingData(true);
      setError(null);

      console.log('Cargando datos iniciales...');

      // Intentar cargar datos del servicio real
      try {
        const [vacantesData, departamentosData, estadisticasData] = await Promise.all([
          vacantesService.getVacantesActivas(),
          vacantesService.getDepartamentos(),
          vacantesService.getEstadisticas()
        ]);

        setVacantes(vacantesData || []);
        setDepartamentos(departamentosData || []);
        setEstadisticas(estadisticasData || {
          vacantesActivas: 0,
          solicitudesPendientes: 0,
          totalPostulaciones: 0,
          tasaAprobacion: 0
        });

        console.log('Datos cargados exitosamente');
      } catch (apiError) {
        console.warn('Error con API real, usando datos mock:', apiError);
        
        // Usar datos mock si la API falla
        setVacantes([
          {
            id: 1,
            cargo: 'Desarrollador Frontend Senior',
            departamento: 'Tecnología',
            descripcion: 'Buscamos un desarrollador frontend senior con experiencia en React y TypeScript.',
            requisitos: ['3+ años en React', 'TypeScript', 'Git'],
            beneficios: ['Seguro médico', 'Trabajo remoto', 'Capacitación'],
            salarioMin: 80000,
            salarioMax: 120000,
            ubicacion: 'Santo Domingo',
            modalidad: 'Híbrido',
            postulaciones: 5,
            fechaPublicacion: '2025-01-15'
          },
          {
            id: 2,
            cargo: 'Analista de RRHH',
            departamento: 'Recursos Humanos',
            descripcion: 'Profesional para apoyar en procesos de reclutamiento y selección.',
            requisitos: ['Licenciatura en RRHH', 'Excel avanzado', 'Inglés'],
            beneficios: ['Seguro médico', 'Flexibilidad horaria', 'Bonos'],
            salarioMin: 60000,
            salarioMax: 85000,
            ubicacion: 'Santo Domingo',
            modalidad: 'Presencial',
            postulaciones: 8,
            fechaPublicacion: '2025-01-10'
          }
        ]);
        
        setDepartamentos([
          { id: 1, nombre: 'Tecnología', descripcion: 'Desarrollo y sistemas' },
          { id: 2, nombre: 'Recursos Humanos', descripcion: 'RRHH y talento humano' },
          { id: 3, nombre: 'Finanzas', descripcion: 'Gestión financiera' },
          { id: 4, nombre: 'Marketing', descripcion: 'Marketing y ventas' }
        ]);
        
        setEstadisticas({
          vacantesActivas: 2,
          solicitudesPendientes: 1,
          totalPostulaciones: 13,
          tasaAprobacion: 65
        });
        
        setError('Usando datos de demostración. Verifica la conexión al servidor.');
      }

    } catch (err) {
      console.error('Error crítico al cargar datos:', err);
      setError('Error al cargar el sistema. Por favor, recarga la página.');
    } finally {
      setLoadingData(false);
    }
  };

  const cargarDatosPorUsuario = async () => {
    if (!user) return;
    
    try {
      const [solicitudesData, postulacionesData] = await Promise.all([
        vacantesService.getSolicitudes(user.id, user.role),
        vacantesService.getPostulaciones(user.id, user.role)
      ]);

      setSolicitudes(solicitudesData);
      setPostulaciones(postulacionesData);
    } catch (err) {
      console.error('Error al cargar datos del usuario:', err);
      setSolicitudes([]);
      setPostulaciones([]);
    }
  };

  const mostrarExito = (mensaje) => {
    setSuccess(mensaje);
    setTimeout(() => setSuccess(null), 5000);
  };

  const aprobarSolicitud = async (id) => {
    try {
      await vacantesService.aprobarSolicitud(id, 'Solicitud aprobada desde el sistema');
      setSolicitudes(prev => prev.map(s => 
        s.id === id ? { ...s, estado: 'Aprobada' } : s
      ));
      
      const [nuevasVacantes, nuevasEstadisticas] = await Promise.all([
        vacantesService.getVacantesActivas(),
        vacantesService.getEstadisticas()
      ]);
      setVacantes(nuevasVacantes);
      setEstadisticas(nuevasEstadisticas);
      mostrarExito('Solicitud aprobada exitosamente');
    } catch (err) {
      console.error('Error al aprobar solicitud:', err);
      setError('Error al aprobar la solicitud');
    }
  };

  const rechazarSolicitud = async (id) => {
    try {
      await vacantesService.rechazarSolicitud(id, 'Solicitud rechazada');
      setSolicitudes(prev => prev.map(s => 
        s.id === id ? { ...s, estado: 'Rechazada' } : s
      ));
      mostrarExito('Solicitud rechazada exitosamente');
    } catch (err) {
      console.error('Error al rechazar solicitud:', err);
      setError('Error al rechazar la solicitud');
    }
  };

  const crearSolicitud = async (datos) => {
    try {
      const nuevaSolicitud = await vacantesService.crearSolicitud({
        ...datos,
        usuarioID: user.id
      });
      setSolicitudes(prev => [...prev, nuevaSolicitud]);
      setModalSolicitud(false);
      mostrarExito('Solicitud creada exitosamente');
    } catch (err) {
      console.error('Error al crear solicitud:', err);
      setError('Error al crear la solicitud');
    }
  };

  const crearPostulacion = async (datos) => {
    try {
      const nuevaPostulacion = await vacantesService.crearPostulacion({
        ...datos,
        vacanteId: vacanteSeleccionada.id,
        empleadoID: user.empleadoId
      });
      
      setPostulaciones(prev => [...prev, nuevaPostulacion]);
      setVacantes(prev => prev.map(v => 
        v.id === vacanteSeleccionada.id 
          ? { ...v, postulaciones: (v.postulaciones || 0) + 1 }
          : v
      ));
      
      setModalPostulacion(false);
      setVacanteSeleccionada(null);
      
      const nuevasEstadisticas = await vacantesService.getEstadisticas();
      setEstadisticas(nuevasEstadisticas);
      mostrarExito('Postulación enviada exitosamente');
    } catch (err) {
      console.error('Error al crear postulación:', err);
      setError('Error al enviar la postulación');
    }
  };

  const obtenerVistas = () => {
    if (!user) return [];

    const vistas = [
      { id: 'vacantes', nombre: 'Vacantes Disponibles', icono: Briefcase }
    ];

    if (user.role === 'director') {
      vistas.push({ id: 'solicitudes', nombre: 'Mis Solicitudes', icono: FileText });
    }

    if (user.role === 'rrhh' || user.role === 'admin') {
      vistas.push(
        { id: 'solicitudes', nombre: 'Gestionar Solicitudes', icono: FileText },
        { id: 'postulaciones', nombre: 'Postulaciones', icono: Users }
      );
    }

    if (user.role === 'colaborador' || user.role === 'empleado') {
      vistas.push({ id: 'postulaciones', nombre: 'Mis Postulaciones', icono: Send });
    }

    return vistas;
  };

  const renderContenido = () => {
    if (loadingData) {
      return <LoadingSpinner />;
    }

    if (error) {
      return <ErrorMessage error={error} onRetry={cargarDatosIniciales} />;
    }

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
          usuarioActual={user}
          onCrearSolicitud={() => setModalSolicitud(true)}
          onAprobar={aprobarSolicitud}
          onRechazar={rechazarSolicitud}
        />;
      case 'postulaciones':
        return <VistaPostulaciones 
          postulaciones={postulaciones}
          usuarioActual={user}
        />;
      default:
        return <VistaVacantes vacantes={vacantes} />;
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '300px', 
        flexDirection: 'column', 
        gap: '1rem' 
      }}>
        <AlertCircle size={48} style={{ color: '#dc2626' }} />
        <p style={{ color: '#dc2626', textAlign: 'center' }}>
          No hay usuario autenticado. Por favor, inicia sesión.
        </p>
      </div>
    );
  }

  const vistas = obtenerVistas();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '1.5rem' }}>
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
            
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '0.5rem', padding: '0.75rem' }}>
              <div style={{ color: 'white', fontSize: '0.875rem' }}>
                <div style={{ fontWeight: '600' }}>{user.name}</div>
                <div style={{ opacity: 0.8, textTransform: 'capitalize' }}>{user.role}</div>
              </div>
            </div>
          </div>

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
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {loadingData ? <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} /> : (estadisticas.vacantesActivas || 0)}
              </div>
            </div>
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '0.5rem', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Clock size={20} />
                <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>Solicitudes Pendientes</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {loadingData ? <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} /> : (estadisticas.solicitudesPendientes || 0)}
              </div>
            </div>
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '0.5rem', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Users size={20} />
                <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>Total Postulaciones</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {loadingData ? <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} /> : (estadisticas.totalPostulaciones || 0)}
              </div>
            </div>
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '0.5rem', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <TrendingUp size={20} />
                <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>Tasa Aprobación</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {loadingData ? <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} /> : `${estadisticas.tasaAprobacion || 0}%`}
              </div>
            </div>
          </div>
        </div>

        <div style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
          <div style={{ display: 'flex', overflowX: 'auto' }}>
            {vistas.map(vista => {
              const Icono = vista.icono;
              const activo = vistaActiva === vista.id;
              return (
                <button
                  key={vista.id}
                  onClick={() => setVistaActiva(vista.id)}
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

      <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ padding: '1.5rem' }}>
          {renderContenido()}
        </div>
      </div>

      {modalSolicitud && (
        <ModalSolicitud 
          onClose={() => setModalSolicitud(false)}
          onGuardar={crearSolicitud}
          departamentos={departamentos}
        />
      )}

      {modalPostulacion && (
        <ModalPostulacion 
          vacante={vacanteSeleccionada}
          usuarioActual={user}
          onClose={() => {
            setModalPostulacion(false);
            setVacanteSeleccionada(null);
          }}
          onGuardar={crearPostulacion}
        />
      )}

      {error && (
        <NotificationMessage 
          type="error" 
          message={error} 
          onClose={() => setError(null)} 
        />
      )}
      
      {success && (
        <NotificationMessage 
          type="success" 
          message={success} 
          onClose={() => setSuccess(null)} 
        />
      )}
    </div>
  );
};

// Componentes auxiliares
const LoadingSpinner = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '300px', 
    flexDirection: 'column', 
    gap: '1rem' 
  }}>
    <Loader size={48} style={{ color: '#3b82f6', animation: 'spin 1s linear infinite' }} />
    <p style={{ color: '#6b7280' }}>Cargando sistema de vacantes...</p>
  </div>
);

const ErrorMessage = ({ error, onRetry }) => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '300px', 
    flexDirection: 'column', 
    gap: '1rem' 
  }}>
    <AlertCircle size={48} style={{ color: '#dc2626' }} />
    <p style={{ color: '#dc2626', textAlign: 'center', maxWidth: '400px' }}>{error}</p>
    <button
      onClick={onRetry}
      style={{
        backgroundColor: '#3b82f6',
        color: 'white',
        padding: '0.5rem 1rem',
        borderRadius: '0.5rem',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}
    >
      <AlertCircle size={16} />
      Reintentar
    </button>
  </div>
);

const NotificationMessage = ({ type, message, onClose }) => {
  const isError = type === 'error';
  const bgColor = isError ? '#fee2e2' : '#d1fae5';
  const borderColor = isError ? '#fecaca' : '#a7f3d0';
  const textColor = isError ? '#dc2626' : '#065f46';
  const Icon = isError ? AlertCircle : CheckCircle;

  return (
    <div style={{
      position: 'fixed',
      top: '1rem',
      right: '1rem',
      backgroundColor: bgColor,
      border: `1px solid ${borderColor}`,
      borderRadius: '0.5rem',
      padding: '1rem',
      maxWidth: '400px',
      zIndex: 1000,
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Icon size={20} style={{ color: textColor }} />
        <span style={{ color: textColor, fontWeight: '500' }}>
          {isError ? 'Error' : 'Éxito'}
        </span>
        <button 
          onClick={onClose}
          style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <X size={16} style={{ color: textColor }} />
        </button>
      </div>
      <p style={{ margin: '0.5rem 0 0 0', color: textColor, fontSize: '0.875rem' }}>{message}</p>
    </div>
  );
};

// Vista de Vacantes
const VistaVacantes = ({ vacantes, onPostularse }) => {
  const [filtro, setFiltro] = useState('');

  const vacantesFiltradas = vacantes.filter(v => 
    v.cargo?.toLowerCase().includes(filtro.toLowerCase()) ||
    v.departamento?.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Vacantes Disponibles</h2>
          <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0' }}>Explora las oportunidades laborales disponibles</p>
        </div>
        
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
          <h3 style={{ fontSize: '1.125rem', fontWeight: '500', color: '#1f2937', marginBottom: '0.5rem' }}>
            No hay vacantes disponibles
          </h3>
          <p style={{ color: '#6b7280' }}>
            {filtro ? 'No se encontraron vacantes que coincidan con tu búsqueda' : 'No hay vacantes publicadas en este momento'}
          </p>
        </div>
      )}
    </div>
  );
};

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
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', margin: '0 0 0.5rem 0' }}>
            {vacante.cargo}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.75rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Building size={14} />
              {vacante.departamento}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <MapPin size={14} />
              {vacante.ubicacion || 'Santo Domingo'}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Users size={14} />
              {vacante.postulaciones || 0} postulaciones
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#059669' }}>
            RD${vacante.salarioMin?.toLocaleString()} - RD${vacante.salarioMax?.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{vacante.modalidad || 'Presencial'}</div>
        </div>
      </div>

      <p style={{ color: '#374151', marginBottom: '1rem', lineHeight: '1.5' }}>{vacante.descripcion}</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <h4 style={{ fontWeight: '500', color: '#1f2937', margin: '0 0 0.5rem 0' }}>Requisitos:</h4>
          <ul style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0, paddingLeft: 0, listStyle: 'none' }}>
            {vacante.requisitos && Array.isArray(vacante.requisitos) && vacante.requisitos.slice(0, 3).map((req, index) => (
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
            {vacante.beneficios && Array.isArray(vacante.beneficios) && vacante.beneficios.slice(0, 3).map((beneficio, index) => (
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
          Publicado: {vacante.fechaPublicacion ? new Date(vacante.fechaPublicacion).toLocaleDateString() : 'Fecha no disponible'}
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
        >
          <Send size={16} />
          Postularse
        </button>
      </div>
    </div>
  );
};

// Vista de Solicitudes
const VistaSolicitudes = ({ solicitudes, usuarioActual, onCrearSolicitud, onAprobar, onRechazar }) => {
  const [filtroEstado, setFiltroEstado] = useState('');

  const solicitudesFiltradas = solicitudes.filter(s => 
    !filtroEstado || s.estado === filtroEstado
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
            {usuarioActual?.role === 'director' ? 'Mis Solicitudes' : 'Gestionar Solicitudes'}
          </h2>
          <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0' }}>
            {usuarioActual?.role === 'director' ? 'Solicitudes de vacantes creadas' : 'Revisar y aprobar solicitudes'}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            style={{
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}
          >
            <option value="">Todos los estados</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Aprobada">Aprobada</option>
            <option value="Rechazada">Rechazada</option>
          </select>
          
          {usuarioActual?.role === 'director' && (
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
                fontSize: '0.875rem'
              }}
            >
              <Plus size={16} />
              Nueva Solicitud
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {solicitudesFiltradas.map(solicitud => (
          <TarjetaSolicitud 
            key={solicitud.id} 
            solicitud={solicitud}
            usuarioActual={usuarioActual}
            onAprobar={onAprobar}
            onRechazar={onRechazar}
          />
        ))}
      </div>

      {solicitudesFiltradas.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <FileText size={48} style={{ margin: '0 auto 1rem', color: '#9ca3af' }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: '500', color: '#1f2937', marginBottom: '0.5rem' }}>
            No hay solicitudes
          </h3>
          <p style={{ color: '#6b7280' }}>
            {filtroEstado ? `No hay solicitudes con estado "${filtroEstado}"` : 'No hay solicitudes creadas'}
          </p>
        </div>
      )}
    </div>
  );
};

const TarjetaSolicitud = ({ solicitud, usuarioActual, onAprobar, onRechazar }) => {
  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Pendiente': return { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' };
      case 'Aprobada': return { bg: '#d1fae5', text: '#065f46', border: '#10b981' };
      case 'Rechazada': return { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' };
      default: return { bg: '#f3f4f6', text: '#374151', border: '#9ca3af' };
    }
  };

  const estadoColor = getEstadoColor(solicitud.estado);

  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: '0.5rem',
      padding: '1.5rem',
      backgroundColor: 'white'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', margin: '0 0 0.5rem 0' }}>
            {solicitud.cargo}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Building size={14} />
              {solicitud.departamento}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <User size={14} />
              {solicitud.solicitante}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Calendar size={14} />
              {new Date(solicitud.fechaSolicitud).toLocaleDateString()}
            </span>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{
            backgroundColor: estadoColor.bg,
            color: estadoColor.text,
            border: `1px solid ${estadoColor.border}`,
            padding: '0.25rem 0.75rem',
            borderRadius: '1rem',
            fontSize: '0.75rem',
            fontWeight: '500'
          }}>
            {solicitud.estado}
          </span>
          
          <div style={{ fontSize: '1rem', fontWeight: '600', color: '#059669' }}>
            RD${solicitud.salarioMin?.toLocaleString()} - RD${solicitud.salarioMax?.toLocaleString()}
          </div>
        </div>
      </div>

      <p style={{ color: '#374151', marginBottom: '1rem', lineHeight: '1.5' }}>
        {solicitud.justificacion}
      </p>

      <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
        <strong>Modalidad:</strong> {solicitud.modalidad}
      </div>

      {usuarioActual?.role === 'rrhh' && solicitud.estado === 'Pendiente' && (
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
  );
};

// Vista de Postulaciones
const VistaPostulaciones = ({ postulaciones, usuarioActual }) => {
  const [filtroEstado, setFiltroEstado] = useState('');

  const postulacionesFiltradas = postulaciones.filter(p => 
    !filtroEstado || p.estado === filtroEstado
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
            {usuarioActual?.role === 'colaborador' ? 'Mis Postulaciones' : 'Gestionar Postulaciones'}
          </h2>
          <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0' }}>
            {usuarioActual?.role === 'colaborador' ? 'Estado de tus postulaciones' : 'Revisar postulaciones recibidas'}
          </p>
        </div>
        
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          style={{
            padding: '0.5rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.5rem',
            fontSize: '0.875rem'
          }}
        >
          <option value="">Todos los estados</option>
          <option value="Recibida">Recibida</option>
          <option value="En revisión">En revisión</option>
          <option value="Aprobada">Aprobada</option>
          <option value="Rechazada">Rechazada</option>
        </select>
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {postulacionesFiltradas.map(postulacion => (
          <TarjetaPostulacion 
            key={postulacion.id} 
            postulacion={postulacion}
            usuarioActual={usuarioActual}
          />
        ))}
      </div>

      {postulacionesFiltradas.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <Send size={48} style={{ margin: '0 auto 1rem', color: '#9ca3af' }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: '500', color: '#1f2937', marginBottom: '0.5rem' }}>
            No hay postulaciones
          </h3>
          <p style={{ color: '#6b7280' }}>
            {filtroEstado ? `No hay postulaciones con estado "${filtroEstado}"` : 'No hay postulaciones registradas'}
          </p>
        </div>
      )}
    </div>
  );
};

const TarjetaPostulacion = ({ postulacion, usuarioActual }) => {
  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Recibida': return { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' };
      case 'En revisión': return { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' };
      case 'Aprobada': return { bg: '#d1fae5', text: '#065f46', border: '#10b981' };
      case 'Rechazada': return { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' };
      default: return { bg: '#f3f4f6', text: '#374151', border: '#9ca3af' };
    }
  };

  const estadoColor = getEstadoColor(postulacion.estado);

  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: '0.5rem',
      padding: '1.5rem',
      backgroundColor: 'white'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', margin: '0 0 0.5rem 0' }}>
            {postulacion.cargoVacante}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <User size={14} />
              {postulacion.nombre}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Mail size={14} />
              {postulacion.email}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Phone size={14} />
              {postulacion.telefono}
            </span>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{
            backgroundColor: estadoColor.bg,
            color: estadoColor.text,
            border: `1px solid ${estadoColor.border}`,
            padding: '0.25rem 0.75rem',
            borderRadius: '1rem',
            fontSize: '0.75rem',
            fontWeight: '500'
          }}>
            {postulacion.estado}
          </span>
          
          <span style={{
            backgroundColor: postulacion.tipoPostulante === 'Interno' ? '#dbeafe' : '#f3f4f6',
            color: postulacion.tipoPostulante === 'Interno' ? '#1e40af' : '#374151',
            padding: '0.25rem 0.75rem',
            borderRadius: '1rem',
            fontSize: '0.75rem',
            fontWeight: '500'
          }}>
            {postulacion.tipoPostulante}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <h4 style={{ fontWeight: '500', color: '#1f2937', margin: '0 0 0.5rem 0', fontSize: '0.875rem' }}>Experiencia:</h4>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>{postulacion.experiencia}</p>
        </div>
        <div>
          <h4 style={{ fontWeight: '500', color: '#1f2937', margin: '0 0 0.5rem 0', fontSize: '0.875rem' }}>Educación:</h4>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>{postulacion.educacion}</p>
        </div>
        <div>
          <h4 style={{ fontWeight: '500', color: '#1f2937', margin: '0 0 0.5rem 0', fontSize: '0.875rem' }}>Expectativa Salarial:</h4>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>RD${postulacion.expectativaSalarial?.toLocaleString()}</p>
        </div>
      </div>

      <div style={{ fontSize: '0.875rem', color: '#6b7280', paddingTop: '1rem', borderTop: '1px solid #f3f4f6' }}>
        <strong>Fecha de postulación:</strong> {new Date(postulacion.fechaPostulacion).toLocaleDateString()}
      </div>
    </div>
  );
};

// Modal para crear solicitud
const ModalSolicitud = ({ onClose, onGuardar, departamentos }) => {
  const [datos, setDatos] = useState({
    cargo: '',
    departamentoID: '',
    justificacion: '',
    salarioMin: '',
    salarioMax: '',
    modalidad: 'Presencial'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onGuardar(datos);
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
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        padding: '2rem',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Nueva Solicitud de Vacante</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Cargo solicitado
            </label>
            <input
              type="text"
              value={datos.cargo}
              onChange={(e) => setDatos(prev => ({ ...prev, cargo: e.target.value }))}
              required
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Departamento
            </label>
            <select
              value={datos.departamentoID}
              onChange={(e) => setDatos(prev => ({ ...prev, departamentoID: e.target.value }))}
              required
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                fontSize: '0.875rem'
              }}
            >
              <option value="">Seleccionar departamento</option>
              {departamentos.map(dep => (
                <option key={dep.id} value={dep.id}>{dep.nombre}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Salario mínimo (RD$)
              </label>
              <input
                type="number"
                value={datos.salarioMin}
                onChange={(e) => setDatos(prev => ({ ...prev, salarioMin: e.target.value }))}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Salario máximo (RD$)
              </label>
              <input
                type="number"
                value={datos.salarioMax}
                onChange={(e) => setDatos(prev => ({ ...prev, salarioMax: e.target.value }))}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Modalidad
            </label>
            <select
              value={datos.modalidad}
              onChange={(e) => setDatos(prev => ({ ...prev, modalidad: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                fontSize: '0.875rem'
              }}
            >
              <option value="Presencial">Presencial</option>
              <option value="Remoto">Remoto</option>
              <option value="Híbrido">Híbrido</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Justificación
            </label>
            <textarea
              value={datos.justificacion}
              onChange={(e) => setDatos(prev => ({ ...prev, justificacion: e.target.value }))}
              required
              rows={4}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                fontSize: '0.875rem',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button
              type="submit"
              style={{
                flex: 1,
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '0.75rem',
                borderRadius: '0.25rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              Crear Solicitud
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                backgroundColor: '#6b7280',
                color: 'white',
                padding: '0.75rem',
                borderRadius: '0.25rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal para postulación
const ModalPostulacion = ({ vacante, usuarioActual, onClose, onGuardar }) => {
  const [datos, setDatos] = useState({
    nombre: usuarioActual?.name || '',
    email: '',
    telefono: '',
    experiencia: '',
    educacion: '',
    expectativaSalarial: '',
    motivacion: '',
    cv: null
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onGuardar(datos);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setDatos(prev => ({ ...prev, cv: file }));
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
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        padding: '2rem',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', margin: '0 0 0.5rem 0' }}>
              Postularse a: {vacante?.cargo}
            </h3>
            <p style={{ color: '#6b7280', margin: 0, fontSize: '0.875rem' }}>
              {vacante?.departamento} • RD${vacante?.salarioMin?.toLocaleString()} - RD${vacante?.salarioMax?.toLocaleString()}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Nombre completo
              </label>
              <input
                type="text"
                value={datos.nombre}
                onChange={(e) => setDatos(prev => ({ ...prev, nombre: e.target.value }))}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Correo electrónico
              </label>
              <input
                type="email"
                value={datos.email}
                onChange={(e) => setDatos(prev => ({ ...prev, email: e.target.value }))}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Teléfono
              </label>
              <input
                type="tel"
                value={datos.telefono}
                onChange={(e) => setDatos(prev => ({ ...prev, telefono: e.target.value }))}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Expectativa salarial (RD$)
              </label>
              <input
                type="number"
                value={datos.expectativaSalarial}
                onChange={(e) => setDatos(prev => ({ ...prev, expectativaSalarial: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Experiencia laboral
            </label>
            <textarea
              value={datos.experiencia}
              onChange={(e) => setDatos(prev => ({ ...prev, experiencia: e.target.value }))}
              required
              rows={3}
              placeholder="Describe tu experiencia relevante para este puesto..."
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                fontSize: '0.875rem',
                resize: 'vertical'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Formación académica
            </label>
            <textarea
              value={datos.educacion}
              onChange={(e) => setDatos(prev => ({ ...prev, educacion: e.target.value }))}
              required
              rows={2}
              placeholder="Incluye títulos, certificaciones y formación relevante..."
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                fontSize: '0.875rem',
                resize: 'vertical'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Motivación
            </label>
            <textarea
              value={datos.motivacion}
              onChange={(e) => setDatos(prev => ({ ...prev, motivacion: e.target.value }))}
              required
              rows={3}
              placeholder="¿Por qué te interesa esta posición? ¿Qué te motiva a trabajar con nosotros?"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                fontSize: '0.875rem',
                resize: 'vertical'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Curriculum Vitae (PDF)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id="cv-upload"
              />
              <label
                htmlFor="cv-upload"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  border: '2px dashed #d1d5db',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  backgroundColor: '#f9fafb'
                }}
              >
                <Upload size={20} />
                {datos.cv ? datos.cv.name : 'Seleccionar archivo PDF'}
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button
              type="submit"
              style={{
                flex: 1,
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '0.75rem',
                borderRadius: '0.25rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <Send size={16} />
              Enviar Postulación
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                backgroundColor: '#6b7280',
                color: 'white',
                padding: '0.75rem',
                borderRadius: '0.25rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VacantesModule;

