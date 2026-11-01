import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import ServiceLayout from './components/ServiceLayout.jsx'
import ServiceProtectedRoute from './components/ServiceProtectedRoute.jsx'
import HomePage from './pages/HomePage.jsx'
import CatalogPage from './pages/CatalogPage.jsx'
import ProductPage from './pages/ProductPage.jsx'
import CartPage from './pages/CartPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import ServicesCatalogPage from './pages/services/CatalogPage.jsx'
import ServicesCartPage from './pages/services/CartPage.jsx'
import ServiceLoginPage from './pages/services/LoginPage.jsx'
import ServiceAdminPage from './pages/services/AdminPage.jsx'
import ServiceAppointmentsPage from './pages/services/AppointmentsPage.jsx'
import ServiceProfilePage from './pages/services/ProfilePage.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="catalog" element={<CatalogPage />} />
        <Route path="product/:id" element={<ProductPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />

        <Route path="services" element={<ServiceLayout />}>
          <Route index element={<ServicesCatalogPage />} />
          <Route path="cart" element={<ServicesCartPage />} />
          <Route path="login" element={<ServiceLoginPage />} />
          <Route path="appointments" element={<ServiceProtectedRoute><ServiceAppointmentsPage /></ServiceProtectedRoute>} />
          <Route path="profile" element={<ServiceProtectedRoute><ServiceProfilePage /></ServiceProtectedRoute>} />
          <Route path="admin" element={<ServiceProtectedRoute adminOnly><ServiceAdminPage /></ServiceProtectedRoute>} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
