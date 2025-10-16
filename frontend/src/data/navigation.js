import { 
  Users, Settings, Shield, Check, Plus, Edit, UserCheck,
  Briefcase, FileText, DollarSign, Calendar, GraduationCap,
  Clock, Building, BadgeCheck, BarChart3, Send, User, UserCog
} from 'lucide-react';
import AccionesPersonal from '../components/rrhh/AccionesPersonal/AccionesPersonal';

// Navegación principal
const NAVIGATION_ITEMS = [
  // No. DE Orden y Posición
  // #1
  { id: 'dashboard', label: 'Inicio', icon: BarChart3, modulo: null, path: '/dashboard' },
    // #2
  { id: 'perfil', label: 'Perfil', icon: User, modulo: 'perfil', path: '/perfil' },
    // #3
  { id: 'vacaciones', label: 'Autoservicio', icon: UserCog, modulo: 'vacaciones', path: '/vacaciones' },
  // #4
  { id: 'empleados', label: 'Empleados', icon: Users, modulo: 'empleados', path: '/empleados' },
  // #5
  { id: 'vacantes', label: 'Vacantes', icon: Briefcase, modulo: 'vacantes', path: '/vacantes' }, 
  // #6
  { id: 'postulaciones', label: 'Postulaciones', icon: FileText, modulo: 'postulaciones', path: '/postulaciones' },
  // #7
  { id: 'nomina', label: 'Nómina', icon: DollarSign, modulo: 'nomina', path: '/nomina' }, 
  // #8
  { id: 'capacitaciones', label: 'Capacitaciones', icon: GraduationCap, modulo: 'capacitaciones', path: '/capacitaciones' },
  // #9
  { id: 'asistencia', label: 'Asistencia', icon: Clock, modulo: 'asistencia', path: '/asistencia' },
  // #10
  { id: 'departamentos', label: 'Departamentos', icon: Building, modulo: 'departamentos', path: '/departamentos' },
  // #11
  { id: 'puestos', label: 'Puestos', icon: BadgeCheck, modulo: 'puestos', path: '/puestos' },
  // #12
  { id: 'reportes', label: 'Reportes', icon: BarChart3, modulo: 'reportes', path: '/reportes' },
  // #13
  { id: 'admin', label: 'Administración', icon: Settings, modulo: 'admin', path: '/admin' },

  // #14
  { id: 'acciones-personal', label: 'Acciones de Personal', icon: FileText, roles: ['Admin', 'Director RRHH', 'Gerente RRHH'], permisos: ['acciones_personal'] },


];

// Roles que tienen acceso directo a ciertos módulos sin necesidad de permisos explícitos
const ACCESO_DIRECTO_POR_ROL = {
  vacantes: ['gerente', 'director', 'gerente_rrhh', 'director_rrhh', 'rrhh', 'colaborador', 'empleado'],
  perfil: ['gerente', 'director', 'gerente_rrhh', 'director_rrhh', 'rrhh', 'colaborador', 'empleado', 'admin'],
  postulaciones: ['gerente', 'director', 'gerente_rrhh', 'director_rrhh', 'rrhh', 'colaborador', 'empleado'],
  AccionesPersonal: ['gerente_rrhh', 'director_rrhh', 'rrhh', 'admin']
};

/**
 * Devuelve los elementos de navegación que un usuario puede ver según su rol y permisos
 * @param {Object} user - Usuario autenticado
 * @param {Array} permisos - Lista de permisos con {NombreModulo, EstaVisible, PuedeVer}
 * @returns {Array} Navegación filtrada
 */
export const getNavigationByRoleAndPermissions = (user, permisos = []) => {
  console.log('🔍 DEBUG NAVEGACIÓN:', {
    user: user,
    userRole: user?.role || user?.rol,
    permisos: permisos,
    permisosCount: permisos.length
  });

  if (!user) return [NAVIGATION_ITEMS[0]]; // Solo dashboard si no hay usuario

  const rolUsuario = (user?.rol || user?.role)?.toLowerCase().replace(/\s+/g, '_');

  // Admin ve todo
  if (rolUsuario === 'admin') {
    console.log('👑 Usuario admin - mostrando todo');
    return NAVIGATION_ITEMS;
  }

  // Filtrar módulos según permisos y acceso directo por rol
  const navegacionFiltrada = NAVIGATION_ITEMS.filter(item => {
    // Siempre mostrar dashboard
    if (!item.modulo) {
      console.log('✅ Mostrando:', item.label, '(dashboard - siempre visible)');
      return true;
    }

    // Verificar si el rol tiene acceso directo al módulo
    const tieneAccesoDirecto = ACCESO_DIRECTO_POR_ROL[item.modulo]?.includes(rolUsuario);
    
    if (tieneAccesoDirecto) {
      console.log('✅ Acceso directo por rol:', item.label, '(rol:', rolUsuario, ')');
      return true;
    }
    
    // Buscar permiso correspondiente en la BD
    const permiso = permisos.find(p => {
      const moduloPermiso = p.NombreModulo?.toLowerCase();
      const moduloNavegacion = item.modulo?.toLowerCase();
      return moduloPermiso === moduloNavegacion;
    });

    if (permiso) {
      console.log('🔍 Evaluando:', item.label, {
        modulo: item.modulo,
        permiso: permiso,
        EstaVisible: permiso.EstaVisible,
        PuedeVer: permiso.PuedeVer,
        mostrar: (permiso.EstaVisible !== false && permiso.PuedeVer !== false)
      });
      
      // Mostrar si no está explícitamente oculto y puede ver
      return (permiso.EstaVisible !== false && permiso.PuedeVer !== false);
    } else {
      console.log('❌ Sin permiso para:', item.label, '(módulo:', item.modulo, ')');
      return false;
    }
  });

  console.log('📋 Navegación final:', navegacionFiltrada.map(n => n.label));
  return navegacionFiltrada;
};

export default NAVIGATION_ITEMS;