import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useApp } from '../../../context/AppContext';
import capacitacionService from '../../../api/capacitacionService';
import { 
  BookOpen, 
  Award, 
  Clock, 
  Users, 
  TrendingUp, 
  Plus, 
  Edit, 
  Eye, 
  Download,
  Calendar,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Search,
  FileText,
  Target,
  DollarSign,
  ArrowRight,
  UserCheck,
  Building,
  Send
} from 'lucide-react';

const CapacitacionModule = () => {
  const { user } = useAuth();
  const appContext = useApp();
  const showSuccessMessage = appContext?.showSuccessMessage || ((msg) => console.log('✅', msg));
  const showErrorMessage = appContext?.showErrorMessage || ((msg) => console.error('❌', msg));
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);

  // Estados principales
  const [solicitudes, setSolicitudes] = useState([]);
  const [cursosDisponibles, setCursosDisponibles] = useState([]);
  const [misCursos, setMisCursos] = useState([]);
  const [certificados, setCertificados] = useState([]);
  const [solicitudesPorAprobar, setSolicitudesPorAprobar] = useState([]);
  const [estadisticasReales, setEstadisticasReales] = useState(null);
  const [todasSolicitudes, setTodasSolicitudes] = useState([]);
  const [miembroEquipo, setMiembroEquipo] = useState([]);

  // ✅ Estados agregados para evitar los errores no definidos
  const [empleadosDisponibles, setEmpleadosDisponibles] = useState([]);
  const [misCapacitaciones, setMisCapacitaciones] = useState([]);
  const [participantesModal, setParticipantesModal] = useState({ open: false, cursoId: null, participantes: [] });
  const [loadingParticipantes, setLoadingParticipantes] = useState(false);
  const [busquedaEmpleado, setBusquedaEmpleado] = useState('');

  // Estados para formularios
  const [nuevaSolicitud, setNuevaSolicitud] = useState({
    titulo: '',
    descripcion: '',
    justificacion: '',
    proveedor: '',
    modalidad: 'presencial',
    fechaInicio: '',
    fechaFin: '',
    costo: 0,
    categoria: 'tecnica',
    prioridad: 'media',
    horas: 0
  });

  // Estados para nuevo curso (solo RRHH)
  const [nuevoCurso, setNuevoCurso] = useState({
    titulo: '',
    descripcion: '',
    proveedor: '',
    modalidad: 'presencial',
    duracion: 0,
    categoria: 'tecnica',
    costo: 0,
    fechaInicio: '',
    cupos: 0,
    tipoAcceso: 'abierto',           // ← NUEVO
    empleadosSeleccionados: []       // ← NUEVO
  });

  // Verificar permisos según el flujo
  const esColaborador = user.role === 'colaborador';
  const esGerente = user.role === 'gerente';
  const esDirector = user.role === 'director';
  const esRRHH = ['rrhh', 'director_rrhh', 'gerente_rrhh'].includes(user.role);
  const esAdmin = user.role === 'admin';

  // Determinar qué puede hacer cada rol
  const puedeCrearSolicitudes = !esRRHH; // Todos excepto RRHH
  const puedeCrearCursos = esRRHH || esAdmin; // Solo RRHH y Admin
  const puedeAprobarGerente = esGerente || esDirector || esRRHH || esAdmin;
  const puedeAprobarDirector = esDirector || esRRHH || esAdmin;
  const puedeAprobarRRHH = esRRHH || esAdmin;

 

  // Datos iniciales con el nuevo flujo
useEffect(() => {
  // Cargar datos principales (solicitudes, cursos, etc.)
  cargarDatos();

 // Cargar empleados para cursos cerrados
const cargarEmpleados = async () => {
  try {
    const data = await capacitacionService.getEmpleados();
    
    // Normalizar datos de empleados para manejar valores null
    const empleadosNormalizados = data.map(emp => ({
      ...emp,
      nombre: emp.nombre || 'Sin nombre',
      apellido: emp.apellido || 'Sin apellido',
      cargo: emp.cargo || 'Sin cargo',
      departamento: emp.departamento || 'Sin departamento',
      nombreCompleto: `${emp.nombre || 'Sin nombre'} ${emp.apellido || 'Sin apellido'}`
    }));
    
    setEmpleadosDisponibles(empleadosNormalizados);
    console.log('Empleados cargados:', empleadosNormalizados);
  } catch (error) {
    console.error('Error al cargar empleados:', error.response || error.message || error);
  }
};

// Cargar mis capacitaciones (para colaboradores y gerentes)
const cargarMisCapacitaciones = async () => {
  try {
    const data = await capacitacionService.getMisCapacitaciones();
    setMisCapacitaciones(data);
    console.log('Mis capacitaciones cargadas:', data);
  } catch (error) {
    console.error('Error al cargar mis capacitaciones:', error);
  }
};

// Ver participantes de un curso (solo RRHH)
const verParticipantes = async (cursoId) => {
  setLoadingParticipantes(true);
  try {
    const data = await capacitacionService.getParticipantes(cursoId);
    setParticipantesModal({ open: true, cursoId, participantes: data });
  } catch (error) {
    console.error('Error al cargar participantes:', error);
    showErrorMessage('Error al cargar participantes');
  } finally {
    setLoadingParticipantes(false);
  }
};

const cerrarModalParticipantes = () => {
  setParticipantesModal({ open: false, cursoId: null, participantes: [] });
};

  cargarEmpleados();
  // Cargar mis capacitaciones si NO es RRHH
  if (!esRRHH) {
  cargarMisCapacitaciones();
}

}, []);

// Cargar mis capacitaciones (para colaboradores y gerentes)
const cargarMisCapacitaciones = async () => {
  try {
    const data = await capacitacionService.getMisCapacitaciones();
    setMisCapacitaciones(data);
    console.log('Mis capacitaciones cargadas:', data);
  } catch (error) {
    console.error('Error al cargar mis capacitaciones:', error);
  }
};

// Ver participantes de un curso (solo RRHH)
const verParticipantes = async (cursoId) => {
  setLoadingParticipantes(true);
  try {
    const data = await capacitacionService.getParticipantes(cursoId);
    setParticipantesModal({ open: true, cursoId, participantes: data });
  } catch (error) {
    console.error('Error al cargar participantes:', error);
    showErrorMessage('Error al cargar participantes');
  } finally {
    setLoadingParticipantes(false);
  }
};

const cerrarModalParticipantes = () => {
  setParticipantesModal({ open: false, cursoId: null, participantes: [] });
};


const cargarDatos = async () => {
  setLoading(true);
  try {
    // 1. Cargar estadísticas
    const statsRes = await capacitacionService.getEstadisticas();
      if (statsRes.success) {
        setEstadisticasReales(statsRes.data);
      }
    
    // 2. Cargar mis solicitudes (solo si no soy RRHH)
    if (puedeCrearSolicitudes) {
      const solRes = await capacitacionService.getMisSolicitudes();
      if (solRes.success) {
        setSolicitudes(solRes.data);
      }
    }

    // 3. Cargar cursos disponibles
    const cursosRes = await capacitacionService.getCursosDisponibles();
    if (cursosRes.success) {
      setCursosDisponibles(cursosRes.data);
    }

    // 4. Cargar mis cursos inscritos
        const misCursosRes = await capacitacionService.getMisCursos();
        if (misCursosRes.success) {
          setMisCursos(misCursosRes.data);
        }

       
    // 5. Cargar mis certificados
    const certRes = await capacitacionService.getMisCertificados();
    if (certRes.success) {
      setCertificados(certRes.data);
    }

    // 7. Cargar histórico si soy gerente o RRHH
    if (esGerente || esDirector || esRRHH) {
      const todasRes = await capacitacionService.getTodasSolicitudes();
      if (todasRes.success) {
        setTodasSolicitudes(todasRes.data);
      }
    }

    // 8. Cargar miembros del equipo si soy gerente
    if (esGerente || esDirector) {
      const equipoRes = await capacitacionService.getProgresoEquipo();
      if (equipoRes.success) {
        setMiembroEquipo(equipoRes.data);
      }
    }

    // 6. Cargar solicitudes por aprobar
    if (puedeAprobarGerente || puedeAprobarDirector || puedeAprobarRRHH) {
      const pendRes = await capacitacionService.getSolicitudesPendientes();
      if (pendRes.success) {
        setSolicitudesPorAprobar(pendRes.data);
      }
    }
    // 9. Cargar empleados si es RRHH (para asignar a cursos)
    if (esRRHH) {
      try {
        // Aquí debes tener un endpoint para obtener empleados
        // Por ahora lo simulo, pero deberías llamar a tu API
        const empleadosRes = await fetch('/api/empleados', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(r => r.json());
        
        if (empleadosRes.success) {
          setEmpleadosDisponibles(empleadosRes.data);
        }
      } catch (error) {
        console.error('Error cargando empleados:', error);
      }
    }

  } catch (error) {
    console.error('Error cargando datos:', error);
    showErrorMessage('Error al cargar los datos');
  } finally {
    setLoading(false);
  }
};

  

  // Crear nueva solicitud con flujo correcto
  // Crear nueva solicitud con flujo correcto
const crearSolicitud = async () => {
  if (!nuevaSolicitud.titulo.trim() || !nuevaSolicitud.justificacion.trim()) {
    showErrorMessage('Título y justificación son requeridos');
    return;
  }

  setLoading(true);
  try {
    const response = await capacitacionService.crearSolicitud(nuevaSolicitud);

    if (response.success) {
      showSuccessMessage(response.message);
      
      setNuevaSolicitud({
        titulo: '',
        descripcion: '',
        justificacion: '',
        proveedor: '',
        modalidad: 'presencial',
        fechaInicio: '',
        fechaFin: '',
        costo: 0,
        categoria: 'tecnica',
        prioridad: 'media',
        horas: 0
      });

      await cargarDatos();
      setActiveTab('solicitudes');
    }
  } catch (error) {
    showErrorMessage(error.response?.data?.message || 'Error al crear la solicitud');
  } finally {
    setLoading(false);
  }
};

  // Crear nuevo curso (solo RRHH)
    const crearCurso = async () => {
      if (!nuevoCurso.titulo.trim() || !nuevoCurso.duracion) {
        showErrorMessage('Título y duración son requeridos');
        return;
      }

      // Validar que si es cerrado, haya empleados seleccionados
      if (nuevoCurso.tipoAcceso === 'cerrado' && nuevoCurso.empleadosSeleccionados.length === 0) {
        showErrorMessage('Debes seleccionar al menos un empleado para cursos cerrados');
        return;
      }

      setLoading(true);
      try {
        const response = await capacitacionService.crearCurso({
          ...nuevoCurso,
          // Enviar los campos nuevos
          tipoAcceso: nuevoCurso.tipoAcceso,
          empleadosSeleccionados: nuevoCurso.tipoAcceso === 'cerrado' ? nuevoCurso.empleadosSeleccionados : []
        });

        if (response.success) {
          showSuccessMessage(response.message);
          
          // Resetear formulario
          setNuevoCurso({
            titulo: '',
            descripcion: '',
            proveedor: '',
            modalidad: 'presencial',
            duracion: 0,
            categoria: 'tecnica',
            costo: 0,
            fechaInicio: '',
            cupos: 0,
            tipoAcceso: 'abierto',
            empleadosSeleccionados: []
          });

          await cargarDatos();
          setActiveTab('cursos'); // Ir a ver los cursos
        }
      } catch (error) {
        showErrorMessage(error.response?.data?.message || 'Error al crear el curso');
      } finally {
        setLoading(false);
      }
    };

    // Crear curso desde solicitud aprobada
    const crearCursoDesdeSolicitud = (solicitud) => {
      setNuevoCurso({
        titulo: solicitud.Titulo,
        descripcion: solicitud.Descripcion || '',
        proveedor: solicitud.Proveedor || '',
        modalidad: solicitud.Modalidad || 'presencial',
        duracion: solicitud.Horas || 0,
        categoria: solicitud.Categoria || 'tecnica',
        costo: solicitud.Costo || 0,
        fechaInicio: solicitud.FechaInicio ? solicitud.FechaInicio.split('T')[0] : '',
        cupos: 20,
        solicitudId: solicitud.SolicitudID,
        tipoAcceso: 'abierto',           // ← AGREGAR
        empleadosSeleccionados:[]      // ← AGREGAR
      });
      
      setActiveTab('crear-curso');
      showSuccessMessage('Formulario pre-llenado con datos de la solicitud');
    };
    

  // Aprobar/Rechazar solicitud según el rol
 // Aprobar/Rechazar solicitud según el rol
const procesarSolicitud = async (solicitudId, accion, comentario = '') => {
  if (!solicitudId) {
    showErrorMessage('ID de solicitud inválido');
    return;
  }

  setLoading(true);
  
  try {
    let resultado;
    
    if (accion === 'aprobar') {
      resultado = await capacitacionService.aprobarSolicitud(solicitudId, comentario);
    } else if (accion === 'rechazar') {
      resultado = await capacitacionService.rechazarSolicitud(solicitudId, comentario);
    }

    if (resultado && resultado.success) {
      const mensaje = resultado.message || `Solicitud ${accion === 'aprobar' ? 'aprobada' : 'rechazada'} exitosamente`;
      if (typeof showSuccessMessage === 'function') {
        showSuccessMessage(mensaje);
      }
      
      // Esperar antes de recargar
     // Recargar datos inmediatamente
      await cargarDatos();
      setLoading(false);
      return; // Salir aquí para evitar el finally

    } else {
      const mensajeError = resultado?.message || 'Error al procesar la solicitud';
      if (typeof showErrorMessage === 'function') {
  showErrorMessage(mensajeError);
}
    }
  } catch (error) {
    console.error(`Error al ${accion} solicitud:`, error);
    
    let mensajeError = `Error al ${accion} la solicitud`;
    
    if (error.response?.data?.message) {
      mensajeError = error.response.data.message;
    } else if (error.message) {
      mensajeError = error.message;
    }
    
    if (typeof showErrorMessage === 'function') {
  showErrorMessage(mensajeError);
}
  }
  
  setLoading(false);
};

  // Inscribirse a curso disponible
  // Inscribirse a curso disponible
const inscribirseCurso = async (cursoId) => {
  console.log('🎓 Intentando inscribirse al curso:', cursoId);
  
  if (!cursoId) {
    showErrorMessage('ID de curso inválido');
    return;
  }
  
  setLoading(true);
  try {
    const response = await capacitacionService.inscribirseCurso(cursoId);

    if (response.success) {
      showSuccessMessage(response.message || 'Inscripción exitosa');
      await cargarDatos();
    } else {
      showErrorMessage(response.message || 'Error al inscribirse');
    }
  } catch (error) {
    console.error('❌ Error al inscribirse:', error);
    showErrorMessage(error.response?.data?.message || 'Error al inscribirse al curso');
  } finally {
    setLoading(false);
  }
};

  // Obtener estadísticas según el rol
  const getEstadisticas = () => {
  // Si tenemos datos reales de la API, usarlos
  if (estadisticasReales) {
    return estadisticasReales;
  }
  
  // Mientras carga, mostrar valores en 0
  if (esRRHH) {
    return {
      TotalSolicitudes: 0,
      PendientesAprobacion: 0,
      CursosCreados: cursosDisponibles.length,
      EmpleadosCapacitados: 0,
      PresupuestoUtilizado: 0
    };
  } else if (esGerente || esDirector) {
    return {
      SolicitudesEquipo: 0,
      PendientesAprobacion: solicitudesPorAprobar.length,
      CursosCompletados: 0,
      HorasCapacitacion: 0
    };
  } else {
    return {
      TotalSolicitudes: solicitudes.length,
      SolicitudesPendientes: solicitudes.filter(s => s.Estado && s.Estado.includes('pendiente')).length,
      CursosCompletados: misCursos.filter(c => c.EstadoCurso === 'completado').length,
      HorasCapacitacion: misCursos.reduce((total, curso) => total + (curso.Progreso === 100 ? (curso.Duracion || 0) : 0), 0)
    };
  }
};

  const estadisticas = getEstadisticas();

  // Obtener tabs disponibles según el rol
  const getTabsDisponibles = () => {
    const tabs = [
      { id: 'dashboard', label: 'Dashboard', icon: TrendingUp }
    ];

    if (puedeCrearSolicitudes) {
      tabs.push({ id: 'solicitudes', label: 'Mis Solicitudes', icon: FileText });
    }

    tabs.push({ id: 'cursos', label: 'Cursos Disponibles', icon: BookOpen });
    tabs.push({ id: 'progreso', label: esRRHH ? 'Progreso Global' : esGerente || esDirector ? 'Progreso Equipo' : 'Mi Progreso', icon: Target });
    tabs.push({ id: 'certificados', label: 'Certificados', icon: Award });

    if (puedeAprobarGerente || puedeAprobarDirector || puedeAprobarRRHH) {
      tabs.push({ id: 'aprobar', label: 'Aprobaciones', icon: CheckCircle });
    }

    if (puedeCrearCursos) {
      tabs.push({ id: 'admin', label: 'Crear Cursos', icon: Plus });
    }

    return tabs;
  };

  const tabsDisponibles = getTabsDisponibles();

  // Componente de tarjeta de estadística
  const StatCard = ({ title, value, icon: Icon, color = 'blue', subtitle }) => (
    <div style={{
      background: 'white',
      borderRadius: '0.75rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #e5e7eb',
      padding: '1.5rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', margin: 0, marginBottom: '0.5rem' }}>
            {title}
          </p>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
            {value}
          </p>
          {subtitle && (
            <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0, marginTop: '0.25rem' }}>
              {subtitle}
            </p>
          )}
        </div>
        <div style={{
          padding: '0.75rem',
          borderRadius: '50%',
          background: `${color === 'blue' ? '#dbeafe' : color === 'green' ? '#dcfce7' : color === 'orange' ? '#fed7aa' : color === 'purple' ? '#e9d5ff' : '#fde68a'}`
        }}>
          <Icon style={{
            width: '1.5rem',
            height: '1.5rem',
            color: `${color === 'blue' ? '#2563eb' : color === 'green' ? '#16a34a' : color === 'orange' ? '#ea580c' : color === 'purple' ? '#9333ea' : '#d97706'}`
          }} />
        </div>
      </div>
    </div>
  );

  // Componente para mostrar el flujo de aprobación
  const FlujoAprobacion = ({ solicitud }) => {
    const pasos = [];
    
    if (solicitud.solicitanteRole === 'colaborador') {
      pasos.push(
        { etapa: 'Gerente', estado: solicitud.flujoAprobacion?.gerente, key: 'gerente' },
        { etapa: 'Director', estado: solicitud.flujoAprobacion?.director, key: 'director' },
        { etapa: 'RRHH', estado: solicitud.flujoAprobacion?.rrhh, key: 'rrhh' }
      );
    } else if (solicitud.solicitanteRole === 'gerente' || solicitud.solicitanteRole === 'director') {
      pasos.push(
        { etapa: 'RRHH', estado: solicitud.flujoAprobacion?.rrhh, key: 'rrhh' }
      );
    }

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        {pasos.map((paso, index) => (
          <React.Fragment key={paso.key}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              fontWeight: '500',
              background: paso.estado?.aprobado ? '#f0fdf4' : 
                         solicitud.Estado.includes(paso.key) ? '#fff7ed' : '#f3f4f6',
              color: paso.estado?.aprobado ? '#166534' : 
                     solicitud.Estado.includes(paso.key) ? '#ea580c' : '#6b7280'
            }}>
              {paso.estado?.aprobado ? (
                <CheckCircle style={{ width: '1rem', height: '1rem' }} />
              ) : solicitud.Estado.includes(paso.key) ? (
                <Clock style={{ width: '1rem', height: '1rem' }} />
              ) : (
                <AlertCircle style={{ width: '1rem', height: '1rem' }} />
              )}
              {paso.etapa}
            </div>
            {index < pasos.length - 1 && (
              <ArrowRight style={{ width: '1rem', height: '1rem', color: '#6b7280' }} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div style={{ padding: '1.5rem', background: '#ffffff', minHeight: '100vh' }}>
      <div style={{ maxWidth: '112rem', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
           Sistema de Capacitación y Desarrollo
        </h1>
        <p style={{ color: '#6b7280', fontSize: '1.125rem', marginBottom: '2rem' }}>
          {esRRHH ? 'Panel administrativo de capacitación' : 
           esGerente || esDirector ? 'Gestión de capacitación de tu equipo' : 
           'Gestiona tu desarrollo profesional'}
        </p>

        {/* Estadísticas según rol */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(15rem, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {esRRHH ? (
            <>
              <StatCard 
                title="Total Solicitudes" 
                value={estadisticas.TotalSolicitudes || 0} 
                icon={FileText} 
                color="blue" 
              />
              <StatCard 
                title="Pendientes Aprobación" 
                value={estadisticas.PendientesAprobacion || 0} 
                icon={Clock} 
                color="orange" 
              />
              <StatCard 
                title="Cursos Creados" 
                value={estadisticas.CursosCreados || 0} 
                icon={BookOpen} 
                color="green" 
              />
              <StatCard 
                title="Empleados Capacitados" 
                value={estadisticas.EmpleadosCapacitados || 0} 
                icon={Users} 
                color="purple" 
              />
              <StatCard 
                title="Presupuesto Utilizado" 
                value={`$${(estadisticas.PresupuestoUtilizado || 0).toLocaleString()}`} 
                icon={DollarSign} 
                color="green" 
              />
            </>
          ) : esGerente || esDirector ? (
              <>
                <StatCard title="Solicitudes del Equipo" value={estadisticas.SolicitudesEquipo || 0} icon={Users} color="blue" />
                <StatCard title="Pendientes Aprobación" value={estadisticas.PendientesAprobacion || 0} icon={Clock} color="orange" />
                <StatCard title="Cursos Completados" value={estadisticas.CursosCompletados || 0} icon={Award} color="green" />
                <StatCard title="Horas de Capacitación" value={`${estadisticas.HorasCapacitacion || 0}h`} icon={TrendingUp} color="purple" />
              </>
          ) : (
              <>
                <StatCard title="Mis Solicitudes" value={estadisticas.TotalSolicitudes || 0} icon={FileText} color="blue" />
                <StatCard title="Pendientes" value={estadisticas.SolicitudesPendientes || 0} icon={Clock} color="orange" />
                <StatCard title="Cursos Completados" value={estadisticas.CursosCompletados || 0} icon={Award} color="green" />
                <StatCard title="Horas Capacitación" value={`${estadisticas.HorasCapacitacion || 0}h`} icon={TrendingUp} color="purple" />
              </>
            )}
        </div>

        {/* Tabs */}
        <div style={{
          background: 'white',
          borderRadius: '0.75rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', overflowX: 'auto' }}>
            {tabsDisponibles.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: '1',
                  minWidth: '150px',
                  padding: '1rem',
                  border: 'none',
                  background: activeTab === tab.id ? '#f8fafc' : 'transparent',
                  color: activeTab === tab.id ? '#3b82f6' : '#6b7280',
                  fontWeight: activeTab === tab.id ? '600' : '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem'
                }}
              >
                <tab.icon style={{ width: '1rem', height: '1rem' }} />
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ padding: '2rem' }}>
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1.5rem' }}>
                  Dashboard de Capacitación
                </h3>

                {/* Información del flujo según rol */}
                <div style={{
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '0.5rem',
                  padding: '1.5rem',
                  marginBottom: '2rem'
                }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#0369a1', marginBottom: '1rem' }}>
                    📋 Flujo de Aprobación de Capacitaciones
                  </h4>
                  <div style={{ fontSize: '0.875rem', color: '#0369a1', lineHeight: '1.6' }}>
                    {esColaborador && (
                      <p style={{ margin: 0 }}>
                        <strong>Tu flujo:</strong> Solicitas → Gerente Aprueba → Director Aprueba → RRHH Aprueba Final
                      </p>
                    )}
                    {esGerente && (
                      <p style={{ margin: 0 }}>
                        <strong>Tu flujo:</strong> Solicitas directamente a RRHH | Apruebas solicitudes de tus colaboradores
                      </p>
                    )}
                    {esDirector && (
                      <p style={{ margin: 0 }}>
                        <strong>Tu flujo:</strong> Solicitas directamente a RRHH | Apruebas solicitudes ya aprobadas por gerentes
                      </p>
                    )}
                    {esRRHH && (
                      <p style={{ margin: 0 }}>
                        <strong>Tu rol:</strong> Aprobación final de todas las solicitudes | Creación de cursos disponibles para inscripción
                      </p>
                    )}
                  </div>
                </div>

                {/* Acciones rápidas específicas por rol */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    padding: '1.5rem'
                  }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                      Acciones Principales
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {puedeCrearSolicitudes && (
                        <button
                          onClick={() => setActiveTab('solicitudes')}
                          style={{
                            padding: '0.75rem',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          <Plus style={{ width: '1rem', height: '1rem' }} />
                          Nueva Solicitud de Capacitación
                        </button>
                      )}
                      {puedeCrearCursos && (
                        <button
                          onClick={() => setActiveTab('admin')}
                          style={{
                            padding: '0.75rem',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          <BookOpen style={{ width: '1rem', height: '1rem' }} />
                          Crear Nuevo Curso
                        </button>
                      )}
                      <button
                        onClick={() => setActiveTab('cursos')}
                        style={{
                          padding: '0.75rem',
                          background: '#f59e0b',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <Award style={{ width: '1rem', height: '1rem' }} />
                        Ver Cursos Disponibles
                      </button>
                      {(puedeAprobarGerente || puedeAprobarDirector || puedeAprobarRRHH) && solicitudesPorAprobar.length > 0 && (
                        <button
                          onClick={() => setActiveTab('aprobar')}
                          style={{
                            padding: '0.75rem',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          <UserCheck style={{ width: '1rem', height: '1rem' }} />
                          Revisar Aprobaciones ({solicitudesPorAprobar.length})
                        </button>
                        

                      )}
                    </div>
                  </div>
                        {(esGerente || esDirector || esRRHH) && (
                      <button
                        onClick={() => setActiveTab('historico')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.75rem 1.5rem',
                          background: activeTab === 'historico' ? '#3b82f6' : 'transparent',
                          color: activeTab === 'historico' ? 'white' : '#6b7280',
                          border: 'none',
                          borderBottom: activeTab === 'historico' ? '2px solid #3b82f6' : '2px solid transparent',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          transition: 'all 0.2s'
                        }}
                      >
                        <FileText style={{ width: '1.25rem', height: '1.25rem' }} />
                        Histórico
                      </button>
                    )}

                    {esGerente && (
                      <button
                        onClick={() => setActiveTab('equipo')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.75rem 1.5rem',
                          background: activeTab === 'equipo' ? '#3b82f6' : 'transparent',
                          color: activeTab === 'equipo' ? 'white' : '#6b7280',
                          border: 'none',
                          borderBottom: activeTab === 'equipo' ? '2px solid #3b82f6' : '2px solid transparent',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          transition: 'all 0.2s'
                        }}
                      >
                        <Users style={{ width: '1.25rem', height: '1.25rem' }} />
                        Mi Equipo
                      </button>
                    )}
                  <div style={{
                    background: '#fef3c7',
                    border: '1px solid #fcd34d',
                    borderRadius: '0.5rem',
                    padding: '1.5rem'
                  }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#92400e', marginBottom: '1rem' }}>
                      Resumen Rápido
                    </h4>
                    <div style={{ fontSize: '0.875rem', color: '#92400e', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Solicitudes activas:</span>
                        <strong>{esRRHH ? estadisticas.totalSolicitudes : estadisticas.totalSolicitudes}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Pendientes:</span>
                        <strong>{esRRHH ? estadisticas.pendientesAprobacion : estadisticas.solicitudesPendientes || estadisticas.pendientesAprobacion}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Cursos disponibles:</span>
                        <strong>{cursosDisponibles.length}</strong>
                      </div>
                      {esRRHH && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Presupuesto usado:</span>
                          <strong>${(estadisticas.PresupuestoUtilizado || 0).toLocaleString()}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}


            {/* Solicitudes Tab */}
            {activeTab === 'solicitudes' && puedeCrearSolicitudes && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', margin: 0 }}>
                    Mis Solicitudes de Capacitación
                  </h3>
                  <button
                    onClick={() => setActiveTab('nueva-solicitud')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1.5rem',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus style={{ width: '1rem', height: '1rem' }} />
                    Nueva Solicitud
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {solicitudes.filter(s => s.SolicitanteID === user.empleadoId).map(solicitud => (
                    <div key={solicitud.SolicitudID} style={{
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      padding: '1.5rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0, marginBottom: '0.5rem' }}>
                            {solicitud.Titulo}
                          </h4>
                          <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0, marginBottom: '0.5rem' }}>
                            {solicitud.descripcion}
                          </p>
                          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#374151', marginBottom: '1rem' }}>
                            <span><strong>Proveedor:</strong> {solicitud.Proveedor}</span>
                            <span><strong>Modalidad:</strong> {solicitud.modalidad}</span>
                            <span><strong>Costo:</strong> ${solicitud.Costo}</span>
                            <span><strong>Prioridad:</strong> {solicitud.prioridad}</span>
                          </div>
                          
                          {/* Flujo de aprobación */}
                          <div style={{ marginBottom: '1rem' }}>
                            <p style={{ fontSize: '0.75rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                              Estado del proceso:
                            </p>
                            <FlujoAprobacion solicitud={solicitud} />
                          </div>
                        </div>
                        
                        <span style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '9999px',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            background: solicitud.Estado === 'aprobado_completo' ? '#f0fdf4' :
                                      solicitud.Estado === 'rechazado' ? '#fef2f2' :
                                      solicitud.Estado === 'pendiente_rrhh' ? '#fff7ed' :
                                      solicitud.Estado === 'pendiente_director' ? '#eff6ff' :
                                      solicitud.Estado === 'pendiente_gerente' ? '#fef3c7' : '#f3f4f6',
                            color: solicitud.Estado === 'aprobado_completo' ? '#166534' :
                                  solicitud.Estado === 'rechazado' ? '#991b1b' :
                                  solicitud.Estado === 'pendiente_rrhh' ? '#ea580c' :
                                  solicitud.Estado === 'pendiente_director' ? '#1e40af' :
                                  solicitud.Estado === 'pendiente_gerente' ? '#92400e' : '#374151',
                            border: solicitud.Estado === 'aprobado_completo' ? '1px solid #bbf7d0' :
                                    solicitud.Estado === 'rechazado' ? '1px solid #fecaca' :
                                    '1px solid transparent'
                          }}>
                            {solicitud.Estado === 'aprobado_completo' && '✅ Aprobado Completo'}
                            {solicitud.Estado === 'rechazado' && '❌ Rechazado'}
                            {solicitud.Estado === 'pendiente_rrhh' && '⏳ Pendiente RRHH'}
                            {solicitud.Estado === 'pendiente_director' && '⏳ Pendiente Director'}
                            {solicitud.Estado === 'pendiente_gerente' && '⏳ Pendiente Gerente'}
                            {!['aprobado_completo', 'rechazado', 'pendiente_rrhh', 'pendiente_director', 'pendiente_gerente'].includes(solicitud.Estado) && solicitud.Estado}
                          </span>
                      </div>

                      {Array.isArray(solicitud.comentarios) && solicitud.comentarios.length > 0 && (
                        <div style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '0.375rem',
                          padding: '1rem'
                        }}>
                          <h5 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827', margin: 0, marginBottom: '0.5rem' }}>
                            Comentarios del proceso
                          </h5>
                          {solicitud.comentarios.map((comentario, index) => (
                            <div key={index} style={{ marginBottom: '0.5rem' }}>
                              <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0, marginBottom: '0.25rem' }}>
                                {comentario.autor} - {new Date(comentario.fecha).toLocaleDateString('es-DO')}
                              </p>
                              <p style={{ fontSize: '0.875rem', color: '#111827', margin: 0 }}>
                                {comentario.mensaje}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nueva Solicitud Tab */}
            {activeTab === 'nueva-solicitud' && puedeCrearSolicitudes && (
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1.5rem' }}>
                  Nueva Solicitud de Capacitación
                </h3>
                
                <div style={{
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <p style={{ fontSize: '0.875rem', color: '#0369a1', margin: 0 }}>
                    <strong>📋 Flujo de tu solicitud:</strong> {' '}
                    {esColaborador ? 'Tu Gerente → Director → RRHH' : 'RRHH (aprobación directa)'}
                  </p>
                </div>

                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  padding: '2rem'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                        Título de la Capacitación *
                      </label>
                      <input
                        type="text"
                        value={nuevaSolicitud.titulo}
                        onChange={(e) => setNuevaSolicitud(prev => ({ ...prev, titulo: e.target.value }))}
                        placeholder="Ej: Certificación en React"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                        Proveedor
                      </label>
                      <input
                        type="text"
                        value={nuevaSolicitud.proveedor}
                        onChange={(e) => setNuevaSolicitud(prev => ({ ...prev, proveedor: e.target.value }))}
                        placeholder="Ej: Platzi, Coursera, INFOTEP"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                      Descripción
                    </label>
                    <textarea
                      value={nuevaSolicitud.descripcion}
                      onChange={(e) => setNuevaSolicitud(prev => ({ ...prev, descripcion: e.target.value }))}
                      placeholder="Describe el contenido y objetivos del curso"
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                      Justificación de la Solicitud *
                    </label>
                    <textarea
                      value={nuevaSolicitud.justificacion}
                      onChange={(e) => setNuevaSolicitud(prev => ({ ...prev, justificacion: e.target.value }))}
                      placeholder="Explica por qué necesitas esta capacitación y cómo beneficiará tu trabajo/equipo"
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                        Modalidad
                      </label>
                      <select
                        value={nuevaSolicitud.modalidad}
                        onChange={(e) => setNuevaSolicitud(prev => ({ ...prev, modalidad: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem'
                        }}
                      >
                        <option value="presencial">Presencial</option>
                        <option value="virtual">Virtual</option>
                        <option value="hibrido">Híbrido</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                        Categoría
                      </label>
                      <select
                        value={nuevaSolicitud.categoria}
                        onChange={(e) => setNuevaSolicitud(prev => ({ ...prev, categoria: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem'
                        }}
                      >
                        <option value="tecnica">Técnica</option>
                        <option value="liderazgo">Liderazgo</option>
                        <option value="soft_skills">Habilidades Blandas</option>
                        <option value="idiomas">Idiomas</option>
                        <option value="certificacion">Certificación</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                        Prioridad
                      </label>
                      <select
                        value={nuevaSolicitud.prioridad}
                        onChange={(e) => setNuevaSolicitud(prev => ({ ...prev, prioridad: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem'
                        }}
                      >
                        <option value="baja">Baja</option>
                        <option value="media">Media</option>
                        <option value="alta">Alta</option>
                        <option value="urgente">Urgente</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                        Horas
                      </label>
                      <input
                        type="number"
                        value={nuevaSolicitud.horas}
                        onChange={(e) => setNuevaSolicitud(prev => ({ ...prev, horas: parseInt(e.target.value) || 0 }))}
                        placeholder="0"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                        Fecha de Inicio
                      </label>
                      <input
                        type="date"
                        value={nuevaSolicitud.fechaInicio}
                        onChange={(e) => setNuevaSolicitud(prev => ({ ...prev, fechaInicio: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                        Fecha de Fin
                      </label>
                      <input
                        type="date"
                        value={nuevaSolicitud.fechaFin}
                        onChange={(e) => setNuevaSolicitud(prev => ({ ...prev, fechaFin: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                        Costo (USD)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={nuevaSolicitud.costo}
                        onChange={(e) => setNuevaSolicitud(prev => ({ ...prev, costo: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.00"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => setActiveTab('solicitudes')}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: 'white',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={crearSolicitud}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      <Send style={{ width: '1rem', height: '1rem' }} />
                      Enviar Solicitud
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Cursos Disponibles Tab */}
            {activeTab === 'cursos' && (
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1.5rem' }}>
                  Cursos Disponibles para Inscripción
                </h3>
                
                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <p style={{ fontSize: '0.875rem', color: '#166534', margin: 0 }}>
                    ℹ️ <strong>Estos cursos son creados por RRHH</strong> y están disponibles para inscripción directa. 
                    No requieren proceso de aprobación.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(20rem, 1fr))', gap: '1.5rem' }}>
                  {cursosDisponibles.map(curso => (
                    <div key={curso.CursoID} style={{
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      padding: '1.5rem',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                          <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0 }}>
                            {curso.Titulo}
                          </h4>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Star style={{ width: '1rem', height: '1rem', color: '#f59e0b', fill: '#f59e0b' }} />
                            <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827' }}>
                              {curso.rating || 'Nuevo'}
                            </span>
                          </div>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0, marginBottom: '0.75rem' }}>
                          {curso.descripcion}
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#374151', marginBottom: '0.75rem' }}>
                          <span><strong>Proveedor:</strong> {curso.proveedor}</span>
                          <span><strong>Duración:</strong> {curso.duracion}h</span>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#374151', marginBottom: '0.75rem' }}>
                          <span><strong>Modalidad:</strong> {curso.modalidad}</span>
                          <span><strong>Cupos:</strong> {curso.Inscritos}/{curso.Cupos}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          <span>Creado por: <strong>{curso.creadoPor}</strong></span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981' }}>
                            {curso.costo === 0 ? 'Gratis' : `$${curso.costo}`}
                          </span>
                          <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                            Inicio: {new Date(curso.fechaInicio).toLocaleDateString('es-DO')}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            if (!curso.CursoID) {
                              showErrorMessage('Curso no válido');
                              return;
                            }
                            if (curso.Inscritos >= curso.Cupos) {
                              showErrorMessage('No hay cupos disponibles');
                              return;
                            }
                            inscribirseCurso(curso.CursoID);
                          }}
                          disabled={curso.Inscritos >= curso.Cupos || loading}
                          style={{
                            padding: '0.5rem 1rem',
                            background: (curso.Inscritos >= curso.Cupos || loading) ? '#9ca3af' : '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: (curso.Inscritos >= curso.Cupos || loading) ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {loading ? 'Procesando...' : (curso.Inscritos >= curso.Cupos ? 'Sin Cupos' : 'Inscribirme')}
                        </button>
                      </div>
                      {/* Botón Ver Participantes - Solo para RRHH */}
                      {esRRHH && (
                        <button
                          onClick={() => {
                              console.log('CursoID a enviar:', curso.CursoID, typeof curso.CursoID);
                              if (!curso.CursoID) {
                                showErrorMessage('ID de curso no válido');
                                return;
                              }
                              verParticipantes(parseInt(curso.CursoID));
                            }}
                          style={{
                            padding: '0.5rem 1rem',
                            background: '#6366f1',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            width: '100%',
                            marginTop: '0.5rem'
                          }}
                        >
                          <Users style={{ width: '1rem', height: '1rem' }} />
                          Ver Participantes ({curso.Inscritos || 0})
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab de Aprobaciones */}
            {activeTab === 'aprobar' && (puedeAprobarGerente || puedeAprobarDirector || puedeAprobarRRHH) && (
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1.5rem' }}>
                  Solicitudes Pendientes de Aprobación
                </h3>

                <div style={{
                  background: '#fff7ed',
                  border: '1px solid #fed7aa',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <p style={{ fontSize: '0.875rem', color: '#ea580c', margin: 0 }}>
                    📋 <strong>Tu nivel de aprobación:</strong> {' '}
                    {esGerente && 'Apruebas solicitudes de tus colaboradores directos'}
                    {esDirector && 'Apruebas solicitudes ya aprobadas por gerentes'}
                    {esRRHH && 'Aprobación final de todas las solicitudes'}
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {solicitudesPorAprobar.map(solicitud => (
                    <div key={solicitud.SolicitudID} style={{
                      background: '#fff7ed',
                      border: '1px solid #fed7aa',
                      borderRadius: '0.5rem',
                      padding: '1.5rem'
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(20rem, 1fr))', gap: '1.5rem' }}>
                        {cursosDisponibles.map(curso => (
                          <div key={curso.CursoID} style={{
                            background: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.5rem',
                            padding: '1.5rem',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                          }}>
                            <div style={{ marginBottom: '1rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0 }}>
                                  {curso.Titulo}
                                </h4>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <Star style={{ width: '1rem', height: '1rem', color: '#f59e0b', fill: '#f59e0b' }} />
                                  <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827' }}>
                                    {curso.rating || 'Nuevo'}
                                  </span>
                                </div>
                              </div>
                              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0, marginBottom: '0.75rem' }}>
                                {curso.descripcion}
                              </p>
                              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#374151', marginBottom: '0.75rem' }}>
                                <span><strong>Proveedor:</strong> {curso.proveedor}</span>
                                <span><strong>Duración:</strong> {curso.duracion}h</span>
                              </div>
                              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#374151', marginBottom: '0.75rem' }}>
                                <span><strong>Modalidad:</strong> {curso.modalidad}</span>
                                <span><strong>Cupos:</strong> {curso.Inscritos}/{curso.Cupos}</span>
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                <span>Creado por: <strong>{curso.creadoPor}</strong></span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981' }}>
                                    {curso.costo === 0 ? 'Gratis' : `$${curso.costo}`}
                                  </span>
                                  <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                                    Inicio: {new Date(curso.fechaInicio).toLocaleDateString('es-DO')}
                                  </p>
                                </div>
                                <button
                                  onClick={() => {
                                    if (!curso.CursoID) {
                                      showErrorMessage('Curso no válido');
                                      return;
                                    }
                                    if (curso.Inscritos >= curso.Cupos) {
                                      showErrorMessage('No hay cupos disponibles');
                                      return;
                                    }
                                    inscribirseCurso(curso.CursoID);
                                  }}
                                  disabled={curso.Inscritos >= curso.Cupos || loading}
                                  style={{
                                    padding: '0.5rem 1rem',
                                    background: (curso.Inscritos >= curso.Cupos || loading) ? '#9ca3af' : '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    cursor: (curso.Inscritos >= curso.Cupos || loading) ? 'not-allowed' : 'pointer'
                                  }}
                                >
                                  {loading ? 'Procesando...' : (curso.Inscritos >= curso.Cupos ? 'Sin Cupos' : 'Inscribirme')}
                                </button>
                              </div>

                              {/* Botón Ver Participantes - Solo para RRHH */}
                              {esRRHH && (
                                <button
                                  onClick={() => verParticipantes(curso.id)}
                                  style={{
                                    padding: '0.5rem 1rem',
                                    background: '#6366f1',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    width: '100%'
                                  }}
                                >
                                  👥 Ver Participantes ({curso.inscritos || 0})
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => procesarSolicitud(solicitud.SolicitudID, 'rechazar', `Rechazado por ${user.role} - Revisar justificación`)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          <XCircle style={{ width: '1rem', height: '1rem' }} />
                          Rechazar
                        </button>
                        <button
                          onClick={() => procesarSolicitud(solicitud.SolicitudID, 'aprobar', `Aprobado por ${user.role} - Continúa proceso`)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          <CheckCircle style={{ width: '1rem', height: '1rem' }} />
                          Aprobar
                        </button>
                      </div>
                    </div>
                  ))}

                  {solicitudesPorAprobar.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                      <CheckCircle style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem', color: '#10b981' }} />
                      <h4 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0, marginBottom: '0.5rem' }}>
                        No hay solicitudes pendientes
                      </h4>
                      <p style={{ margin: 0 }}>
                        Todas las solicitudes en tu nivel han sido procesadas
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab Crear Cursos (solo RRHH) */}
           {activeTab === 'admin' && puedeCrearCursos && (
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1.5rem' }}>
                  Crear Nuevo Curso
                </h3>

                <div style={{
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <p style={{ fontSize: '0.875rem', color: '#0369a1', margin: 0 }}>
                    💡 <strong>Los cursos que crees aquí</strong> estarán disponibles para que todos los empleados se inscriban directamente, 
                    sin necesidad de proceso de aprobación.
                  </p>
                </div>

                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  padding: '2rem'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                        Título del Curso *
                      </label>
                      <input
                        type="text"
                        value={nuevoCurso.titulo}
                        onChange={(e) => setNuevoCurso(prev => ({ ...prev, titulo: e.target.value }))}
                        placeholder="Ej: Fundamentos de Excel"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                        Proveedor
                      </label>
                      <input
                        type="text"
                        value={nuevoCurso.proveedor}
                        onChange={(e) => setNuevoCurso(prev => ({ ...prev, proveedor: e.target.value }))}
                        placeholder="Ej: INFOTEP, Interno, Coursera"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                      Descripción del Curso
                    </label>
                    <textarea
                      value={nuevoCurso.descripcion}
                      onChange={(e) => setNuevoCurso(prev => ({ ...prev, descripcion: e.target.value }))}
                      placeholder="Describe los objetivos y contenido del curso"
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                        Modalidad
                      </label>
                      <select
                        value={nuevoCurso.modalidad}
                        onChange={(e) => setNuevoCurso(prev => ({ ...prev, modalidad: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem'
                        }}
                      >
                        <option value="presencial">Presencial</option>
                        <option value="virtual">Virtual</option>
                        <option value="hibrido">Híbrido</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                        Categoría
                      </label>
                      <select
                        value={nuevoCurso.categoria}
                        onChange={(e) => setNuevoCurso(prev => ({ ...prev, categoria: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem'
                        }}
                      >
                        <option value="tecnica">Técnica</option>
                        <option value="liderazgo">Liderazgo</option>
                        <option value="soft_skills">Habilidades Blandas</option>
                        <option value="idiomas">Idiomas</option>
                        <option value="certificacion">Certificación</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                        Duración (horas)
                      </label>
                      <input
                        type="number"
                        value={nuevoCurso.duracion}
                        onChange={(e) => setNuevoCurso(prev => ({ ...prev, duracion: parseInt(e.target.value) || 0 }))}
                        placeholder="0"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                        Cupos Disponibles
                      </label>
                      <input
                        type="number"
                        value={nuevoCurso.cupos}
                        onChange={(e) => setNuevoCurso(prev => ({ ...prev, cupos: parseInt(e.target.value) || 0 }))}
                        placeholder="0"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>
                  </div>

                  {/* NUEVO: Tipo de Acceso */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                      Tipo de Acceso al Curso
                    </label>
                    <div style={{ display: 'flex', gap: '2rem', marginTop: '0.75rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="tipoAcceso"
                          value="abierto"
                          checked={nuevoCurso.tipoAcceso === 'abierto'}
                          onChange={(e) => setNuevoCurso(prev => ({ 
                            ...prev, 
                            tipoAcceso: e.target.value,
                            empleadosSeleccionados: []
                          }))}
                          style={{ width: '1rem', height: '1rem' }}
                        />
                        <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                          <strong>Abierto</strong> - Todos pueden inscribirse
                        </span>
                      </label>
                      
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="tipoAcceso"
                          value="cerrado"
                          checked={nuevoCurso.tipoAcceso === 'cerrado'}
                          onChange={(e) => setNuevoCurso(prev => ({ ...prev, tipoAcceso: e.target.value }))}
                          style={{ width: '1rem', height: '1rem' }}
                        />
                        <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                          <strong>Cerrado</strong> - Solo empleados seleccionados
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* NUEVO: Selector de Empleados (solo si es cerrado) */}
                  {nuevoCurso.tipoAcceso === 'cerrado' && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                        Seleccionar Empleados para el Curso
                      </label>
                      
                      <input
                        type="text"
                        value={busquedaEmpleado}
                        onChange={(e) => setBusquedaEmpleado(e.target.value)}
                        placeholder="Buscar empleado por nombre..."
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          marginBottom: '1rem'
                        }}
                      />
                      
                      <div style={{
                        maxHeight: '15rem',
                        overflowY: 'auto',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.375rem',
                        padding: '0.5rem'
                      }}>
                        {empleadosDisponibles
                        .filter(emp => {
                          const searchTerm = busquedaEmpleado.toLowerCase();
                          const nombre = (emp.nombreCompleto || '').toLowerCase();
                          const cargo = (emp.cargo || '').toLowerCase();
                          const departamento = (emp.departamento || '').toLowerCase();
                          
                          return nombre.includes(searchTerm) || 
                                cargo.includes(searchTerm) || 
                                departamento.includes(searchTerm);
                        })
                        .map(empleado => (
                          <label
                            key={empleado.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.5rem',
                              cursor: 'pointer',
                              borderRadius: '0.25rem',
                              background: nuevoCurso.empleadosSeleccionados.includes(empleado.id) ? '#eff6ff' : 'transparent'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={nuevoCurso.empleadosSeleccionados.includes(empleado.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNuevoCurso(prev => ({
                                    ...prev,
                                    empleadosSeleccionados: [...prev.empleadosSeleccionados, empleado.id]
                                  }));
                                } else {
                                  setNuevoCurso(prev => ({
                                    ...prev,
                                    empleadosSeleccionados: prev.empleadosSeleccionados.filter(id => id !== empleado.id)
                                  }));
                                }
                              }}
                              style={{ width: '1rem', height: '1rem' }}
                            />
                            <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                              {empleado.nombre} {empleado.apellido} - {empleado.cargo || 'Sin cargo'}
                            </span>
                          </label>
                        ))}
                                            </div>
                      
                      <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem', margin: 0 }}>
                        {nuevoCurso.empleadosSeleccionados.length} empleado(s) seleccionado(s)
                      </p>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                        Fecha de Inicio
                      </label>
                      <input
                        type="date"
                        value={nuevoCurso.fechaInicio}
                        onChange={(e) => setNuevoCurso(prev => ({ ...prev, fechaInicio: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                        Costo (USD) - Opcional
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={nuevoCurso.costo}
                        onChange={(e) => setNuevoCurso(prev => ({ ...prev, costo: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.00 (gratis para empleados)"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => setNuevoCurso({
                        titulo: '',
                        descripcion: '',
                        proveedor: '',
                        modalidad: 'presencial',
                        duracion: 0,
                        categoria: 'tecnica',
                        costo: 0,
                        fechaInicio: '',
                        cupos: 0,
                        tipoAcceso: 'abierto',
                        empleadosSeleccionados: []
                      })}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: 'white',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Limpiar
                    </button>
                    <button
                      onClick={crearCurso}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      <Plus style={{ width: '1rem', height: '1rem' }} />
                      Crear Curso
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Continuar con otros tabs... */}
            {/* Progreso Tab */}
            {activeTab === 'progreso' && (
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1.5rem' }}>
                  {esRRHH ? 'Progreso Global de Capacitación' : esGerente || esDirector ? 'Progreso del Equipo' : 'Mi Progreso de Capacitación'}
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {misCursos.map(curso => (
                    <div key={curso.CursoID} style={{
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      padding: '1.5rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0, marginBottom: '0.5rem' }}>
                            {curso.Titulo}
                          </h4>
                          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.75rem' }}>
                            <span>Inicio: {new Date(curso.fechaInicio).toLocaleDateString('es-DO')}</span>
                            <span>Límite: {new Date(curso.fechaLimite).toLocaleDateString('es-DO')}</span>
                            <span>Tipo: {curso.tipo === 'inscripcion' ? 'Inscripción directa' : 'Por solicitud'}</span>
                          </div>
                        </div>
                        <span style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '9999px',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          background: curso.estado === 'completado' ? '#f0fdf4' : 
                                     curso.estado === 'en_progreso' ? '#fff7ed' : '#eff6ff',
                          color: curso.estado === 'completado' ? '#166534' : 
                                 curso.estado === 'en_progreso' ? '#ea580c' : '#2563eb',
                          border: curso.estado === 'completado' ? '1px solid #bbf7d0' : 
                                  curso.estado === 'en_progreso' ? '1px solid #fed7aa' : '1px solid #bfdbfe'
                        }}>
                          {curso.estado === 'completado' ? '✅ Completado' : 
                           curso.estado === 'en_progreso' ? '🔄 En Progreso' : '📝 Inscrito'}
                        </span>
                      </div>

                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                            Progreso
                          </span>
                          <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#3b82f6' }}>
                            {curso.progreso}%
                          </span>
                        </div>
                        <div style={{
                          width: '100%',
                          height: '0.5rem',
                          background: '#e5e7eb',
                          borderRadius: '9999px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${curso.progreso}%`,
                            height: '100%',
                            background: curso.progreso === 100 ? '#10b981' : '#3b82f6',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </div>

                      {curso.estado === 'completado' && (
                        <div style={{
                          background: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          borderRadius: '0.375rem',
                          padding: '1rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div>
                            <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#166534', margin: 0, marginBottom: '0.25rem' }}>
                              ¡Curso Completado!
                            </p>
                            {curso.calificacion && (
                              <p style={{ fontSize: '0.75rem', color: '#166534', margin: 0 }}>
                                Calificación: {curso.calificacion}/100
                              </p>
                            )}
                          </div>
                          {curso.certificado && (
                            <button
                              onClick={() => showSuccessMessage('Certificado descargado (simulado)')}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 1rem',
                                background: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.375rem',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                cursor: 'pointer'
                              }}
                            >
                              <Award style={{ width: '1rem', height: '1rem' }} />
                              Descargar Certificado
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certificados Tab */}
            {activeTab === 'certificados' && (
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1.5rem' }}>
                  {esRRHH ? 'Certificados de Todos los Empleados' : esGerente || esDirector ? 'Certificados del Equipo' : 'Mis Certificados'}
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(20rem, 1fr))', gap: '1.5rem' }}>
                  {certificados.map(certificado => (
                    <div key={certificado.CertificadoID} style={{
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      padding: '1.5rem',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                        <Award style={{ width: '3rem', height: '3rem', color: '#f59e0b', margin: '0 auto 0.5rem' }} />
                        <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0, marginBottom: '0.5rem' }}>
                          {certificado.Titulo}
                        </h4>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                          {certificado.proveedor}
                        </p>
                      </div>

                      <div style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span><strong>Código:</strong></span>
                          <span>{certificado.Codigo}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span><strong>Fecha:</strong></span>
                          <span>{new Date(certificado.fechaObtencion).toLocaleDateString('es-DO')}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span><strong>Vigencia:</strong></span>
                          <span>{new Date(certificado.vigencia).toLocaleDateString('es-DO')}</span>
                        </div>
                      </div>

                      {certificado.descargable && (
                        <button
                          onClick={() => showSuccessMessage('Certificado descargado (simulado)')}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          <Download style={{ width: '1rem', height: '1rem' }} />
                          Descargar PDF
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab Histórico */}
              {activeTab === 'historico' && (esGerente || esDirector || esRRHH) && (
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1.5rem' }}>
                    {esRRHH ? 'Todas las Solicitudes' : 'Solicitudes de Mi Equipo'}
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {todasSolicitudes.map(solicitud => (
                      <div key={solicitud.SolicitudID} style={{
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.5rem',
                        padding: '1.5rem'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0, marginBottom: '0.5rem' }}>
                              {solicitud.Titulo}
                            </h4>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                              <strong>Solicitante:</strong> {solicitud.solicitante} • {new Date(solicitud.FechaSolicitud).toLocaleDateString('es-DO')}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                              <strong>Costo:</strong> ${solicitud.Costo?.toLocaleString()} • <strong>Prioridad:</strong> {solicitud.Prioridad}
                            </div>
                          </div>
                          <span style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '9999px',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            background: solicitud.Estado === 'aprobado_completo' ? '#f0fdf4' :
                                      solicitud.Estado === 'rechazado' ? '#fef2f2' : '#fff7ed',
                            color: solicitud.Estado === 'aprobado_completo' ? '#166534' :
                                  solicitud.Estado === 'rechazado' ? '#dc2626' : '#ea580c'
                          }}>
                            {solicitud.Estado === 'aprobado_completo' ? '✅ Aprobado' :
                            solicitud.Estado === 'rechazado' ? '❌ Rechazado' :
                            solicitud.Estado?.replace('pendiente_', '⏳ Pendiente ').toUpperCase()}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', marginTop: '0.75rem' }}>
                          {solicitud.aprobadoPorGerente && (
                            <span style={{ color: '#10b981' }}>✅ Gerente: {solicitud.aprobadoPorGerente}</span>
                          )}
                          {solicitud.aprobadoPorDirector && (
                            <span style={{ color: '#10b981' }}>✅ Director: {solicitud.aprobadoPorDirector}</span>
                          )}
                          {solicitud.aprobadoPorRRHH && (
                            <span style={{ color: '#10b981' }}>✅ RRHH: {solicitud.aprobadoPorRRHH}</span>
                          )}                          
                        </div>
                        
                        {/* Botón para crear curso (solo RRHH y solicitudes aprobadas completas) */}
                        {esRRHH && solicitud.Estado === 'aprobado_completo' && !solicitud.CursoCreado && (
                          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                            <button
                              onClick={() => crearCursoDesdeSolicitud(solicitud)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.75rem 1.5rem',
                                background: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.375rem',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                cursor: 'pointer'
                              }}
                            >
                              <Plus style={{ width: '1rem', height: '1rem' }} />
                              Crear Curso de esta Solicitud
                            </button>
                          </div>
                        )}
                        
                      </div>
                      
                    ))}
                    

                    {todasSolicitudes.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                        <FileText style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem', opacity: 0.5 }} />
                        <p>No hay solicitudes para mostrar</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab Mi Equipo */}
              {activeTab === 'equipo' && esGerente && (
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1.5rem' }}>
                    Progreso de Capacitación del Equipo
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(20rem, 1fr))', gap: '1.5rem' }}>
                    {miembroEquipo.map(miembro => (
                      <div key={miembro.EmpleadoID} style={{
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.5rem',
                        padding: '1.5rem'
                      }}>
                        <div style={{ marginBottom: '1rem' }}>
                          <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0 }}>
                            {miembro.NombreEmpleado}
                          </h4>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Cursos totales:</span>
                            <strong style={{ color: '#111827' }}>{miembro.TotalCursos || 0}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Completados:</span>
                            <strong style={{ color: '#10b981' }}>{miembro.CursosCompletados || 0}</strong>
                          </div>
                          {/* Modal de Participantes */}
                            {participantesModal.open && (
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
                                  borderRadius: '0.5rem',
                                  padding: '2rem',
                                  maxWidth: '50rem',
                                  width: '90%',
                                  maxHeight: '80vh',
                                  overflow: 'auto',
                                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                                }}>
                                  {/* Header del Modal */}
                                  <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center', 
                                    marginBottom: '1.5rem',
                                    paddingBottom: '1rem',
                                    borderBottom: '2px solid #e5e7eb'
                                  }}>
                                    <h3 style={{ 
                                      fontSize: '1.5rem', 
                                      fontWeight: '600', 
                                      color: '#111827', 
                                      margin: 0,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.5rem'
                                    }}>
                                      <Users style={{ width: '1.5rem', height: '1.5rem', color: '#6366f1' }} />
                                      Participantes Inscritos
                                    </h3>
                                    <button
                                      onClick={cerrarModalParticipantes}
                                      style={{
                                        background: 'transparent',
                                        border: 'none',
                                        fontSize: '1.5rem',
                                        cursor: 'pointer',
                                        color: '#6b7280',
                                        padding: '0.25rem',
                                        display: 'flex',
                                        alignItems: 'center'
                                      }}
                                    >
                                      ✕
                                    </button>
                                  </div>

                                  {/* Contenido del Modal */}
                                  {loadingParticipantes ? (
                                    <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                                      <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
                                      <p>Cargando participantes...</p>
                                    </div>
                                  ) : participantesModal.participantes.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                                      <Users style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem', opacity: 0.5 }} />
                                      <p>No hay participantes inscritos en este curso</p>
                                    </div>
                                  ) : (
                                    <>
                                      {/* Contador de participantes */}
                                      <div style={{
                                        background: '#f0f9ff',
                                        border: '1px solid #bae6fd',
                                        borderRadius: '0.375rem',
                                        padding: '1rem',
                                        marginBottom: '1.5rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                      }}>
                                        <UserCheck style={{ width: '1.25rem', height: '1.25rem', color: '#0369a1' }} />
                                        <span style={{ fontSize: '0.875rem', color: '#0369a1', fontWeight: '500' }}>
                                          Total de inscritos: <strong>{participantesModal.participantes.length}</strong>
                                        </span>
                                      </div>

                                      {/* Lista de Participantes */}
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {participantesModal.participantes.map((participante, index) => (
                                          <div 
                                            key={participante.EmpleadoID || index} 
                                            style={{
                                              background: '#f9fafb',
                                              border: '1px solid #e5e7eb',
                                              borderRadius: '0.375rem',
                                              padding: '1rem',
                                              display: 'flex',
                                              justifyContent: 'space-between',
                                              alignItems: 'center'
                                            }}
                                          >
                                            <div style={{ flex: 1 }}>
                                              <h4 style={{ 
                                                fontSize: '1rem', 
                                                fontWeight: '600', 
                                                color: '#111827', 
                                                margin: 0,
                                                marginBottom: '0.25rem'
                                              }}>
                                                {participante.NombreCompleto || `${participante.Nombre} ${participante.Apellido}`}
                                              </h4>
                                              <div style={{ 
                                                display: 'flex', 
                                                gap: '1rem', 
                                                fontSize: '0.75rem', 
                                                color: '#6b7280',
                                                flexWrap: 'wrap'
                                              }}>
                                                {participante.Cargo && (
                                                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <Building style={{ width: '0.875rem', height: '0.875rem' }} />
                                                    {participante.Cargo}
                                                  </span>
                                                )}
                                                {participante.Departamento && (
                                                  <span>• Dpto: {participante.Departamento}</span>
                                                )}
                                                {participante.FechaInscripcion && (
                                                  <span>• Inscrito: {new Date(participante.FechaInscripcion).toLocaleDateString('es-DO')}</span>
                                                )}
                                              </div>
                                            </div>
                                            
                                            {/* Badge de estado si existe */}
                                            {participante.Estado && (
                                              <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '9999px',
                                                fontSize: '0.75rem',
                                                fontWeight: '500',
                                                background: participante.Estado === 'completado' ? '#f0fdf4' : 
                                                          participante.Estado === 'en_progreso' ? '#fff7ed' : '#eff6ff',
                                                color: participante.Estado === 'completado' ? '#166534' : 
                                                      participante.Estado === 'en_progreso' ? '#ea580c' : '#2563eb'
                                              }}>
                                                {participante.Estado === 'completado' ? '✅ Completado' : 
                                                participante.Estado === 'en_progreso' ? '🔄 En Progreso' : '📝 Inscrito'}
                                              </span>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </>
                                  )}

                                  {/* Botón Cerrar al final */}
                                  <div style={{ 
                                    marginTop: '1.5rem', 
                                    paddingTop: '1rem', 
                                    borderTop: '1px solid #e5e7eb',
                                    display: 'flex',
                                    justifyContent: 'flex-end'
                                  }}>
                                    <button
                                      onClick={cerrarModalParticipantes}
                                      style={{
                                        padding: '0.75rem 1.5rem',
                                        background: '#6b7280',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '0.375rem',
                                        fontSize: '0.875rem',
                                        fontWeight: '500',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      Cerrar
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Progreso promedio:</span>
                            <strong style={{ color: '#3b82f6' }}>{Math.round(miembro.ProgresoPromedio || 0)}%</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Horas capacitadas:</span>
                            <strong style={{ color: '#111827' }}>{miembro.HorasTotales || 0}h</strong>
                          </div>
                        </div>
                      </div>
                    ))}

                    {miembroEquipo.length === 0 && (
                      <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                        <Users style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem', opacity: 0.5 }} />
                        <p>No hay miembros en tu equipo</p>
                      </div>
                    )}
                  </div>
                </div>
              )}


              {/* Modal de Participantes */}
          {participantesModal.open && (
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
                borderRadius: '0.5rem',
                padding: '2rem',
                maxWidth: '50rem',
                width: '90%',
                maxHeight: '80vh',
                overflow: 'auto',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: '1.5rem',
                  paddingBottom: '1rem',
                  borderBottom: '2px solid #e5e7eb'
                }}>
                  <h3 style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: '600', 
                    color: '#111827', 
                    margin: 0
                  }}>
                    👥 Participantes Inscritos
                  </h3>
                  <button
                    onClick={cerrarModalParticipantes}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      fontSize: '1.5rem',
                      cursor: 'pointer',
                      color: '#6b7280'
                    }}
                  >
                    ✕
                  </button>
                </div>

                {loadingParticipantes ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
                    <p>Cargando participantes...</p>
                  </div>
                ) : participantesModal.participantes.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                    <Users style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem', opacity: 0.5 }} />
                    <p>No hay participantes inscritos en este curso</p>
                  </div>
                ) : (
                  <>
                    <div style={{
                      background: '#f0f9ff',
                      border: '1px solid #bae6fd',
                      borderRadius: '0.375rem',
                      padding: '1rem',
                      marginBottom: '1.5rem'
                    }}>
                      <span style={{ fontSize: '0.875rem', color: '#0369a1', fontWeight: '500' }}>
                        Total de inscritos: <strong>{participantesModal.participantes.length}</strong>
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {participantesModal.participantes.map((participante, index) => (
                        <div 
                          key={participante.EmpleadoID || index} 
                          style={{
                            background: '#f9fafb',
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.375rem',
                            padding: '1rem'
                          }}
                        >
                          <h4 style={{ 
                            fontSize: '1rem', 
                            fontWeight: '600', 
                            color: '#111827', 
                            margin: 0,
                            marginBottom: '0.5rem'
                          }}>
                            {participante.NombreCompleto || `${participante.Nombre} ${participante.Apellido}`}
                          </h4>
                          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            {participante.Cargo && <div>📋 {participante.Cargo}</div>}
                            {participante.Departamento && <div>🏢 {participante.Departamento}</div>}
                            {participante.FechaInscripcion && (
                              <div>📅 Inscrito: {new Date(participante.FechaInscripcion).toLocaleDateString('es-DO')}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                  <button
                    onClick={cerrarModalParticipantes}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      cursor: 'pointer'
                    }}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};


export default CapacitacionModule;