// src/App.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import LoginPage from './components/auth/LoginPage';
import ResetPassword from './components/auth/ResetPassword';
import { Menu, LogOut, Building2, Calendar } from 'lucide-react';
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
import AccionesPersonal from './components/rrhh/AccionesPersonal/AccionesPersonal';

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
        background:'white', boxShadow:'0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition:'transform 0.3s ease', zIndex:50
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1rem', borderBottom:'1px solid #e5e7eb' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
            <Building2 style={{ width:'2rem', height:'2rem', color:'#3b82f6' }} />
            <img src="ProDominicana Logo FC.png" alt="Logo" style={{ height:'45px', width:'auto' }} />
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
            <img src="ProDominicana Logo FC.png" alt="Logo" style={{ height:'45px', width:'auto' }} />
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

  const formatearFecha = () => {
    const dias = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const fecha = new Date();
    return `${dias[fecha.getDay()]}, ${fecha.getDate()} ${meses[fecha.getMonth()]} ${fecha.getFullYear()}`;
  };

  const formatearHora = () => {
    const fecha = new Date();
    let horas = fecha.getHours();
    const minutos = fecha.getMinutes().toString().padStart(2, '0');
    const ampm = horas >= 12 ? 'p. m.' : 'a. m.';
    horas = horas % 12;
    horas = horas ? horas : 12;
    const horasFormat = horas.toString().padStart(2, '0');
    return `${horasFormat}:${minutos} ${ampm}`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a2540'
    }}>
      {/* HERO SECTION CON BANNER */}
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        background: '#0a2540',
        minHeight: '180px'
      }}>
        {/* Imagen de fondo con overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url("/images/ProD Banner.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 0
        }}>
          {/* Overlay con gradiente */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, rgba(10, 37, 64, 0.88) 0%, rgba(10, 37, 64, 0.45) 50%, rgba(10, 37, 64, 0.75) 100%)'
          }}></div>
        </div>
        
        {/* Contenido del Hero */}
        <div style={{ 
          position: 'relative', 
          padding: '1.75rem 2rem',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          {/* Saludo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <h2 style={{
              fontSize: '1.875rem',
              fontWeight: '600',
              color: '#ffffff',
              margin: 0,
              letterSpacing: '-0.01em',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              {getSaludoPorHora()}, {user?.name || 'Usuario'}
            </h2>
            <p style={{
              color: '#d1dce6',
              fontSize: '0.9375rem',
              fontWeight: '400',
              margin: '0.375rem 0 0 0',
              letterSpacing: '0.01em'
            }}>
              Sistema de Gestión de Recursos Humanos
            </p>
            <p style={{
              color: '#a8bccf',
              fontSize: '0.8125rem',
              fontWeight: '400',
              margin: '0.25rem 0 0 0',
              letterSpacing: '0.01em'
            }}>
              ProDominicana - Centro de Exportación e Inversión
            </p>
          </motion.div>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div style={{ padding: '2rem 2rem 3rem 2rem', background: '#0a2540' }}>
        {/* Tarjetas de información */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.25rem',
            marginBottom: '2.5rem'
          }}
        >
          {/* Fecha Actual */}
          <div style={{
            background: 'linear-gradient(135deg, #1e5cb3 0%, #2563eb 100%)',
            borderRadius: '1rem',
            padding: '1.75rem',
            boxShadow: '0 4px 12px rgba(30, 92, 179, 0.25), 0 1px 3px rgba(0, 0, 0, 0.1)',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '100px',
              height: '100px',
              background: 'rgba(255, 255, 255, 0.06)',
              borderRadius: '50%',
              filter: 'blur(20px)'
            }}></div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <p style={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.8125rem',
                fontWeight: '600',
                margin: '0 0 0.5rem 0',
                textTransform: 'uppercase',
                letterSpacing: '0.08em'
              }}>Fecha Actual</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{
                  fontSize: '1.375rem',
                  fontWeight: '600',
                  color: '#ffffff',
                  margin: 0,
                  letterSpacing: '-0.01em'
                }}>{formatearFecha()}</p>
                <div style={{
                  width: '2.75rem',
                  height: '2.75rem',
                  background: 'rgba(255, 255, 255, 0.18)',
                  borderRadius: '0.625rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}>
                  <Calendar style={{ width: '1.375rem', height: '1.375rem', color: '#ffffff' }} />
                </div>
              </div>
            </div>
          </div>
          
          {/* Hora Actual */}
          <div style={{
            background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
            borderRadius: '1rem',
            padding: '1.75rem',
            boxShadow: '0 4px 12px rgba(8, 145, 178, 0.25), 0 1px 3px rgba(0, 0, 0, 0.1)',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '100px',
              height: '100px',
              background: 'rgba(255, 255, 255, 0.06)',
              borderRadius: '50%',
              filter: 'blur(20px)'
            }}></div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <p style={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.8125rem',
                fontWeight: '600',
                margin: '0 0 0.5rem 0',
                textTransform: 'uppercase',
                letterSpacing: '0.08em'
              }}>Hora Actual</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{
                  fontSize: '1.375rem',
                  fontWeight: '600',
                  color: '#ffffff',
                  margin: 0,
                  letterSpacing: '-0.01em'
                }}>{formatearHora()}</p>
                <div style={{
                  width: '2.75rem',
                  height: '2.75rem',
                  background: 'rgba(255, 255, 255, 0.18)',
                  borderRadius: '0.625rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}>
                  <Clock style={{ width: '1.375rem', height: '1.375rem', color: '#ffffff' }} />
                </div>
              </div>
            </div>
          </div>
          
          {/* Notificaciones */}
          <div style={{
            background: 'linear-gradient(135deg, #dc143c 0%, #ef4444 100%)',
            borderRadius: '1rem',
            padding: '1.75rem',
            boxShadow: '0 4px 12px rgba(220, 20, 60, 0.25), 0 1px 3px rgba(0, 0, 0, 0.1)',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '100px',
              height: '100px',
              background: 'rgba(255, 255, 255, 0.06)',
              borderRadius: '50%',
              filter: 'blur(20px)'
            }}></div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <p style={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.8125rem',
                fontWeight: '600',
                margin: '0 0 0.5rem 0',
                textTransform: 'uppercase',
                letterSpacing: '0.08em'
              }}>Notificaciones</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{
                  fontSize: '1.375rem',
                  fontWeight: '600',
                  color: '#ffffff',
                  margin: 0,
                  letterSpacing: '-0.01em'
                }}>{user?.stats?.notifications || '0'}</p>
                <div style={{
                  width: '2.75rem',
                  height: '2.75rem',
                  background: 'rgba(255, 255, 255, 0.18)',
                  borderRadius: '0.625rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}>
                  <Bell style={{ width: '1.375rem', height: '1.375rem', color: '#ffffff' }} />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Módulos del Sistema */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          style={{ marginBottom: '2.5rem' }}
        >
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#ffffff',
            margin: '0 0 1.5rem 0',
            letterSpacing: '0.005em'
          }}>Módulos del Sistema</h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.5rem',
            width: '100%'
          }}>
            {navigation.filter(item => item.id !== 'dashboard').map((item, index) => {
              const Icon = item.icon;
              const colors = [
                { bg: 'linear-gradient(135deg, #1e5cb3 0%, #2563eb 100%)', shadow: 'rgba(30, 92, 179, 0.3)' },
                { bg: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)', shadow: 'rgba(22, 163, 74, 0.3)' },
                { bg: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)', shadow: 'rgba(8, 145, 178, 0.3)' },
                { bg: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)', shadow: 'rgba(234, 88, 12, 0.3)' },
                { bg: 'linear-gradient(135deg, #dc143c 0%, #ef4444 100%)', shadow: 'rgba(220, 20, 60, 0.3)' },
                { bg: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)', shadow: 'rgba(2, 132, 199, 0.3)' },
                { bg: 'linear-gradient(135deg, #15803d 0%, #16a34a 100%)', shadow: 'rgba(21, 128, 61, 0.3)' },
                { bg: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)', shadow: 'rgba(29, 78, 216, 0.3)' }
              ];
              const colorScheme = colors[index % colors.length];

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    delay: index * 0.05 + 0.3, 
                    duration: 0.4
                  }}
                  whileHover={{ 
                    scale: 1.03,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    background: '#ffffff',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    cursor: 'pointer',
                    boxShadow: `0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.06)`,
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    minHeight: '200px',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{
                    width: '5rem',
                    height: '5rem',
                    background: colorScheme.bg,
                    borderRadius: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem',
                    boxShadow: `0 4px 12px ${colorScheme.shadow}, 0 2px 4px rgba(0, 0, 0, 0.1)`
                  }}>
                    <Icon style={{ width: '2.5rem', height: '2.5rem', color: 'white' }} />
                  </div>
                  
                  <h3 style={{
                    fontWeight: '600',
                    color: '#1a202c',
                    fontSize: '1.0625rem',
                    margin: '0 0 1rem 0',
                    letterSpacing: '0.005em'
                  }}>
                    {item.label}
                  </h3>
                  
                  <button
                    onClick={() => navigateToSection(item.id)}
                    style={{
                      width: '100%',
                      padding: '0.625rem 1.25rem',
                      background: colorScheme.bg,
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontWeight: '600',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: `0 2px 6px ${colorScheme.shadow}`,
                      letterSpacing: '0.02em'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = `0 4px 10px ${colorScheme.shadow}`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = `0 2px 6px ${colorScheme.shadow}`;
                    }}
                  >
                    Acceder
                  </button>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Footer con Logo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          style={{
            background: 'linear-gradient(135deg, #0d3a5c 0%, #0a2540 100%)',
            borderRadius: '1rem',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div style={{
            padding: '2.25rem',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '150px'
          }}>
            <img
              src="/ProD Talento Hum.png"
              alt="Dirección del Talento Humano y Servicios"
              style={{
                maxHeight: '120px',
                maxWidth: '100%',
                objectFit: 'contain',
                filter: 'brightness(1.15) contrast(1.05)'
              }}
            />
          </div>

          <div style={{
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '1.25rem',
            textAlign: 'center',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: '#ffffff',
              margin: '0 0 0.375rem 0',
              letterSpacing: '0.005em'
            }}>
              Centro de Exportación e Inversión de la República Dominicana
            </h3>
            <p style={{
              color: '#d1dce6',
              fontSize: '0.875rem',
              fontWeight: '400',
              margin: 0,
              letterSpacing: '0.01em'
            }}>
              Habilitadores de Sueños y Oportunidades
            </p>
          </div>
        </motion.div>

        {/* Copyright */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          style={{
            marginTop: '2rem',
            textAlign: 'center',
            color: '#a8bccf',
            fontSize: '0.8125rem',
            fontWeight: '400',
            letterSpacing: '0.01em'
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
      case 'acciones-personal': return <AccionesPersonal />; // ← AGREGAR ESTA LÍNEA
      default: return <Dashboard />;
    }
  };

  return (
    <div style={{ display:'flex', height:'100vh', background:'#0a2540' }}>
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
  if (loading) return <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', fontSize:'1.2rem', color:'#94a3b8', background:'#0a2540' }}>Cargando...</div>;
  
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/reset-password/:token" element={user ? <Navigate to="/dashboard" replace /> : <ResetPassword />} />
      <Route path="/postulacion" element={<FormularioPostulacion />} />
      
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
     