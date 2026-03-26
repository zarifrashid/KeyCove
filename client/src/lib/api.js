import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
<<<<<<< HEAD
const AUTH_STORAGE_KEY = 'keycoveAuthToken'
=======
>>>>>>> origin/main

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
})

<<<<<<< HEAD
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = window.localStorage.getItem(AUTH_STORAGE_KEY)
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

=======
>>>>>>> origin/main
export function buildMapQuery(params = {}) {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value))
    }
  })

  return searchParams.toString()
}
<<<<<<< HEAD

export { AUTH_STORAGE_KEY }
=======
>>>>>>> origin/main
