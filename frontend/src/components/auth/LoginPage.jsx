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
      background: 'linear-gradient(135deg, rgb(37, 99, 235) 0%, rgb(29, 78, 216) 30%, rgb(67, 56, 202) 70%, rgb(55, 48, 163) 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Effects */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3Ccircle cx='0' cy='30' r='4'/%3E%3Ccircle cx='60' cy='30' r='4'/%3E%3Ccircle cx='30' cy='0' r='4'/%3E%3Ccircle cx='30' cy='60' r='4'/%3E%3C/g%3E%3C/svg%3E")`,
        opacity: 0.3
      }}></div>

      {/* Floating Shapes */}
      <motion.div
        animate={{
          y: [-20, 20, -20],
          rotate: [0, 180, 0]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: '80px',
          height: '80px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          backdropFilter: 'blur(10px)'
        }}
      />
      
      <motion.div
        animate={{
          y: [20, -20, 20],
          rotate: [0, -180, 0]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{
          position: 'absolute',
          bottom: '20%',
          right: '15%',
          width: '60px',
          height: '60px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '30%',
          backdropFilter: 'blur(10px)'
        }}
      />

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
          position: 'relative'
        }}
      >
        {/* Header Section */}
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
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'white',
              padding: '1.5rem 2.5rem',
              borderRadius: '20px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
              border: '2px solid rgba(37, 99, 235, 0.1)'
            }}>
              <img 
                src="/PD-Logo-RGB-CEI.png" 
                alt="ProDominicana Logo" 
                style={{ height: '40px', width: 'auto' }} 
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: 'bold',
              color: 'rgb(17, 24, 39)',
              marginBottom: '0.5rem',
              margin: 0
            }}>
              {forgotMode ? 'Recuperar Contraseña' : 'Bienvenido'}
            </h1>
            <p style={{
              color: 'rgb(107, 114, 128)',
              fontSize: '0.95rem',
              margin: '0.5rem 0 0 0'
            }}>
              {forgotMode 
                ? 'Ingresa tu email para recibir las instrucciones'
                : 'Sistema de Gestión de Recursos Humanos'
              }
            </p>
          </motion.div>
        </div>

        {/* Form Section */}
        <AnimatePresence mode="wait">
          {forgotMode ? (
            <motion.div
              key="forgot"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'rgb(55, 65, 81)',
                  marginBottom: '0.5rem'
                }}>
                  Correo Electrónico
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail 
                    size={18} 
                    style={{
                      position: 'absolute',
                      left: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'rgb(156, 163, 175)'
                    }}
                  />
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
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      background: 'white',
                      boxSizing: 'border-box'
                    }}
                    placeholder="tu.email@ejemplo.com"
                    onFocus={(e) => e.target.style.borderColor = 'rgb(37, 99, 235)'}
                    onBlur={(e) => e.target.style.borderColor = 'rgb(229, 231, 235)'}
                  />
                </div>
              </div>

              <motion.button
                onClick={handleForgot}
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, rgb(37, 99, 235), rgb(67, 56, 202))',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 15px rgba(37, 99, 235, 0.3)',
                  opacity: isLoading ? 0.7 : 1
                }}
              >
                {isLoading ? (
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                ) : (
                  <>
                    <Shield size={18} />
                    Enviar Instrucciones
                  </>
                )}
              </motion.button>

              <motion.button
                onClick={() => {
                  setForgotMode(false)
                  setMessage('')
                }}
                whileHover={{ scale: 1.02 }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  border: '2px solid rgb(229, 231, 235)',
                  background: 'white',
                  color: 'rgb(107, 114, 128)',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  marginTop: '1rem',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = 'rgb(37, 99, 235)'
                  e.target.style.color = 'rgb(37, 99, 235)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = 'rgb(229, 231, 235)'
                  e.target.style.color = 'rgb(107, 114, 128)'
                }}
              >
                Volver al Login
              </motion.button>
            </motion.div>
          ) : (
            <motion.form
              key="login"
              onSubmit={handleSubmit}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Email Field */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'rgb(55, 65, 81)',
                  marginBottom: '0.5rem'
                }}>
                  Correo Electrónico
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail 
                    size={18} 
                    style={{
                      position: 'absolute',
                      left: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'rgb(156, 163, 175)'
                    }}
                  />
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
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      background: 'white',
                      boxSizing: 'border-box'
                    }}
                    placeholder="tu.email@prodominicana.gov.do"
                    onFocus={(e) => e.target.style.borderColor = 'rgb(37, 99, 235)'}
                    onBlur={(e) => e.target.style.borderColor = 'rgb(229, 231, 235)'}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'rgb(55, 65, 81)',
                  marginBottom: '0.5rem'
                }}>
                  Contraseña
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock 
                    size={18} 
                    style={{
                      position: 'absolute',
                      left: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'rgb(156, 163, 175)'
                    }}
                  />
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
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      background: 'white',
                      boxSizing: 'border-box'
                    }}
                    placeholder="••••••••"
                    onFocus={(e) => e.target.style.borderColor = 'rgb(37, 99, 235)'}
                    onBlur={(e) => e.target.style.borderColor = 'rgb(229, 231, 235)'}
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
                      color: 'rgb(156, 163, 175)',
                      padding: '0.25rem'
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, rgb(37, 99, 235), rgb(67, 56, 202))',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 15px rgba(37, 99, 235, 0.3)',
                  opacity: isLoading ? 0.7 : 1
                }}
              >
                {isLoading ? (
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                ) : (
                  <>
                    Iniciar Sesión
                    <ArrowRight size={18} />
                  </>
                )}
              </motion.button>

              {/* Forgot Password Link */}
              <motion.button
                type="button"
                onClick={() => {
                  setForgotMode(true)
                  setMessage('')
                  setLoginError(null)
                }}
                whileHover={{ scale: 1.02 }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  border: '2px solid rgb(229, 231, 235)',
                  background: 'white',
                  color: 'rgb(107, 114, 128)',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  marginTop: '1rem',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = 'rgb(37, 99, 235)'
                  e.target.style.color = 'rgb(37, 99, 235)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = 'rgb(229, 231, 235)'
                  e.target.style.color = 'rgb(107, 114, 128)'
                }}
              >
                ¿Olvidaste tu contraseña?
              </motion.button>
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
                textAlign: 'center',
                fontWeight: '500'
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
                textAlign: 'center',
                fontWeight: '500'
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
          transition={{ delay: 0.6, duration: 0.6 }}
          style={{
            marginTop: '2rem',
            textAlign: 'center',
            color: 'rgb(107, 114, 128)',
            fontSize: '0.8rem'
          }}
        >
          <p style={{ margin: 0 }}>
            © {new Date().getFullYear()} ProDominicana
          </p>
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