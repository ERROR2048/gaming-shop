import { createContext, useContext, useEffect, useState } from 'react'
import { apiRequest } from '../api/serviceClient.js'

const AuthContext = createContext(null)

export function ServiceAuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('service-store-token')
    if (!token) {
      setLoading(false)
      return
    }
    apiRequest('/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => {
        localStorage.removeItem('service-store-token')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  async function signIn(email, password) {
    const result = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    localStorage.setItem('service-store-token', result.token)
    setUser(result.user)
    return result.user
  }

  async function register(fullName, email, password) {
    const result = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ full_name: fullName, email, password }),
    })
    localStorage.setItem('service-store-token', result.token)
    setUser(result.user)
    return result.user
  }

  function signOut() {
    localStorage.removeItem('service-store-token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, register, signOut, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth должен использоваться внутри AuthProvider')
  return value
}
