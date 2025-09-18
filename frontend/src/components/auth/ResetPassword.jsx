import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle } from 'lucide-react';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://192.168.0.239:5000/api';

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Validaciones
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 8) {
      setMessage('La contraseña debe tener al menos 8 caracteres');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword: formData.newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        setIsSuccess(true);
        setMessage('Contraseña actualizada correctamente. Serás redirigido al login en 3 segundos...');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setMessage(data.message || 'Error al actualizar la contraseña. El enlace puede haber expirado.');
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoContainer}>
          <img src="/PD-Logo-RGB-CEI.png" alt="ProDominicana Logo" style={styles.logo} />
        </div>

        <div style={styles.header}>
          <Lock size={48} color="#667eea" style={{ margin: '0 auto 16px' }} />
          <h2 style={styles.title}>Restablecer Contraseña</h2>
          <p style={styles.subtitle}>Ingresa tu nueva contraseña</p>
        </div>

        {message && (
          <div style={{
            ...styles.message,
            backgroundColor: isSuccess ? '#d4edda' : '#f8d7da',
            color: isSuccess ? '#155724' : '#721c24',
            borderColor: isSuccess ? '#c3e6cb' : '#f5c6cb'
          }}>
            {isSuccess ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Nueva Contraseña</label>
            <div style={styles.inputContainer}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                required
                style={styles.input}
                placeholder="Mínimo 8 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Confirmar Contraseña</label>
            <div style={styles.inputContainer}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                style={styles.input}
                placeholder="Repite la nueva contraseña"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              backgroundColor: loading ? '#9ca3af' : '#667eea',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
          </button>
        </form>

        <div style={styles.footer}>
          <button
            onClick={() => navigate('/login')}
            style={styles.linkButton}
          >
            Volver al Login
          </button>
        </div>
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
    padding: '2rem'
  },
  logoContainer: {
    textAlign: 'center',
    marginBottom: '1.5rem'
  },
  logo: {
    width: '120px',
    height: 'auto'
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem'
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '0.5rem'
  },
  subtitle: {
    fontSize: '0.9rem',
    color: '#666'
  },
  message: {
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    border: '1px solid',
    fontSize: '0.9rem'
  },
  form: {
    display: 'flex',
    flexDirection: 'column'
  },
  field: {
    marginBottom: '1.25rem'
  },
  label: {
    display: 'block',
    fontSize: '0.9rem',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '0.5rem'
  },
  inputContainer: {
    position: 'relative'
  },
  input: {
    width: '100%',
    padding: '0.75rem 2.5rem 0.75rem 0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '1rem',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s'
  },
  eyeButton: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
    padding: '0'
  },
  button: {
    padding: '0.75rem',
    borderRadius: '8px',
    border: 'none',
    color: 'white',
    fontSize: '1rem',
    fontWeight: 'bold',
    marginTop: '0.5rem',
    transition: 'all 0.2s'
  },
  footer: {
    textAlign: 'center',
    marginTop: '1.5rem'
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: '#667eea',
    fontSize: '0.9rem',
    cursor: 'pointer',
    textDecoration: 'underline'
  }
};

export default ResetPassword;