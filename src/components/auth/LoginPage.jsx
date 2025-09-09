import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const LoginPage = () => {
  const { login, forgotPassword, error, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(null);
  const [forgotMode, setForgotMode] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError(null);
    const result = await login(email, password);
    if (!result.success) setLoginError(result.error);
  };

  const handleForgot = async () => {
    setMessage('');
    try {
      const result = await forgotPassword(email);
      setMessage(result.resetToken 
        ? `Token generado: ${result.resetToken}` // Solo para pruebas
        : 'Revisa tu email para restablecer tu contraseña');
    } catch (err) {
      setMessage('Error al enviar token');
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoContainer}>
          <img src="/PD-Logo-RGB-CEI.png" alt="ProDominicana Logo" style={styles.logo} />
        </div>

        {!forgotMode ? (
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
            <p style={styles.link} onClick={() => { setForgotMode(true); setMessage(''); }}>
              Olvidé mi contraseña
            </p>
          </form>
        ) : (
          <div style={styles.form}>
            <h2 style={styles.title}>Olvidé mi contraseña</h2>
            <div style={styles.field}>
              <label>Email:</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={styles.input}/>
            </div>
            <button onClick={handleForgot} style={styles.button}>Enviar Token</button>
            {message && <p style={styles.message}>{message}</p>}
            <p style={styles.link} onClick={() => { setForgotMode(false); setMessage(''); }}>
              Volver al login
            </p>
          </div>
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
    marginBottom: '1.5rem',
    color: '#333'
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
    marginTop: '1rem'
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
    marginTop: '1rem'
  },
  message: {
    color: 'green',
    textAlign: 'center',
    marginTop: '1rem'
  }
};

export default LoginPage;
