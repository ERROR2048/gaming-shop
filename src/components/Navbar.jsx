import { NavLink, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'






export default function Navbar() {
  const { totalCount, totalSum } = useCart()
  const { toggleTheme, isDark } = useTheme()
  const { user, isAuth, logout } = useAuth()
  const navigate = useNavigate()

  
  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <NavLink to="/" className="navbar__logo">
          🎮 Game<span>Deck</span>
        </NavLink>

        <nav className="navbar__menu">
          <NavLink to="/" end>
            Главная
          </NavLink>
          <NavLink to="/catalog">Каталог</NavLink>
          <NavLink to="/services">Услуги</NavLink>
          <NavLink to="/cart" className="navbar__cart-link" title="Открыть корзину и посмотреть сумму">
            🛒 Корзина
            
            {totalCount > 0 && <span className="badge">{totalCount}</span>}
            <span className="navbar__cart-total">{totalSum.toLocaleString('ru-RU')} ₽</span>
          </NavLink>
          <NavLink to="/dashboard">Кабинет</NavLink>
        </nav>

        <div className="navbar__actions">
          
          <button
            className="btn btn--ghost"
            onClick={toggleTheme}
            title="Переключить светлую/тёмную тему"
          >
            {isDark ? '☀️ Светлая' : '🌙 Тёмная'}
          </button>

          {isAuth ? (
            <>
              <span className="navbar__user" title={user.email}>
                {user.name}
              </span>
              <button className="btn btn--ghost" onClick={handleLogout}>
                Выйти
              </button>
            </>
          ) : (
            <NavLink to="/login" className="btn btn--small">
              Войти
            </NavLink>
          )}
        </div>
      </div>
    </header>
  )
}
