import { 
  Users, Settings, Shield, Check, Plus, Edit, UserCheck,
  Briefcase, FileText, DollarSign, Calendar, GraduationCap,
  Clock, Building, BadgeCheck, BarChart3
} from 'lucide-react';

// Navegación principal
const NAVIGATION_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3, modulo: null, path: '/dashboard' },
  { id: 'empleados', label: 'Empleados', icon: Users, modulo: 'empleados', path: '/empleados' },
  { id: 'vacantes', label: 'Vacantes', icon: Briefcase, modulo: 'vacantes', path: '/vacantes' },
  { id: 'postulaciones', label: 'Postulaciones', icon: FileText, modulo: 'postulaciones', path: '/postulaciones' },
  { id: 'nomina', label: 'Nómina', icon: DollarSign, modulo: 'nomina', path: '/nomina' },
  { id: 'vacaciones', label: 'Vacaciones', icon: Calendar, modulo: 'vacaciones', path: '/vacaciones' },
  { id: 'capacitaciones', label: 'Capacitaciones', icon: GraduationCap, modulo: 'capacitaciones', path: '/capacitaciones' },
  { id: 'asistencia', label: 'Asistencia', icon: Clock, modulo: 'asistencia', path: '/asistencia' },
  { id: 'departamentos', label: 'Departamentos', icon: Building, modulo: 'departamentos', path: '/departamentos' },
  { id: 'puestos', label: 'Puestos', icon: BadgeCheck, modulo: 'puestos', path: '/puestos' },
  { id: 'reportes', label: 'Reportes', icon: BarChart3, modulo: 'reportes', path: '/reportes' },
  { id: 'admin', label: 'Administración', icon: Settings, modulo: 'admin', path: '/admin' }
];

/**
 * Devuelve los elementos de navegación que un usuario puede ver según su rol y permisos
 * @param {Object} user - Usuario autenticado
 * @param {Array} permisos - Lista de permisos con {NombreModulo, EstaVisible, PuedeVer}
 * @returns {Array} Navegación filtrada
 */
export const getNavigationByRoleAndPermissions = (user, permisos = []) => {
  if (!user) return [NAVIGATION_ITEMS[0]]; // Solo dashboard si no hay usuario

  // Admin ve todo
  if (user?.rol === 'admin') return NAVIGATION_ITEMS;

  // Otros roles ven solo módulos con permisos visibles
  return NAVIGATION_ITEMS.filter(item => {
    if (!item.modulo) return true; // Siempre mostrar dashboard
    const permiso = permisos.find(
      p => p.NombreModulo?.toLowerCase() === item.modulo?.toLowerCase()
    );
    return permiso?.EstaVisible && permiso?.PuedeVer;
  });
};

export default NAVIGATION_ITEMS;


