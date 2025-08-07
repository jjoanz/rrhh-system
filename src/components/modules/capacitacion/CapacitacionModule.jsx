import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useApp } from '../../../context/AppContext';
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
  const { showSuccessMessage, showErrorMessage } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);

  // Estados principales
  const [solicitudes, setSolicitudes] = useState([]);
  const [cursosDisponibles, setCursosDisponibles] = useState([]);
  const [misCursos, setMisCursos] = useState([]);
  const [certificados, setCertificados] = useState([]);
  const [solicitudesPorAprobar, setSolicitudesPorAprobar] = useState([]);

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
    cupos: 0
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
    cargarDatos();
  }, []);

  const cargarDatos = () => {
    // Solicitudes con estados de flujo jerárquico
    const solicitudesEjemplo = [
      {
        id: 1,
        titulo: 'Certificación en React Avanzado',
        descripcion: 'Curso avanzado de React con hooks, context y mejores prácticas',
        justificacion: 'Necesario para proyecto de modernización del sistema',
        solicitante: user.name,
        solicitanteId: user.id || 1,
        solicitanteRole: user.role,
        fechaSolicitud: '2024-07-15',
        estado: esColaborador ? 'pendiente_gerente' : 'pendiente_rrhh',
        proveedor: 'Platzi',
        modalidad: 'virtual',
        fechaInicio: '2024-08-01',
        fechaFin: '2024-08-30',
        costo: 299,
        categoria: 'tecnica',
        prioridad: 'alta',
        horas: 40,
        flujoAprobacion: {
          gerente: esColaborador ? null : { aprobado: true, fecha: '2024-07-16', nombre: 'Gerente Ejemplo' },
          director: null,
          rrhh: null
        },
        comentarios: []
      },
      {
        id: 2,
        titulo: 'Liderazgo y Gestión de Equipos',
        descripcion: 'Desarrollo de habilidades de liderazgo y gestión efectiva',
        justificacion: 'Promoción reciente a líder de equipo',
        solicitante: 'María García',
        solicitanteId: 2,
        solicitanteRole: 'colaborador',
        fechaSolicitud: '2024-07-10',
        estado: 'aprobado_completo',
        proveedor: 'INFOTEP',
        modalidad: 'presencial',
        fechaInicio: '2024-07-25',
        fechaFin: '2024-07-27',
        costo: 450,
        categoria: 'liderazgo',
        prioridad: 'media',
        horas: 24,
        flujoAprobacion: {
          gerente: { aprobado: true, fecha: '2024-07-11', nombre: 'Juan Pérez' },
          director: { aprobado: true, fecha: '2024-07-12', nombre: 'Ana Director' },
          rrhh: { aprobado: true, fecha: '2024-07-13', nombre: 'RRHH Manager' }
        },
        comentarios: [
          { fecha: '2024-07-11', autor: 'Juan Pérez', mensaje: 'Aprobado por desarrollo del equipo' },
          { fecha: '2024-07-12', autor: 'Ana Director', mensaje: 'Excelente para crecimiento profesional' },
          { fecha: '2024-07-13', autor: 'RRHH Manager', mensaje: 'Presupuesto aprobado. Proceder con inscripción' }
        ]
      }
    ];

    setSolicitudes(solicitudesEjemplo);

    // Cursos disponibles creados por RRHH
    setCursosDisponibles([
      {
        id: 1,
        titulo: 'Introducción a Python',
        descripcion: 'Curso básico de programación en Python para todos los empleados',
        proveedor: 'Coursera',
        modalidad: 'virtual',
        duracion: 30,
        categoria: 'tecnica',
        costo: 0, // Gratis para empleados
        rating: 4.8,
        disponible: true,
        fechaInicio: '2024-08-15',
        cupos: 25,
        inscritos: 12,
        creadoPor: 'RRHH',
        fechaCreacion: '2024-07-01'
      },
      {
        id: 2,
        titulo: 'Comunicación Efectiva',
        descripcion: 'Mejora tus habilidades de comunicación interpersonal',
        proveedor: 'Dale Carnegie',
        modalidad: 'presencial',
        duracion: 16,
        categoria: 'soft_skills',
        costo: 0,
        rating: 4.9,
        disponible: true,
        fechaInicio: '2024-09-01',
        cupos: 15,
        inscritos: 8,
        creadoPor: 'RRHH',
        fechaCreacion: '2024-06-15'
      }
    ]);

    // Mis cursos inscritos
    setMisCursos([
      {
        id: 1,
        titulo: 'Excel Avanzado',
        progreso: 85,
        fechaInicio: '2024-06-01',
        fechaLimite: '2024-07-30',
        estado: 'en_progreso',
        certificado: false,
        calificacion: null,
        tipo: 'inscripcion' // inscripcion o solicitud
      },
      {
        id: 2,
        titulo: 'Gestión de Proyectos',
        progreso: 100,
        fechaInicio: '2024-05-01',
        fechaLimite: '2024-06-15',
        estado: 'completado',
        certificado: true,
        calificacion: 95,
        tipo: 'solicitud'
      }
    ]);

    setCertificados([
      {
        id: 1,
        titulo: 'Gestión de Proyectos',
        fechaObtencion: '2024-06-20',
        proveedor: 'PMI',
        codigo: 'PMI-2024-001234',
        vigencia: '2027-06-20',
        descargable: true
      }
    ]);

    // Cargar solicitudes por aprobar según el rol
    cargarSolicitudesPorAprobar();
  };

  const cargarSolicitudesPorAprobar = () => {
    // Simular solicitudes que necesitan aprobación según el rol
    let solicitudesPendientes = [];

    if (esGerente) {
      // Gerentes ven solicitudes de sus colaboradores
      solicitudesPendientes = [
        {
          id: 3,
          titulo: 'Curso de JavaScript ES6+',
          solicitante: 'Pedro Martínez',
          solicitanteRole: 'colaborador',
          fechaSolicitud: '2024-07-18',
          estado: 'pendiente_gerente',
          costo: 199,
          justificacion: 'Necesario para proyecto web nuevo',
          prioridad: 'alta'
        }
      ];
    }

    if (esDirector) {
      // Directores ven solicitudes aprobadas por gerentes
      solicitudesPendientes = [
        {
          id: 4,
          titulo: 'Certificación PMP',
          solicitante: 'Laura González',
          solicitanteRole: 'gerente',
          fechaSolicitud: '2024-07-17',
          estado: 'pendiente_director',
          costo: 850,
          justificacion: 'Para dirigir proyectos complejos',
          prioridad: 'media',
          aprobadoPorGerente: 'Carlos Supervisor'
        }
      ];
    }

    if (esRRHH) {
      // RRHH ve solicitudes aprobadas por directores
      solicitudesPendientes = [
        {
          id: 5,
          titulo: 'MBA Ejecutivo',
          solicitante: 'Roberto Director',
          solicitanteRole: 'director',
          fechaSolicitud: '2024-07-16',
          estado: 'pendiente_rrhh',
          costo: 2500,
          justificacion: 'Desarrollo estratégico',
          prioridad: 'alta',
          aprobadoPorGerente: 'N/A',
          aprobadoPorDirector: 'Ana Directora General'
        }
      ];
    }

    setSolicitudesPorAprobar(solicitudesPendientes);
  };

  // Crear nueva solicitud con flujo correcto
  const crearSolicitud = () => {
    if (!nuevaSolicitud.titulo.trim()) {
      showErrorMessage('El título es requerido');
      return;
    }

    // Determinar estado inicial según el rol
    let estadoInicial = '';
    if (esColaborador) {
      estadoInicial = 'pendiente_gerente';
    } else if (esGerente || esDirector) {
      estadoInicial = 'pendiente_rrhh';
    }

    const solicitud = {
      ...nuevaSolicitud,
      id: Date.now(),
      solicitante: user.name,
      solicitanteId: user.id || Date.now(),
      solicitanteRole: user.role,
      fechaSolicitud: new Date().toISOString().split('T')[0],
      estado: estadoInicial,
      flujoAprobacion: {
        gerente: esColaborador ? null : { aprobado: true, fecha: new Date().toISOString().split('T')[0], nombre: user.name },
        director: null,
        rrhh: null
      },
      comentarios: []
    };

    setSolicitudes(prev => [solicitud, ...prev]);
    
    // Limpiar formulario
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

    const mensaje = esColaborador 
      ? 'Solicitud enviada a tu gerente para aprobación'
      : 'Solicitud enviada a RRHH para aprobación';
    
    showSuccessMessage(mensaje);
    setActiveTab('solicitudes');
  };

  // Crear nuevo curso (solo RRHH)
  const crearCurso = () => {
    if (!nuevoCurso.titulo.trim()) {
      showErrorMessage('El título del curso es requerido');
      return;
    }

    const curso = {
      ...nuevoCurso,
      id: Date.now(),
      rating: 0,
      disponible: true,
      inscritos: 0,
      creadoPor: user.name,
      fechaCreacion: new Date().toISOString().split('T')[0]
    };

    setCursosDisponibles(prev => [curso, ...prev]);
    
    setNuevoCurso({
      titulo: '',
      descripcion: '',
      proveedor: '',
      modalidad: 'presencial',
      duracion: 0,
      categoria: 'tecnica',
      costo: 0,
      fechaInicio: '',
      cupos: 0
    });

    showSuccessMessage('Curso creado y disponible para inscripciones');
  };

  // Aprobar/Rechazar solicitud según el rol
  const procesarSolicitud = (id, accion, comentario = '') => {
    const solicitud = solicitudesPorAprobar.find(s => s.id === id);
    if (!solicitud) return;

    let nuevoEstado = '';
    let mensajeExito = '';

    if (accion === 'aprobar') {
      if (esGerente && solicitud.estado === 'pendiente_gerente') {
        nuevoEstado = 'pendiente_director';
        mensajeExito = 'Solicitud aprobada y enviada al Director';
      } else if (esDirector && solicitud.estado === 'pendiente_director') {
        nuevoEstado = 'pendiente_rrhh';
        mensajeExito = 'Solicitud aprobada y enviada a RRHH';
      } else if (esRRHH && solicitud.estado === 'pendiente_rrhh') {
        nuevoEstado = 'aprobado_completo';
        mensajeExito = 'Solicitud aprobada completamente. Proceso de capacitación iniciado';
      }
    } else {
      nuevoEstado = 'rechazado';
      mensajeExito = 'Solicitud rechazada';
    }

    // Actualizar en la lista principal
    setSolicitudes(prev => prev.map(s => 
      s.id === id 
        ? {
            ...s,
            estado: nuevoEstado,
            comentarios: [
              ...s.comentarios,
              {
                fecha: new Date().toISOString().split('T')[0],
                autor: user.name,
                mensaje: comentario || `Solicitud ${accion === 'aprobar' ? 'aprobada' : 'rechazada'} por ${user.role}`
              }
            ]
          }
        : s
    ));

    // Remover de solicitudes por aprobar
    setSolicitudesPorAprobar(prev => prev.filter(s => s.id !== id));
    
    showSuccessMessage(mensajeExito);
  };

  // Inscribirse a curso disponible
  const inscribirseCurso = (cursoId) => {
    const curso = cursosDisponibles.find(c => c.id === cursoId);
    if (!curso) return;

    if (curso.inscritos >= curso.cupos) {
      showErrorMessage('No hay cupos disponibles');
      return;
    }

    const nuevoCurso = {
      id: Date.now(),
      titulo: curso.titulo,
      progreso: 0,
      fechaInicio: new Date().toISOString().split('T')[0],
      fechaLimite: curso.fechaInicio,
      estado: 'inscrito',
      certificado: false,
      calificacion: null,
      tipo: 'inscripcion'
    };

    setMisCursos(prev => [nuevoCurso, ...prev]);
    
    // Actualizar contador de inscritos
    setCursosDisponibles(prev => prev.map(c => 
      c.id === cursoId ? { ...c, inscritos: c.inscritos + 1 } : c
    ));

    showSuccessMessage(`Te has inscrito exitosamente a: ${curso.titulo}`);
  };

  // Obtener estadísticas según el rol
  const getEstadisticas = () => {
    if (esRRHH) {
      // RRHH ve estadísticas globales
      return {
        totalSolicitudes: 25,
        pendientesAprobacion: 8,
        cursosCreados: cursosDisponibles.length,
        empleadosCapacitados: 156,
        presupuestoUtilizado: 12500
      };
    } else if (esGerente || esDirector) {
      // Gerentes/Directores ven estadísticas de su área
      return {
        solicitudesEquipo: 12,
        pendientesAprobacion: solicitudesPorAprobar.length,
        cursosCompletados: 8,
        horasCapacitacion: 240
      };
    } else {
      // Colaboradores ven sus estadísticas personales
      const misSolicitudes = solicitudes.filter(s => s.solicitante === user.name);
      return {
        totalSolicitudes: misSolicitudes.length,
        solicitudesPendientes: misSolicitudes.filter(s => s.estado.includes('pendiente')).length,
        cursosCompletados: misCursos.filter(c => c.estado === 'completado').length,
        horasCapacitacion: misCursos.reduce((total, curso) => total + (curso.progreso === 100 ? 40 : 0), 0)
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
                         solicitud.estado.includes(paso.key) ? '#fff7ed' : '#f3f4f6',
              color: paso.estado?.aprobado ? '#166534' : 
                     solicitud.estado.includes(paso.key) ? '#ea580c' : '#6b7280'
            }}>
              {paso.estado?.aprobado ? (
                <CheckCircle style={{ width: '1rem', height: '1rem' }} />
              ) : solicitud.estado.includes(paso.key) ? (
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
    <div style={{ padding: '1.5rem' }}>
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
              <StatCard title="Total Solicitudes" value={estadisticas.totalSolicitudes} icon={FileText} color="blue" />
              <StatCard title="Pendientes Aprobación" value={estadisticas.pendientesAprobacion} icon={Clock} color="orange" />
              <StatCard title="Cursos Creados" value={estadisticas.cursosCreados} icon={BookOpen} color="green" />
              <StatCard title="Empleados Capacitados" value={estadisticas.empleadosCapacitados} icon={Users} color="purple" />
              <StatCard title="Presupuesto Utilizado" value={`$${estadisticas.presupuestoUtilizado.toLocaleString()}`} icon={DollarSign} color="green" />
            </>
          ) : esGerente || esDirector ? (
            <>
              <StatCard title="Solicitudes del Equipo" value={estadisticas.solicitudesEquipo} icon={Users} color="blue" />
              <StatCard title="Pendientes Aprobación" value={estadisticas.pendientesAprobacion} icon={Clock} color="orange" />
              <StatCard title="Cursos Completados" value={estadisticas.cursosCompletados} icon={Award} color="green" />
              <StatCard title="Horas de Capacitación" value={`${estadisticas.horasCapacitacion}h`} icon={TrendingUp} color="purple" />
            </>
          ) : (
            <>
              <StatCard title="Mis Solicitudes" value={estadisticas.totalSolicitudes} icon={FileText} color="blue" />
              <StatCard title="Pendientes" value={estadisticas.solicitudesPendientes} icon={Clock} color="orange" />
              <StatCard title="Cursos Completados" value={estadisticas.cursosCompletados} icon={Award} color="green" />
              <StatCard title="Horas Capacitación" value={`${estadisticas.horasCapacitacion}h`} icon={TrendingUp} color="purple" />
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
                          <strong>${estadisticas.presupuestoUtilizado.toLocaleString()}</strong>
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
                  {solicitudes.filter(s => s.solicitante === user.name).map(solicitud => (
                    <div key={solicitud.id} style={{
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      padding: '1.5rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0, marginBottom: '0.5rem' }}>
                            {solicitud.titulo}
                          </h4>
                          <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0, marginBottom: '0.5rem' }}>
                            {solicitud.descripcion}
                          </p>
                          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#374151', marginBottom: '1rem' }}>
                            <span><strong>Proveedor:</strong> {solicitud.proveedor}</span>
                            <span><strong>Modalidad:</strong> {solicitud.modalidad}</span>
                            <span><strong>Costo:</strong> ${solicitud.costo}</span>
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
                          background: solicitud.estado === 'aprobado_completo' ? '#f0fdf4' : 
                                     solicitud.estado === 'rechazado' ? '#fef2f2' : '#fff7ed',
                          color: solicitud.estado === 'aprobado_completo' ? '#166534' : 
                                 solicitud.estado === 'rechazado' ? '#dc2626' : '#ea580c',
                          border: solicitud.estado === 'aprobado_completo' ? '1px solid #bbf7d0' : 
                                  solicitud.estado === 'rechazado' ? '1px solid #fecaca' : '1px solid #fed7aa'
                        }}>
                          {solicitud.estado === 'aprobado_completo' ? '✅ Aprobado Completo' : 
                           solicitud.estado === 'rechazado' ? '❌ Rechazado' : 
                           solicitud.estado === 'pendiente_gerente' ? '⏳ Pendiente Gerente' :
                           solicitud.estado === 'pendiente_director' ? '⏳ Pendiente Director' :
                           '⏳ Pendiente RRHH'}
                        </span>
                      </div>

                      {solicitud.comentarios.length > 0 && (
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
                    <div key={curso.id} style={{
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      padding: '1.5rem',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                          <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0 }}>
                            {curso.titulo}
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
                          <span><strong>Cupos:</strong> {curso.inscritos}/{curso.cupos}</span>
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
                          onClick={() => inscribirseCurso(curso.id)}
                          disabled={curso.inscritos >= curso.cupos}
                          style={{
                            padding: '0.5rem 1rem',
                            background: curso.inscritos >= curso.cupos ? '#9ca3af' : '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: curso.inscritos >= curso.cupos ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {curso.inscritos >= curso.cupos ? 'Sin Cupos' : 'Inscribirme'}
                        </button>
                      </div>
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
                    <div key={solicitud.id} style={{
                      background: '#fff7ed',
                      border: '1px solid #fed7aa',
                      borderRadius: '0.5rem',
                      padding: '1.5rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0, marginBottom: '0.5rem' }}>
                            {solicitud.titulo}
                          </h4>
                          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.75rem' }}>
                            <span><strong>Solicitado por:</strong> {solicitud.solicitante} ({solicitud.solicitanteRole})</span>
                            <span><strong>Fecha:</strong> {new Date(solicitud.fechaSolicitud).toLocaleDateString('es-DO')}</span>
                          </div>
                          <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0, marginBottom: '0.75rem' }}>
                            <strong>Justificación:</strong> {solicitud.justificacion}
                          </p>
                          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#374151', marginBottom: '0.75rem' }}>
                            <span><strong>Costo:</strong> ${solicitud.costo}</span>
                            <span><strong>Prioridad:</strong> {solicitud.prioridad}</span>
                          </div>
                          
                          {/* Mostrar aprobaciones previas */}
                          {(solicitud.aprobadoPorGerente || solicitud.aprobadoPorDirector) && (
                            <div style={{
                              background: '#f0fdf4',
                              border: '1px solid #bbf7d0',
                              borderRadius: '0.375rem',
                              padding: '0.75rem',
                              fontSize: '0.75rem',
                              color: '#166534'
                            }}>
                              {solicitud.aprobadoPorGerente && (
                                <p style={{ margin: 0 }}>✅ Aprobado por Gerente: {solicitud.aprobadoPorGerente}</p>
                              )}
                              {solicitud.aprobadoPorDirector && (
                                <p style={{ margin: 0 }}>✅ Aprobado por Director: {solicitud.aprobadoPorDirector}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => procesarSolicitud(solicitud.id, 'rechazar', `Rechazado por ${user.role} - Revisar justificación`)}
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
                          onClick={() => procesarSolicitud(solicitud.id, 'aprobar', `Aprobado por ${user.role} - Continúa proceso`)}
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
                        cupos: 0
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
                    <div key={curso.id} style={{
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      padding: '1.5rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0, marginBottom: '0.5rem' }}>
                            {curso.titulo}
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
                    <div key={certificado.id} style={{
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      padding: '1.5rem',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                        <Award style={{ width: '3rem', height: '3rem', color: '#f59e0b', margin: '0 auto 0.5rem' }} />
                        <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0, marginBottom: '0.5rem' }}>
                          {certificado.titulo}
                        </h4>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                          {certificado.proveedor}
                        </p>
                      </div>

                      <div style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span><strong>Código:</strong></span>
                          <span>{certificado.codigo}</span>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default CapacitacionModule;