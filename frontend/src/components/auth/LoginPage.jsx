// src/components/auth/LoginPage.jsx
import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const LoginPage = () => {
  const { login, forgotPassword, user, loading, logout } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState(null)
  const [forgotMode, setForgotMode] = useState(false)
  const [message, setMessage] = useState('')

  // Redirigir si ya hay sesión activa y usuario está activo
  useEffect(() => {
    if (user && user.estado === 'Activo') {
      navigate('/dashboard')
    } else if (user && user.estado !== 'Activo') {
      logout()
      setLoginError('Usuario inactivo. Contacta al administrador.')
    }
  }, [user, navigate, logout])

  // Manejar login
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoginError(null)
    setMessage('')
    const result = await login(email, password)
    if (!result.success) {
      setLoginError(result.error)
    }
  }

  // Manejar forgot password
  const handleForgot = async () => {
    setMessage('')
    if (!email) {
      setMessage('Por favor ingresa tu email')
      return
    }

    try {
      const result = await forgotPassword(email)
      if (result.success) {
        setMessage(
          'Se ha enviado un correo con las instrucciones para restablecer tu contraseña. Revisa tu bandeja de entrada.'
        )
      } else {
        setMessage(result.error || 'Error al enviar email')
      }
    } catch {
      setMessage('Error al enviar email')
    }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.logoContainer}>
          <img src="/PD-Logo-RGB-CEI.png" alt="ProDominicana Logo" style={styles.logo} />
        </div>

        {forgotMode ? (
          <div style={styles.form}>
            <h2 style={styles.title}>Olvidé mi contraseña</h2>
            <p style={styles.subtitle}>Ingresa tu email para recibir instrucciones</p>

            <div style={styles.field}>
              <label style={styles.label}>Email:</label>
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
              {loading ? 'Enviando...' : 'Enviar Instrucciones'}
            </button>

            {message && (
              <div style={message.includes('Error') ? styles.error : styles.success}>{message}</div>
            )}

            <p
              style={styles.link}
              onClick={() => {
                setForgotMode(false)
                setMessage('')
              }}
            >
              Volver al login
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={styles.form}>
            <h2 style={styles.title}>Iniciar Sesión</h2>
            <p style={styles.subtitle}>Accede a tu cuenta</p>

            <div style={styles.field}>
              <label style={styles.label}>Email:</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={styles.input}
                placeholder="Ingresa tu email"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Contraseña:</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={styles.input}
                placeholder="Ingresa tu contraseña"
              />
            </div>

            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? 'Cargando...' : 'Ingresar'}
            </button>

            {loginError && <p style={styles.error}>{loginError}</p>}
            {message && <p style={styles.success}>{message}</p>}

            <p
              style={styles.link}
              onClick={() => {
                setForgotMode(true)
                setMessage('')
                setLoginError(null)
              }}
            >
              ¿Olvidaste tu contraseña?
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

// ============================
// ESTILOS
// ============================
const styles = {
  wrapper: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #a2cfe9ff 0%, #478be4ff 100%)', padding: '1rem' },
  card: { backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px', padding: '2rem', textAlign: 'center' },
  logoContainer: { marginBottom: '1.5rem' },
  logo: { width: '120px', height: 'auto' },
  title: { fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#333' },
  subtitle: { fontSize: '0.9rem', color: '#666', marginBottom: '1.5rem' },
  form: { display: 'flex', flexDirection: 'column' },
  field: { marginBottom: '1rem', display: 'flex', flexDirection: 'column', textAlign: 'left' },
  label: { fontSize: '0.9rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' },
  input: { padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s' },
  button: { padding: '0.75rem', borderRadius: '8px', border: 'none', backgroundColor: '#667eea', color: 'white', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', marginTop: '1rem', transition: 'all 0.2s' },
  link: { color: '#667eea', cursor: 'pointer', marginTop: '1rem', textDecoration: 'underline', fontSize: '0.9rem' },
  error: { color: '#dc3545', textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem', backgroundColor: '#f8d7da', padding: '0.5rem', borderRadius: '4px', border: '1px solid #f5c6cb' },
  success: { color: '#155724', textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem', backgroundColor: '#d4edda', padding: '0.5rem', borderRadius: '4px', border: '1px solid #c3e6cb' },
}

export default LoginPage



