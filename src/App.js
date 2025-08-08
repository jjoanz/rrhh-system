import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { useAuth } from './context/AuthContext';
import { useApp } from './context/AppContext';
import LoginPage from './components/auth/LoginPage';
import { Building2, Home, User, Calendar, Clock, DollarSign, Briefcase, Users, BookOpen, BarChart3, Settings, FileText, Menu, LogOut } from 'lucide-react';
import { getNavigationByRole } from './data/navigation';
import VacacionesModule from './components/modules/vacaciones/VacacionesModule';
import NominaModule from './components/modules/nomina/NominaModule';
import AsistenciaModule from './components/modules/asistencia/AsistenciaModule';
import CapacitacionModule from './components/modules/capacitacion/CapacitacionModule';
import VacantesModule from './components/modules/vacantes/VacantesModule';
// ✅ CORREGIDO: usando perfilModule con p minúscula (como está el archivo real)
import PerfilModule from './components/modules/perfil/perfilModule';
import EmpleadosModule from './components/modules/empleados/EmpleadosModule';
import configuracion from './components/modules/configuracion/ConfiguracionModule';
import ConfiguracionModule from './components/modules/configuracion/ConfiguracionModule';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { activeSection, navigateToSection } = useApp();
  const navigation = getNavigationByRole(user.role);

  return (
    <>
      {isOpen && (
        <div 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: 'rgba(0, 0, 0, 0.5)', 
            zIndex: 40 
          }} 
          onClick={onClose} 
        />
      )}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100%',
        width: '16rem',
        background: 'white',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease',
        zIndex: 50
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Building2 style={{ width: '2rem', height: '2rem', color: '#3b82f6' }} />
            <span style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#111827' }}>
            <img
              src="PD-Logo-RGB-CEI.png"
              alt="Logo"
              style={{ height: '24px', width: 'auto' }}
            />
            </span>
          </div>
          <button 
            onClick={onClose} 
            style={{ 
              border: 'none', 
              background: 'none', 
              fontSize: '1.5rem', 
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            ×
          </button>
        </div>

        <div style={{
          padding: '1rem',
          borderBottom: '1px solid #e5e7eb',
          background: '#f9fafb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              background: '#3b82f6',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '1rem'
            }}>
              {user.avatar || user.name.charAt(0)}
            </div>
            <div>
              <p style={{ fontWeight: '500', color: '#111827', margin: 0 }}>
                {user.name}
              </p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                {user.position}
              </p>
            </div>
          </div>
        </div>

        <nav style={{ padding: '1rem' }}>
          {navigation.map(item => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  navigateToSection(item.id);
                  onClose();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  marginBottom: '0.25rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  background: isActive ? '#3b82f6' : 'transparent',
                  color: isActive ? 'white' : '#374151',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
              >
                <Icon style={{ width: '1.25rem', height: '1.25rem' }} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
};

const Header = () => {
  const { user, logout } = useAuth();
  const { toggleSidebar } = useApp();

  return (
    <header style={{
      background: 'white',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      borderBottom: '1px solid #e5e7eb'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={toggleSidebar} 
            style={{
              padding: '0.5rem',
              border: 'none',
              background: 'none',
              cursor: 'pointer'
            }}
          >
            <Menu style={{ width: '1.25rem', height: '1.25rem' }} />
          </button>
          <h1 style={{
          fontSize: '1.125rem',
          fontWeight: 'bold',
          color: '#111827',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <img
            src="PD-Logo-RGB-CEI.png"
            alt="Logo"
            style={{ height: '24px', width: 'auto' }}
          />Sistema de Gestión RRHH ProDominicana v.1
        </h1>

        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#111827',
              margin: 0
            }}>
              {user.name}
            </p>
            <p style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              margin: 0
            }}>
              {user.position}
            </p>
          </div>
          <button 
            onClick={logout} 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            <LogOut style={{ width: '1rem', height: '1rem' }} />
            Salir
          </button>
        </div>
      </div>
    </header>
  );
};

const Dashboard = () => {
  const { user } = useAuth();

  const getRoleLabel = (role) => {
    const labels = {
      colaborador: 'Colaborador',
      gerente: 'Gerente', 
      director: 'Director',
      rrhh: 'Recursos Humanos',
      gerente_rrhh: 'Gerente de RRHH',
      director_rrhh: 'Director de RRHH',
      admin: 'Administrador'
    };
    return labels[role] || role;
  };

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ maxWidth: '112rem', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '0.5rem'
          }}>
            ¡Hola, {user.name}! {user.avatar}
          </h1>
          <p style={{
            color: '#6b7280',
            fontSize: '1.125rem'
          }}>
            Bienvenido al sistema de gestión de recursos humanos
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(20rem, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '0.75rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb',
            padding: '1.5rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#111827',
                margin: 0
              }}>
                Mi Información
              </h3>
              <User style={{ width: '1.5rem', height: '1.5rem', color: '#3b82f6' }} />
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                <span style={{ fontWeight: '500' }}>Rol:</span> {getRoleLabel(user.role)}
              </p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                <span style={{ fontWeight: '500' }}>Posición:</span> {user.position}
              </p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                <span style={{ fontWeight: '500' }}>Departamento:</span> {user.department}
              </p>
            </div>
          </div>

          {user.role !== 'admin' && (
            <div style={{
              background: 'white',
              borderRadius: '0.75rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb',
              padding: '1.5rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#111827',
                  margin: 0
                }}>
                  Vacaciones
                </h3>
                <Calendar style={{ width: '1.5rem', height: '1.5rem', color: '#10b981' }} />
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                  <span style={{ fontWeight: '500' }}>Días disponibles:</span> {user.vacationDays - user.usedVacationDays}
                </p>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                  <span style={{ fontWeight: '500' }}>Días utilizados:</span> {user.usedVacationDays}
                </p>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                  <span style={{ fontWeight: '500' }}>Total anual:</span> {user.vacationDays}
                </p>
              </div>
            </div>
          )}

          <div style={{
            background: 'white',
            borderRadius: '0.75rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb',
            padding: '1.5rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#111827',
                margin: 0
              }}>
                Sistema
              </h3>
              <Settings style={{ width: '1.5rem', height: '1.5rem', color: '#f59e0b' }} />
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                Sistema completamente funcional
              </p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                Todos los módulos disponibles
              </p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                Responsive y móvil-friendly
              </p>
            </div>
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '0.75rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb',
          padding: '1.5rem'
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '1rem'
          }}>
            Funcionalidades Disponibles para tu Rol
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(15rem, 1fr))',
            gap: '1rem'
          }}>
            {getNavigationByRole(user.role)?.map(item => {
              const Icon = item.icon;
              return (
                <div 
                  key={item.id} 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    background: '#f9fafb',
                    borderRadius: '0.5rem'
                  }}
                >
                  <Icon style={{ width: '1.25rem', height: '1.25rem', color: '#3b82f6' }} />
                  <span style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const MainApp = () => {
  const { user, loading } = useAuth();
  const { sidebarOpen, closeSidebar, activeSection } = useApp();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  // Función para renderizar el módulo correspondiente
  const renderModule = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'vacaciones':
        return <VacacionesModule />;
      case 'nomina':
        return <NominaModule />;
      case 'asistencia':
        return <AsistenciaModule />;
      case 'capacitacion':
        return <CapacitacionModule />;
      case 'vacantes':
        return <VacantesModule />;
      case 'perfil':
        return <PerfilModule />;

      case 'empleados':
        return <EmpleadosModule />;
      
        case 'configuracion':
        return <ConfiguracionModule />;
        
        
      
      default:
        return (
          <div style={{ padding: '1.5rem' }}>
            <div style={{ maxWidth: '112rem', margin: '0 auto' }}>
              <div style={{
                background: 'white',
                borderRadius: '0.75rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                padding: '2rem',
                border: '1px solid #e5e7eb',
                textAlign: 'center'
              }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: '#111827',
                  marginBottom: '1rem'
                }}>
                  Módulo: {getNavigationByRole(user.role)?.find(item => item.id === activeSection)?.label}
                </h2>
                <p style={{
                  color: '#6b7280',
                  marginBottom: '1.5rem'
                }}>
                  Este módulo está en desarrollo. Pronto estará disponible con todas las funcionalidades.
                </p>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem'
                }}>
                  <Settings style={{ width: '1.25rem', height: '1.25rem' }} />
                  <span>Próximamente disponible</span>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: '#f8fafc'
    }}>
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <Header />
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {renderModule()}
        </main>
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

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