import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { ServiceAuthProvider } from './context/ServiceAuthContext.jsx'
import { ServiceCartProvider } from './context/ServiceCartContext.jsx'
import './index.css'
import './service-store.css'










ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <ServiceAuthProvider>
              <ServiceCartProvider>
                <ToastProvider>
                  <App />
                </ToastProvider>
              </ServiceCartProvider>
            </ServiceAuthProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
