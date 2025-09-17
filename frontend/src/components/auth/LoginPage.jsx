import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const LoginPage = () => {
  const { 
    login, 
    forgotPassword, 
    resetPassword, 
    error, 
    loading,
    resetMode,
    setResetMode,
    resetToken
  } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loginError, setLoginError] = useState(null);
  const [forgotMode, setForgotMode] = useState(false);
  const [message, setMessage] = useState('');

  // ✅ VERIFICAR SI HAY TOKEN DE RESET AL CARGAR
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token && window.location.pathname.includes('reset-password')) {
      setResetMode(true);
      // Limpiar URL
      window.history.replaceState({}, document.title, '/');
    }
  }, [setResetMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError(null);
    const result = await login(email, password);
    if (!result.success) setLoginError(result.error);
  };

  const handleForgot = async () => {
    setMessage('');
    if (!email) {
      setMessage('Por favor ingresa tu email');
      return;
    }
    
    try {
      const result = await forgotPassword(email);
      if (result.success) {
        setMessage('Se ha enviado un correo con las instrucciones para restablecer tu contraseña');
      } else {
        setMessage(result.error || 'Error al enviar email');
      }
    } catch (err) {
      setMessage('Error al enviar email');
    }
  };

  // ✅ NUEVA FUNCIÓN PARA MANEJAR RESET
  const handleReset = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoginError(null);

    // Validaciones
    if (!newPassword || !confirmPassword) {
      setLoginError('Por favor completa todos los campos');
      return;
    }

    if (newPassword.length < 8) {
      setLoginError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setLoginError('Las contraseñas no coinciden');
      return;
    }

    try {
      const result = await resetPassword(resetToken, newPassword);
      if (result.success) {
        setMessage('¡Contraseña actualizada correctamente! Redirigiendo...');
        setTimeout(() => {
          setResetMode(false);
          setNewPassword('');
          setConfirmPassword('');
          setMessage('Ya puedes iniciar sesión con tu nueva contraseña');
        }, 2000);
      } else {
        setLoginError(result.error || 'Error al restablecer la contraseña');
      }
    } catch (err) {
      setLoginError('Error de conexión con el servidor');
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoContainer}>
          <img src="/PD-Logo-RGB-CEI.png" alt="ProDominicana Logo" style={styles.logo} />
        </div>

        {/* ✅ MODO RESET PASSWORD */}
        {resetMode ? (
          <form onSubmit={handleReset} style={styles.form}>
            <h2 style={styles.title}>Restablecer Contraseña</h2>
            <p style={styles.subtitle}>Ingresa tu nueva contraseña</p>
            
            <div style={styles.field}>
              <label>Nueva Contraseña:</label>
              <input 
                type="password" 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                placeholder="Mínimo 8 caracteres"
                required 
                style={styles.input}
              />
            </div>
            
            <div style={styles.field}>
              <label>Confirmar Contraseña:</label>
              <input 
                type="password" 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                placeholder="Repite la contraseña"
                required 
                style={styles.input}
              />
            </div>
            
            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
            </button>
            
            {loginError && <p style={styles.error}>{loginError}</p>}
            {message && <p style={styles.success}>{message}</p>}
            
            <p style={styles.link} onClick={() => {
              setResetMode(false);
              setNewPassword('');
              setConfirmPassword('');
              setMessage('');
              setLoginError(null);
            }}>
              Volver al login
            </p>
          </form>
        )
        
        /* MODO FORGOT PASSWORD */
        : forgotMode ? (
          <div style={styles.form}>
            <h2 style={styles.title}>Olvidé mi contraseña</h2>
            <div style={styles.field}>
              <label>Email:</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                style={styles.input}
                placeholder="Ingresa tu email"
              />
            </div>
            <button onClick={handleForgot} disabled={loading} style={styles.button}>
              {loading ? 'Enviando...' : 'Enviar Email'}
            </button>
            {message && <p style={styles.message}>{message}</p>}
            <p style={styles.link} onClick={() => { 
              setForgotMode(false); 
              setMessage(''); 
            }}>
              Volver al login
            </p>
          </div>
        ) 
        
        /* MODO LOGIN NORMAL */
        : (
          <form onSubmit={handleSubmit} style={styles.form}>
            <h2 style={styles.title}>Iniciar Sesión</h2>
            <div style={styles.field}>
              <label>Email:</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={styles.input}/>
            </div>
            <div style={styles.field}>
              <label>Contraseña:</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={styles.input}/>
            </div>
            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? 'Cargando...' : 'Ingresar'}
            </button>
            {loginError && <p style={styles.error}>{loginError}</p>}
            {error && <p style={styles.error}>{error}</p>}
            {message && <p style={styles.success}>{message}</p>}
            <p style={styles.link} onClick={() => { 
              setForgotMode(true); 
              setMessage(''); 
              setLoginError(null);
            }}>
              Olvidé mi contraseña
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #a2cfe9ff 0%, #478be4ff 100%)',
    padding: '1rem'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px',
    padding: '2rem',
    textAlign: 'center'
  },
  logoContainer: {
    marginBottom: '1.5rem'
  },
  logo: {
    width: '120px',
    height: 'auto'
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
    color: '#333'
  },
  subtitle: {
    fontSize: '0.9rem',
    color: '#666',
    marginBottom: '1.5rem'
  },
  form: {
    display: 'flex',
    flexDirection: 'column'
  },
  field: {
    marginBottom: '1rem',
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left'
  },
  input: {
    padding: '0.75rem',
    borderRadius: '8px',
    border: '1px solid #ccc',
    fontSize: '1rem',
    marginTop: '0.25rem'
  },
  button: {
    padding: '0.75rem',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#667eea',
    color: 'white',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '1rem',
    opacity: 1,
    transition: 'opacity 0.2s'
  },
  link: {
    color: '#764ba2',
    cursor: 'pointer',
    marginTop: '1rem',
    textDecoration: 'underline',
    fontSize: '0.9rem'
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginTop: '1rem',
    fontSize: '0.9rem'
  },
  success: {
    color: 'green',
    textAlign: 'center',
    marginTop: '1rem',
    fontSize: '0.9rem'
  },
  message: {
    color: 'green',
    textAlign: 'center',
    marginTop: '1rem',
    fontSize: '0.9rem'
  }
};

export default LoginPage;
