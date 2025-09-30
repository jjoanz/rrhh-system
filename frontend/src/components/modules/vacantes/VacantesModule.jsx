import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import vacantesService from '../../../api/vacantesService';
import { Briefcase, Users, Clock, CheckCircle, XCircle, AlertCircle, FileText, Plus, Send, X, Loader, Eye, Calendar, MapPin, DollarSign } from 'lucide-react';

const VacantesModule = () => {
  const { user, loading, getStoredToken } = useAuth();
  const [vistaActiva, setVistaActiva] = useState('dashboard');
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [solicitudes, setSolicitudes] = useState([]);
  const [vacantes, setVacantes] = useState([]);
  const [postulaciones, setPostulaciones] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [estadisticas, setEstadisticas] = useState({});
  
  const [modalSolicitud, setModalSolicitud] = useState(false);
  const [modalVacante, setModalVacante] = useState(false);
  const [modalPostulacion, setModalPostulacion] = useState(false);
  const [vacanteSeleccionada, setVacanteSeleccionada] = useState(null);

  useEffect(() => {
      if (!loading && user) cargarDatos();
    }, [user, loading]);

    const cargarDatos = async () => {
      try {
        setLoadingData(true);
        const token = getStoredToken();
        
        const [deptData, statsData, vacantesData] = await Promise.all([
          vacantesService.getDepartamentos(token),
          vacantesService.getEstadisticas(user.role, token),
          vacantesService.getVacantesActivas(token)
        ]);

        setDepartamentos(deptData || []);
        setEstadisticas(statsData || {});
        setVacantes(vacantesData || []);

        // Cargar solicitudes (Director y Gerente crean, RRHH gestiona)
       // Cargar solicitudes (Director y Gerente crean, RRHH gestiona)
        const rolNormalizadoCarga = user.role?.toLowerCase().replace(/\s+/g, '_');
        if (['director', 'gerente', 'director_rrhh', 'gerente_rrhh', 'rrhh'].includes(rolNormalizadoCarga)) {
          console.log('🔄 Cargando solicitudes para:', {
            nombre: user.name,
            usuarioID: user.id,
            empleadoID: user.empleadoId,
            rol: user.role
          });
          
          const solData = await vacantesService.getSolicitudes(user.id, user.role);
          
          console.log('📥 Solicitudes recibidas:', {
            cantidad: solData?.length || 0,
            datos: solData
          });
          
          setSolicitudes(solData || []);
        }

        // Cargar postulaciones (Personal RRHH gestiona, Colaboradores ven las propias)
        if (['director_rrhh', 'gerente_rrhh', 'rrhh'].includes(rolNormalizadoCarga)) {
          const postData = await vacantesService.getPostulaciones('todas', token);
          setPostulaciones(postData || []);
        } else if (user.role === 'Colaborador') {
          const postData = await vacantesService.getPostulacionesEmpleado(user.empleadoId, token);
          setPostulaciones(postData || []);
        }

      } catch (err) {
        console.error('Error:', err);
        setError('Error al cargar datos del sistema');
      } finally {
        setLoadingData(false);
      }
    };

   // Normalizar rol para comparación consistente
const rolNormalizado = user?.role?.toLowerCase().replace(/\s+/g, '_');

// Permisos según la lógica de flujo RRHH actualizada
const permisos = {
  // Director y Gerente solicitan vacantes
  crearSolicitud: ['director', 'gerente'].includes(rolNormalizado),
  
  // Director del Área aprueba solicitudes de sus gerentes
  aprobarDirectorArea: ['director'].includes(rolNormalizado),
  
  // Gerente RRHH aprueba solicitudes aprobadas por el Director del Área
  aprobarGerenteRRHH: ['gerente_rrhh'].includes(rolNormalizado),
  
  // Director RRHH aprueba después del Gerente RRHH
  aprobarDirectorRRHH: ['director_rrhh'].includes(rolNormalizado),
  
  // Personal RRHH (Director RRHH, Gerente RRHH, RRHH) puede crear vacantes directas y publicar
  crearVacante: ['director_rrhh', 'gerente_rrhh', 'rrhh'].includes(rolNormalizado),
  publicarVacante: ['director_rrhh', 'gerente_rrhh', 'rrhh'].includes(rolNormalizado),
  
  // Colaboradores se postulan
  postularse: ['colaborador', 'empleado'].includes(rolNormalizado),
  
  // Personal RRHH gestiona postulaciones, Directores y Gerentes ven progreso de sus solicitudes
  gestionarPostulaciones: ['director_rrhh', 'gerente_rrhh', 'rrhh', 'director', 'gerente'].includes(rolNormalizado)
};

// Funciones del flujo de aprobación
const crearSolicitud = async (datos) => {
  try {
    const token = getStoredToken();
    console.log('📝 Creando solicitud con empleadoId:', user.empleadoId);
    
    const nueva = await vacantesService.crearSolicitudVacante({
      ...datos,
      solicitanteId: user.empleadoId,
      estado: 'Pendiente'
    }, token);
    
    console.log('✅ Solicitud creada:', nueva);
    setSolicitudes(prev => [...prev, nueva]);
    setModalSolicitud(false);
    mostrarExito('Solicitud enviada al Área de Talento Humano');
  } catch (err) {
    console.error('❌ Error al crear solicitud:', err);
    setError('Error al crear solicitud');
  }
};

const aprobarSolicitud = async (solicitudId, nivel) => {
  try {
    const token = getStoredToken();
    let nuevoEstado, mensaje;
    
    if (nivel === 'director-area') {
      await vacantesService.aprobarSolicitudDirectorArea(solicitudId, user.empleadoId, token);
      nuevoEstado = 'Aprobada por Director de Área';
      mensaje = 'Solicitud aprobada por Director de Área. Enviada a Gerente RRHH';
    } else if (nivel === 'gerente-rrhh') {
      await vacantesService.aprobarSolicitudGerenteRRHH(solicitudId, user.empleadoId, token);
      nuevoEstado = 'Aprobada por Gerente RRHH';
      mensaje = 'Solicitud aprobada por Gerente RRHH. Enviada al Director RRHH';
    } else if (nivel === 'director-rrhh') {
      await vacantesService.aprobarSolicitudDirectorRRHH(solicitudId, user.empleadoId, token);
      nuevoEstado = 'Aprobada por Director RRHH';
      mensaje = 'Solicitud autorizada por Director RRHH. Lista para publicación';
    }
    
    setSolicitudes(prev => prev.map(s => 
      s.id === solicitudId ? { ...s, estado: nuevoEstado } : s
    ));
    mostrarExito(mensaje);
  } catch (err) {
    setError('Error al aprobar solicitud');
  }
};

const publicarVacante = async (solicitudId) => {
  try {
    const token = getStoredToken();
    const nuevaVacante = await vacantesService.publicarVacanteDesdeSolicitud(solicitudId, user.empleadoId, token);
    
    setSolicitudes(prev => prev.map(s => 
      s.id === solicitudId ? { ...s, estado: 'Publicada' } : s
    ));
    setVacantes(prev => [...prev, nuevaVacante]);
    mostrarExito('Vacante publicada y habilitada para postulaciones');
  } catch (err) {
    setError('Error al publicar vacante');
  }
};

const crearVacanteDirecta = async (datos) => {
  try {
    const token = getStoredToken();
    const nueva = await vacantesService.crearVacanteDirecta({
      ...datos,
      creadoPor: user.empleadoId,
      estado: 'Activa'
    }, token);
    setVacantes(prev => [...prev, nueva]);
    setModalVacante(false);
    mostrarExito('Vacante creada y publicada directamente');
  } catch (err) {
    setError('Error al crear vacante');
  }
};

const postularse = async (datos) => {
  try {
    const token = getStoredToken();
    const nueva = await vacantesService.crearPostulacion({
      ...datos,
      vacanteId: vacanteSeleccionada.id,
      empleadoId: user.empleadoId,
      estado: 'Recibida'
    }, token);
    setPostulaciones(prev => [...prev, nueva]);
    setModalPostulacion(false);
    setVacanteSeleccionada(null);
    mostrarExito('Postulación enviada exitosamente');
  } catch (err) {
    setError('Error al enviar postulación');
  }
};

const cambiarEstadoPostulacion = async (postulacionId, nuevoEstado) => {
  try {
    const token = getStoredToken();
    await vacantesService.cambiarEstadoPostulacion(postulacionId, nuevoEstado, '', user.empleadoId, token);
    setPostulaciones(prev => prev.map(p => 
      p.id === postulacionId ? { ...p, estado: nuevoEstado } : p
    ));
    mostrarExito(`Estado actualizado: ${nuevoEstado}`);
  } catch (err) {
    setError('Error al actualizar estado');
  }
};

const mostrarExito = (mensaje) => {
  setSuccess(mensaje);
  setTimeout(() => setSuccess(null), 5000);
};

if (loading || loadingData) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', flexDirection: 'column', gap: '1rem' }}>
      <Loader size={48} style={{ color: '#3b82f6', animation: 'spin 1s linear infinite' }} />
      <p>Cargando sistema de vacantes...</p>
    </div>
  );
}

if (!user) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', flexDirection: 'column', gap: '1rem' }}>
      <AlertCircle size={48} style={{ color: '#dc2626' }} />
      <p style={{ color: '#dc2626' }}>Acceso no autorizado</p>
    </div>
  );
}

return (
  <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '1.5rem' }}>
    {/* Header Profesional */}
    <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', marginBottom: '1.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg, #1e40af 0%, #3730a3 100%)', color: 'white', padding: '2rem', borderRadius: '0.75rem 0.75rem 0 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Briefcase size={44} />
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0 }}>Sistema de Vacantes</h1>
              <p style={{ opacity: 0.9, margin: 0 }}>Gestión profesional de reclutamiento y selección</p>
            </div>
          </div>
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: '0.75rem', padding: '1rem' }}>
            <div style={{ fontWeight: '600', fontSize: '1rem' }}>{user.name}</div>
            <div style={{ opacity: 0.9 }}>{user.role}</div>
          </div>
        </div>

        {/* Indicadores de rendimiento */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '0.5rem', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Clock size={20} />
              <span style={{ fontSize: '0.875rem' }}>Solicitudes Pendientes</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{estadisticas.solicitudesPendientes || 0}</div>
          </div>
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '0.5rem', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Briefcase size={20} />
              <span style={{ fontSize: '0.875rem' }}>Vacantes Activas</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{estadisticas.vacantesActivas || 0}</div>
          </div>
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '0.5rem', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Users size={20} />
              <span style={{ fontSize: '0.875rem' }}>Postulaciones</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{estadisticas.postulaciones || 0}</div>
          </div>
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '0.5rem', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <CheckCircle size={20} />
              <span style={{ fontSize: '0.875rem' }}>Tasa de Aprobación</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{estadisticas.tasaAprobacion || 0}%</div>
          </div>
        </div>
      </div>

      {/* Navegación con roles específicos */}
      <div style={{ display: 'flex', overflowX: 'auto', backgroundColor: '#f8fafc' }}>
        {[
          { id: 'dashboard', nombre: 'Dashboard', show: true },
          { id: 'solicitudes', nombre: 'Solicitudes', show: permisos.crearSolicitud || permisos.aprobarDirectorArea || permisos.aprobarGerenteRRHH || permisos.aprobarDirectorRRHH || permisos.publicarVacante },
          { id: 'vacantes', nombre: 'Vacantes', show: true },
          { id: 'postulaciones', nombre: 'Postulaciones', show: permisos.gestionarPostulaciones || permisos.postularse }
        ].filter(v => v.show).map(vista => (
          <button
            key={vista.id}
            onClick={() => setVistaActiva(vista.id)}
            style={{
              padding: '1rem 1.5rem',
              border: 'none',
              backgroundColor: 'transparent',
              color: vistaActiva === vista.id ? '#1e40af' : '#6b7280',
              borderBottom: `3px solid ${vistaActiva === vista.id ? '#1e40af' : 'transparent'}`,
              cursor: 'pointer',
              fontWeight: vistaActiva === vista.id ? '600' : '500',
              fontSize: '0.875rem'
            }}
          >
            {vista.nombre}
          </button>
        ))}
      </div>
    </div>

      {/* Contenido Principal */}
      <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', padding: '2rem' }}>
        {vistaActiva === 'dashboard' && <VistaDashboard permisos={permisos} setModalSolicitud={setModalSolicitud} setModalVacante={setModalVacante} estadisticas={estadisticas} user={user} />}
        {vistaActiva === 'solicitudes' && <VistaSolicitudes solicitudes={solicitudes} user={user} permisos={permisos} setModalSolicitud={setModalSolicitud} aprobarSolicitud={aprobarSolicitud} publicarVacante={publicarVacante} />}
        {vistaActiva === 'vacantes' && <VistaVacantes vacantes={vacantes} permisos={permisos} setModalVacante={setModalVacante} setVacanteSeleccionada={setVacanteSeleccionada} setModalPostulacion={setModalPostulacion} />}
        {vistaActiva === 'postulaciones' && <VistaPostulaciones postulaciones={postulaciones} permisos={permisos} cambiarEstadoPostulacion={cambiarEstadoPostulacion} user={user} />}
      </div>

      {/* Modales */}
      {modalSolicitud && <ModalSolicitud onClose={() => setModalSolicitud(false)} onGuardar={crearSolicitud} departamentos={departamentos} />}
      {modalVacante && <ModalVacante onClose={() => setModalVacante(false)} onGuardar={crearVacanteDirecta} departamentos={departamentos} />}
      {modalPostulacion && <ModalPostulacion vacante={vacanteSeleccionada} onClose={() => { setModalPostulacion(false); setVacanteSeleccionada(null); }} onGuardar={postularse} />}

      {/* Notificaciones */}
      {error && <Notificacion type="error" message={error} onClose={() => setError(null)} />}
      {success && <Notificacion type="success" message={success} onClose={() => setSuccess(null)} />}
    </div>
  );
};

// Dashboard con flujo visual de RRHH
const VistaDashboard = ({ permisos, setModalSolicitud, setModalVacante, estadisticas, user }) => (
  <div>
    <div style={{ marginBottom: '2rem' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>Dashboard - Gestión de Vacantes</h2>
      <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Panel de control para el flujo de reclutamiento profesional</p>
    </div>
    
    {/* Flujo de proceso visual */}
    <div style={{ backgroundColor: '#f8fafc', borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '2rem', border: '1px solid #e2e8f0' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#1e293b' }}>Flujo de Proceso RRHH Actualizado</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <ProcesoEtapa numero="1" titulo="Solicitud" descripcion="Gerente solicita" activo={permisos.crearSolicitud} />
        <FlechaProceso />
        <ProcesoEtapa numero="2" titulo="Aprobación" descripcion="Director de Área" activo={permisos.aprobarDirectorArea} />
        <FlechaProceso />
        <ProcesoEtapa numero="3" titulo="Revisión" descripcion="Gerente RRHH" activo={permisos.aprobarGerenteRRHH} />
        <FlechaProceso />
        <ProcesoEtapa numero="4" titulo="Autorización" descripcion="Director RRHH" activo={permisos.aprobarDirectorRRHH} />
        <FlechaProceso />
        <ProcesoEtapa numero="5" titulo="Publicación" descripcion="Personal RRHH" activo={permisos.publicarVacante} />
      </div>
      
      <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center', lineHeight: '1.4' }}>
          <strong>Flujo de solicitud:</strong> Gerente solicita → Director de Área aprueba → Gerente RRHH revisa → Director RRHH autoriza → RRHH publica
        </div>
      </div>
    </div>

    {/* Acciones rápidas según rol */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
      {permisos.crearSolicitud && (
        <AccionRapida
          icono={FileText}
          titulo="Solicitar Nueva Vacante"
          descripcion="Enviar solicitud al Área de Talento Humano para aprobación"
          color="#0ea5e9"
          accion={() => setModalSolicitud(true)}
          textoBoton="Nueva Solicitud"
        />
      )}
      
      {permisos.crearVacante && (
        <AccionRapida
          icono={Briefcase}
          titulo="Crear Vacante Directa"
          descripcion="Publicar vacante inmediatamente sin proceso de aprobación"
          color="#22c55e"
          accion={() => setModalVacante(true)}
          textoBoton="Crear Vacante"
        />
      )}

      {permisos.aprobarGerente && (
        <AccionRapida
          icono={CheckCircle}
          titulo="Aprobar Solicitudes"
          descripcion="Revisar y aprobar solicitudes pendientes como Gerente RRHH"
          color="#7c3aed"
          accion={() => {}}
          textoBoton="Ver Solicitudes"
          badge={estadisticas.solicitudesPendientes || 0}
        />
      )}

      {permisos.gestionarPostulaciones && (
        <AccionRapida
          icono={Users}
          titulo="Gestionar Postulaciones"
          descripcion="Revisar candidatos y gestionar proceso de reclutamiento"
          color="#dc2626"
          accion={() => {}}
          textoBoton="Ver Postulaciones"
          badge={estadisticas.postulaciones || 0}
        />
      )}
    </div>

    {/* Resumen estadístico */}
    <div style={{ backgroundColor: '#f9fafb', borderRadius: '0.75rem', padding: '1.5rem' }}>
      <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1.5rem' }}>Resumen Ejecutivo</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <EstadisticaTarjeta valor={estadisticas.solicitudesPendientes || 0} etiqueta="Solicitudes Pendientes" color="#f59e0b" />
        <EstadisticaTarjeta valor={estadisticas.vacantesActivas || 0} etiqueta="Vacantes Activas" color="#3b82f6" />
        <EstadisticaTarjeta valor={estadisticas.postulaciones || 0} etiqueta="Postulaciones Totales" color="#10b981" />
        <EstadisticaTarjeta valor={`${estadisticas.tasaAprobacion || 0}%`} etiqueta="Tasa de Aprobación" color="#8b5cf6" />
      </div>
    </div>
  </div>
);

// Vista de Solicitudes con flujo profesional
const VistaSolicitudes = ({ solicitudes, user, permisos, setModalSolicitud, aprobarSolicitud, publicarVacante }) => {
  const [filtro, setFiltro] = useState('todas');
  const [solicitudEnProceso, setSolicitudEnProceso] = useState(null);

  const solicitudesFiltradas = solicitudes.filter(s => {
    if (filtro === 'todas') return true;
    return s.estado.toLowerCase().includes(filtro.toLowerCase());
  });

  const obtenerTituloVista = () => {
    if (permisos.crearSolicitud && !permisos.aprobarGerente && !permisos.aprobarDirector && !permisos.publicarVacante) {
      return 'Mis Solicitudes de Vacantes';
    }
    return 'Gestión de Solicitudes - Flujo de Aprobación RRHH';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>{obtenerTituloVista()}</h2>
          <p style={{ color: '#6b7280', margin: 0 }}>
            {permisos.crearSolicitud ? 'Proceso de solicitud y seguimiento de vacantes' : 'Panel de aprobación profesional'}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}
          >
            <option value="todas">Todas</option>
            <option value="pendiente">Pendientes</option>
            <option value="aprobada">Aprobadas</option>
            <option value="publicada">Publicadas</option>
          </select>
          
          {permisos.crearSolicitud && (
            <button onClick={() => setModalSolicitud(true)} style={{ backgroundColor: '#3b82f6', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              <Plus size={16} />
              Nueva Solicitud
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {solicitudesFiltradas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#f9fafb', borderRadius: '0.75rem' }}>
            <FileText size={48} style={{ margin: '0 auto 1rem', color: '#9ca3af' }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '0.5rem' }}>No hay solicitudes</h3>
            <p style={{ color: '#6b7280' }}>
              {filtro === 'todas' ? 'No se han creado solicitudes de vacantes' : `No hay solicitudes ${filtro}`}
            </p>
          </div>
        ) : (
          solicitudesFiltradas.map(solicitud => (
            <TarjetaSolicitudProfesional 
              key={solicitud.id}
              solicitud={solicitud}
              user={user}
              permisos={permisos}
              aprobarSolicitud={aprobarSolicitud}
              publicarVacante={publicarVacante}
              solicitudEnProceso={solicitudEnProceso}
              setSolicitudEnProceso={setSolicitudEnProceso}
            />
          ))
        )}
      </div>
    </div>
  );
};

// Vista de Vacantes
const VistaVacantes = ({ vacantes, permisos, setModalVacante, setVacanteSeleccionada, setModalPostulacion }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>Vacantes Publicadas</h2>
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Oportunidades de empleo activas para postulación</p>
      </div>
      
      {permisos.crearVacante && (
        <button onClick={() => setModalVacante(true)} style={{ backgroundColor: '#059669', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={16} />
          Nueva Vacante
        </button>
      )}
    </div>

    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {vacantes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#f9fafb', borderRadius: '0.75rem' }}>
          <Briefcase size={48} style={{ margin: '0 auto 1rem', color: '#9ca3af' }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '0.5rem' }}>No hay vacantes activas</h3>
          <p style={{ color: '#6b7280' }}>No hay oportunidades de empleo publicadas actualmente</p>
        </div>
      ) : (
        vacantes.map(vacante => (
          <TarjetaVacanteProfesional 
            key={vacante.id}
            vacante={vacante}
            permisos={permisos}
            setVacanteSeleccionada={setVacanteSeleccionada}
            setModalPostulacion={setModalPostulacion}
          />
        ))
      )}
    </div>
  </div>
);

// Vista de Postulaciones
const VistaPostulaciones = ({ postulaciones, permisos, cambiarEstadoPostulacion, user }) => {
  const [filtroEstado, setFiltroEstado] = useState('');

  const postulacionesFiltradas = postulaciones.filter(p => 
    !filtroEstado || p.estado === filtroEstado
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>
            {permisos.gestionarPostulaciones && user.role !== 'Colaborador' ? 'Gestión de Postulaciones' : 'Mis Postulaciones'}
          </h2>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            {permisos.gestionarPostulaciones && user.role !== 'Colaborador' ? 'Proceso de reclutamiento y selección de candidatos' : 'Estado de mis aplicaciones a vacantes'}
          </p>
        </div>
        
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}
        >
          <option value="">Todos los estados</option>
          <option value="Recibida">Recibidas</option>
          <option value="En revisión">En Revisión</option>
          <option value="Entrevista">Para Entrevista</option>
          <option value="Aprobada">Aprobadas</option>
          <option value="Rechazada">Rechazadas</option>
        </select>
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {postulacionesFiltradas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#f9fafb', borderRadius: '0.75rem' }}>
            <Users size={48} style={{ margin: '0 auto 1rem', color: '#9ca3af' }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '0.5rem' }}>No hay postulaciones</h3>
            <p style={{ color: '#6b7280' }}>
              {filtroEstado ? `No hay postulaciones con estado "${filtroEstado}"` : 'No hay postulaciones registradas'}
            </p>
          </div>
        ) : (
          postulacionesFiltradas.map(postulacion => (
            <TarjetaPostulacionProfesional 
              key={postulacion.id}
              postulacion={postulacion}
              permisos={permisos}
              cambiarEstadoPostulacion={cambiarEstadoPostulacion}
              user={user}
            />
          ))
        )}
      </div>
    </div>
  );
};

// Componentes auxiliares profesionales

// Etapa del proceso
const ProcesoEtapa = ({ numero, titulo, descripcion, activo }) => (
  <div style={{ 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    padding: '1rem',
    backgroundColor: activo ? '#dbeafe' : '#f8fafc',
    borderRadius: '0.5rem',
    border: `2px solid ${activo ? '#3b82f6' : '#e5e7eb'}`,
    minWidth: '120px'
  }}>
    <div style={{ 
      width: '32px', 
      height: '32px', 
      backgroundColor: activo ? '#3b82f6' : '#9ca3af', 
      color: 'white', 
      borderRadius: '50%', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      fontSize: '0.875rem', 
      fontWeight: 'bold',
      marginBottom: '0.5rem'
    }}>
      {numero}
    </div>
    <div style={{ fontSize: '0.75rem', fontWeight: '600', color: activo ? '#1e40af' : '#374151', textAlign: 'center' }}>{titulo}</div>
    <div style={{ fontSize: '0.625rem', color: '#6b7280', textAlign: 'center', marginTop: '0.25rem' }}>{descripcion}</div>
  </div>
);

const FlechaProceso = () => (
  <div style={{ width: '24px', height: '2px', backgroundColor: '#d1d5db', position: 'relative' }}>
    <div style={{ position: 'absolute', right: '-4px', top: '-3px', width: 0, height: 0, borderLeft: '8px solid #d1d5db', borderTop: '4px solid transparent', borderBottom: '4px solid transparent' }}></div>
  </div>
);

// Acción rápida
const AccionRapida = ({ icono: Icono, titulo, descripcion, color, accion, textoBoton, badge }) => (
  <div style={{ backgroundColor: `${color}10`, border: `2px solid ${color}`, borderRadius: '0.75rem', padding: '1.5rem', position: 'relative' }}>
    {badge > 0 && (
      <div style={{ position: 'absolute', top: '1rem', right: '1rem', backgroundColor: '#dc2626', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>
        {badge}
      </div>
    )}
    <Icono size={32} style={{ color, marginBottom: '1rem' }} />
    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: '0 0 0.5rem 0', color: '#1e293b' }}>{titulo}</h3>
    <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1rem', lineHeight: '1.4' }}>{descripcion}</p>
    <button onClick={accion} style={{ backgroundColor: color, color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500' }}>
      {textoBoton}
    </button>
  </div>
);

// Estadística
const EstadisticaTarjeta = ({ valor, etiqueta, color }) => (
  <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', textAlign: 'center', border: '1px solid #f1f5f9' }}>
    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color, marginBottom: '0.5rem' }}>{valor}</div>
    <div style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>{etiqueta}</div>
  </div>
);

// Tarjeta de solicitud profesional - CORREGIDA
const TarjetaSolicitudProfesional = ({ solicitud, user, permisos, aprobarSolicitud, publicarVacante, solicitudEnProceso, setSolicitudEnProceso }) => {
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  
  const rolNormalizado = user?.role?.toLowerCase().replace(/\s+/g, '_');
  
  const puedeAprobarDirectorArea = rolNormalizado === 'director' && solicitud.estado === 'Pendiente';
  const puedeAprobarGerenteRRHH = rolNormalizado === 'gerente_rrhh' && solicitud.estado === 'Aprobada por Director de Área';
  const puedeAprobarDirectorRRHH = rolNormalizado === 'director_rrhh' && solicitud.estado === 'Aprobada por Gerente RRHH';
  const puedePublicar = ['director_rrhh', 'gerente_rrhh', 'rrhh'].includes(rolNormalizado) && solicitud.estado === 'Aprobada por Director RRHH';

  const getProgresoFlujo = () => {
    switch (solicitud.estado) {
      case 'Pendiente': return 20;
      case 'Aprobada por Director de Área': return 40;
      case 'Aprobada por Gerente RRHH': return 60;
      case 'Aprobada por Director RRHH': return 80;
      case 'Publicada': return 100;
      case 'Rechazada': return 0;
      default: return 0;
    }
  };

  const handleAccion = async (accion, id) => {
    setSolicitudEnProceso(id);
    try {
      if (accion === 'aprobar-director-area') {
        await aprobarSolicitud(id, 'director-area');
      } else if (accion === 'aprobar-gerente-rrhh') {
        await aprobarSolicitud(id, 'gerente-rrhh');
      } else if (accion === 'aprobar-director-rrhh') {
        await aprobarSolicitud(id, 'director-rrhh');
      } else if (accion === 'publicar') {
        await publicarVacante(id);
      }
    } finally {
      setSolicitudEnProceso(null);
    }
  };

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1.5rem', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: '0 0 0.5rem 0', color: '#1e293b' }}>{solicitud.cargo}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
            <span><strong>Solicitante:</strong> {solicitud.solicitante}</span>
            <span>•</span>
            <span><strong>Departamento:</strong> {solicitud.departamento}</span>
            <span>•</span>
            <span><strong>Fecha:</strong> {solicitud.fechaSolicitud}</span>
          </div>
          <div style={{ fontSize: '1rem', fontWeight: '600', color: '#059669', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <DollarSign size={16} />
            RD${(solicitud.salarioMin || 0).toLocaleString()} - RD${(solicitud.salarioMax || 0).toLocaleString()}
          </div>
        </div>
        <EstadoBadge estado={solicitud.estado} />
      </div>

      {/* Barra de progreso */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
          <span>Progreso del flujo</span>
          <span>{getProgresoFlujo()}%</span>
        </div>
        <div style={{ width: '100%', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '1rem', overflow: 'hidden' }}>
          <div style={{ width: `${getProgresoFlujo()}%`, height: '100%', backgroundColor: '#3b82f6', transition: 'width 0.3s ease' }}></div>
        </div>
      </div>

      {/* Detalles expandibles */}
      <button 
        onClick={() => setMostrarDetalles(!mostrarDetalles)}
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3b82f6', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500', marginBottom: '1rem' }}
      >
        <Eye size={16} />
        {mostrarDetalles ? 'Ocultar' : 'Ver'} detalles
      </button>

      {mostrarDetalles && (
        <div style={{ backgroundColor: '#f8fafc', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1e293b' }}>Descripción:</h4>
            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0, lineHeight: '1.4' }}>{solicitud.descripcion || 'No especificada'}</p>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1e293b' }}>Requisitos:</h4>
            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0, lineHeight: '1.4' }}>{solicitud.requisitos || 'No especificados'}</p>
          </div>
          <div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1e293b' }}>Justificación:</h4>
            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0, lineHeight: '1.4' }}>{solicitud.justificacion}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Modalidad:</span>
              <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1e293b' }}>{solicitud.modalidad || 'Presencial'}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Prioridad:</span>
              <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1e293b' }}>{solicitud.prioridad || 'Media'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Botones de acción */}
      {(puedeAprobarDirectorArea || puedeAprobarGerenteRRHH || puedeAprobarDirectorRRHH || puedePublicar) && (
        <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
          {puedeAprobarDirectorArea && (
            <button 
              onClick={() => handleAccion('aprobar-director-area', solicitud.id)} 
              disabled={solicitudEnProceso === solicitud.id}
              style={{ 
                backgroundColor: solicitudEnProceso === solicitud.id ? '#9ca3af' : '#0ea5e9', 
                color: 'white', 
                padding: '0.5rem 1rem', 
                borderRadius: '0.5rem', 
                border: 'none', 
                cursor: solicitudEnProceso === solicitud.id ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              {solicitudEnProceso === solicitud.id ? <Loader size={16} /> : <CheckCircle size={16} />}
              Aprobar como Director de Área
            </button>
          )}
          {puedeAprobarGerenteRRHH && (
            <button 
              onClick={() => handleAccion('aprobar-gerente-rrhh', solicitud.id)} 
              disabled={solicitudEnProceso === solicitud.id}
              style={{ 
                backgroundColor: solicitudEnProceso === solicitud.id ? '#9ca3af' : '#059669', 
                color: 'white', 
                padding: '0.5rem 1rem', 
                borderRadius: '0.5rem', 
                border: 'none', 
                cursor: solicitudEnProceso === solicitud.id ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              {solicitudEnProceso === solicitud.id ? <Loader size={16} /> : <CheckCircle size={16} />}
              Aprobar como Gerente RRHH
            </button>
          )}
          {puedeAprobarDirectorRRHH && (
            <button 
              onClick={() => handleAccion('aprobar-director-rrhh', solicitud.id)} 
              disabled={solicitudEnProceso === solicitud.id}
              style={{ 
                backgroundColor: solicitudEnProceso === solicitud.id ? '#9ca3af' : '#7c3aed', 
                color: 'white', 
                padding: '0.5rem 1rem', 
                borderRadius: '0.5rem', 
                border: 'none', 
                cursor: solicitudEnProceso === solicitud.id ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              {solicitudEnProceso === solicitud.id ? <Loader size={16} /> : <CheckCircle size={16} />}
              Autorizar como Director RRHH
            </button>
          )}
          {puedePublicar && (
            <button 
              onClick={() => handleAccion('publicar', solicitud.id)} 
              disabled={solicitudEnProceso === solicitud.id}
              style={{ 
                backgroundColor: solicitudEnProceso === solicitud.id ? '#9ca3af' : '#dc2626', 
                color: 'white', 
                padding: '0.5rem 1rem', 
                borderRadius: '0.5rem', 
                border: 'none', 
                cursor: solicitudEnProceso === solicitud.id ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              {solicitudEnProceso === solicitud.id ? <Loader size={16} /> : <Send size={16} />}
              Publicar Vacante
            </button>
          )}
        </div>
      )}
    </div>
  );
};
// Tarjeta de vacante profesional
const TarjetaVacanteProfesional = ({ vacante, permisos, setVacanteSeleccionada, setModalPostulacion }) => (
  <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1.5rem', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
      <div style={{ flex: 1 }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: '0 0 0.5rem 0', color: '#1e293b' }}>{vacante.titulo}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <MapPin size={14} />
            {vacante.departamento}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Calendar size={14} />
            {new Date(vacante.fechaPublicacion || Date.now()).toLocaleDateString()}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Users size={14} />
            {vacante.totalPostulaciones || 0} postulaciones
          </span>
        </div>
        <div style={{ fontSize: '1rem', fontWeight: '600', color: '#059669', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <DollarSign size={16} />
          RD${(vacante.salarioMinimo || 0).toLocaleString()} - RD${(vacante.salarioMaximo || 0).toLocaleString()}
        </div>
      </div>
      
      <div style={{ textAlign: 'right' }}>
        <EstadoBadge estado={vacante.estado} />
      </div>
    </div>

    <p style={{ color: '#374151', marginBottom: '1rem', lineHeight: '1.5' }}>{vacante.descripcion}</p>

    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid #f3f4f6' }}>
      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
        <strong>Modalidad:</strong> {vacante.modalidad || 'Presencial'}
      </div>
      
      {permisos.postularse && vacante.estado === 'Activa' && (
        <button 
          onClick={() => { setVacanteSeleccionada(vacante); setModalPostulacion(true); }}
          style={{ backgroundColor: '#3b82f6', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}
        >
          <Send size={16} />
          Postularse
        </button>
      )}
    </div>
  </div>
);

// Tarjeta de postulación profesional
const TarjetaPostulacionProfesional = ({ postulacion, permisos, cambiarEstadoPostulacion, user }) => (
  <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1.5rem', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
      <div style={{ flex: 1 }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: '0 0 0.5rem 0', color: '#1e293b' }}>
          {postulacion.nombreCandidato || 'Mi Postulación'}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
          <span><strong>Vacante:</strong> {postulacion.cargoVacante}</span>
          <span>•</span>
          <span><strong>Fecha:</strong> {new Date(postulacion.fechaPostulacion || Date.now()).toLocaleDateString()}</span>
        </div>
        {postulacion.email && (
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
            <strong>Email:</strong> {postulacion.email}
          </div>
        )}
      </div>
      
      <EstadoBadge estado={postulacion.estado} />
    </div>
    
    {postulacion.motivacion && (
      <div style={{ backgroundColor: '#f8fafc', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1rem' }}>
        <h4 style={{ fontSize: '0.875rem', fontWeight: '600', margin: '0 0 0.5rem 0' }}>Motivación:</h4>
        <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0, lineHeight: '1.4' }}>{postulacion.motivacion}</p>
      </div>
    )}
    
    {permisos.gestionarPostulaciones && user.role !== 'Colaborador' && (
      <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #f3f4f6', flexWrap: 'wrap' }}>
        <button onClick={() => cambiarEstadoPostulacion(postulacion.id, 'En revisión')} style={botonEstado('#f59e0b')}>En Revisión</button>
        <button onClick={() => cambiarEstadoPostulacion(postulacion.id, 'Entrevista')} style={botonEstado('#8b5cf6')}>Entrevista</button>
        <button onClick={() => cambiarEstadoPostulacion(postulacion.id, 'Aprobada')} style={botonEstado('#22c55e')}>Aprobar</button>
        <button onClick={() => cambiarEstadoPostulacion(postulacion.id, 'Rechazada')} style={botonEstado('#ef4444')}>Rechazar</button>
      </div>
    )}
  </div>
);

// Badge de estado
const EstadoBadge = ({ estado }) => {
  const colores = {
    'Pendiente': { bg: '#fef3c7', text: '#92400e', border: '#fbbf24' },
    'Aprobada por Gerente RRHH': { bg: '#dbeafe', text: '#1e40af', border: '#60a5fa' },
    'Aprobada por Director RRHH': { bg: '#dcfce7', text: '#166534', border: '#4ade80' },
    'Publicada': { bg: '#f0f9ff', text: '#0369a1', border: '#0ea5e9' },
    'Rechazada': { bg: '#fee2e2', text: '#991b1b', border: '#f87171' },
    'Activa': { bg: '#dcfce7', text: '#166534', border: '#4ade80' },
    'Pausada': { bg: '#fef3c7', text: '#92400e', border: '#fbbf24' },
    'Cerrada': { bg: '#f3f4f6', text: '#374151', border: '#9ca3af' },
    'Recibida': { bg: '#dbeafe', text: '#1e40af', border: '#60a5fa' },
    'En revisión': { bg: '#fef3c7', text: '#92400e', border: '#fbbf24' },
    'Entrevista': { bg: '#f3e8ff', text: '#7c3aed', border: '#a78bfa' },
    'Aprobada': { bg: '#dcfce7', text: '#166534', border: '#4ade80' }
  };
  
  const color = colores[estado] || { bg: '#f3f4f6', text: '#374151', border: '#9ca3af' };
  
  return (
    <span style={{
      backgroundColor: color.bg,
      color: color.text,
      border: `1px solid ${color.border}`,
      padding: '0.25rem 0.75rem',
      borderRadius: '1rem',
      fontSize: '0.75rem',
      fontWeight: '600'
    }}>
      {estado}
    </span>
  );
};

const botonEstado = (color) => ({
  backgroundColor: color,
  color: 'white',
  padding: '0.375rem 0.75rem',
  borderRadius: '0.375rem',
  border: 'none',
  cursor: 'pointer',
  fontSize: '0.75rem',
  fontWeight: '500'
});

// Modales profesionales

const ModalSolicitud = ({ onClose, onGuardar, departamentos }) => {
  const [datos, setDatos] = useState({
    titulo: '',
    cargo: '',
    departamentoId: '',
    descripcion: '',
    requisitos: '',
    justificacion: '',
    salarioMinimo: '',
    salarioMaximo: '',
    modalidad: 'Presencial',
    fechaCierreEstimada: '',
    numeroVacantes: '1',
    urgencia: 'Media'
  });

  const [errores, setErrores] = useState({});

  const validarFormulario = () => {
    const nuevosErrores = {};
    
    if (!datos.titulo.trim()) nuevosErrores.titulo = 'El título es requerido';
    if (!datos.cargo.trim()) nuevosErrores.cargo = 'El cargo es requerido';
    if (!datos.departamentoId) nuevosErrores.departamentoId = 'El departamento es requerido';
    if (!datos.descripcion.trim()) nuevosErrores.descripcion = 'La descripción es requerida';
    if (!datos.requisitos.trim()) nuevosErrores.requisitos = 'Los requisitos son requeridos';
    if (!datos.justificacion.trim()) nuevosErrores.justificacion = 'La justificación es requerida';
    if (!datos.salarioMinimo || datos.salarioMinimo <= 0) nuevosErrores.salarioMinimo = 'El salario mínimo es requerido';
    if (!datos.salarioMaximo || datos.salarioMaximo <= 0) nuevosErrores.salarioMaximo = 'El salario máximo es requerido';
    if (parseInt(datos.salarioMaximo) <= parseInt(datos.salarioMinimo)) {
      nuevosErrores.salarioMaximo = 'El salario máximo debe ser mayor al mínimo';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validarFormulario()) {
      const solicitudData = {
        Titulo: datos.titulo,
        Descripcion: datos.descripcion,
        Requisitos: datos.requisitos,
        SalarioMinimo: parseFloat(datos.salarioMinimo),
        SalarioMaximo: parseFloat(datos.salarioMaximo),
        DepartamentoID: parseInt(datos.departamentoId),
        cargo: datos.cargo,
        modalidad: datos.modalidad,
        justificacion: datos.justificacion,
        fechaCierreEstimada: datos.fechaCierreEstimada || null,
        numeroVacantes: parseInt(datos.numeroVacantes),
        urgencia: datos.urgencia,
        estado: 'Pendiente',
        fechaSolicitud: new Date().toISOString()
      };
      
      onGuardar(solicitudData);
    }
  };

  const mostrarError = (campo) => errores[campo] && (
    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
      {errores[campo]}
    </div>
  );

  return (
    <ModalBase titulo="Nueva Solicitud de Vacante" onClose={onClose} ancho="700px">
      <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f0f9ff', borderRadius: '0.5rem', border: '1px solid #e0f2fe' }}>
        <div style={{ fontSize: '0.875rem', color: '#0369a1', fontWeight: '600', marginBottom: '0.5rem' }}>
          📋 Flujo de Aprobación RRHH
        </div>
        <div style={{ fontSize: '0.75rem', color: '#0369a1', lineHeight: '1.4' }}>
          Su solicitud seguirá este proceso: <strong>Solicitud → Gerente RRHH → Director RRHH → Publicación</strong>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
          <div>
            <Input 
              label="Título de la Vacante" 
              value={datos.titulo} 
              onChange={(e) => setDatos(prev => ({ ...prev, titulo: e.target.value }))} 
              required 
              placeholder="ej. Analista de Sistemas Senior"
            />
            {mostrarError('titulo')}
          </div>
          <div>
            <Input 
              label="Cargo/Posición" 
              value={datos.cargo} 
              onChange={(e) => setDatos(prev => ({ ...prev, cargo: e.target.value }))} 
              required 
              placeholder="ej. Analista"
            />
            {mostrarError('cargo')}
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Departamento *</label>
            <select 
              value={datos.departamentoId} 
              onChange={(e) => setDatos(prev => ({ ...prev, departamentoId: e.target.value }))} 
              style={inputStyle} 
              required
            >
              <option value="">Seleccionar departamento</option>
              {departamentos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
            </select>
            {mostrarError('departamentoId')}
          </div>
          <div>
            <Input 
              label="N° Vacantes" 
              type="number" 
              value={datos.numeroVacantes} 
              onChange={(e) => setDatos(prev => ({ ...prev, numeroVacantes: e.target.value }))} 
              min="1"
            />
          </div>
          <div>
            <label style={labelStyle}>Prioridad</label>
            <select value={datos.urgencia} onChange={(e) => setDatos(prev => ({ ...prev, urgencia: e.target.value }))} style={inputStyle}>
              <option value="Baja">Baja</option>
              <option value="Media">Media</option>
              <option value="Alta">Alta</option>
              <option value="Urgente">Urgente</option>
            </select>
          </div>
        </div>
        
        <div>
          <label style={labelStyle}>Descripción del Puesto *</label>
          <textarea 
            value={datos.descripcion} 
            onChange={(e) => setDatos(prev => ({ ...prev, descripcion: e.target.value }))} 
            rows={4} 
            style={inputStyle} 
            placeholder="Describe las responsabilidades principales, funciones del día a día, y objetivos del puesto..."
            required 
          />
          {mostrarError('descripcion')}
        </div>
        
        <div>
          <label style={labelStyle}>Requisitos y Cualificaciones *</label>
          <textarea 
            value={datos.requisitos} 
            onChange={(e) => setDatos(prev => ({ ...prev, requisitos: e.target.value }))} 
            rows={4} 
            style={inputStyle} 
            placeholder="Experiencia mínima, nivel educativo, habilidades técnicas, certificaciones, competencias requeridas..."
            required 
          />
          {mostrarError('requisitos')}
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <Input 
              label="Salario Mínimo (RD$)" 
              type="number" 
              value={datos.salarioMinimo} 
              onChange={(e) => setDatos(prev => ({ ...prev, salarioMinimo: e.target.value }))} 
              required 
              placeholder="50000"
            />
            {mostrarError('salarioMinimo')}
          </div>
          <div>
            <Input 
              label="Salario Máximo (RD$)" 
              type="number" 
              value={datos.salarioMaximo} 
              onChange={(e) => setDatos(prev => ({ ...prev, salarioMaximo: e.target.value }))} 
              required 
              placeholder="75000"
            />
            {mostrarError('salarioMaximo')}
          </div>
          <div>
            <label style={labelStyle}>Modalidad</label>
            <select value={datos.modalidad} onChange={(e) => setDatos(prev => ({ ...prev, modalidad: e.target.value }))} style={inputStyle}>
              <option value="Presencial">Presencial</option>
              <option value="Remoto">Remoto</option>
              <option value="Híbrido">Híbrido</option>
            </select>
          </div>
        </div>

        <div>
          <Input 
            label="Fecha Límite de Postulación (Opcional)" 
            type="date" 
            value={datos.fechaCierreEstimada} 
            onChange={(e) => setDatos(prev => ({ ...prev, fechaCierreEstimada: e.target.value }))} 
          />
        </div>
        
        <div>
          <label style={labelStyle}>Justificación de la Solicitud *</label>
          <textarea 
            value={datos.justificacion} 
            onChange={(e) => setDatos(prev => ({ ...prev, justificacion: e.target.value }))} 
            rows={4} 
            style={inputStyle} 
            placeholder="Explica la necesidad del negocio, impacto esperado, si es reemplazo o nueva posición, urgencia del rol..."
            required 
          />
          {mostrarError('justificacion')}
        </div>
        
        <BotonesModal onSubmit="Enviar Solicitud" onCancel={onClose} />
      </form>
    </ModalBase>
  );
};

const ModalVacante = ({ onClose, onGuardar, departamentos }) => {
  const [datos, setDatos] = useState({
    titulo: '',
    departamentoId: '',
    descripcion: '',
    requisitos: '',
    salarioMinimo: '',
    salarioMaximo: '',
    modalidad: 'Presencial',
    fechaCierre: ''
  });

  const [errores, setErrores] = useState({});

  const validarFormulario = () => {
    const nuevosErrores = {};
    
    if (!datos.titulo.trim()) nuevosErrores.titulo = 'El título es requerido';
    if (!datos.departamentoId) nuevosErrores.departamentoId = 'El departamento es requerido';
    if (!datos.descripcion.trim()) nuevosErrores.descripcion = 'La descripción es requerida';
    if (!datos.requisitos.trim()) nuevosErrores.requisitos = 'Los requisitos son requeridos';
    if (!datos.salarioMinimo || datos.salarioMinimo <= 0) nuevosErrores.salarioMinimo = 'El salario mínimo es requerido';
    if (!datos.salarioMaximo || datos.salarioMaximo <= 0) nuevosErrores.salarioMaximo = 'El salario máximo es requerido';
    if (parseInt(datos.salarioMaximo) <= parseInt(datos.salarioMinimo)) {
      nuevosErrores.salarioMaximo = 'El salario máximo debe ser mayor al mínimo';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validarFormulario()) {
      onGuardar({
        Titulo: datos.titulo,
        DepartamentoID: parseInt(datos.departamentoId),
        Descripcion: datos.descripcion,
        Requisitos: datos.requisitos,
        SalarioMinimo: parseFloat(datos.salarioMinimo),
        SalarioMaximo: parseFloat(datos.salarioMaximo),
        modalidad: datos.modalidad,
        fechaCierre: datos.fechaCierre || null,
        estado: 'Activa'
      });
    }
  };

  const mostrarError = (campo) => errores[campo] && (
    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
      {errores[campo]}
    </div>
  );

  return (
    <ModalBase titulo="Crear Nueva Vacante" onClose={onClose} ancho="600px">
      <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '0.5rem', border: '1px solid #dcfce7' }}>
        <div style={{ fontSize: '0.875rem', color: '#166534', fontWeight: '600', marginBottom: '0.5rem' }}>
          ⚡ Publicación Directa
        </div>
        <div style={{ fontSize: '0.75rem', color: '#166534', lineHeight: '1.4' }}>
          Esta vacante se publicará inmediatamente y estará disponible para postulaciones
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
        <Input 
          label="Título de la Vacante" 
          value={datos.titulo} 
          onChange={(e) => setDatos(prev => ({ ...prev, titulo: e.target.value }))} 
          required 
          placeholder="ej. Desarrollador Full Stack"
        />
        {mostrarError('titulo')}
        
        <div>
          <label style={labelStyle}>Departamento *</label>
          <select 
            value={datos.departamentoId} 
            onChange={(e) => setDatos(prev => ({ ...prev, departamentoId: e.target.value }))} 
            style={inputStyle} 
            required
          >
            <option value="">Seleccionar departamento</option>
            {departamentos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
          </select>
          {mostrarError('departamentoId')}
        </div>
        
        <div>
          <label style={labelStyle}>Descripción del Puesto *</label>
          <textarea 
            value={datos.descripcion} 
            onChange={(e) => setDatos(prev => ({ ...prev, descripcion: e.target.value }))} 
            rows={4} 
            style={inputStyle} 
            placeholder="Responsabilidades principales y funciones del puesto..."
            required 
          />
          {mostrarError('descripcion')}
        </div>
        
        <div>
          <label style={labelStyle}>Requisitos y Cualificaciones *</label>
          <textarea 
            value={datos.requisitos} 
            onChange={(e) => setDatos(prev => ({ ...prev, requisitos: e.target.value }))} 
            rows={4} 
            style={inputStyle} 
            placeholder="Experiencia, educación, habilidades requeridas..."
            required 
          />
          {mostrarError('requisitos')}
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <Input 
              label="Salario Mínimo (RD$)" 
              type="number" 
              value={datos.salarioMinimo} 
              onChange={(e) => setDatos(prev => ({ ...prev, salarioMinimo: e.target.value }))} 
              required 
              placeholder="45000"
            />
            {mostrarError('salarioMinimo')}
          </div>
          <div>
            <Input 
              label="Salario Máximo (RD$)" 
              type="number" 
              value={datos.salarioMaximo} 
              onChange={(e) => setDatos(prev => ({ ...prev, salarioMaximo: e.target.value }))} 
              required 
              placeholder="65000"
            />
            {mostrarError('salarioMaximo')}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Modalidad</label>
            <select value={datos.modalidad} onChange={(e) => setDatos(prev => ({ ...prev, modalidad: e.target.value }))} style={inputStyle}>
              <option value="Presencial">Presencial</option>
              <option value="Remoto">Remoto</option>
              <option value="Híbrido">Híbrido</option>
            </select>
          </div>
          <div>
            <Input 
              label="Fecha Límite (Opcional)" 
              type="date" 
              value={datos.fechaCierre} 
              onChange={(e) => setDatos(prev => ({ ...prev, fechaCierre: e.target.value }))} 
            />
          </div>
        </div>
        
        <BotonesModal onSubmit="Publicar Vacante" onCancel={onClose} />
      </form>
    </ModalBase>
  );
};

const ModalPostulacion = ({ vacante, onClose, onGuardar }) => {
  const [datos, setDatos] = useState({
    nombre: '',
    email: '',
    telefono: '',
    experiencia: '',
    educacion: '',
    expectativaSalarial: '',
    motivacion: ''
  });

  const [errores, setErrores] = useState({});

  const validarFormulario = () => {
    const nuevosErrores = {};
    
    if (!datos.nombre.trim()) nuevosErrores.nombre = 'El nombre es requerido';
    if (!datos.email.trim()) nuevosErrores.email = 'El email es requerido';
    if (!datos.telefono.trim()) nuevosErrores.telefono = 'El teléfono es requerido';
    if (!datos.experiencia.trim()) nuevosErrores.experiencia = 'La experiencia es requerida';
    if (!datos.educacion.trim()) nuevosErrores.educacion = 'La educación es requerida';
    if (!datos.motivacion.trim()) nuevosErrores.motivacion = 'La motivación es requerida';

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validarFormulario()) {
      onGuardar(datos);
    }
  };

  const mostrarError = (campo) => errores[campo] && (
    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
      {errores[campo]}
    </div>
  );

  return (
    <ModalBase titulo={`Postularse: ${vacante?.titulo}`} onClose={onClose} ancho="600px">
      <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#fefce8', borderRadius: '0.5rem', border: '1px solid #fde047' }}>
        <div style={{ fontSize: '0.875rem', color: '#a16207', fontWeight: '600', marginBottom: '0.5rem' }}>
          💼 Información de la Vacante
        </div>
        <div style={{ fontSize: '0.75rem', color: '#a16207', lineHeight: '1.4' }}>
          <strong>Departamento:</strong> {vacante?.departamento} • <strong>Salario:</strong> RD${vacante?.salarioMinimo?.toLocaleString()} - RD${vacante?.salarioMaximo?.toLocaleString()}
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <Input 
              label="Nombre Completo" 
              value={datos.nombre} 
              onChange={(e) => setDatos(prev => ({ ...prev, nombre: e.target.value }))} 
              required 
              placeholder="Nombre y apellidos"
            />
            {mostrarError('nombre')}
          </div>
          <div>
            <Input 
              label="Correo Electrónico" 
              type="email" 
              value={datos.email} 
              onChange={(e) => setDatos(prev => ({ ...prev, email: e.target.value }))} 
              required 
              placeholder="correo@ejemplo.com"
            />
            {mostrarError('email')}
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <Input 
              label="Teléfono" 
              value={datos.telefono} 
              onChange={(e) => setDatos(prev => ({ ...prev, telefono: e.target.value }))} 
              required 
              placeholder="(809) 000-0000"
            />
            {mostrarError('telefono')}
          </div>
          <div>
            <Input 
              label="Expectativa Salarial (RD$)" 
              type="number" 
              value={datos.expectativaSalarial} 
              onChange={(e) => setDatos(prev => ({ ...prev, expectativaSalarial: e.target.value }))} 
              placeholder="Opcional"
            />
          </div>
        </div>
        
        <div>
          <label style={labelStyle}>Experiencia Laboral Relevante *</label>
          <textarea 
            value={datos.experiencia} 
            onChange={(e) => setDatos(prev => ({ ...prev, experiencia: e.target.value }))} 
            rows={4} 
            style={inputStyle} 
            placeholder="Describe tu experiencia profesional relevante para este puesto, años de experiencia, roles anteriores..."
            required 
          />
          {mostrarError('experiencia')}
        </div>
        
        <div>
          <label style={labelStyle}>Formación Académica *</label>
          <textarea 
            value={datos.educacion} 
            onChange={(e) => setDatos(prev => ({ ...prev, educacion: e.target.value }))} 
            rows={3} 
            style={inputStyle} 
            placeholder="Nivel educativo, títulos obtenidos, certificaciones relevantes..."
            required 
          />
          {mostrarError('educacion')}
        </div>
        
        <div>
          <label style={labelStyle}>¿Por qué te interesa esta posición? *</label>
          <textarea 
            value={datos.motivacion} 
            onChange={(e) => setDatos(prev => ({ ...prev, motivacion: e.target.value }))} 
            rows={4} 
            style={inputStyle} 
            placeholder="Explica tu motivación, cómo puedes contribuir al equipo y por qué eres el candidato ideal..."
            required 
          />
          {mostrarError('motivacion')}
        </div>
        
        <BotonesModal onSubmit="Enviar Postulación" onCancel={onClose} />
      </form>
    </ModalBase>
  );
};

// Componentes base para modales
const ModalBase = ({ titulo, children, onClose, ancho = '500px' }) => (
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
    zIndex: 1000,
    padding: '1rem'
  }}>
    <div style={{ 
      backgroundColor: 'white', 
      borderRadius: '0.75rem', 
      padding: '2rem', 
      maxWidth: ancho, 
      width: '100%', 
      maxHeight: '90vh', 
      overflow: 'auto',
      boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>{titulo}</h3>
        <button 
          onClick={onClose} 
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            fontSize: '1.5rem',
            color: '#6b7280',
            padding: '0.25rem'
          }}
        >
          <X size={24} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

const Input = ({ label, value, onChange, type = 'text', required = false, placeholder = '' }) => (
  <div>
    <label style={labelStyle}>
      {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
    </label>
    <input 
      type={type} 
      value={value} 
      onChange={onChange} 
      required={required} 
      style={inputStyle}
      placeholder={placeholder}
    />
  </div>
);

const BotonesModal = ({ onSubmit, onCancel }) => (
  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
    <button 
      type="submit" 
      style={{ 
        flex: 1, 
        backgroundColor: '#3b82f6', 
        color: 'white', 
        padding: '0.875rem', 
        borderRadius: '0.5rem', 
        border: 'none', 
        cursor: 'pointer', 
        fontSize: '0.875rem', 
        fontWeight: '600'
      }}
    >
      {onSubmit}
    </button>
    <button 
      type="button" 
      onClick={onCancel} 
      style={{ 
        flex: 1, 
        backgroundColor: '#6b7280', 
        color: 'white', 
        padding: '0.875rem', 
        borderRadius: '0.5rem', 
        border: 'none', 
        cursor: 'pointer', 
        fontSize: '0.875rem', 
        fontWeight: '600'
      }}
    >
      Cancelar
    </button>
  </div>
);

const Notificacion = ({ type, message, onClose }) => {
  const isError = type === 'error';
  const bgColor = isError ? '#fee2e2' : '#d1fae5';
  const textColor = isError ? '#dc2626' : '#065f46';
  const borderColor = isError ? '#f87171' : '#34d399';
  const Icon = isError ? AlertCircle : CheckCircle;

  return (
    <div style={{ 
      position: 'fixed', 
      top: '1rem', 
      right: '1rem', 
      backgroundColor: bgColor, 
      border: `1px solid ${borderColor}`,
      borderRadius: '0.75rem', 
      padding: '1rem', 
      maxWidth: '400px', 
      zIndex: 1000, 
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)' 
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Icon size={20} style={{ color: textColor }} />
        <div style={{ flex: 1, color: textColor, fontSize: '0.875rem', lineHeight: '1.4' }}>{message}</div>
        <button 
          onClick={onClose} 
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer',
            color: textColor,
            padding: '0.25rem'
          }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

// Estilos constantes
const labelStyle = { 
  display: 'block', 
  fontSize: '0.875rem', 
  fontWeight: '600', 
  marginBottom: '0.5rem', 
  color: '#374151' 
};

const inputStyle = { 
  width: '100%', 
  padding: '0.75rem', 
  border: '1px solid #d1d5db', 
  borderRadius: '0.5rem', 
  fontSize: '0.875rem',
  backgroundColor: '#ffffff',
  transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
  outline: 'none'
};

export default VacantesModule;