import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useApp } from '../../context/AppContext';
import Dashboard from '../Dashboard';
import VacacionesModule from '../modules/vacaciones/VacacionesModule';
import NominaModule from '../modules/nomina/NominaModule';
import AsistenciaModule from '../modules/asistencia/AsistenciaModule';
import CapacitacionModule from '../modules/capacitacion/CapacitacionModule';
import VacantesModule from '../modules/vacantes/VacantesModule';
import PerfilModule from '../modules/perfil/perfilModule';
import EmpleadosModule from '../modules/empleados/EmpleadosModule';
import ConfiguracionModule from '../modules/configuracion/ConfiguracionModule';
import AdminPermissions from '../Admin/AdminPermissions';
import PostulacionesModule from '../modules/postulaciones/PostulacionesModule';
import DepartamentosModule from '../modules/departamentos/DepartamentosModule';

const MainLayout = () => {
  const { activeSection } = useApp();

  const renderModule = () => {
    switch (activeSection) {
      case 'dashboard': return <Dashboard />;
      case 'vacaciones': return <VacacionesModule />;
      case 'nomina': return <NominaModule />;
      case 'asistencia': return <AsistenciaModule />;
      case 'capacitaciones': return <CapacitacionModule />;
      case 'vacantes': return <VacantesModule />;
      case 'perfil': return <PerfilModule />;
      case 'empleados': return <EmpleadosModule />;
      case 'configuracion': return <ConfiguracionModule />;
      case 'admin': return <AdminPermissions />;
      case 'postulaciones': return <PostulacionesModule />;
      case 'departamentos': return <DepartamentosModule />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4">
          {renderModule()}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
