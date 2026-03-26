import { createContext, useContext, useEffect, useState } from 'react'
<<<<<<< HEAD
import { api, AUTH_STORAGE_KEY } from '../lib/api'
=======
import { api } from '../lib/api'
>>>>>>> origin/main

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedUser = localStorage.getItem('keycoveUser')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const register = async (formData) => {
    const { data } = await api.post('/auth/register', formData)
    return data
  }

  const login = async (formData) => {
    const { data } = await api.post('/auth/login', formData)
    setUser(data.user)
    localStorage.setItem('keycoveUser', JSON.stringify(data.user))
<<<<<<< HEAD
    if (data.token) {
      localStorage.setItem(AUTH_STORAGE_KEY, data.token)
    }
=======
>>>>>>> origin/main
    return data
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout', {})
    } catch (_) {}
    setUser(null)
    localStorage.removeItem('keycoveUser')
<<<<<<< HEAD
    localStorage.removeItem(AUTH_STORAGE_KEY)
=======
>>>>>>> origin/main
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
