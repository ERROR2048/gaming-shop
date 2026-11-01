import { createContext, useContext, useEffect, useState } from 'react'









const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  
  const [theme, setTheme] = useState(() => localStorage.getItem('gamedeck-theme') || 'dark')

  useEffect(() => {
    
    document.documentElement.dataset.theme = theme
    localStorage.setItem('gamedeck-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme() нужно вызывать внутри <ThemeProvider>')
  }
  return context
}
