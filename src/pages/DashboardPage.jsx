import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'






export default function DashboardPage() {
  const { user, logout } = useAuth()
  const { items, totalCount, totalSum } = useCart()
  const { theme } = useTheme()

  return (
    <div className="page">
      <h1 className="page__title">Личный кабинет</h1>
      <p className="muted">
        Вы вошли как <b>{user?.email}</b> (имя пользователя: {user?.name})
      </p>

      <div className="stats-grid">
        <div className="stat stat--card">
          <b>{totalCount}</b>
          <span>единиц в корзине</span>
        </div>
        <div className="stat stat--card">
          <b>{totalSum.toLocaleString('ru-RU')} ₽</b>
          <span>сумма корзины</span>
        </div>
        <div className="stat stat--card">
          <b>{items.length}</b>
          <span>позиций</span>
        </div>
        <div className="stat stat--card">
          <b>{theme}</b>
          <span>активная тема</span>
        </div>
      </div>

      <section className="section">
        <h2>Товары в корзине</h2>
        {items.length === 0 ? (
          <p className="empty">
            Корзина пуста. <Link to="/catalog" className="link">Перейти в каталог →</Link>
          </p>
        ) : (
          <ul className="simple-list">
            {items.map((item) => (
              <li key={item.id}>
                <span>{item.name}</span>
                <span className="muted">
                  {item.qty} × {item.price.toLocaleString('ru-RU')} ₽ ={' '}
                  {(item.qty * item.price).toLocaleString('ru-RU')} ₽
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="hero__actions">
        <Link to="/catalog" className="btn">
          В каталог
        </Link>
        <Link to="/cart" className="btn btn--ghost">
          Открыть корзину
        </Link>
        <button className="btn btn--danger" onClick={logout}>
          Выйти из аккаунта
        </button>
      </div>
    </div>
  )
}
