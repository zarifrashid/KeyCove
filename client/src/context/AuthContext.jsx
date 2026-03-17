import { createContext, useContext, useEffect, useState } from 'react'
import axios from 'axios'

const API = 'http://localhost:5000/api'
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
    const { data } = await axios.post(`${API}/auth/register`, formData, { withCredentials: true })
    return data
  }

  const login = async (formData) => {
    const { data } = await axios.post(`${API}/auth/login`, formData, { withCredentials: true })
    setUser(data.user)
    localStorage.setItem('keycoveUser', JSON.stringify(data.user))
    return data
  }

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true })
    } catch (_) {}
    setUser(null)
    localStorage.removeItem('keycoveUser')
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
