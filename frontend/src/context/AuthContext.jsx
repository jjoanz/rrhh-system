/// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [permisos, setPermisos] = useState([])
  const [loading, setLoading] = useState(true)

  const API_URL = process.env.REACT_APP_API_URL || 'http://192.168.0.239:5000/api'

  // ============================
  // FUNCIÓN PARA OBTENER TOKEN
  // ============================
  const getStoredToken = () => {
    const token = localStorage.getItem('rrhh_token')
    console.log('getStoredToken llamado, token:', token ? 'presente' : 'ausente')
    return token
  }

  // ============================
  // CONFIGURAR AXIOS INTERCEPTORS
  // ============================
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = getStoredToken()
        if (token) config.headers.Authorization = `Bearer ${token}`
        return config
      },
      (error) => Promise.reject(error)
    )

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) logout()
        return Promise.reject(error)
      }
    )

    return () => {
      axios.interceptors.request.eject(requestInterceptor)
      axios.interceptors.response.eject(responseInterceptor)
    }
  }, [])

  // ============================
  // VALIDAR TOKEN
  // ============================
  const isTokenValid = (token) => {
    if (!token) return false

    try {
      if (token.length < 10) return false

      if (token.includes('.')) {
        const parts = token.split('.')
        if (parts.length !== 3) return false

        const payload = JSON.parse(atob(parts[1]))
        if (!payload.exp) return true

        const currentTime = Date.now() / 1000
        return payload.exp > currentTime
      } else {
        return true
      }
    } catch (error) {
      console.error('Error validando token:', error)
      return false
    }
  }

  const mapEstado = (estado) => (estado === 1 || estado === true ? 'Activo' : 'Inactivo')

  const formatUser = (userData) => ({
    id: userData.id,
    name: `${userData.nombre || ''} ${userData.apellido || ''}`.trim() || 'Usuario',
    position: userData.puesto || userData.rol || '',
    role: userData.rol || 'Sistema',
    email: userData.email,
    empleadoId: userData.empleadoId,
    estado: mapEstado(userData.estado),
  })

  // ============================
  // LOGIN
  // ============================
  const login = async (email, password) => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error al iniciar sesión')

      localStorage.setItem('rrhh_token', data.token)
      const formattedUser = formatUser(data.user)
      setUser(formattedUser)
      setPermisos(data.permisos || [])
      return { success: true }
    } catch (error) {
      console.error('Error en login:', error)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  // ============================
  // LOGOUT
  // ============================
  const logout = () => {
    localStorage.removeItem('rrhh_token')
    setUser(null)
    setPermisos([])
  }

  // ============================
  // VERIFICAR USUARIO
  // ============================
  const verifyUser = async () => {
    setLoading(true)
    const token = getStoredToken()

    if (!token || !isTokenValid(token)) {
      logout()
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`${API_URL}/auth/verify`, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      })

      const data = await res.json()

      if (!data.user) {
        logout()
        return
      }

      const userEstado = data.user.estado ?? 1
      if (userEstado === 1 || userEstado === true) {
        setUser(formatUser(data.user))
        setPermisos(data.permisos || [])
      } else {
        logout()
      }
    } catch (error) {
      console.error('Error verificando usuario:', error)
      logout()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    verifyUser()
  }, [])

  // ============================
  // FORGOT PASSWORD
  // ============================
  const forgotPassword = async (email) => {
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error al enviar email')
      return { success: true, message: data.message || 'Email enviado correctamente' }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // ============================
  // RESET PASSWORD
  // ============================
  const resetPassword = async (token, newPassword) => {
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error al restablecer contraseña')
      return { success: true, message: data.message || 'Contraseña actualizada correctamente' }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // ============================
  // CHANGE PASSWORD (usuario logueado)
  // ============================
  const changePassword = async (currentPassword, newPassword) => {
    const token = getStoredToken()
    if (!token || !isTokenValid(token)) return { success: false, error: 'No estás autenticado' }

    try {
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401) logout()
        throw new Error(data.message || 'Error cambiando contraseña')
      }

      return { success: true, message: data.message || 'Contraseña cambiada correctamente' }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // ============================
  // FUNCIONES DE DEBUG
  // ============================
  const getTokenInfo = () => {
    const token = getStoredToken()
    if (!token) return { hasToken: false }

    const info = {
      hasToken: true,
      tokenLength: token.length,
      tokenPreview: token.substring(0, 20) + '...',
      isValid: isTokenValid(token),
    }

    if (token.includes('.')) {
      try {
        info.payload = JSON.parse(atob(token.split('.')[1]))
        info.isJWT = true
      } catch (e) {
        info.isJWT = false
        info.parseError = e.message
      }
    } else {
      info.isJWT = false
      info.tokenType = 'simple'
    }

    return info
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        permisos,
        login,
        logout,
        getStoredToken,
        forgotPassword,
        resetPassword,
        changePassword,
        loading,
        isTokenValid,
        getTokenInfo,
        verifyUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de un AuthProvider')
  return context
}
