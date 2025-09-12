// src/components/layout/Sidebar.jsx
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  getNavigationByRole,
  hasCapacitacionPermission,
  hasVacantesPermission,
  isModuleAvailable
} from '../../data/navigation';

const Sidebar = () => {
  const { user } = useAuth();
  if (!user) return null;

  const navigation = getNavigationByRole(user.role);

  return (
    <aside className="sidebar bg-gray-100 w-64 min-h-screen p-4">
      <div className="mb-6">
        <h2 className="text-xl font-bold">Hola, {user.name}</h2>
        <p className="text-sm text-gray-600 capitalize">{user.role}</p>
      </div>
      <ul className="space-y-2">
        {navigation.map((item) => {
          // Validar permisos para módulos de capacitacion o vacantes
          if (item.id === 'capacitacion' && !hasCapacitacionPermission(user.role, 'canView')) return null;
          if (item.id === 'vacantes' && !hasVacantesPermission(user.role, 'canView')) return null;

          // Validar disponibilidad de módulo
          if (!isModuleAvailable(item.id, user.role)) return null;

          const Icon = item.icon;

          return (
            <li key={item.id} className="hover:bg-gray-200 rounded p-2 flex items-center cursor-pointer">
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


