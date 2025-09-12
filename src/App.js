// App.js
import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import LoginPage from './components/auth/LoginPage';
import { Building2, Menu, LogOut } from 'lucide-react';
import { getNavigationByRole } from './data/navigation';

import VacacionesModule from './components/modules/vacaciones/VacacionesModule';
import NominaModule from './components/modules/nomina/NominaModule';
import AsistenciaModule from './components/modules/asistencia/AsistenciaModule';
import CapacitacionModule from './components/modules/capacitacion/CapacitacionModule';
import VacantesModule from './components/modules/vacantes/VacantesModule';
import PerfilModule from './components/modules/perfil/perfilModule';
import EmpleadosModule from './components/modules/empleados/EmpleadosModule';
import ConfiguracionModule from './components/modules/configuracion/ConfiguracionModule';
import AdminPermissions from './components/Admin/AdminPermissions';

// ===================== SIDEBAR =====================
const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { activeSection, navigateToSection } = useApp();
  const navigation = user ? getNavigationByRole(user.role) : [];

  return (
    <>
      {isOpen && <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', zIndex:40 }} onClick={onClose} />}
      <div style={{
        position:'fixed', top:0, left:0, height:'100%', width:'16rem',
        background:'white', boxShadow:'0 10px 15px -3px rgba(0,0,0,0.1)',
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition:'transform 0.3s ease', zIndex:50
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1rem', borderBottom:'1px solid #e5e7eb' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
            <Building2 style={{ width:'2rem', height:'2rem', color:'#3b82f6' }} />
            <img src="PD-Logo-RGB-CEI.png" alt="Logo" style={{ height:'24px', width:'auto' }} />
          </div>
          <button onClick={onClose} style={{ border:'none', background:'none', fontSize:'1.5rem', cursor:'pointer', color:'#6b7280' }}>×</button>
        </div>

        <div style={{ padding:'1rem', borderBottom:'1px solid #e5e7eb', background:'#f9fafb', display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <div style={{
            width:'2.5rem', height:'2.5rem', background:'#3b82f6',
            borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
            color:'white', fontWeight:'bold', fontSize:'1rem'
          }}>{user?.avatar || user?.name?.charAt(0) || '?'}</div>
          <div>
            <p style={{ fontWeight:'500', color:'#111827', margin:0 }}>{user?.name || '-'}</p>
            <p style={{ fontSize:'0.875rem', color:'#6b7280', margin:0 }}>{user?.position || '-'}</p>
          </div>
        </div>

        <nav style={{ padding:'1rem' }}>
          {navigation.length === 0 && <p style={{ color:'#6b7280', fontSize:'0.875rem' }}>No tienes módulos disponibles</p>}
          {navigation.map(item => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button key={item.id}
                onClick={() => { navigateToSection(item.id); onClose(); }}
                style={{
                  width:'100%', display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.75rem',
                  marginBottom:'0.25rem', borderRadius:'0.5rem', border:'none', textAlign:'left',
                  cursor:'pointer', background:isActive ? '#3b82f6' : 'transparent',
                  color:isActive ? 'white' : '#374151', fontWeight:'500', transition:'all 0.2s ease'
                }}>
                {Icon && <Icon style={{ width:'1.25rem', height:'1.25rem' }} />}
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
};

// ===================== HEADER =====================
const Header = () => {
  const { user, logout } = useAuth();
  const { toggleSidebar } = useApp();

  return (
    <header style={{ background:'white', boxShadow:'0 1px 3px rgba(0,0,0,0.1)', borderBottom:'1px solid #e5e7eb' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.75rem 1rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <button onClick={toggleSidebar} style={{ padding:'0.5rem', border:'none', background:'none', cursor:'pointer' }}>
            <Menu style={{ width:'1.25rem', height:'1.25rem' }} />
          </button>
          <h1 style={{ fontSize:'1.125rem', fontWeight:'bold', color:'#111827', margin:0, display:'flex', alignItems:'center', gap:'0.5rem' }}>
            <img src="PD-Logo-RGB-CEI.png" alt="Logo" style={{ height:'24px', width:'auto' }} />
            Sistema de Gestión RRHH ProDominicana
          </h1>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <div style={{ textAlign:'right' }}>
            <p style={{ fontSize:'0.875rem', fontWeight:'500', color:'#111827', margin:0 }}>{user?.name || '-'}</p>
            <p style={{ fontSize:'0.75rem', color:'#6b7280', margin:0 }}>{user?.position || '-'}</p>
          </div>
          <button onClick={logout} style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.5rem', border:'none', background:'none', cursor:'pointer', color:'#6b7280' }}>
            <LogOut style={{ width:'1rem', height:'1rem' }} /> Salir
          </button>
        </div>
      </div>
    </header>
  );
};

// ===================== DASHBOARD =====================
const Dashboard = () => {
  const { user } = useAuth();
  const navigation = user ? getNavigationByRole(user.role) : [];

  return (
    <div style={{ padding:'1.5rem' }}>
      <h1 style={{ fontSize:'2rem', fontWeight:'bold', color:'#111827' }}>¡Hola, {user?.name || 'Usuario'}!</h1>
      <p style={{ color:'#6b7280', fontSize:'1.125rem' }}>Bienvenido al sistema de gestión de recursos humanos</p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(15rem,1fr))', gap:'1rem', marginTop:'2rem' }}>
        {navigation.map(item => {
          const Icon = item.icon;
          return (
            <div key={item.id} style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'1rem', background:'#f9fafb', borderRadius:'0.5rem', border:'1px solid #e5e7eb', cursor:'pointer' }}
              onClick={() => console.log(`Ir a módulo ${item.id}`)}>
              <Icon style={{ width:'1.5rem', height:'1.5rem', color:'#3b82f6' }} />
              <span style={{ fontSize:'0.875rem', fontWeight:'500', color:'#374151' }}>{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ===================== MAIN APP =====================
const MainApp = () => {
  const { user, loading } = useAuth();
  const { sidebarOpen, closeSidebar, activeSection } = useApp();

  if (loading) return <p>Cargando...</p>;
  if (!user) return <LoginPage />;

  const renderModule = () => {
    switch (activeSection) {
      case 'dashboard': return <Dashboard />;
      case 'vacaciones': return <VacacionesModule />;
      case 'nomina': return <NominaModule />;
      case 'asistencia': return <AsistenciaModule />;
      case 'capacitacion': return <CapacitacionModule />;
      case 'vacantes': return <VacantesModule />;
      case 'perfil': return <PerfilModule />;
      case 'empleados': return <EmpleadosModule />;
      case 'configuracion': return <ConfiguracionModule />;
      case 'adminPermissions': return <AdminPermissions />;
      default: return <Dashboard />;
    }
  };

  return (
    <div style={{ display:'flex', height:'100vh', background:'#f8fafc' }}>
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <Header />
        <main style={{ flex:1, overflowY:'auto' }}>{renderModule()}</main>
      </div>
    </div>
  );
};

// ===================== APP =====================
function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <MainApp />
      </AppProvider>
    </AuthProvider>
  );
}

export default App;




