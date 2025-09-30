// src/App.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import LoginPage from './components/auth/LoginPage';
import ResetPassword from './components/auth/ResetPassword';
import { Menu, LogOut, Building2 } from 'lucide-react';
import { getNavigationByRoleAndPermissions } from './data/navigation';
import { motion } from "framer-motion";
import { Users, Activity, Bell, Clock, ChevronRight } from 'lucide-react';

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

// ===================== COMPONENTES PÚBLICOS =====================
import FormularioPostulacion from './components/public/FormularioPostulacion';

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

// ===================== DASHBOARD RRHH PRODOMINICANA =====================
const Dashboard = () => {
  const { user, permisos } = useAuth();
  const { navigateToSection } = useApp();
  const navigation = user ? getNavigationByRoleAndPermissions(user, permisos) : [];

  const getSaludoPorHora = () => {
    const hora = new Date().getHours();
    if (hora < 12) return "Buenos días";
    if (hora < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, rgb(248, 250, 252) 0%, rgb(239, 246, 255) 50%, rgb(224, 231, 255) 100%)'
    }}>
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(90deg, rgb(37, 99, 235) 0%, rgb(29, 78, 216) 50%, rgb(67, 56, 202) 100%)'
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M20 20c0 11.046-8.954 20-20 20v20h40V20H20z'/%3E%3C/g%3E%3C/svg%3E")`,
          opacity: 0.2
        }}></div>
        
        <div style={{ position: 'relative', padding: '2rem 1.5rem' }}>
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <div>
              <h1 style={{
                fontSize: '2.25rem',
                fontWeight: 'bold',
                color: 'white',
                marginBottom: '0.5rem',
                margin: 0
              }}>
                {getSaludoPorHora()}, {user?.name || 'Usuario'}
              </h1>
              <p style={{
                color: 'rgb(191, 219, 254)',
                fontSize: '1.125rem',
                fontWeight: '500',
                margin: 0
              }}>
                Sistema de Gestión de Recursos Humanos
              </p>
              <p style={{
                color: 'rgb(196, 181, 253)',
                fontSize: '0.875rem',
                marginTop: '0.25rem',
                margin: '0.25rem 0 0 0'
              }}>
                ProDominicana - Centro de Exportación e Inversión
              </p>
            </div>
            
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
              style={{
                display: 'none',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(4px)',
                borderRadius: '9999px',
                padding: '1rem 1.5rem'
              }}
            >
              <div style={{
                width: '0.5rem',
                height: '0.5rem',
                background: 'rgb(74, 222, 128)',
                borderRadius: '50%'
              }}></div>
              <span style={{ color: 'white', fontSize: '0.875rem', fontWeight: '500' }}>
                Sistema Activo
              </span>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <div style={{ padding: '2rem 1.5rem' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}
        >
          <div style={{
            background: 'white',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgb(243, 244, 246)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{
                  color: 'rgb(107, 114, 128)',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  margin: 0
                }}>Fecha Actual</p>
                <p style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: 'rgb(17, 24, 39)',
                  margin: 0
                }}>{new Date().toLocaleDateString('es-DO', { 
                  weekday: 'short', 
                  day: 'numeric', 
                  month: 'short',
                  year: 'numeric'
                })}</p>
              </div>
              <div style={{
                width: '3rem',
                height: '3rem',
                background: 'rgb(219, 234, 254)',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ fontSize: '1.5rem' }}>📅</span>
              </div>
            </div>
          </div>
          
          <div style={{
            background: 'white',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgb(243, 244, 246)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{
                  color: 'rgb(107, 114, 128)',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  margin: 0
                }}>Hora Actual</p>
                <p style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: 'rgb(17, 24, 39)',
                  margin: 0
                }}>{new Date().toLocaleTimeString('es-DO', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: true
                })}</p>
              </div>
              <div style={{
                width: '3rem',
                height: '3rem',
                background: 'rgb(220, 252, 231)',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Clock style={{ width: '1.5rem', height: '1.5rem', color: 'rgb(34, 197, 94)' }} />
              </div>
            </div>
          </div>
          
          <div style={{
            background: 'white',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgb(243, 244, 246)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{
                  color: 'rgb(107, 114, 128)',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  margin: 0
                }}>Notificaciones</p>
                <p style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: 'rgb(17, 24, 39)',
                  margin: 0
                }}>{user?.stats?.notifications || '0'}</p>
              </div>
              <div style={{
                width: '3rem',
                height: '3rem',
                background: 'rgb(254, 243, 199)',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Bell style={{ width: '1.5rem', height: '1.5rem', color: 'rgb(245, 158, 11)' }} />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          style={{ marginBottom: '2rem' }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: 'rgb(17, 24, 39)',
              margin: 0
            }}>Módulos del Sistema</h2>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '0.875rem',
              color: 'rgb(107, 114, 128)'
            }}>
              <Clock style={{ width: '1rem', height: '1rem', marginRight: '0.25rem' }} />
              Última actualización: {new Date().toLocaleDateString('es-DO')}
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem'
          }}>
            {navigation.map((item, index) => {
              const Icon = item.icon;
              const colors = [
                'linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(37, 99, 235) 100%)',
                'linear-gradient(135deg, rgb(34, 197, 94) 0%, rgb(22, 163, 74) 100%)',
                'linear-gradient(135deg, rgb(168, 85, 247) 0%, rgb(147, 51, 234) 100%)',
                'linear-gradient(135deg, rgb(249, 115, 22) 0%, rgb(234, 88, 12) 100%)',
                'linear-gradient(135deg, rgb(239, 68, 68) 0%, rgb(220, 38, 38) 100%)',
                'linear-gradient(135deg, rgb(99, 102, 241) 0%, rgb(79, 70, 229) 100%)',
                'linear-gradient(135deg, rgb(236, 72, 153) 0%, rgb(219, 39, 119) 100%)',
                'linear-gradient(135deg, rgb(20, 184, 166) 0%, rgb(13, 148, 136) 100%)'
              ];
              const gradientColor = colors[index % colors.length];

              return (
                <motion.div
                  key={item.id}
                  onClick={() => navigateToSection(item.id)}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    delay: index * 0.1 + 0.2, 
                    duration: 0.5,
                    type: "spring",
                    stiffness: 100
                  }}
                  whileHover={{ 
                    scale: 1.05, 
                    y: -5,
                    transition: { type: "spring", stiffness: 300 }
                  }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    position: 'relative',
                    background: 'white',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    cursor: 'pointer',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgb(243, 244, 246)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      width: '4rem',
                      height: '4rem',
                      background: gradientColor,
                      borderRadius: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '1rem',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}>
                      <Icon style={{ width: '2rem', height: '2rem', color: 'white' }} />
                    </div>
                    
                    <h3 style={{
                      fontWeight: 'bold',
                      color: 'rgb(17, 24, 39)',
                      fontSize: '1.125rem',
                      marginBottom: '0.5rem',
                      margin: '0 0 0.5rem 0'
                    }}>
                      {item.label}
                    </h3>
                    
                    <p style={{
                      color: 'rgb(107, 114, 128)',
                      fontSize: '0.875rem',
                      lineHeight: 1.6,
                      margin: 0
                    }}>
                      {item.description || "Gestiona y administra información del sistema"}
                    </p>
                    
                    <div style={{
                      marginTop: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '0.75rem',
                      color: 'rgb(156, 163, 175)'
                    }}>
                      <ChevronRight style={{
                        width: '1rem',
                        height: '1rem',
                        marginRight: '0.25rem'
                      }} />
                      <span>Acceder</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          style={{
            background: 'white',
            borderRadius: '1rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgb(243, 244, 246)',
            overflow: 'hidden'
          }}
        >
          <div style={{
            background: 'linear-gradient(90deg, rgb(249, 250, 251) 0%, rgb(243, 244, 246) 100%)',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: 'rgb(31, 41, 55)',
              marginBottom: '0.5rem',
              margin: '0 0 0.5rem 0'
            }}>
              Centro de Exportación e Inversión de la República Dominicana
            </h3>
            <p style={{
              color: 'rgb(107, 114, 128)',
              fontSize: '0.875rem',
              margin: 0
            }}>
              Habilitadores de Sueños y Oportunidades
            </p>
          </div>
          
          <div style={{
            padding: '2rem',
            background: 'white',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '200px'
          }}>
            <motion.img
              src="/IMG_3119.jpg"
              alt="ProDominicana - Centro de Exportación e Inversión"
              style={{
                maxHeight: '160px',
                maxWidth: '100%',
                objectFit: 'contain',
                filter: 'drop-shadow(0 10px 8px rgb(0 0 0 / 0.04))'
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
              whileHover={{ scale: 1.05 }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          style={{
            marginTop: '2rem',
            textAlign: 'center',
            color: 'rgb(107, 114, 128)',
            fontSize: '0.875rem'
          }}
        >
          <p style={{ margin: 0 }}>© {new Date().getFullYear()} ProDominicana. Sistema de Recursos Humanos v2.0</p>
        </motion.div>
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
      <Route path="/postulacion" element={<FormularioPostulacion />} /> {/* ← NUEVA RUTA PÚBLICA */}

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