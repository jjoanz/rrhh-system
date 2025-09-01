import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { DEMO_USERS } from '../../data/users';
import { 
  Building2, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn,
  AlertCircle 
} from 'lucide-react';


const LoginPage = () => {
  const { login } = useAuth();
  const { showSuccessMessage, showErrorMessage } = useApp();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        showSuccessMessage(`¡Bienvenido, ${result.user.name}!`, 'Inicio de sesión exitoso');
      } else {
        setError(result.error);
        showErrorMessage(result.error, 'Error de autenticación');
      }
    } catch (error) {
      const errorMsg = 'Error inesperado. Por favor, intenta nuevamente.';
      setError(errorMsg);
      showErrorMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (userEmail) => {
    const user = DEMO_USERS.find(u => u.email === userEmail);
    if (user) {
      setFormData({
        email: userEmail,
        password: '123456'
      });
      setError('');
    }
  };

  const getRoleLabel = (role) => {
    const labels = {
      colaborador: 'Colaborador',
      gerente: 'Gerente',
      director: 'Director',
      rrhh: 'Recursos Humanos',
      director_rrhh: 'Director de RRHH',
      admin: 'Administrador'
    };
    return labels[role] || role;
  };

  const getRoleColor = (role) => {
    const colors = {
      colaborador: 'green',
      gerente: 'blue',
      director: 'purple',
      rrhh: 'orange',
      director_rrhh: 'red',
      admin: 'gray'
    };
    return colors[role] || 'gray';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{ maxWidth: '28rem', width: '100%' }}>
        
        {/* Tarjeta principal de login */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          boxShadow: '0 20px 20px -5px rgba(0, 0, 0, 0.1)',
          padding: '2rem',
          marginBottom: '1.5rem'
        }}>
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              margin: '0 auto',
              width: '4rem',
              height: '4rem',
              background: 'linear-gradient(135deg, #f63b3bff, #6366f1)',
              borderRadius: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }}>
              <Building2 style={{ width: '2rem', height: '2rem', color: 'white' }} />
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
              RRHH Pro
            </h1>
            <p style={{ color: '#6b7280' }}>Sistema de Gestión de Recursos Humanos</p>
          </div>

          {/* Formulario */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Correo Electrónico
              </label>
              <div style={{ position: 'relative' }}>
                <User style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '1.25rem', height: '1.25rem', color: '#9ca3af' }} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  style={{
                    width: '83%',
                    paddingLeft: '2.5rem',
                    paddingRight: '1rem',
                    paddingTop: '0.75rem',
                    paddingBottom: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  placeholder="usuario@prodominicana.gob.do"
                  required
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '1.25rem', height: '1.25rem', color: '#9ca3af' }} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  style={{
                    width: '75%',
                    paddingLeft: '2.5rem',
                    paddingRight: '3rem',
                    paddingTop: '0.75rem',
                    paddingBottom: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  placeholder="••••••••"
                  required
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#9ca3af',
                    cursor: 'pointer'
                  }}
                >
                  {showPassword ? <EyeOff style={{ width: '1.25rem', height: '1.25rem' }} /> : <Eye style={{ width: '1.25rem', height: '1.25rem' }} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#dc2626',
                fontSize: '0.875rem',
                background: '#fef2f2',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid #fecaca',
                marginBottom: '1.5rem'
              }}>
                <AlertCircle style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Botón de login */}
            <button
              onClick={handleSubmit}
              disabled={loading || !formData.email || !formData.password}
              style={{
                width: '100%',
                background: loading || !formData.email || !formData.password ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6, #6366f1)',
                color: 'white',
                padding: '0.50rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontWeight: '500',
                cursor: loading || !formData.email || !formData.password ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 10px 10px -3px rgba(0, 0, 0, 0.1)',
                fontSize: '1rem'
              }}
            >
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '1rem',
                    height: '1rem',
                    border: '2px solid white',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  <span>Iniciando sesión...</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <LogIn style={{ width: '1rem', height: '1rem' }} />
                  <span>Iniciar Sesión</span>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Usuarios de prueba */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          padding: '1.5rem'
        }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '1rem', textAlign: 'center' }}>
            Usuarios de Prueba
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', textAlign: 'center', marginBottom: '1rem' }}>
            Haz clic en cualquier usuario para acceder instantáneamente
          </p>
          
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {DEMO_USERS.map(user => (
              <button
                key={user.id}
                onClick={() => quickLogin(user.email)}
                style={{
                  textAlign: 'left',
                  padding: '1rem',
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#f3f4f6';
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#f9fafb';
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ fontSize: '1.5rem' }}>{user.avatar}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <p style={{ fontWeight: '500', color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user.name}
                      </p>
                      <span style={{
                        padding: '0.125rem 0.5rem',
                        fontSize: '0.75rem',
                        borderRadius: '9999px',
                        border: '1px solid',
                        background: getRoleColor(user.role) === 'green' ? '#f0fdf4' : 
                                   getRoleColor(user.role) === 'blue' ? '#eff6ff' :
                                   getRoleColor(user.role) === 'purple' ? '#faf5ff' :
                                   getRoleColor(user.role) === 'orange' ? '#fff7ed' :
                                   getRoleColor(user.role) === 'red' ? '#fef2f2' : '#f9fafb',
                        color: getRoleColor(user.role) === 'green' ? '#166534' : 
                               getRoleColor(user.role) === 'blue' ? '#1d4ed8' :
                               getRoleColor(user.role) === 'purple' ? '#7c3aed' :
                               getRoleColor(user.role) === 'orange' ? '#ea580c' :
                               getRoleColor(user.role) === 'red' ? '#dc2626' : '#374151',
                        borderColor: getRoleColor(user.role) === 'green' ? '#bbf7d0' : 
                                     getRoleColor(user.role) === 'blue' ? '#bfdbfe' :
                                     getRoleColor(user.role) === 'purple' ? '#e9d5ff' :
                                     getRoleColor(user.role) === 'orange' ? '#fed7aa' :
                                     getRoleColor(user.role) === 'red' ? '#fecaca' : '#e5e7eb'
                      }}>
                        {getRoleLabel(user.role)}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.email}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0 }}>
                      {user.position}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: '#eff6ff',
            borderRadius: '0.5rem',
            border: '1px solid #bfdbfe'
          }}>
            <p style={{ fontSize: '0.75rem', color: '#1d4ed8', textAlign: 'center', margin: 0 }}>
              <strong>Tip:</strong> Todas las contraseñas son "123456"
            </p>
          </div>
        </div>
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

export default LoginPage;