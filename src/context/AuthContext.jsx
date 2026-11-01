import { createContext, useContext, useState } from 'react'








const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('gamedeck-user'))
    } catch {
      return null
    }
  })

  
  function login(email, password) {
    const trimmedEmail = email.trim()

    if (!trimmedEmail.includes('@')) {
      return { ok: false, error: 'Введите корректный e-mail (например, student@mail.ru)' }
    }
    if (password.length < 4) {
      return { ok: false, error: 'Пароль должен содержать минимум 4 символа' }
    }

    const profile = {
      name: trimmedEmail.split('@')[0],
      email: trimmedEmail,
      loginTime: new Date().toISOString(),
    }

    localStorage.setItem('gamedeck-user', JSON.stringify(profile))
    setUser(profile)
    return { ok: true }
  }

  function logout() {
    localStorage.removeItem('gamedeck-user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isAuth: Boolean(user), login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth() нужно вызывать внутри <AuthProvider>')
  }
  return context
}
