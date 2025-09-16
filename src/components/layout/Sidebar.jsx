// src/components/layout/Sidebar.jsx
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  getNavigationByRoleAndPermissions, 
  hasCapacitacionPermission, 
  hasVacantesPermission, 
  isModuleAvailable 
} from '../../data/navigation';

const Sidebar = () => {
  const { user, permisos } = useAuth(); // permisos obtenidos del backend
  if (!user) return null;

  // Obtenemos la navegación filtrada por rol y permisos
  const navigation = getNavigationByRoleAndPermissions(user, permisos);

  return (
    <aside className="sidebar bg-gray-100 w-64 min-h-screen p-4">
      <div className="mb-6">
        <h2 className="text-xl font-bold">
          Hola, {user.name || `${user.nombre} ${user.apellido}` || user.username}
        </h2>
        <p className="text-sm text-gray-600 capitalize">{user.rol || user.role}</p>
      </div>
      <ul className="space-y-2">
        {navigation.map((item) => {
          // Validaciones de permisos por módulo
          if (item.id === 'capacitaciones' && !hasCapacitacionPermission(permisos)) return null;
          if (item.id === 'vacantes' && !hasVacantesPermission(permisos)) return null;
          if (!isModuleAvailable(item.modulo, permisos)) return null;

          const Icon = item.icon;

          return (
            <li 
              key={item.id} 
              className="hover:bg-gray-200 rounded p-2 flex items-center cursor-pointer"
              onClick={() => item.onClick?.()}
            >
              {Icon && <Icon className="mr-2 w-5 h-5 text-gray-700" />}
              <span>{item.label}</span>
            </li>
          );
        })}
      </ul>
    </aside>
  );
};

export default Sidebar;
