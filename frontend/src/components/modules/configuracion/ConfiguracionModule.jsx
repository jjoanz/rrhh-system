import React, { useState, useEffect, useCallback } from 'react';
import { 
  Settings, 
  Building2, 
  Users, 
  DollarSign, 
  Calendar, 
  Clock, 
  GraduationCap, 
  FileText, 
  Database, 
  Shield, 
  Save, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Edit, 
  X, 
  Check, 
  AlertTriangle,
  Info,
  Lock,
  Star,
  TrendingUp,
  UserCheck,
  Key,
  Zap,
  GitBranch,
  Bell,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowDown,
  Filter,
  Search,
  Mail
} from 'lucide-react';

const ConfiguracionModule = () => {
  // Estados principales
  const [seccionActiva, setSeccionActiva] = useState('empresa');
  const [configuraciones, setConfiguraciones] = useState({});
  const [cargando, setCargando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [modalActivo, setModalActivo] = useState(null);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [rolEditando, setRolEditando] = useState(null);

  // Configuraciones iniciales completas
  const configuracionesIniciales = {
    empresa: {
      nombre: 'RRHH Pro Enterprise',
      ruc: '131-12345-1',
      direccion: 'Av. 27 de Febrero #123, Santo Domingo, República Dominicana',
      telefono: '+1 (809) 555-0100',
      email: 'info@rrhh-pro.com',
      sitioWeb: 'https://www.rrhh-pro.com',
      logo: '/api/placeholder/150/150',
      moneda: 'DOP',
      zonaHoraria: 'America/Santo_Domingo',
      codigoEmpresa: 'RRHH001',
      sector: 'Tecnología',
      numeroEmpleados: 50
    },
    usuarios: [
      {
        id: 1,
        nombre: 'Juan Pérez',
        email: 'colaborador@empresa.com',
        rol: 'colaborador',
        estado: 'activo',
        ultimoAcceso: '2024-01-15 09:30:00',
        permisos: ['dashboard', 'perfil', 'vacaciones', 'asistencia', 'nomina', 'capacitacion', 'vacantes'],
        departamento: 'Tecnología',
        fechaCreacion: '2023-02-15',
        createdBy: 'Ana López'
      },
      {
        id: 2,
        nombre: 'María González',
        email: 'gerente@empresa.com',
        rol: 'gerente',
        estado: 'activo',
        ultimoAcceso: '2024-01-15 08:15:00',
        permisos: ['dashboard', 'perfil', 'empleados', 'vacaciones', 'asistencia', 'nomina', 'capacitacion', 'vacantes', 'reportes'],
        departamento: 'Tecnología',
        fechaCreacion: '2021-08-10',
        createdBy: 'Luis Martínez'
      },
      {
        id: 3,
        nombre: 'Carlos Rodríguez',
        email: 'director@empresa.com',
        rol: 'director',
        estado: 'activo',
        ultimoAcceso: '2024-01-15 08:00:00',
        permisos: ['dashboard', 'perfil', 'empleados', 'vacaciones', 'asistencia', 'nomina', 'capacitacion', 'vacantes', 'reportes'],
        departamento: 'Operaciones',
        fechaCreacion: '2019-01-20',
        createdBy: 'Sistema Admin'
      },
      {
        id: 4,
        nombre: 'Ana López',
        email: 'rrhh@empresa.com',
        rol: 'rrhh',
        estado: 'activo',
        ultimoAcceso: '2024-01-15 08:30:00',
        permisos: ['dashboard', 'perfil', 'empleados', 'vacaciones', 'asistencia', 'nomina', 'capacitacion', 'vacantes', 'reportes'],
        departamento: 'Recursos Humanos',
        fechaCreacion: '2022-05-15',
        createdBy: 'Luis Martínez'
      },
      {
        id: 5,
        nombre: 'Luis Martínez',
        email: 'director.rrhh@empresa.com',
        rol: 'director_rrhh',
        estado: 'activo',
        ultimoAcceso: '2024-01-15 07:50:00',
        permisos: ['dashboard', 'perfil', 'empleados', 'vacaciones', 'asistencia', 'nomina', 'capacitacion', 'vacantes', 'reportes', 'configuracion'],
        departamento: 'Recursos Humanos',
        fechaCreacion: '2020-03-08',
        createdBy: 'Sistema Admin'
      },
      {
        id: 6,
        nombre: 'Patricia Morales',
        email: 'gerente.rrhh@empresa.com',
        rol: 'gerente_rrhh',
        estado: 'activo',
        ultimoAcceso: '2024-01-15 08:20:00',
        permisos: ['dashboard', 'perfil', 'empleados', 'vacaciones', 'asistencia', 'nomina', 'capacitacion', 'vacantes', 'reportes'],
        departamento: 'Recursos Humanos',
        fechaCreacion: '2021-11-12',
        createdBy: 'Luis Martínez'
      },
      {
        id: 7,
        nombre: 'Sistema Admin',
        email: 'admin@empresa.com',
        rol: 'admin',
        estado: 'activo',
        ultimoAcceso: '2024-01-15 07:45:00',
        permisos: ['todos'],
        departamento: 'Tecnología',
        fechaCreacion: '2019-01-01',
        createdBy: 'Sistema'
      }
    ],
    roles: {
      admin: {
        nombre: 'Administrador del Sistema',
        descripcion: 'Control total del sistema - Acceso a todas las funciones',
        nivel: 5,
        color: '#dc2626',
        activo: true,
        modulosPermitidos: ['dashboard', 'perfil', 'empleados', 'vacaciones', 'asistencia', 'nomina', 'capacitacion', 'vacantes', 'reportes', 'configuracion'],
        permisos: {
          dashboard: { ver: true, crear: true, editar: true, eliminar: true, exportar: true },
          perfil: { ver: true, crear: true, editar: true, eliminar: true, exportar: true },
          empleados: { ver: true, crear: true, editar: true, eliminar: true, exportar: true },
          vacaciones: { ver: true, crear: true, editar: true, eliminar: true, aprobar: true, exportar: true },
          asistencia: { ver: true, crear: true, editar: true, eliminar: true, exportar: true },
          nomina: { ver: true, crear: true, editar: true, eliminar: true, exportar: true },
          capacitacion: { ver: true, crear: true, editar: true, eliminar: true, aprobar: true, exportar: true },
          vacantes: { ver: true, crear: true, editar: true, eliminar: true, exportar: true },
          reportes: { ver: true, crear: true, editar: true, eliminar: true, exportar: true },
          configuracion: { ver: true, crear: true, editar: true, eliminar: true, exportar: true }
        },
        puedeAprobar: ['vacaciones', 'capacitacion', 'horas_extras', 'permisos', 'anticipos'],
        limitesEspeciales: {
          diasVacacionesMaximas: 999,
          montoAnticipoMaximo: 999999,
          horasExtrasMaximas: 999
        }
      },
      director_rrhh: {
        nombre: 'Director de RRHH',
        descripcion: 'Dirección estratégica de recursos humanos',
        nivel: 4,
        color: '#7c3aed',
        activo: true,
        modulosPermitidos: ['dashboard', 'perfil', 'empleados', 'vacaciones', 'asistencia', 'nomina', 'capacitacion', 'vacantes', 'reportes', 'configuracion'],
        permisos: {
          dashboard: { ver: true, crear: false, editar: false, eliminar: false, exportar: true },
          perfil: { ver: true, crear: false, editar: true, eliminar: false, exportar: false },
          empleados: { ver: true, crear: true, editar: true, eliminar: true, exportar: true },
          vacaciones: { ver: true, crear: true, editar: true, eliminar: false, aprobar: true, exportar: true },
          asistencia: { ver: true, crear: false, editar: true, eliminar: false, exportar: true },
          nomina: { ver: true, crear: true, editar: true, eliminar: false, exportar: true },
          capacitacion: { ver: true, crear: true, editar: true, eliminar: false, aprobar: true, exportar: true },
          vacantes: { ver: true, crear: true, editar: true, eliminar: false, exportar: true },
          reportes: { ver: true, crear: true, editar: false, eliminar: false, exportar: true },
          configuracion: { ver: true, crear: false, editar: true, eliminar: false, exportar: false }
        },
        puedeAprobar: ['vacaciones', 'capacitacion', 'horas_extras', 'anticipos'],
        limitesEspeciales: {
          diasVacacionesMaximas: 30,
          montoAnticipoMaximo: 100000,
          horasExtrasMaximas: 20
        }
      },
      director: {
        nombre: 'Director',
        descripcion: 'Dirección ejecutiva con acceso completo a reportes',
        nivel: 4,
        color: '#ea580c',
        activo: true,
        modulosPermitidos: ['dashboard', 'perfil', 'empleados', 'vacaciones', 'asistencia', 'nomina', 'capacitacion', 'vacantes', 'reportes'],
        permisos: {
          dashboard: { ver: true, crear: false, editar: false, eliminar: false, exportar: true },
          perfil: { ver: true, crear: false, editar: true, eliminar: false, exportar: false },
          empleados: { ver: true, crear: false, editar: false, eliminar: false, exportar: true },
          vacaciones: { ver: true, crear: false, editar: false, eliminar: false, aprobar: true, exportar: true },
          asistencia: { ver: true, crear: false, editar: false, eliminar: false, exportar: true },
          nomina: { ver: true, crear: false, editar: false, eliminar: false, exportar: true },
          capacitacion: { ver: true, crear: false, editar: false, eliminar: false, aprobar: true, exportar: true },
          vacantes: { ver: true, crear: false, editar: false, eliminar: false, exportar: true },
          reportes: { ver: true, crear: false, editar: false, eliminar: false, exportar: true }
        },
        puedeAprobar: ['vacaciones', 'capacitacion', 'horas_extras'],
        limitesEspeciales: {
          diasVacacionesMaximas: 999,
          montoAnticipoMaximo: 50000,
          horasExtrasMaximas: 999
        }
      },
      rrhh: {
        nombre: 'Recursos Humanos',
        descripcion: 'Gestión operativa de recursos humanos',
        nivel: 3,
        color: '#059669',
        activo: true,
        modulosPermitidos: ['dashboard', 'perfil', 'empleados', 'vacaciones', 'asistencia', 'nomina', 'capacitacion', 'vacantes', 'reportes'],
        permisos: {
          dashboard: { ver: true, crear: false, editar: false, eliminar: false, exportar: false },
          perfil: { ver: true, crear: false, editar: true, eliminar: false, exportar: false },
          empleados: { ver: true, crear: true, editar: true, eliminar: false, exportar: true },
          vacaciones: { ver: true, crear: true, editar: true, eliminar: false, aprobar: true, exportar: true },
          asistencia: { ver: true, crear: true, editar: true, eliminar: false, exportar: true },
          nomina: { ver: true, crear: true, editar: true, eliminar: false, exportar: true },
          capacitacion: { ver: true, crear: true, editar: true, eliminar: false, aprobar: false, exportar: true },
          vacantes: { ver: true, crear: true, editar: true, eliminar: false, exportar: true },
          reportes: { ver: true, crear: false, editar: false, eliminar: false, exportar: true }
        },
        puedeAprobar: ['vacaciones', 'horas_extras'],
        limitesEspeciales: {
          diasVacacionesMaximas: 21,
          montoAnticipoMaximo: 25000,
          horasExtrasMaximas: 15
        }
      },
      gerente_rrhh: {
        nombre: 'Gerente de RRHH',
        descripcion: 'Gestión táctica de recursos humanos',
        nivel: 3,
        color: '#0284c7',
        activo: true,
        modulosPermitidos: ['dashboard', 'perfil', 'empleados', 'vacaciones', 'asistencia', 'nomina', 'capacitacion', 'vacantes', 'reportes'],
        permisos: {
          dashboard: { ver: true, crear: false, editar: false, eliminar: false, exportar: false },
          perfil: { ver: true, crear: false, editar: true, eliminar: false, exportar: false },
          empleados: { ver: true, crear: true, editar: true, eliminar: false, exportar: true },
          vacaciones: { ver: true, crear: true, editar: true, eliminar: false, aprobar: true, exportar: true },
          asistencia: { ver: true, crear: false, editar: true, eliminar: false, exportar: true },
          nomina: { ver: true, crear: false, editar: false, eliminar: false, exportar: false },
          capacitacion: { ver: true, crear: true, editar: true, eliminar: false, aprobar: true, exportar: true },
          vacantes: { ver: true, crear: true, editar: true, eliminar: false, exportar: true },
          reportes: { ver: true, crear: false, editar: false, eliminar: false, exportar: true }
        },
        puedeAprobar: ['vacaciones', 'capacitacion'],
        limitesEspeciales: {
          diasVacacionesMaximas: 21,
          montoAnticipoMaximo: 20000,
          horasExtrasMaximas: 12
        }
      },
      gerente: {
        nombre: 'Gerente',
        descripcion: 'Supervisión de equipos y aprobación de solicitudes',
        nivel: 2,
        color: '#7c2d12',
        activo: true,
        modulosPermitidos: ['dashboard', 'perfil', 'empleados', 'vacaciones', 'asistencia', 'nomina', 'capacitacion', 'vacantes', 'reportes'],
        permisos: {
          dashboard: { ver: true, crear: false, editar: false, eliminar: false, exportar: false },
          perfil: { ver: true, crear: false, editar: true, eliminar: false, exportar: false },
          empleados: { ver: true, crear: false, editar: false, eliminar: false, exportar: false },
          vacaciones: { ver: true, crear: false, editar: false, eliminar: false, aprobar: true, exportar: false },
          asistencia: { ver: true, crear: false, editar: false, eliminar: false, exportar: false },
          nomina: { ver: true, crear: false, editar: false, eliminar: false, exportar: false },
          capacitacion: { ver: true, crear: false, editar: false, eliminar: false, aprobar: true, exportar: false },
          vacantes: { ver: true, crear: false, editar: false, eliminar: false, exportar: false },
          reportes: { ver: true, crear: false, editar: false, eliminar: false, exportar: false }
        },
        puedeAprobar: ['vacaciones'],
        limitesEspeciales: {
          diasVacacionesMaximas: 14,
          montoAnticipoMaximo: 0,
          horasExtrasMaximas: 8
        }
      },
      colaborador: {
        nombre: 'Colaborador',
        descripcion: 'Acceso personal a funciones básicas',
        nivel: 1,
        color: '#374151',
        activo: true,
        modulosPermitidos: ['dashboard', 'perfil', 'vacaciones', 'asistencia', 'nomina', 'capacitacion', 'vacantes'],
        permisos: {
          dashboard: { ver: true, crear: false, editar: false, eliminar: false, exportar: false },
          perfil: { ver: true, crear: false, editar: true, eliminar: false, exportar: false },
          vacaciones: { ver: true, crear: true, editar: false, eliminar: false, aprobar: false, exportar: false },
          asistencia: { ver: true, crear: true, editar: false, eliminar: false, exportar: false },
          nomina: { ver: true, crear: false, editar: false, eliminar: false, exportar: false },
          capacitacion: { ver: true, crear: true, editar: false, eliminar: false, aprobar: false, exportar: false },
          vacantes: { ver: true, crear: true, editar: false, eliminar: false, exportar: false }
        },
        puedeAprobar: [],
        limitesEspeciales: {
          diasVacacionesMaximas: 14,
          montoAnticipoMaximo: 0,
          horasExtrasMaximas: 0
        }
      }
    },
    modulos: {
      dashboard: { nombre: 'Dashboard', icono: 'BarChart3', descripcion: 'Panel principal del sistema', activo: true },
      perfil: { nombre: 'Mi Perfil', icono: 'User', descripcion: 'Información personal del usuario', activo: true },
      empleados: { nombre: 'Empleados', icono: 'Users', descripcion: 'Gestión de personal', activo: true },
      vacaciones: { nombre: 'Vacaciones', icono: 'Calendar', descripcion: 'Gestión de tiempo libre', activo: true },
      asistencia: { nombre: 'Asistencia', icono: 'Clock', descripcion: 'Control de horarios', activo: true },
      nomina: { nombre: 'Nómina', icono: 'DollarSign', descripcion: 'Gestión de pagos', activo: true },
      capacitacion: { nombre: 'Capacitación', icono: 'GraduationCap', descripcion: 'Desarrollo profesional', activo: true },
      vacantes: { nombre: 'Vacantes', icono: 'Briefcase', descripcion: 'Reclutamiento', activo: true },
      reportes: { nombre: 'Reportes', icono: 'FileText', descripcion: 'Analytics y reportes', activo: true },
      configuracion: { nombre: 'Configuración', icono: 'Settings', descripcion: 'Configuración del sistema', activo: true }
    },
    flujosAprobacion: {
      vacaciones: {
        nombre: 'Aprobación de Vacaciones',
        descripcion: 'Flujo de aprobación requerido para todas las solicitudes de vacaciones. Tu solicitud será visible para toda la jerarquía de aprobación inmediatamente.',
        activo: true,
        requiereAprobacion: true,
        pasos: [
          { 
            orden: 1, 
            rol: 'gerente', 
            descripcion: 'Aprobación inicial del supervisor directo', 
            obligatorio: true,
            condicion: ''
          },
          { 
            orden: 2, 
            rol: 'director', 
            descripcion: 'Validación y aprobación ejecutiva', 
            obligatorio: true,
            condicion: ''
          },
          { 
            orden: 3, 
            rol: 'director_rrhh', 
            descripcion: 'Aprobación final de Dirección de RRHH', 
            obligatorio: true,
            condicion: ''
          }
        ],
        tiempoMaximoRespuesta: 48, // horas
        escalamiento: {
          activo: true,
          tiempoEscalamiento: 24,
          nivelEscalamiento: 'director_rrhh'
        }
      }
    },
    politicasEmpresa: {
      vacaciones: {
        diasAnuales: 14,
        diasMaximosConsecutivos: 21,
        diasMinimoAnticipacion: 3,
        acumulacionMaxima: 28,
        anticipoMaximoDias: 7,
        periodosBloqueados: [
          { inicio: '12-15', fin: '01-15', descripcion: 'Cierre de año' },
          { inicio: '03-20', fin: '04-05', descripcion: 'Semana Santa' }
        ],
        requiereJustificacion: {
          masde14dias: true,
          fechasEspeciales: true,
          anticipos: true
        }
      },
      asistencia: {
        horarioEntrada: '08:00',
        horarioSalida: '17:00',
        toleranciaEntrada: 15,
        toleranciaSalida: 5,
        descansoAlmuerzo: 60,
        requiereGeolocalización: true,
        radioPermitido: 100,
        horasNormalesDiarias: 8,
        horasExtrasNormales: {
          limite: 2,
          multiplicador: 1.25,
          descripcion: 'Primeras 2 horas extras del día'
        },
        horasSobreExtras: {
          multiplicador: 1.5,
          descripcion: 'Horas después de las primeras 2 horas extras'
        },
        horasNocturnas: {
          horaInicio: '18:00',
          horaFin: '06:00',
          multiplicador: 1.35,
          descripcion: 'Horas trabajadas entre 6:00 PM y 6:00 AM'
        },
        horasFestivas: {
          multiplicador: 2.0,
          descripcion: 'Horas trabajadas en días festivos'
        },
        diasFestivos: [
          '2024-01-01', '2024-01-21', '2024-02-27', '2024-04-18', 
          '2024-04-19', '2024-05-01', '2024-08-16', '2024-09-24', 
          '2024-11-06', '2024-12-25'
        ]
      },
      nomina: {
        periodosPago: 'quincenal',
        diaCorte: 15,
        diaPago: 30,
        impuestoISR: 15,
        seguroSocial: 2.87,
        afp: 2.87,
        ars: 3.04,
        montoExentoISR: 416220,
        horasSemanales: 44,
        horasExtrasMultiplicador: 1.35,
        aguinaldoFormula: 'salario_mensual',
        bonificacionAnual: 0,
        anticiposPermitidos: true,
        montoMaximoAnticipo: 50000,
        descuentoMaximoPorcentaje: 30
      },
      capacitacion: {
        presupuestoAnual: 500000,
        presupuestoPorEmpleado: 10000,
        horasAnualesMinimas: 40,
        horasMaximasAnuales: 120,
        requiereAprobacion: true,
        certificacionesObligatorias: ['Seguridad Laboral', 'Código de Ética', 'Protección de Datos'],
        proveedoresPreferidos: ['INFOTEP', 'INTEC', 'PUCMM', 'UNIBE'],
        evaluacionObligatoria: true,
        tiempoMinimoEvaluacion: 30 // días después del curso
      }
    },
    notificaciones: {
      vacaciones: {
        solicitudCreada: ['gerente', 'rrhh'],
        solicitudAprobada: ['solicitante', 'rrhh'],
        solicitudRechazada: ['solicitante'],
        recordatorioVencimiento: ['solicitante'],
        escalamiento: ['director_rrhh']
      },
      capacitacion: {
        solicitudCreada: ['gerente', 'gerente_rrhh'],
        solicitudAprobada: ['solicitante', 'gerente_rrhh'],
        solicitudRechazada: ['solicitante'],
        cursoProximoVencer: ['solicitante', 'gerente'],
        certificacionObligatoria: ['solicitante', 'rrhh']
      },
      asistencia: {
        tardanza: ['gerente', 'rrhh'],
        horasExtrasExcesivas: ['gerente', 'rrhh'],
        ausenciaSinJustificar: ['gerente', 'rrhh'],
        recordatorioCheckout: ['solicitante']
      },
      sistema: {
        backupCompletado: ['admin'],
        errorSistema: ['admin'],
        mantenimientoProgramado: ['todos'],
        nuevaVersion: ['admin', 'director_rrhh']
      }
    },
    sistema: {
      versionActual: '1.0.0',
      ultimoBackup: '2024-01-14 23:00:00',
      espacioUsado: '2.3 GB',
      espacioTotal: '10 GB',
      sesionesActivas: 12,
      logLevel: 'info',
      mantenimiento: false,
      backupAutomatico: true,
      frecuenciaBackup: 'diario',
      retencionBackups: 30
    }
  };

  // Inicialización
  useEffect(() => {
    setCargando(true);
    setTimeout(() => {
      setConfiguraciones(configuracionesIniciales);
      setCargando(false);
    }, 1000);
  }, []);

  // Función para guardar configuraciones
  const guardarConfiguracion = (seccion, datos) => {
    setCargando(true);
    setTimeout(() => {
      setConfiguraciones(prev => ({
        ...prev,
        [seccion]: { ...prev[seccion], ...datos }
      }));
      setCargando(false);
      setGuardado(true);
      setTimeout(() => setGuardado(false), 3000);
    }, 1000);
  };

  // Función para actualizar permisos de rol
  const actualizarPermisosRol = (rolId, modulo, accion, valor) => {
    const nuevosRoles = { ...configuraciones.roles };
    if (!nuevosRoles[rolId].permisos[modulo]) {
      nuevosRoles[rolId].permisos[modulo] = {};
    }
    nuevosRoles[rolId].permisos[modulo][accion] = valor;
    
    setConfiguraciones(prev => ({
      ...prev,
      roles: nuevosRoles
    }));
  };

  // Función para cambiar rol de usuario
  const cambiarRolUsuario = (usuarioId, nuevoRol) => {
    const nuevosUsuarios = configuraciones.usuarios.map(usuario => 
      usuario.id === usuarioId 
        ? { ...usuario, rol: nuevoRol, permisos: configuraciones.roles[nuevoRol]?.modulosPermitidos || [] }
        : usuario
    );
    
    setConfiguraciones(prev => ({
      ...prev,
      usuarios: nuevosUsuarios
    }));
  };

  // Estilos en línea mejorados
  const styles = {
    container: {
      padding: '24px',
      backgroundColor: '#f8fafc',
      minHeight: '100vh'
    },
    header: {
      marginBottom: '32px'
    },
    title: {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#1f2937',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '8px'
    },
    subtitle: {
      color: '#6b7280',
      fontSize: '16px'
    },
    mainGrid: {
      display: 'grid',
      gridTemplateColumns: '280px 1fr',
      gap: '24px',
      minHeight: '700px'
    },
    sidebar: {
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb',
      padding: '20px',
      height: 'fit-content',
      position: 'sticky',
      top: '20px'
    },
    sidebarTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    menuItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      marginBottom: '4px',
      fontSize: '14px',
      fontWeight: '500'
    },
    menuItemActive: {
      backgroundColor: '#dbeafe',
      color: '#1d4ed8',
      borderLeft: '3px solid #2563eb'
    },
    menuItemInactive: {
      color: '#6b7280',
      backgroundColor: 'transparent'
    },
    content: {
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb',
      padding: '32px',
      minHeight: '700px'
    },
    sectionTitle: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#1f2937',
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    subsectionTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '24px'
    },
    formGroup: {
      marginBottom: '20px'
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151',
      marginBottom: '6px'
    },
    input: {
      width: '100%',
      padding: '10px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      outline: 'none',
      transition: 'border-color 0.2s'
    },
    select: {
      width: '100%',
      padding: '10px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      outline: 'none',
      backgroundColor: 'white'
    },
    textarea: {
      width: '100%',
      padding: '10px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      outline: 'none',
      resize: 'vertical',
      minHeight: '100px'
    },
    button: {
      padding: '10px 20px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    buttonPrimary: {
      backgroundColor: '#2563eb',
      color: 'white'
    },
    buttonSecondary: {
      backgroundColor: '#f3f4f6',
      color: '#374151',
      border: '1px solid #d1d5db'
    },
    buttonSuccess: {
      backgroundColor: '#059669',
      color: 'white'
    },
    buttonDanger: {
      backgroundColor: '#dc2626',
      color: 'white'
    },
    card: {
      backgroundColor: '#f9fafb',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '20px'
    },
    cardWhite: {
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '20px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    },
    cardTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    alertBox: {
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px'
    },
    alertSuccess: {
      backgroundColor: '#d1fae5',
      border: '1px solid #a7f3d0',
      color: '#065f46'
    },
    alertInfo: {
      backgroundColor: '#dbeafe',
      border: '1px solid #93c5fd',
      color: '#1e40af'
    },
    alertWarning: {
      backgroundColor: '#fef3c7',
      border: '1px solid #fde68a',
      color: '#92400e'
    },
    alertDanger: {
      backgroundColor: '#fee2e2',
      border: '1px solid #fecaca',
      color: '#991b1b'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      marginTop: '16px'
    },
    tableHeader: {
      backgroundColor: '#f9fafb',
      borderBottom: '1px solid #e5e7eb'
    },
    tableHeaderCell: {
      padding: '12px 16px',
      textAlign: 'left',
      fontWeight: '500',
      color: '#1f2937',
      fontSize: '14px'
    },
    tableRow: {
      borderBottom: '1px solid #e5e7eb',
      transition: 'background-color 0.2s'
    },
    tableCell: {
      padding: '12px 16px',
      fontSize: '14px',
      color: '#1f2937'
    },
    badge: {
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '500'
    },
    badgeSuccess: {
      backgroundColor: '#d1fae5',
      color: '#065f46'
    },
    badgeDanger: {
      backgroundColor: '#fee2e2',
      color: '#991b1b'
    },
    badgeWarning: {
      backgroundColor: '#fef3c7',
      color: '#92400e'
    },
    badgeInfo: {
      backgroundColor: '#dbeafe',
      color: '#1e40af'
    },
    toggle: {
      position: 'relative',
      display: 'inline-block',
      width: '44px',
      height: '24px'
    },
    toggleInput: {
      opacity: 0,
      width: 0,
      height: 0
    },
    toggleSlider: {
      position: 'absolute',
      cursor: 'pointer',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#d1d5db',
      transition: '0.3s',
      borderRadius: '24px'
    },
    toggleSliderChecked: {
      backgroundColor: '#059669'
    },
    permissionsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
      gap: '8px',
      padding: '12px',
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      border: '1px solid #e5e7eb'
    },
    permissionItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '12px'
    },
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '16px'
    },
    modalContent: {
      backgroundColor: 'white',
      borderRadius: '12px',
      maxWidth: '800px',
      width: '100%',
      maxHeight: '90vh',
      overflow: 'auto'
    },
    modalHeader: {
      padding: '24px',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    modalTitle: {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#1f2937'
    },
    modalBody: {
      padding: '24px'
    }
  };

  // Componente para configuración de empresa
  const ConfiguracionEmpresa = () => {
    const [datos, setDatos] = useState(configuraciones.empresa || {});

    const handleGuardar = () => {
      guardarConfiguracion('empresa', datos);
    };

    return (
      <div>
        <h2 style={styles.sectionTitle}>
          <Building2 size={24} />
          Configuración de la Empresa
        </h2>

        <div style={{...styles.alertBox, ...styles.alertInfo}}>
          <Info size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
          <div>
            <strong>Información corporativa:</strong> Estos datos aparecerán en reportes oficiales, recibos de pago y documentos del sistema.
          </div>
        </div>

        <div style={styles.formGrid}>
          <div style={styles.cardWhite}>
            <h3 style={styles.cardTitle}>
              <Building2 size={20} />
              Información Básica
            </h3>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Nombre de la Empresa *</label>
              <input
                type="text"
                value={datos.nombre || ''}
                onChange={(e) => setDatos({...datos, nombre: e.target.value})}
                style={styles.input}
                placeholder="Nombre completo de la empresa"
                autoComplete="off"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>RNC/RUC *</label>
              <input
                type="text"
                value={datos.ruc || ''}
                onChange={(e) => setDatos({...datos, ruc: e.target.value})}
                style={styles.input}
                placeholder="131-12345-1"
                autoComplete="off"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Código de Empresa</label>
              <input
                type="text"
                value={datos.codigoEmpresa || ''}
                onChange={(e) => setDatos({...datos, codigoEmpresa: e.target.value})}
                style={styles.input}
                placeholder="RRHH001"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Sector</label>
              <select
                value={datos.sector || ''}
                onChange={(e) => setDatos({...datos, sector: e.target.value})}
                style={styles.select}
              >
                <option value="">Seleccionar sector</option>
                <option value="Tecnología">Tecnología</option>
                <option value="Finanzas">Finanzas</option>
                <option value="Salud">Salud</option>
                <option value="Educación">Educación</option>
                <option value="Manufactura">Manufactura</option>
                <option value="Servicios">Servicios</option>
                <option value="Retail">Retail</option>
                <option value="Construcción">Construcción</option>
              </select>
            </div>
          </div>

          <div style={styles.cardWhite}>
            <h3 style={styles.cardTitle}>
              <Mail size={20} />
              Información de Contacto
            </h3>

            <div style={styles.formGroup}>
              <label style={styles.label}>Teléfono Principal</label>
              <input
                type="tel"
                value={datos.telefono || ''}
                onChange={(e) => setDatos({...datos, telefono: e.target.value})}
                style={styles.input}
                placeholder="+1 (809) 555-0100"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Email Corporativo</label>
              <input
                type="email"
                value={datos.email || ''}
                onChange={(e) => setDatos({...datos, email: e.target.value})}
                style={styles.input}
                placeholder="info@empresa.com"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Sitio Web</label>
              <input
                type="url"
                value={datos.sitioWeb || ''}
                onChange={(e) => setDatos({...datos, sitioWeb: e.target.value})}
                style={styles.input}
                placeholder="https://www.empresa.com"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Dirección Completa</label>
              <textarea
                value={datos.direccion || ''}
                onChange={(e) => setDatos({...datos, direccion: e.target.value})}
                style={styles.textarea}
                placeholder="Dirección completa con ciudad y país"
              />
            </div>
          </div>
        </div>

        <div style={styles.formGrid}>
          <div style={styles.cardWhite}>
            <h3 style={styles.cardTitle}>
              <Settings size={20} />
              Configuración Regional
            </h3>

            <div style={styles.formGroup}>
              <label style={styles.label}>Moneda</label>
              <select
                value={datos.moneda || 'DOP'}
                onChange={(e) => setDatos({...datos, moneda: e.target.value})}
                style={styles.select}
              >
                <option value="DOP">Peso Dominicano (DOP)</option>
                <option value="USD">Dólar Estadounidense (USD)</option>
                <option value="EUR">Euro (EUR)</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Zona Horaria</label>
              <select
                value={datos.zonaHoraria || 'America/Santo_Domingo'}
                onChange={(e) => setDatos({...datos, zonaHoraria: e.target.value})}
                style={styles.select}
              >
                <option value="America/Santo_Domingo">Santo Domingo (GMT-4)</option>
                <option value="America/New_York">Nueva York (GMT-5)</option>
                <option value="America/Los_Angeles">Los Ángeles (GMT-8)</option>
                <option value="Europe/Madrid">Madrid (GMT+1)</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Número de Empleados</label>
              <input
                type="number"
                value={datos.numeroEmpleados || ''}
                onChange={(e) => setDatos({...datos, numeroEmpleados: parseInt(e.target.value)})}
                style={styles.input}
                placeholder="50"
              />
            </div>
          </div>
        </div>

        <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
          <button
            onClick={handleGuardar}
            style={{ ...styles.button, ...styles.buttonPrimary }}
            disabled={cargando}
          >
            {cargando ? <RefreshCw size={16} /> : <Save size={16} />}
            {cargando ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    );
  };

  // Componente para gestión de usuarios
  const GestionUsuarios = () => {
    const usuarios = configuraciones.usuarios || [];
    const roles = configuraciones.roles || {};
    
    // Simulación de usuario actual
    const usuarioActual = { rol: 'admin' };
    const esAdmin = usuarioActual.rol === 'admin';

    if (!esAdmin) {
      return (
        <div>
          <h2 style={styles.sectionTitle}>
            <Users size={24} />
            Gestión de Usuarios
          </h2>
          
          <div style={{...styles.alertBox, ...styles.alertDanger}}>
            <Lock size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <strong>Acceso Restringido:</strong> Solo los administradores del sistema pueden gestionar usuarios y roles.
            </div>
          </div>
        </div>
      );
    }

    return (
      <div>
        <h2 style={styles.sectionTitle}>
          <Users size={24} />
          Gestión de Usuarios del Sistema
        </h2>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{...styles.alertBox, ...styles.alertInfo}}>
            <Shield size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
            <span>Los empleados se crean desde el módulo de Empleados por RRHH. Aquí solo se gestionan roles y permisos.</span>
          </div>
        </div>

        <div style={styles.cardWhite}>
          <h3 style={styles.cardTitle}>
            <UserCheck size={20} />
            Usuarios Registrados en el Sistema
          </h3>

          <table style={styles.table}>
            <thead style={styles.tableHeader}>
              <tr>
                <th style={styles.tableHeaderCell}>Usuario</th>
                <th style={styles.tableHeaderCell}>Rol Actual</th>
                <th style={styles.tableHeaderCell}>Departamento</th>
                <th style={styles.tableHeaderCell}>Estado</th>
                <th style={styles.tableHeaderCell}>Creado</th>
                <th style={styles.tableHeaderCell}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => {
                const rolInfo = roles[usuario.rol] || {};
                return (
                  <tr key={usuario.id} style={styles.tableRow}>
                    <td style={styles.tableCell}>
                      <div>
                        <div style={{ fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {usuario.nombre}
                          {usuario.rol === 'admin' && <Shield size={14} color="#dc2626" />}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{usuario.email}</div>
                      </div>
                    </td>
                    <td style={styles.tableCell}>
                      <select
                        value={usuario.rol}
                        onChange={(e) => cambiarRolUsuario(usuario.id, e.target.value)}
                        style={{
                          ...styles.select,
                          fontSize: '12px',
                          padding: '4px 8px',
                          backgroundColor: `${rolInfo.color}10`,
                          border: `1px solid ${rolInfo.color}40`,
                          color: rolInfo.color
                        }}
                      >
                        {Object.entries(roles).map(([roleKey, roleData]) => (
                          <option key={roleKey} value={roleKey}>
                            {roleData.nombre}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={styles.tableCell}>
                      <span style={{...styles.badge, ...styles.badgeInfo}}>
                        {usuario.departamento}
                      </span>
                    </td>
                    <td style={styles.tableCell}>
                      <span style={{
                        ...styles.badge,
                        ...(usuario.estado === 'activo' ? styles.badgeSuccess : styles.badgeDanger)
                      }}>
                        {usuario.estado === 'activo' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={styles.tableCell}>
                      <div style={{ fontSize: '12px' }}>
                        {new Date(usuario.fechaCreacion).toLocaleDateString()}<br/>
                        <span style={{ color: '#6b7280' }}>
                          por {usuario.createdBy}
                        </span>
                      </div>
                    </td>
                    <td style={styles.tableCell}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => {
                            setUsuarioEditando(usuario);
                            setModalActivo('permisosUsuario');
                          }}
                          style={{ 
                            ...styles.button, 
                            padding: '6px 12px', 
                            fontSize: '12px',
                            backgroundColor: '#dbeafe',
                            color: '#1d4ed8'
                          }}
                          title="Ver permisos detallados"
                        >
                          <Key size={14} />
                          Permisos
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Componente para gestión de roles y permisos
  const GestionRoles = () => {
    const roles = configuraciones.roles || {};
    const modulos = configuraciones.modulos || {};

    return (
      <div>
        <h2 style={styles.sectionTitle}>
          <UserCheck size={24} />
          Gestión de Roles y Permisos
        </h2>

        <div style={{...styles.alertBox, ...styles.alertWarning}}>
          <AlertTriangle size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
          <div>
            <strong>Configuración crítica:</strong> Los cambios en permisos afectan inmediatamente a todos los usuarios con ese rol.
          </div>
        </div>

        <div style={styles.cardWhite}>
          <h3 style={styles.cardTitle}>
            <Shield size={20} />
            Roles del Sistema
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            {Object.entries(roles).map(([roleKey, roleData]) => (
              <div key={roleKey} style={{
                ...styles.card,
                borderLeft: `4px solid ${roleData.color}`,
                position: 'relative'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h4 style={{ 
                      color: roleData.color, 
                      fontWeight: 'bold', 
                      fontSize: '16px',
                      marginBottom: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {roleKey === 'admin' && <Shield size={16} />}
                      {roleData.nombre}
                    </h4>
                    <div style={{
                      fontSize: '11px',
                      backgroundColor: `${roleData.color}20`,
                      color: roleData.color,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      display: 'inline-block',
                      marginBottom: '8px'
                    }}>
                      Nivel {roleData.nivel} • {roleData.activo ? 'Activo' : 'Inactivo'}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setRolEditando({...roleData, id: roleKey});
                      setModalActivo('editarRol');
                    }}
                    style={{ 
                      ...styles.button, 
                      padding: '4px 8px', 
                      fontSize: '12px',
                      backgroundColor: `${roleData.color}20`,
                      color: roleData.color
                    }}
                  >
                    <Edit size={14} />
                  </button>
                </div>
                
                <p style={{ 
                  fontSize: '13px', 
                  color: '#6b7280', 
                  marginBottom: '16px',
                  lineHeight: '1.4'
                }}>
                  {roleData.descripcion}
                </p>
                
                <div style={{ marginBottom: '16px' }}>
                  <h5 style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                    PUEDE APROBAR
                  </h5>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {roleData.puedeAprobar?.map(item => (
                      <span key={item} style={{
                        fontSize: '10px',
                        backgroundColor: '#d1fae5',
                        color: '#065f46',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        border: '1px solid #a7f3d0'
                      }}>
                        {item}
                      </span>
                    )) || <span style={{ fontSize: '10px', color: '#6b7280' }}>Sin permisos de aprobación</span>}
                  </div>
                </div>
                
                <div>
                  <h5 style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                    LÍMITES ESPECIALES
                  </h5>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>
                    <div>Vacaciones: {roleData.limitesEspeciales?.diasVacacionesMaximas} días</div>
                    <div>Anticipo: ${roleData.limitesEspeciales?.montoAnticipoMaximo?.toLocaleString()}</div>
                    <div>Horas extras: {roleData.limitesEspeciales?.horasExtrasMaximas}h/semana</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.cardWhite}>
          <h3 style={styles.cardTitle}>
            <Zap size={20} />
            Matriz de Permisos por Módulo
          </h3>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ ...styles.table, fontSize: '12px' }}>
              <thead style={styles.tableHeader}>
                <tr>
                  <th style={{ ...styles.tableHeaderCell, minWidth: '120px' }}>Módulo</th>
                  <th style={{ ...styles.tableHeaderCell, textAlign: 'center' }}>Ver</th>
                  <th style={{ ...styles.tableHeaderCell, textAlign: 'center' }}>Crear</th>
                  <th style={{ ...styles.tableHeaderCell, textAlign: 'center' }}>Editar</th>
                  <th style={{ ...styles.tableHeaderCell, textAlign: 'center' }}>Eliminar</th>
                  <th style={{ ...styles.tableHeaderCell, textAlign: 'center' }}>Aprobar</th>
                  <th style={{ ...styles.tableHeaderCell, textAlign: 'center' }}>Exportar</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(modulos).filter(([key]) => key !== 'configuracion').map(([moduloKey, moduloData]) => (
                  <tr key={moduloKey} style={styles.tableRow}>
                    <td style={{ ...styles.tableCell, fontWeight: '500' }}>
                      {moduloData.nombre}
                    </td>
                    {['ver', 'crear', 'editar', 'eliminar', 'aprobar', 'exportar'].map(accion => (
                      <td key={accion} style={{ ...styles.tableCell, textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                          {Object.entries(roles).map(([roleKey, roleData]) => {
                            const tienePermiso = roleData.permisos[moduloKey]?.[accion] || false;
                            return (
                              <div key={roleKey} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <label style={{ fontSize: '10px', color: roleData.color, marginBottom: '2px' }}>
                                  {roleKey.charAt(0).toUpperCase()}
                                </label>
                                <input
                                  type="checkbox"
                                  checked={tienePermiso}
                                  onChange={(e) => actualizarPermisosRol(roleKey, moduloKey, accion, e.target.checked)}
                                  style={{ 
                                    width: '14px', 
                                    height: '14px',
                                    accentColor: roleData.color
                                  }}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Estados adicionales para flujos
  const [flujoEditando, setFlujoEditando] = useState(null);
  const [nuevoFlujo, setNuevoFlujo] = useState({
    nombre: '',
    descripcion: '',
    activo: true,
    requiereAprobacion: true,
    pasos: [],
    tiempoMaximoRespuesta: 48,
    escalamiento: {
      activo: false,
      tiempoEscalamiento: 24,
      nivelEscalamiento: ''
    }
  });

  // Funciones optimizadas con useCallback para evitar re-renders
  const actualizarNuevoFlujo = useCallback((campo, valor) => {
    setNuevoFlujo(prev => ({ ...prev, [campo]: valor }));
  }, []);

  const actualizarNuevoFlujoEscalamiento = useCallback((campo, valor) => {
    setNuevoFlujo(prev => ({ 
      ...prev, 
      escalamiento: { ...prev.escalamiento, [campo]: valor }
    }));
  }, []);

  const actualizarFlujoEditandoCallback = useCallback((campo, valor) => {
    setFlujoEditando(prev => ({ ...prev, [campo]: valor }));
  }, []);

  const actualizarFlujoEditandoEscalamiento = useCallback((campo, valor) => {
    setFlujoEditando(prev => ({ 
      ...prev, 
      escalamiento: { ...prev.escalamiento, [campo]: valor }
    }));
  }, []);

  // Función para crear nuevo flujo
  const crearNuevoFlujo = () => {
    if (!nuevoFlujo.nombre.trim()) return;
    
    const flujoKey = nuevoFlujo.nombre.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const nuevosFlujosAprobacion = {
      ...configuraciones.flujosAprobacion,
      [flujoKey]: { ...nuevoFlujo }
    };
    
    setConfiguraciones(prev => ({
      ...prev,
      flujosAprobacion: nuevosFlujosAprobacion
    }));
    
    // Reset form
    setNuevoFlujo({
      nombre: '',
      descripcion: '',
      activo: true,
      requiereAprobacion: true,
      pasos: [],
      tiempoMaximoRespuesta: 48,
      escalamiento: {
        activo: false,
        tiempoEscalamiento: 24,
        nivelEscalamiento: ''
      }
    });
    setModalActivo(null);
  };

  // Función para eliminar flujo
  const eliminarFlujo = (flujoKey) => {
    const nuevosFlujosAprobacion = { ...configuraciones.flujosAprobacion };
    delete nuevosFlujosAprobacion[flujoKey];
    
    setConfiguraciones(prev => ({
      ...prev,
      flujosAprobacion: nuevosFlujosAprobacion
    }));
  };

  // Función para actualizar flujo existente
  const actualizarFlujo = (flujoKey, datosActualizados) => {
    const nuevosFlujosAprobacion = {
      ...configuraciones.flujosAprobacion,
      [flujoKey]: { ...configuraciones.flujosAprobacion[flujoKey], ...datosActualizados }
    };
    
    setConfiguraciones(prev => ({
      ...prev,
      flujosAprobacion: nuevosFlujosAprobacion
    }));
  };

  // Función optimizada para agregar paso al flujo
  const agregarPasoFlujoOptimizado = useCallback((flujo, esNuevo) => {
    const nuevoPaso = {
      orden: (flujo.pasos?.length || 0) + 1,
      rol: '',
      descripcion: '',
      obligatorio: true,
      condicion: ''
    };
    
    const pasosActualizados = [...(flujo.pasos || []), nuevoPaso];
    
    if (esNuevo) {
      setNuevoFlujo(prev => ({
        ...prev,
        pasos: pasosActualizados
      }));
    } else {
      setFlujoEditando(prev => ({
        ...prev,
        pasos: pasosActualizados
      }));
    }
  }, []);

  // Funciones optimizadas para pasos
  const actualizarPasoFlujoOptimizado = useCallback((flujo, indice, campo, valor, esNuevo) => {
    const pasosActualizados = flujo.pasos.map((paso, i) => 
      i === indice ? { ...paso, [campo]: valor } : paso
    );
    
    if (esNuevo) {
      setNuevoFlujo(prev => ({
        ...prev,
        pasos: pasosActualizados
      }));
    } else {
      setFlujoEditando(prev => ({
        ...prev,
        pasos: pasosActualizados
      }));
    }
  }, []);

  // Función optimizada para eliminar paso del flujo
  const eliminarPasoFlujoOptimizado = useCallback((flujo, indice, esNuevo) => {
    const pasosActualizados = flujo.pasos.filter((_, i) => i !== indice)
      .map((paso, i) => ({ ...paso, orden: i + 1 }));
    
    if (esNuevo) {
      setNuevoFlujo(prev => ({
        ...prev,
        pasos: pasosActualizados
      }));
    } else {
      setFlujoEditando(prev => ({
        ...prev,
        pasos: pasosActualizados
      }));
    }
  }, []);

  // Componente para flujos de aprobación
  const FlujosAprobacion = () => {
    const flujos = configuraciones.flujosAprobacion || {};
    const roles = configuraciones.roles || {};

    // Simulación de usuario actual
    const usuarioActual = { rol: 'admin' };
    const esAdmin = usuarioActual.rol === 'admin';

    if (!esAdmin) {
      return (
        <div>
          <h2 style={styles.sectionTitle}>
            <GitBranch size={24} />
            Flujos de Aprobación
          </h2>
          
          <div style={{...styles.alertBox, ...styles.alertDanger}}>
            <Lock size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <strong>Acceso Restringido:</strong> Solo los administradores del sistema pueden gestionar flujos de aprobación.
            </div>
          </div>
        </div>
      );
    }

    return (
      <div>
        <h2 style={styles.sectionTitle}>
          <GitBranch size={24} />
          Gestión de Flujos de Aprobación
        </h2>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{...styles.alertBox, ...styles.alertInfo, marginBottom: 0, flex: 1, marginRight: '16px'}}>
            <Info size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <strong>Control total:</strong> Crea y configura flujos de aprobación personalizados para cualquier proceso de tu empresa.
            </div>
          </div>
          
          <button
            onClick={() => setModalActivo('crearFlujo')}
            style={{ ...styles.button, ...styles.buttonPrimary }}
          >
            <Plus size={16} />
            Crear Nuevo Flujo
          </button>
        </div>

        {Object.keys(flujos).length === 0 ? (
          <div style={styles.cardWhite}>
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              <GitBranch size={48} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.5 }} />
              <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>No hay flujos de aprobación configurados</h3>
              <p style={{ marginBottom: '24px' }}>Comienza creando tu primer flujo de aprobación personalizado</p>
              <button
                onClick={() => setModalActivo('crearFlujo')}
                style={{ ...styles.button, ...styles.buttonPrimary }}
              >
                <Plus size={16} />
                Crear Primer Flujo
              </button>
            </div>
          </div>
        ) : (
          Object.entries(flujos).map(([flujoKey, flujoData]) => (
            <div key={flujoKey} style={styles.cardWhite}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h3 style={styles.cardTitle}>
                    <ArrowRight size={20} />
                    {flujoData.nombre || flujoKey.charAt(0).toUpperCase() + flujoKey.slice(1)}
                    <span style={{
                      ...styles.badge,
                      ...(flujoData.activo ? styles.badgeSuccess : styles.badgeDanger),
                      marginLeft: '12px'
                    }}>
                      {flujoData.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </h3>
                  {flujoData.descripcion && (
                    <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '-8px' }}>
                      {flujoData.descripcion}
                    </p>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      setFlujoEditando({ ...flujoData, key: flujoKey });
                      setModalActivo('editarFlujo');
                    }}
                    style={{ 
                      ...styles.button, 
                      padding: '6px 12px', 
                      fontSize: '12px',
                      backgroundColor: '#dbeafe',
                      color: '#1d4ed8'
                    }}
                  >
                    <Edit size={14} />
                    Editar
                  </button>
                  
                  <button
                    onClick={() => {
                      if (window.confirm(`¿Estás seguro de eliminar el flujo "${flujoData.nombre || flujoKey}"?`)) {
                        eliminarFlujo(flujoKey);
                      }
                    }}
                    style={{ 
                      ...styles.button, 
                      padding: '6px 12px', 
                      fontSize: '12px',
                      backgroundColor: '#fee2e2',
                      color: '#dc2626'
                    }}
                  >
                    <Trash2 size={14} />
                    Eliminar
                  </button>
                  
                  <button
                    onClick={() => actualizarFlujo(flujoKey, { activo: !flujoData.activo })}
                    style={{ 
                      ...styles.button, 
                      padding: '6px 12px', 
                      fontSize: '12px',
                      backgroundColor: flujoData.activo ? '#fef3c7' : '#d1fae5',
                      color: flujoData.activo ? '#92400e' : '#065f46'
                    }}
                  >
                    {flujoData.activo ? <EyeOff size={14} /> : <Eye size={14} />}
                    {flujoData.activo ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              </div>

              <div style={styles.formGrid}>
                <div>
                  <h4 style={styles.subsectionTitle}>
                    Pasos de Aprobación ({flujoData.pasos?.length || 0})
                  </h4>
                  
                  {flujoData.pasos && flujoData.pasos.length > 0 ? (
                    flujoData.pasos.map((paso, index) => {
                      const rolInfo = roles[paso.rol] || {};
                      return (
                        <div key={index} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px',
                          backgroundColor: '#f9fafb',
                          borderRadius: '8px',
                          marginBottom: '8px',
                          border: '1px solid #e5e7eb'
                        }}>
                          <div style={{
                            backgroundColor: rolInfo.color || '#6b7280',
                            color: 'white',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>
                            {paso.orden}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '500', color: rolInfo.color }}>
                              {rolInfo.nombre || paso.rol}
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                              {paso.descripcion}
                            </div>
                            {paso.condicion && (
                              <div style={{ fontSize: '11px', color: '#ea580c', fontStyle: 'italic' }}>
                                Condición: {paso.condicion}
                              </div>
                            )}
                          </div>
                          <div>
                            {paso.obligatorio ? (
                              <span style={{...styles.badge, ...styles.badgeDanger}}>Obligatorio</span>
                            ) : (
                              <span style={{...styles.badge, ...styles.badgeWarning}}>Opcional</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ 
                      padding: '20px', 
                      textAlign: 'center', 
                      color: '#6b7280',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      No hay pasos configurados para este flujo
                    </div>
                  )}
                </div>

                <div>
                  <h4 style={styles.subsectionTitle}>Configuración de Tiempos</h4>
                  <div style={styles.card}>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={styles.label}>Tiempo máximo de respuesta</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="number"
                          value={flujoData.tiempoMaximoRespuesta || 48}
                          onChange={(e) => actualizarFlujo(flujoKey, { tiempoMaximoRespuesta: parseInt(e.target.value) })}
                          style={{ ...styles.input, width: '80px' }}
                        />
                        <span style={{ fontSize: '14px', color: '#6b7280' }}>horas</span>
                      </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ ...styles.label, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          checked={flujoData.escalamiento?.activo || false}
                          onChange={(e) => actualizarFlujo(flujoKey, { 
                            escalamiento: { 
                              ...flujoData.escalamiento, 
                              activo: e.target.checked 
                            }
                          })}
                        />
                        Escalamiento Automático
                      </label>
                    </div>

                    {flujoData.escalamiento?.activo && (
                      <div>
                        <div style={{ marginBottom: '12px' }}>
                          <label style={styles.label}>Tiempo para escalamiento (horas)</label>
                          <input
                            type="number"
                            value={flujoData.escalamiento.tiempoEscalamiento || 24}
                            onChange={(e) => actualizarFlujo(flujoKey, { 
                              escalamiento: { 
                                ...flujoData.escalamiento, 
                                tiempoEscalamiento: parseInt(e.target.value) 
                              }
                            })}
                            style={{ ...styles.input, width: '80px' }}
                          />
                        </div>
                        
                        <div>
                          <label style={styles.label}>Escalar a rol</label>
                          <select
                            value={flujoData.escalamiento.nivelEscalamiento || ''}
                            onChange={(e) => actualizarFlujo(flujoKey, { 
                              escalamiento: { 
                                ...flujoData.escalamiento, 
                                nivelEscalamiento: e.target.value 
                              }
                            })}
                            style={styles.select}
                          >
                            <option value="">Seleccionar rol</option>
                            {Object.entries(roles).map(([roleKey, roleData]) => (
                              <option key={roleKey} value={roleKey}>
                                {roleData.nombre}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  // Componente para políticas de empresa
  const PoliticasEmpresa = () => {
    const politicas = configuraciones.politicasEmpresa || {};

    return (
      <div>
        <h2 style={styles.sectionTitle}>
          <FileText size={24} />
          Políticas de la Empresa
        </h2>

        <div style={{...styles.alertBox, ...styles.alertWarning}}>
          <AlertTriangle size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
          <div>
            <strong>Políticas globales:</strong> Estas configuraciones afectan el comportamiento de todos los módulos del sistema.
          </div>
        </div>

        {/* Política de Vacaciones */}
        <div style={styles.cardWhite}>
          <h3 style={styles.cardTitle}>
            <Calendar size={20} />
            Política de Vacaciones
          </h3>

          <div style={styles.formGrid}>
            <div>
              <h4 style={styles.subsectionTitle}>Días y Límites</h4>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Días anuales por empleado</label>
                <input
                  type="number"
                  value={politicas.vacaciones?.diasAnuales || 14}
                  style={styles.input}
                  readOnly
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Máximo días consecutivos</label>
                <input
                  type="number"
                  value={politicas.vacaciones?.diasMaximosConsecutivos || 21}
                  style={styles.input}
                  readOnly
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Días mínimos de anticipación</label>
                <input
                  type="number"
                  value={politicas.vacaciones?.diasMinimoAnticipacion || 3}
                  style={styles.input}
                  readOnly
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Acumulación máxima</label>
                <input
                  type="number"
                  value={politicas.vacaciones?.acumulacionMaxima || 28}
                  style={styles.input}
                  readOnly
                />
              </div>
            </div>

            <div>
              <h4 style={styles.subsectionTitle}>Períodos Bloqueados</h4>
              
              {politicas.vacaciones?.periodosBloqueados?.map((periodo, index) => (
                <div key={index} style={{
                  padding: '12px',
                  backgroundColor: '#fef3c7',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  border: '1px solid #fde68a'
                }}>
                  <div style={{ fontWeight: '500', color: '#92400e' }}>
                    {periodo.inicio} al {periodo.fin}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {periodo.descripcion}
                  </div>
                </div>
              ))}

              <h4 style={{ ...styles.subsectionTitle, marginTop: '24px' }}>Requiere Justificación</h4>
              
              <div style={styles.permissionsGrid}>
                <div style={styles.permissionItem}>
                  <CheckCircle size={14} color="#059669" />
                  <span>Más de 14 días</span>
                </div>
                <div style={styles.permissionItem}>
                  <CheckCircle size={14} color="#059669" />
                  <span>Fechas especiales</span>
                </div>
                <div style={styles.permissionItem}>
                  <CheckCircle size={14} color="#059669" />
                  <span>Anticipos</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Política de Nómina */}
        <div style={styles.cardWhite}>
          <h3 style={styles.cardTitle}>
            <DollarSign size={20} />
            Política de Nómina
          </h3>

          <div style={styles.formGrid}>
            <div>
              <h4 style={styles.subsectionTitle}>Parámetros de Pago</h4>
              
              <div style={styles.card}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px' }}>
                  <div>
                    <strong>Periodo:</strong> {politicas.nomina?.periodosPago}
                  </div>
                  <div>
                    <strong>Día de corte:</strong> {politicas.nomina?.diaCorte}
                  </div>
                  <div>
                    <strong>Día de pago:</strong> {politicas.nomina?.diaPago}
                  </div>
                  <div>
                    <strong>Horas semanales:</strong> {politicas.nomina?.horasSemanales}h
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 style={styles.subsectionTitle}>Parámetros Fiscales</h4>
              
              <div style={styles.card}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                  <div>ISR: {politicas.nomina?.impuestoISR}%</div>
                  <div>Seguro Social: {politicas.nomina?.seguroSocial}%</div>
                  <div>AFP: {politicas.nomina?.afp}%</div>
                  <div>ARS: {politicas.nomina?.ars}%</div>
                </div>
                <div style={{ marginTop: '12px', fontSize: '12px', color: '#6b7280' }}>
                  Monto exento ISR: RD${politicas.nomina?.montoExentoISR?.toLocaleString()}
                </div>
              </div>

              <div style={{ marginTop: '16px' }}>
                <h5 style={styles.subsectionTitle}>Anticipos</h5>
                <div style={{...styles.badge, ...styles.badgeSuccess}}>
                  Permitidos hasta RD${politicas.nomina?.montoMaximoAnticipo?.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Componente para configuración de notificaciones
  const ConfiguracionNotificaciones = () => {
    const notificaciones = configuraciones.notificaciones || {};
    const roles = configuraciones.roles || {};

    return (
      <div>
        <h2 style={styles.sectionTitle}>
          <Bell size={24} />
          Configuración de Notificaciones
        </h2>

        <div style={{...styles.alertBox, ...styles.alertInfo}}>
          <Info size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
          <div>
            <strong>Sistema de notificaciones:</strong> Define quién recibe qué notificaciones y cuándo se envían.
          </div>
        </div>

        {Object.entries(notificaciones).map(([moduloKey, eventos]) => (
          <div key={moduloKey} style={styles.cardWhite}>
            <h3 style={styles.cardTitle}>
              <Bell size={20} />
              Notificaciones de {moduloKey.charAt(0).toUpperCase() + moduloKey.slice(1)}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              {Object.entries(eventos).map(([eventoKey, destinatarios]) => (
                <div key={eventoKey} style={styles.card}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
                    {eventoKey.replace(/([A-Z])/g, ' $1').toLowerCase().replace(/^\w/, c => c.toUpperCase())}
                  </h4>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {Array.isArray(destinatarios) ? destinatarios.map(dest => {
                      const rolInfo = roles[dest] || {};
                      return (
                        <span key={dest} style={{
                          ...styles.badge,
                          backgroundColor: `${rolInfo.color || '#6b7280'}20`,
                          color: rolInfo.color || '#6b7280'
                        }}>
                          {rolInfo.nombre || dest}
                        </span>
                      );
                    }) : (
                      <span style={styles.badge}>
                        {destinatarios}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Modal para permisos de usuario
  const ModalPermisosUsuario = () => {
    if (!usuarioEditando) return null;

    const rolUsuario = configuraciones.roles[usuarioEditando.rol] || {};

    return (
      <div style={styles.modal}>
        <div style={styles.modalContent}>
          <div style={styles.modalHeader}>
            <h3 style={styles.modalTitle}>
              Permisos de {usuarioEditando.nombre}
            </h3>
            <button 
              onClick={() => {
                setModalActivo(null);
                setUsuarioEditando(null);
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <X size={24} color="#6b7280" />
            </button>
          </div>
          
          <div style={styles.modalBody}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                padding: '16px',
                backgroundColor: `${rolUsuario.color}10`,
                borderRadius: '8px',
                border: `1px solid ${rolUsuario.color}40`
              }}>
                <h4 style={{ color: rolUsuario.color, marginBottom: '8px' }}>
                  {rolUsuario.nombre} (Nivel {rolUsuario.nivel})
                </h4>
                <p style={{ fontSize: '14px', color: '#6b7280' }}>
                  {rolUsuario.descripcion}
                </p>
              </div>
            </div>

            <h4 style={styles.subsectionTitle}>Módulos Permitidos</h4>
            <div style={styles.permissionsGrid}>
              {rolUsuario.modulosPermitidos?.map(modulo => (
                <div key={modulo} style={styles.permissionItem}>
                  <CheckCircle size={14} color="#059669" />
                  <span>{configuraciones.modulos[modulo]?.nombre || modulo}</span>
                </div>
              ))}
            </div>

            <h4 style={{ ...styles.subsectionTitle, marginTop: '24px' }}>Puede Aprobar</h4>
            <div style={styles.permissionsGrid}>
              {rolUsuario.puedeAprobar?.length > 0 ? rolUsuario.puedeAprobar.map(item => (
                <div key={item} style={styles.permissionItem}>
                  <CheckCircle size={14} color="#059669" />
                  <span>{item}</span>
                </div>
              )) : (
                <span style={{ fontSize: '12px', color: '#6b7280' }}>Sin permisos de aprobación</span>
              )}
            </div>

            <h4 style={{ ...styles.subsectionTitle, marginTop: '24px' }}>Límites Especiales</h4>
            <div style={styles.card}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', fontSize: '14px' }}>
                <div>
                  <strong>Vacaciones:</strong><br/>
                  {rolUsuario.limitesEspeciales?.diasVacacionesMaximas} días máx.
                </div>
                <div>
                  <strong>Anticipos:</strong><br/>
                  RD${rolUsuario.limitesEspeciales?.montoAnticipoMaximo?.toLocaleString()}
                </div>
                <div>
                  <strong>Horas Extras:</strong><br/>
                  {rolUsuario.limitesEspeciales?.horasExtrasMaximas}h/semana
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Modal para crear nuevo flujo
  const ModalCrearFlujo = () => {
    return (
      <div style={styles.modal}>
        <div style={styles.modalContent}>
          <div style={styles.modalHeader}>
            <h3 style={styles.modalTitle}>
              <Plus size={24} style={{ marginRight: '8px' }} />
              Crear Nuevo Flujo de Aprobación
            </h3>
            <button 
              onClick={() => {
                setModalActivo(null);
                setNuevoFlujo({
                  nombre: '',
                  descripcion: '',
                  activo: true,
                  requiereAprobacion: true,
                  pasos: [],
                  tiempoMaximoRespuesta: 48,
                  escalamiento: {
                    activo: false,
                    tiempoEscalamiento: 24,
                    nivelEscalamiento: ''
                  }
                });
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <X size={24} color="#6b7280" />
            </button>
          </div>
          
          <div style={styles.modalBody}>
            <div style={{...styles.alertBox, ...styles.alertInfo}}>
              <Info size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                Crea un flujo personalizado para cualquier proceso: aprobación de gastos, permisos especiales, cambios de horario, etc.
              </div>
            </div>

            <div style={styles.formGrid}>
              <div>
                <h4 style={styles.subsectionTitle}>Información Básica</h4>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Nombre del Flujo *</label>
                  <input
                    type="text"
                    value={nuevoFlujo.nombre}
                    onChange={(e) => actualizarNuevoFlujo('nombre', e.target.value)}
                    style={styles.input}
                    placeholder="Ej: Aprobación de Gastos, Permisos Especiales, etc."
                    autoComplete="off"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Descripción</label>
                  <textarea
                    value={nuevoFlujo.descripcion}
                    onChange={(e) => actualizarNuevoFlujo('descripcion', e.target.value)}
                    style={styles.textarea}
                    placeholder="Describe cuándo y cómo se usa este flujo de aprobación"
                    autoComplete="off"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={{ ...styles.label, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={nuevoFlujo.activo}
                      onChange={(e) => actualizarNuevoFlujo('activo', e.target.checked)}
                    />
                    Flujo activo
                  </label>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Tiempo máximo de respuesta (horas)</label>
                  <input
                    type="number"
                    value={nuevoFlujo.tiempoMaximoRespuesta}
                    onChange={(e) => actualizarNuevoFlujo('tiempoMaximoRespuesta', parseInt(e.target.value) || 48)}
                    style={styles.input}
                    min="1"
                    max="720"
                    autoComplete="off"
                  />
                </div>
              </div>

              <div>
                <h4 style={styles.subsectionTitle}>Escalamiento Automático</h4>
                
                <div style={styles.formGroup}>
                  <label style={{ ...styles.label, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={nuevoFlujo.escalamiento.activo}
                      onChange={(e) => actualizarNuevoFlujoEscalamiento('activo', e.target.checked)}
                    />
                    Habilitar escalamiento automático
                  </label>
                </div>

                {nuevoFlujo.escalamiento.activo && (
                  <>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Tiempo para escalamiento (horas)</label>
                      <input
                        type="number"
                        value={nuevoFlujo.escalamiento.tiempoEscalamiento}
                        onChange={(e) => actualizarNuevoFlujoEscalamiento('tiempoEscalamiento', parseInt(e.target.value) || 24)}
                        style={styles.input}
                        min="1"
                        max="168"
                        autoComplete="off"
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Escalar a rol</label>
                      <select
                        value={nuevoFlujo.escalamiento.nivelEscalamiento}
                        onChange={(e) => actualizarNuevoFlujoEscalamiento('nivelEscalamiento', e.target.value)}
                        style={styles.select}
                      >
                        <option value="">Seleccionar rol</option>
                        {Object.entries(configuraciones.roles || {}).map(([roleKey, roleData]) => (
                          <option key={roleKey} value={roleKey}>
                            {roleData.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div style={styles.cardWhite}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={styles.subsectionTitle}>
                  Pasos de Aprobación ({nuevoFlujo.pasos.length})
                </h4>
                <button
                  onClick={() => agregarPasoFlujoOptimizado(nuevoFlujo, true)}
                  style={{ ...styles.button, ...styles.buttonPrimary, fontSize: '12px', padding: '6px 12px' }}
                >
                  <Plus size={14} />
                  Agregar Paso
                </button>
              </div>

              {nuevoFlujo.pasos.length === 0 ? (
                <div style={{ 
                  padding: '20px', 
                  textAlign: 'center', 
                  color: '#6b7280',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  No hay pasos configurados. Haz clic en "Agregar Paso" para comenzar.
                </div>
              ) : (
                nuevoFlujo.pasos.map((paso, index) => (
                  <div key={index} style={{
                    padding: '16px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h5 style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                        Paso {paso.orden}
                      </h5>
                      <button
                        onClick={() => eliminarPasoFlujoOptimizado(nuevoFlujo, index, true)}
                        style={{ 
                          ...styles.button, 
                          padding: '4px', 
                          fontSize: '12px',
                          backgroundColor: '#fee2e2',
                          color: '#dc2626'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={styles.label}>Rol que aprueba</label>
                        <select
                          value={paso.rol}
                          onChange={(e) => actualizarPasoFlujoOptimizado(nuevoFlujo, index, 'rol', e.target.value, true)}
                          style={styles.select}
                        >
                          <option value="">Seleccionar rol</option>
                          {Object.entries(configuraciones.roles || {}).map(([roleKey, roleData]) => (
                            <option key={roleKey} value={roleKey}>
                              {roleData.nombre}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ ...styles.label, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="checkbox"
                            checked={paso.obligatorio}
                            onChange={(e) => actualizarPasoFlujoOptimizado(nuevoFlujo, index, 'obligatorio', e.target.checked, true)}
                          />
                          Paso obligatorio
                        </label>
                      </div>
                    </div>

                    <div style={{ marginTop: '12px' }}>
                      <label style={styles.label}>Descripción del paso</label>
                      <input
                        type="text"
                        value={paso.descripcion}
                        onChange={(e) => actualizarPasoFlujoOptimizado(nuevoFlujo, index, 'descripcion', e.target.value, true)}
                        style={styles.input}
                        placeholder="Ej: Revisar documentación y aprobar solicitud"
                        autoComplete="off"
                      />
                    </div>

                    <div style={{ marginTop: '12px' }}>
                      <label style={styles.label}>Condición (opcional)</label>
                      <input
                        type="text"
                        value={paso.condicion}
                        onChange={(e) => actualizarPasoFlujoOptimizado(nuevoFlujo, index, 'condicion', e.target.value, true)}
                        style={styles.input}
                        placeholder="Ej: monto > 1000, días > 5, etc."
                        autoComplete="off"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => {
                  setModalActivo(null);
                  setNuevoFlujo({
                    nombre: '',
                    descripcion: '',
                    activo: true,
                    requiereAprobacion: true,
                    pasos: [],
                    tiempoMaximoRespuesta: 48,
                    escalamiento: {
                      activo: false,
                      tiempoEscalamiento: 24,
                      nivelEscalamiento: ''
                    }
                  });
                }}
                style={{ ...styles.button, ...styles.buttonSecondary }}
              >
                Cancelar
              </button>
              <button
                onClick={crearNuevoFlujo}
                disabled={!nuevoFlujo.nombre.trim()}
                style={{ 
                  ...styles.button, 
                  ...styles.buttonPrimary,
                  opacity: !nuevoFlujo.nombre.trim() ? 0.5 : 1
                }}
              >
                <Save size={16} />
                Crear Flujo
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Modal para editar flujo existente
  const ModalEditarFlujo = () => {
    if (!flujoEditando) return null;

    const guardarCambiosFlujo = () => {
      const { key, ...datosActualizados } = flujoEditando;
      actualizarFlujo(key, datosActualizados);
      setModalActivo(null);
      setFlujoEditando(null);
    };

    return (
      <div style={styles.modal}>
        <div style={styles.modalContent}>
          <div style={styles.modalHeader}>
            <h3 style={styles.modalTitle}>
              <Edit size={24} style={{ marginRight: '8px' }} />
              Editar Flujo: {flujoEditando.nombre || flujoEditando.key}
            </h3>
            <button 
              onClick={() => {
                setModalActivo(null);
                setFlujoEditando(null);
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <X size={24} color="#6b7280" />
            </button>
          </div>
          
          <div style={styles.modalBody}>
            <div style={styles.formGrid}>
              <div>
                <h4 style={styles.subsectionTitle}>Información Básica</h4>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Nombre del Flujo</label>
                  <input
                    type="text"
                    value={flujoEditando.nombre || ''}
                    onChange={(e) => actualizarFlujoEditandoCallback('nombre', e.target.value)}
                    style={styles.input}
                    autoComplete="off"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Descripción</label>
                  <textarea
                    value={flujoEditando.descripcion || ''}
                    onChange={(e) => actualizarFlujoEditandoCallback('descripcion', e.target.value)}
                    style={styles.textarea}
                    autoComplete="off"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Tiempo máximo de respuesta (horas)</label>
                  <input
                    type="number"
                    value={flujoEditando.tiempoMaximoRespuesta || 48}
                    onChange={(e) => actualizarFlujoEditandoCallback('tiempoMaximoRespuesta', parseInt(e.target.value) || 48)}
                    style={styles.input}
                    min="1"
                    max="720"
                    autoComplete="off"
                  />
                </div>
              </div>

              <div>
                <h4 style={styles.subsectionTitle}>Escalamiento Automático</h4>
                
                <div style={styles.formGroup}>
                  <label style={{ ...styles.label, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={flujoEditando.escalamiento?.activo || false}
                      onChange={(e) => actualizarFlujoEditandoEscalamiento('activo', e.target.checked)}
                    />
                    Habilitar escalamiento automático
                  </label>
                </div>

                {flujoEditando.escalamiento?.activo && (
                  <>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Tiempo para escalamiento (horas)</label>
                      <input
                        type="number"
                        value={flujoEditando.escalamiento.tiempoEscalamiento || 24}
                        onChange={(e) => actualizarFlujoEditandoEscalamiento('tiempoEscalamiento', parseInt(e.target.value) || 24)}
                        style={styles.input}
                        min="1"
                        max="168"
                        autoComplete="off"
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Escalar a rol</label>
                      <select
                        value={flujoEditando.escalamiento.nivelEscalamiento || ''}
                        onChange={(e) => actualizarFlujoEditandoEscalamiento('nivelEscalamiento', e.target.value)}
                        style={styles.select}
                      >
                        <option value="">Seleccionar rol</option>
                        {Object.entries(configuraciones.roles || {}).map(([roleKey, roleData]) => (
                          <option key={roleKey} value={roleKey}>
                            {roleData.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div style={styles.cardWhite}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={styles.subsectionTitle}>
                  Pasos de Aprobación ({flujoEditando.pasos?.length || 0})
                </h4>
                <button
                  onClick={() => agregarPasoFlujoOptimizado(flujoEditando, false)}
                  style={{ ...styles.button, ...styles.buttonPrimary, fontSize: '12px', padding: '6px 12px' }}
                >
                  <Plus size={14} />
                  Agregar Paso
                </button>
              </div>

              {(!flujoEditando.pasos || flujoEditando.pasos.length === 0) ? (
                <div style={{ 
                  padding: '20px', 
                  textAlign: 'center', 
                  color: '#6b7280',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  No hay pasos configurados. Haz clic en "Agregar Paso" para comenzar.
                </div>
              ) : (
                flujoEditando.pasos.map((paso, index) => (
                  <div key={index} style={{
                    padding: '16px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h5 style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                        Paso {paso.orden}
                      </h5>
                      <button
                        onClick={() => eliminarPasoFlujoOptimizado(flujoEditando, index, false)}
                        style={{ 
                          ...styles.button, 
                          padding: '4px', 
                          fontSize: '12px',
                          backgroundColor: '#fee2e2',
                          color: '#dc2626'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={styles.label}>Rol que aprueba</label>
                        <select
                          value={paso.rol}
                          onChange={(e) => actualizarPasoFlujoOptimizado(flujoEditando, index, 'rol', e.target.value, false)}
                          style={styles.select}
                        >
                          <option value="">Seleccionar rol</option>
                          {Object.entries(configuraciones.roles || {}).map(([roleKey, roleData]) => (
                            <option key={roleKey} value={roleKey}>
                              {roleData.nombre}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ ...styles.label, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="checkbox"
                            checked={paso.obligatorio}
                            onChange={(e) => actualizarPasoFlujoOptimizado(flujoEditando, index, 'obligatorio', e.target.checked, false)}
                          />
                          Paso obligatorio
                        </label>
                      </div>
                    </div>

                    <div style={{ marginTop: '12px' }}>
                      <label style={styles.label}>Descripción del paso</label>
                      <input
                        type="text"
                        value={paso.descripcion}
                        onChange={(e) => actualizarPasoFlujoOptimizado(flujoEditando, index, 'descripcion', e.target.value, false)}
                        style={styles.input}
                        placeholder="Ej: Revisar documentación y aprobar solicitud"
                        autoComplete="off"
                      />
                    </div>

                    <div style={{ marginTop: '12px' }}>
                      <label style={styles.label}>Condición (opcional)</label>
                      <input
                        type="text"
                        value={paso.condicion || ''}
                        onChange={(e) => actualizarPasoFlujoOptimizado(flujoEditando, index, 'condicion', e.target.value, false)}
                        style={styles.input}
                        placeholder="Ej: monto > 1000, días > 5, etc."
                        autoComplete="off"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => {
                  setModalActivo(null);
                  setFlujoEditando(null);
                }}
                style={{ ...styles.button, ...styles.buttonSecondary }}
              >
                Cancelar
              </button>
              <button
                onClick={guardarCambiosFlujo}
                style={{ ...styles.button, ...styles.buttonPrimary }}
              >
                <Save size={16} />
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Secciones del menú
  const secciones = [
    { id: 'empresa', label: 'Empresa', icon: Building2, component: ConfiguracionEmpresa },
    { id: 'usuarios', label: 'Usuarios', icon: Users, component: GestionUsuarios },
    { id: 'roles', label: 'Roles y Permisos', icon: UserCheck, component: GestionRoles },
    { id: 'flujos', label: 'Flujos de Aprobación', icon: GitBranch, component: FlujosAprobacion },
    { id: 'politicas', label: 'Políticas Empresa', icon: FileText, component: PoliticasEmpresa },
    { id: 'notificaciones', label: 'Notificaciones', icon: Bell, component: ConfiguracionNotificaciones },
    { id: 'sistema', label: 'Estado del Sistema', icon: Database, component: () => <div>Estado del Sistema</div> }
  ];

  const SeccionActiva = secciones.find(s => s.id === seccionActiva)?.component || (() => <div>Sección no encontrada</div>);

  if (cargando && Object.keys(configuraciones).length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite' }} color="#2563eb" />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .menu-item:hover { background-color: #f3f4f6; }
          .table-row:hover { background-color: #f9fafb; }
          .button-primary:hover { background-color: #1d4ed8; }
          .button-secondary:hover { background-color: #e5e7eb; }
          .input:focus, .select:focus, .textarea:focus { 
            border-color: #2563eb; 
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); 
          }
        `}
      </style>

      <div style={styles.header}>
        <h1 style={styles.title}>
          <Settings size={32} color="#2563eb" />
          Centro de Configuración Avanzado
        </h1>
        <p style={styles.subtitle}>
          Control total del sistema RRHH Pro - Roles, permisos, flujos y políticas empresariales
        </p>
      </div>

      {guardado && (
        <div style={{...styles.alertBox, ...styles.alertSuccess, marginBottom: '20px'}}>
          <Check size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
          <span>Configuración guardada exitosamente</span>
        </div>
      )}

      <div style={styles.mainGrid}>
        <div style={styles.sidebar}>
          <h3 style={styles.sidebarTitle}>
            <Settings size={20} />
            Configuraciones
          </h3>
          
          {secciones.map((seccion) => (
            <div
              key={seccion.id}
              onClick={() => setSeccionActiva(seccion.id)}
              style={{
                ...styles.menuItem,
                ...(seccionActiva === seccion.id ? styles.menuItemActive : styles.menuItemInactive)
              }}
              className="menu-item"
            >
              <seccion.icon size={18} />
              {seccion.label}
            </div>
          ))}
        </div>

        <div style={styles.content}>
          <SeccionActiva />
        </div>
      </div>

      {modalActivo === 'permisosUsuario' && <ModalPermisosUsuario />}
      {modalActivo === 'crearFlujo' && <ModalCrearFlujo />}
      {modalActivo === 'editarFlujo' && <ModalEditarFlujo />}
    </div>
  );
};

export default ConfiguracionModule;