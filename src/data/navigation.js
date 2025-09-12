import { 
  Home, 
  User, 
  Users, 
  Calendar, 
  Clock, 
  DollarSign, 
  BookOpen, 
  Briefcase, 
  Settings,
  BarChart3,
  FileText
} from 'lucide-react';

// Configuración de navegación por rol
export const NAVIGATION_CONFIG = {
  colaborador: [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: Home,
      description: 'Resumen general de tu información'
    },
    { 
      id: 'perfil', 
      label: 'Mi Perfil', 
      icon: User,
      description: 'Información personal y configuración'
    },
    { 
      id: 'vacaciones', 
      label: 'Vacaciones', 
      icon: Calendar,
      description: 'Solicitar y gestionar vacaciones'
    },
    { 
      id: 'asistencia', 
      label: 'Asistencia', 
      icon: Clock,
      description: 'Registro de entrada y salida'
    },
    { 
      id: 'capacitacion', 
      label: 'Capacitación', 
      icon: BookOpen,
      description: 'Solicitar y gestionar capacitaciones'
    },
    { 
      id: 'vacantes', 
      label: 'Vacantes', 
      icon: Briefcase,
      description: 'Explorar oportunidades internas'
    }
  ],
  
  gerente: [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: Home,
      description: 'Resumen de tu equipo y métricas'
    },
    { 
      id: 'perfil', 
      label: 'Mi Perfil', 
      icon: User,
      description: 'Información personal'
    },
    { 
      id: 'equipo', 
      label: 'Mi Equipo', 
      icon: Users,
      description: 'Gestionar colaboradores directos'
    },
    { 
      id: 'vacaciones', 
      label: 'Vacaciones', 
      icon: Calendar,
      description: 'Aprobar solicitudes de vacaciones'
    },
    { 
      id: 'asistencia', 
      label: 'Asistencia', 
      icon: Clock,
      description: 'Supervisar asistencia del equipo'
    },
    { 
      id: 'nomina', 
      label: 'Nómina', 
      icon: DollarSign,
      description: 'Información salarial'
    },
    { 
      id: 'capacitacion', 
      label: 'Capacitación', 
      icon: BookOpen,
      description: 'Proponer y gestionar capacitaciones del equipo'
    },
    { 
      id: 'vacantes', 
      label: 'Vacantes', 
      icon: Briefcase,
      description: 'Gestionar vacantes del área'
    }
  ],
  
  director: [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: Home,
      description: 'Vista ejecutiva de la organización'
    },
    { 
      id: 'perfil', 
      label: 'Mi Perfil', 
      icon: User,
      description: 'Información personal'
    },
    { 
      id: 'equipos', 
      label: 'Equipos', 
      icon: Users,
      description: 'Supervisar múltiples equipos'
    },
    { 
      id: 'vacaciones', 
      label: 'Vacaciones', 
      icon: Calendar,
      description: 'Aprobar vacaciones de alto nivel'
    },
    { 
      id: 'asistencia', 
      label: 'Asistencia', 
      icon: Clock,
      description: 'Reportes de asistencia general'
    },
    { 
      id: 'nomina', 
      label: 'Nómina', 
      icon: DollarSign,
      description: 'Información salarial ejecutiva'
    },
    { 
      id: 'capacitacion', 
      label: 'Capacitación', 
      icon: BookOpen,
      description: 'Estrategia de capacitación y aprobaciones'
    },
    { 
      id: 'vacantes', 
      label: 'Vacantes', 
      icon: Briefcase,
      description: 'Aprobar vacantes estratégicas'
    },
    { 
      id: 'reportes', 
      label: 'Reportes', 
      icon: BarChart3,
      description: 'Métricas y analytics ejecutivos'
    }
  ],
  
  rrhh: [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: Home,
      description: 'Panel de control de RRHH'
    },
    { 
      id: 'perfil', 
      label: 'Mi Perfil', 
      icon: User,
      description: 'Información personal'
    },
    { 
      id: 'empleados', 
      label: 'Empleados', 
      icon: Users,
      description: 'Gestión completa de personal'
    },
    { 
      id: 'vacaciones', 
      label: 'Vacaciones', 
      icon: Calendar,
      description: 'Administrar todas las vacaciones'
    },
    { 
      id: 'asistencia', 
      label: 'Asistencia', 
      icon: Clock,
      description: 'Control de asistencia general'
    },
    { 
      id: 'nomina', 
      label: 'Nómina', 
      icon: DollarSign,
      description: 'Procesamiento de nóminas'
    },
    { 
      id: 'capacitacion', 
      label: 'Capacitación', 
      icon: BookOpen,
      description: 'Administrar capacitaciones y crear cursos'
    },
    { 
      id: 'vacantes', 
      label: 'Vacantes', 
      icon: Briefcase,
      description: 'Gestión de reclutamiento'
    },
    { 
      id: 'reportes', 
      label: 'Reportes', 
      icon: BarChart3,
      description: 'Reportes de recursos humanos'
    }
  ],
  
  director_rrhh: [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: Home,
      description: 'Dashboard estratégico de RRHH'
    },
    { 
      id: 'perfil', 
      label: 'Mi Perfil', 
      icon: User,
      description: 'Información personal'
    },
    { 
      id: 'empleados', 
      label: 'Empleados', 
      icon: Users,
      description: 'Supervisión estratégica de personal'
    },
    { 
      id: 'vacaciones', 
      label: 'Vacaciones', 
      icon: Calendar,
      description: 'Políticas y aprobaciones de vacaciones'
    },
    { 
      id: 'asistencia', 
      label: 'Asistencia', 
      icon: Clock,
      description: 'Políticas de asistencia'
    },
    { 
      id: 'nomina', 
      label: 'Nómina', 
      icon: DollarSign,
      description: 'Estrategia salarial'
    },
    { 
      id: 'capacitacion', 
      label: 'Capacitación', 
      icon: BookOpen,
      description: 'Estrategia de desarrollo y presupuesto de capacitación'
    },
    { 
      id: 'vacantes', 
      label: 'Vacantes', 
      icon: Briefcase,
      description: 'Estrategia de reclutamiento'
    },
    { 
      id: 'reportes', 
      label: 'Reportes', 
      icon: BarChart3,
      description: 'Analytics estratégicos de RRHH'
    },
    { 
      id: 'configuracion', 
      label: 'Configuración', 
      icon: Settings,
      description: 'Configurar políticas de RRHH'
    }
  ],
  
  gerente_rrhh: [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: Home,
      description: 'Panel de control gerencial de RRHH'
    },
    { 
      id: 'perfil', 
      label: 'Mi Perfil', 
      icon: User,
      description: 'Información personal'
    },
    { 
      id: 'empleados', 
      label: 'Empleados', 
      icon: Users,
      description: 'Gestión del equipo de RRHH'
    },
    { 
      id: 'vacaciones', 
      label: 'Vacaciones', 
      icon: Calendar,
      description: 'Supervisar vacaciones del área'
    },
    { 
      id: 'asistencia', 
      label: 'Asistencia', 
      icon: Clock,
      description: 'Control de asistencia de RRHH'
    },
    { 
      id: 'nomina', 
      label: 'Nómina', 
      icon: DollarSign,
      description: 'Supervisión de nóminas'
    },
    { 
      id: 'capacitacion', 
      label: 'Capacitación', 
      icon: BookOpen,
      description: 'Gestión operativa de capacitaciones'
    },
    { 
      id: 'vacantes', 
      label: 'Vacantes', 
      icon: Briefcase,
      description: 'Supervisión de reclutamiento'
    },
    { 
      id: 'reportes', 
      label: 'Reportes', 
      icon: BarChart3,
      description: 'Reportes gerenciales de RRHH'
    }
  ],
  
  admin: [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: Home,
      description: 'Panel de administración del sistema'
    },
    { 
      id: 'usuarios', 
      label: 'Usuarios', 
      icon: Users,
      description: 'Gestión de usuarios del sistema'
    },
    { 
      id: 'empleados', 
      label: 'Empleados', 
      icon: Users,
      description: 'Gestión completa de personal'
    },
    { 
      id: 'vacaciones', 
      label: 'Vacaciones', 
      icon: Calendar,
      description: 'Administración completa de vacaciones'
    },
    { 
      id: 'asistencia', 
      label: 'Asistencia', 
      icon: Clock,
      description: 'Administración de asistencia'
    },
    { 
      id: 'nomina', 
      label: 'Nómina', 
      icon: DollarSign,
      description: 'Administración de nóminas'
    },
    { 
      id: 'capacitacion', 
      label: 'Capacitación', 
      icon: BookOpen,
      description: 'Administración completa del sistema de capacitación'
    },
    { 
      id: 'vacantes', 
      label: 'Vacantes', 
      icon: Briefcase,
      description: 'Administración completa del sistema de reclutamiento'
    },
    { 
      id: 'reportes', 
      label: 'Reportes', 
      icon: BarChart3,
      description: 'Reportes técnicos y de uso'
    },
    { 
      id: 'configuracion', 
      label: 'Configuración', 
      icon: Settings,
      description: 'Configuración general del sistema'
    },
    { 
      id: 'logs', 
      label: 'Logs', 
      icon: FileText,
      description: 'Registros del sistema'
    },
    // 🔹 Módulo AdminPermissions agregado
    {
      id: 'adminPermissions',
      label: 'Admin Permisos',
      icon: Settings,
      description: 'Gestión de permisos administrativos'
    }
  ]
};

// Función para obtener la navegación según el rol
export const getNavigationByRole = (role) => {
  return NAVIGATION_CONFIG[role] || [];
};

// Configuración de permisos para el módulo de capacitación
export const CAPACITACION_PERMISSIONS = {
  canView: ['colaborador', 'gerente', 'director', 'rrhh', 'director_rrhh', 'gerente_rrhh', 'admin'],
  canCreateRequest: ['colaborador', 'gerente', 'director', 'rrhh', 'director_rrhh', 'gerente_rrhh'],
  canApprove: ['director', 'rrhh', 'director_rrhh', 'gerente_rrhh', 'admin'],
  canManageCourses: ['rrhh', 'director_rrhh', 'gerente_rrhh', 'admin'],
  canViewAllRequests: ['gerente', 'director', 'rrhh', 'director_rrhh', 'gerente_rrhh', 'admin'],
  canConfigurePolicies: ['director_rrhh', 'admin'],
  canGenerateReports: ['director', 'rrhh', 'director_rrhh', 'gerente_rrhh', 'admin']
};

// Configuración de permisos para el módulo de vacantes
export const VACANTES_PERMISSIONS = {
  canView: ['colaborador', 'gerente', 'director', 'rrhh', 'director_rrhh', 'gerente_rrhh', 'admin'],
  canApply: ['colaborador', 'gerente', 'director'],
  canRefer: ['colaborador', 'gerente', 'director', 'rrhh', 'director_rrhh', 'gerente_rrhh'],
  canCreateJob: ['rrhh', 'director_rrhh', 'gerente_rrhh', 'admin'],
  canManageJobs: ['rrhh', 'director_rrhh', 'gerente_rrhh', 'admin'],
  canManageSelection: ['rrhh', 'director_rrhh', 'gerente_rrhh', 'admin'],
  canViewAllApplications: ['gerente', 'director', 'rrhh', 'director_rrhh', 'gerente_rrhh', 'admin'],
  canApproveJobs: ['director', 'director_rrhh', 'admin'],
  canGenerateReports: ['director', 'rrhh', 'director_rrhh', 'gerente_rrhh', 'admin'],
  canConfigurePolicies: ['director_rrhh', 'admin'],
  canManageReferrals: ['rrhh', 'director_rrhh', 'gerente_rrhh', 'admin']
};

// Función para verificar permisos de capacitación
export const hasCapacitacionPermission = (userRole, permission) => {
  return CAPACITACION_PERMISSIONS[permission]?.includes(userRole) || false;
};

// Función para verificar permisos de vacantes
export const hasVacantesPermission = (userRole, permission) => {
  return VACANTES_PERMISSIONS[permission]?.includes(userRole) || false;
};

// Función para verificar si un módulo está disponible para un rol
export const isModuleAvailable = (moduleId, userRole) => {
  const navigation = getNavigationByRole(userRole);
  return navigation.some(item => item.id === moduleId);
};

// Función para obtener la información de un módulo específico
export const getModuleInfo = (moduleId, userRole) => {
  const navigation = getNavigationByRole(userRole);
  return navigation.find(item => item.id === moduleId);
};
