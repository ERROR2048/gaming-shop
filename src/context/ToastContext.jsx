import { createContext, useCallback, useContext, useRef, useState } from 'react'






const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const showToast = useCallback((message, kind = 'success') => {
    const id = ++idRef.current
    setToasts((list) => [...list, { id, message, kind }])
    
    setTimeout(() => {
      setToasts((list) => list.filter((toast) => toast.id !== id))
    }, 2000)
  }, [])

  const value = { toasts, showToast }

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast() нужно вызывать внутри <ToastProvider>')
  }
  return context
}
