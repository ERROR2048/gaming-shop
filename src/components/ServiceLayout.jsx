import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/ServiceAuthContext.jsx'
import { useCart } from '../context/ServiceCartContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'

export default function ServiceLayout() {
  const { user, signOut } = useAuth()
  const { totalCount, subtotal } = useCart()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  function handleSignOut() {
    signOut()
    navigate('/services')
  }

  return (
    <div className="service-shell">
      <header className="topbar">
        <NavLink to="/services" className="brand">GameCare</NavLink>
        <nav className="nav-links">
          <NavLink to="/">GameDeck</NavLink>
          <NavLink to="/services">Услуги</NavLink>
          <NavLink to="/services/cart">Корзина <span className="nav-total">{totalCount} · {subtotal.toLocaleString('ru-RU')} ₽</span></NavLink>
          {user && <NavLink to="/services/profile">Личный кабинет</NavLink>}
          {user && <NavLink to="/services/appointments">Мои записи</NavLink>}
          {user?.role === 'admin' && <NavLink to="/services/admin">Администрирование</NavLink>}
        </nav>
        <div className="nav-actions">
          <button className="button button--outline" onClick={toggleTheme}>{theme === 'dark' ? '☀ Светлая' : '☾ Тёмная'}</button>
          {user ? <button className="button button--outline" onClick={handleSignOut}>Выйти</button> : <NavLink className="button button--outline" to="/services/login">Войти</NavLink>}
        </div>
      </header>
      <main className="main-container"><Outlet /></main>
      <footer className="footer">GameCare · Каталог услуг, запись и оплата в учебном режиме</footer>
    </div>
  )
}
