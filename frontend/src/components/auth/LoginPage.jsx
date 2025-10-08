// src/components/auth/LoginPage.jsx
import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Shield, Building2 } from 'lucide-react'

const LoginPage = () => {
  const { login, forgotPassword, user, loading, logout } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState(null)
  const [forgotMode, setForgotMode] = useState(false)
  const [message, setMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

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
    setIsLoading(true)
    
    const result = await login(email, password)
    if (!result.success) {
      setLoginError(result.error)
    }
    setIsLoading(false)
  }

  // Manejar forgot password
  const handleForgot = async () => {
    setMessage('')
    if (!email) {
      setMessage('Por favor ingresa tu email')
      return
    }

    setIsLoading(true)
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
    setIsLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundImage: 'url("/images/ProD Back.jpg")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Overlay oscuro para mejorar legibilidad */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.3)',
        zIndex: 1
      }}></div>

      {/* Main Login Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '3rem 2.5rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
          width: '100%',
          maxWidth: '420px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          position: 'relative',
          zIndex: 2
        }}
      >
       {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem'
            }}
          >
            <img 
              src="./ProDominicana Logo FC.png" 
              alt="ProDominicana Logo" 
              style={{ height: '60px', width: 'auto' }} 
            />
          </motion.div>

          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 'bold',
            color: 'rgb(17, 24, 39)',
            margin: '0 0 0.5rem 0'
          }}>
            {forgotMode ? 'Recuperar Contraseña' : 'Bienvenido'}
          </h1>
          <p style={{
            color: 'rgb(107, 114, 128)',
            fontSize: '0.95rem',
            margin: 0
          }}>
            {forgotMode 
              ? 'Ingresa tu email para recibir las instrucciones'
              : 'Sistema de Gestión de Recursos Humanos'
            }
          </p>
        </div>


        {/* Forms */}
        <AnimatePresence mode="wait">
          {forgotMode ? (
            <motion.div key="forgot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'rgb(55, 65, 81)',
                  marginBottom: '0.5rem'
                }}>Correo Electrónico</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'rgb(156, 163, 175)'
                  }} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem 0.875rem 3rem',
                      borderRadius: '12px',
                      border: '2px solid rgb(229, 231, 235)',
                      fontSize: '1rem',
                      boxSizing: 'border-box'
                    }}
                    placeholder="tu.email@ejemplo.com"
                  />
                </div>
              </div>

              <button
                onClick={handleForgot}
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, rgb(37, 99, 235), rgb(67, 56, 202))',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <Shield size={18} />
                {isLoading ? 'Enviando...' : 'Enviar Instrucciones'}
              </button>

              <button
                onClick={() => { setForgotMode(false); setMessage('') }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  marginTop: '1rem',
                  borderRadius: '12px',
                  border: '2px solid rgb(229, 231, 235)',
                  background: 'white',
                  color: 'rgb(107, 114, 128)',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Volver al Login
              </button>
            </motion.div>
          ) : (
            <motion.form key="login" onSubmit={handleSubmit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'rgb(55, 65, 81)',
                  marginBottom: '0.5rem'
                }}>Correo Electrónico</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'rgb(156, 163, 175)'
                  }} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem 0.875rem 3rem',
                      borderRadius: '12px',
                      border: '2px solid rgb(229, 231, 235)',
                      fontSize: '1rem',
                      boxSizing: 'border-box'
                    }}
                    placeholder="tu.email@prodominicana.gob.do"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'rgb(55, 65, 81)',
                  marginBottom: '0.5rem'
                }}>Contraseña</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'rgb(156, 163, 175)'
                  }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '0.875rem 3rem 0.875rem 3rem',
                      borderRadius: '12px',
                      border: '2px solid rgb(229, 231, 235)',
                      fontSize: '1rem',
                      boxSizing: 'border-box'
                    }}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      color: 'rgb(156, 163, 175)'
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, rgb(37, 99, 235), rgb(67, 56, 202))',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 15px rgba(37, 99, 235, 0.3)'
                }}
              >
                {isLoading ? 'Iniciando...' : 'Iniciar Sesión'}
                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                onClick={() => { setForgotMode(true); setMessage(''); setLoginError(null) }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  marginTop: '1rem',
                  borderRadius: '12px',
                  border: '2px solid rgb(229, 231, 235)',
                  background: 'white',
                  color: 'rgb(107, 114, 128)',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Messages */}
        <AnimatePresence>
          {loginError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                marginTop: '1rem',
                padding: '0.875rem',
                borderRadius: '12px',
                background: 'rgb(254, 242, 242)',
                border: '1px solid rgb(252, 165, 165)',
                color: 'rgb(185, 28, 28)',
                fontSize: '0.875rem',
                textAlign: 'center'
              }}
            >
              {loginError}
            </motion.div>
          )}

          {message && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                marginTop: '1rem',
                padding: '0.875rem',
                borderRadius: '12px',
                background: message.includes('Error') ? 'rgb(254, 242, 242)' : 'rgb(240, 253, 244)',
                border: message.includes('Error') ? '1px solid rgb(252, 165, 165)' : '1px solid rgb(167, 243, 208)',
                color: message.includes('Error') ? 'rgb(185, 28, 28)' : 'rgb(22, 101, 52)',
                fontSize: '0.875rem',
                textAlign: 'center'
              }}
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{
            marginTop: '2rem',
            textAlign: 'center',
            color: 'rgb(107, 114, 128)',
            fontSize: '0.8rem'
          }}
        >
          <p style={{ margin: 0 }}>© {new Date().getFullYear()} ProDominicana</p>
          <p style={{ margin: '0.25rem 0 0 0' }}>
            Centro de Exportación e Inversión de la República Dominicana
          </p>
        </motion.div>
      </motion.div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  )
}

export default LoginPage