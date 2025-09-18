// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [permisos, setPermisos] = useState([])
  const [loading, setLoading] = useState(true)

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api'

  // ✅ Validación de token que acepta tokens sin exp
  const isTokenValid = (token) => {
    if (!token) return false
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (!payload.exp) return true
      const currentTime = Date.now() / 1000
      return payload.exp > currentTime
    } catch (error) {
      console.error('Token malformado:', error)
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
      setUser(formatUser(data.user))
      setPermisos(data.permisos || [])
      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
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
  // VERIFICAR TOKEN / USUARIO
  // ============================
  const verifyUser = async () => {
    const token = localStorage.getItem('rrhh_token')
    if (!token || !isTokenValid(token)) {
      logout()
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`${API_URL}/auth/verify`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()

      // ⚡ Nuevo chequeo para usuario inactivo
      if (!res.ok || data.success === false) {
        console.warn('Token inválido o usuario inactivo, haciendo logout')
        logout()
        return
      }

      if (data.user.estado === 1 || data.user.estado === true) {
        setUser(formatUser(data.user))
        setPermisos(data.permisos || [])
      } else {
        console.warn('Usuario inactivo, haciendo logout')
        logout()
      }
    } catch (error) {
      console.error('Verify user error:', error)
      logout()
    } finally {
      setLoading(false)
    }
  }

  // ✅ Mantener sesión al cargar la app
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
      console.error('Forgot password error:', error)
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
      console.error('Reset password error:', error)
      return { success: false, error: error.message }
    }
  }

  // ============================
  // CHANGE PASSWORD (usuario logueado)
  // ============================
  const changePassword = async (currentPassword, newPassword) => {
    const token = localStorage.getItem('rrhh_token')
    if (!token || !isTokenValid(token)) return { success: false, error: 'No estás autenticado' }

    try {
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401) logout()
        throw new Error(data.message || 'Error cambiando contraseña')
      }

      return { success: true, message: data.message || 'Contraseña cambiada correctamente' }
    } catch (error) {
      console.error('Change password error:', error)
      return { success: false, error: error.message }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        permisos,
        login,
        logout,
        forgotPassword,
        resetPassword,
        changePassword,
        loading,
        isTokenValid,
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
