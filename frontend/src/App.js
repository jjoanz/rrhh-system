// src/App.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import LoginPage from './components/auth/LoginPage';
import ResetPassword from './components/auth/ResetPassword';
import { Menu, LogOut, Building2 } from 'lucide-react';
import { getNavigationByRoleAndPermissions } from './data/navigation';

// ===================== MÓDULOS =====================
import VacacionesModule from './components/modules/vacaciones/VacacionesModule';
import NominaModule from './components/modules/nomina/NominaModule';
import AsistenciaModule from './components/modules/asistencia/AsistenciaModule';
import CapacitacionModule from './components/modules/capacitacion/CapacitacionModule';
import VacantesModule from './components/modules/vacantes/VacantesModule';
import PerfilModule from './components/modules/perfil/perfilModule';
import EmpleadosModule from './components/modules/empleados/EmpleadosModule';
import ConfiguracionModule from './components/modules/configuracion/ConfiguracionModule';
import PostulacionesModule from './components/modules/postulaciones/PostulacionesModule';
import DepartamentosModule from './components/modules/departamentos/DepartamentosModule';
import PuestosModule from './components/modules/puestos/PuestosModule';
import ReportesModule from './components/modules/Reportes/ReportesModule';

// ===================== ADMIN =====================
import AdminPermissions from './components/Admin/AdminPermissions';

// ===================== SIDEBAR =====================
const Sidebar = ({ isOpen, onClose }) => {
  const { user, permisos } = useAuth();
  const { activeSection, navigateToSection } = useApp();
  const navigation = user ? getNavigationByRoleAndPermissions(user, permisos) : [];

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
  const { user, permisos } = useAuth();
  const { navigateToSection } = useApp();
  const navigation = user ? getNavigationByRoleAndPermissions(user, permisos) : [];

  return (
    <div style={{ padding:'1.5rem' }}>
      <h1 style={{ fontSize:'2rem', fontWeight:'bold', color:'#111827' }}>¡Hola, {user?.name || 'Usuario'}!</h1>
      <p style={{ color:'#6b7280', fontSize:'1.125rem' }}>Bienvenido al sistema de gestión de recursos humanos</p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(15rem,1fr))', gap:'1rem', marginTop:'2rem' }}>
        {navigation.map(item => {
          const Icon = item.icon;
          return (
            <div key={item.id} style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'1rem', background:'#f9fafb', borderRadius:'0.5rem', border:'1px solid #e5e7eb', cursor:'pointer' }}
              onClick={() => navigateToSection(item.id)}>
              <Icon style={{ width:'1.5rem', height:'1.5rem', color:'#3b82f6' }} />
              <span style={{ fontSize:'0.875rem', fontWeight:'500', color:'#374151' }}>{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ===================== PROTECTED ROUTE =====================
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', fontSize:'1.2rem', color:'#6b7280' }}>Cargando...</div>;
  return user ? children : <Navigate to="/login" replace />;
};

// ===================== MAIN LAYOUT =====================
const MainLayout = () => {
  const { sidebarOpen, closeSidebar, activeSection } = useApp();

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
      case 'puestos': return <PuestosModule />;
      case 'reportes': return <ReportesModule />;
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

// ===================== APP ROUTER =====================
const AppRouter = () => {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', fontSize:'1.2rem', color:'#6b7280' }}>Cargando...</div>;

  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/reset-password/:token" element={user ? <Navigate to="/dashboard" replace /> : <ResetPassword />} />

      {/* Rutas protegidas */}
      <Route path="/*" element={
        <ProtectedRoute>
          <AppProvider>
            <MainLayout />
          </AppProvider>
        </ProtectedRoute>
      } />
    </Routes>
  );
};

// ===================== MAIN APP =====================
function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;




