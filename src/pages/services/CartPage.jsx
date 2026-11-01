import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiRequest } from '../../api/serviceClient.js'
import { useAuth } from '../../context/ServiceAuthContext.jsx'
import { useCart } from '../../context/ServiceCartContext.jsx'

export default function CartPage() {
  const { items, totalCount, subtotal, change, remove, clear } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [receipt, setReceipt] = useState(null)
  const couponPercent = user?.coupon?.discount_percent || 0
  const total = items.reduce((sum, item) => sum + Math.round(item.service.final_price * (100 - couponPercent) / 100) * item.quantity, 0)
  const personalDiscount = subtotal - total

  async function submitAppointments() {
    if (!user) {
      navigate('/services/login', { state: { from: '/services/cart' } })
      return
    }
    setLoading(true)
    setError('')
    try {
      const result = await apiRequest('/appointments', {
        method: 'POST',
        body: JSON.stringify({ items: items.map((item) => ({ service_id: item.service.id, quantity: item.quantity })) }),
      })
      setReceipt(result)
      clear()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (receipt) {
    return (
      <section className="panel centered-panel">
        <span className="success-mark">✓</span>
        <h1>Запись оформлена</h1>
        <p>{receipt.message}</p>
        <p>Итого к оплате: <strong>{receipt.total.toLocaleString('ru-RU')} ₽</strong></p>
        <Link className="button button--primary" to="/services/appointments">Посмотреть мои записи</Link>
      </section>
    )
  }

  if (items.length === 0) {
    return <section className="panel centered-panel"><h1>Корзина пуста</h1><p className="muted">Выберите услуги в каталоге, чтобы продолжить.</p><Link className="button button--primary" to="/services">Открыть каталог</Link></section>
  }

  return (
    <div className="page-stack">
      <div className="page-heading"><div><span className="eyebrow">ВАШ ВЫБОР</span><h1>Корзина</h1></div><button className="button button--outline" onClick={clear}>Очистить</button></div>
      <div className="cart-layout">
        <section className="cart-list panel">
          {items.map(({ service, quantity }) => (
            <article className="cart-row" key={service.id}>
              <div className="cart-row__main"><span className="category-label">{service.category}</span><h2>{service.name}</h2><p className="muted">{service.duration_minutes} минут · {service.final_price.toLocaleString('ru-RU')} ₽ за услугу</p></div>
              <div className="quantity-control"><button aria-label="Уменьшить" onClick={() => change(service.id, -1)}>−</button><span>{quantity}</span><button aria-label="Увеличить" onClick={() => change(service.id, 1)}>+</button></div>
              <strong className="line-total">{(service.final_price * quantity).toLocaleString('ru-RU')} ₽</strong>
              <button className="text-button danger-text" onClick={() => remove(service.id)}>Удалить</button>
            </article>
          ))}
        </section>

        <aside className="summary panel">
          <h2>Итого</h2>
          <div className="summary-line"><span>Услуг</span><strong>{totalCount}</strong></div>
          <div className="summary-line"><span>Сумма услуг со скидками</span><strong>{subtotal.toLocaleString('ru-RU')} ₽</strong></div>
          {couponPercent > 0 && <div className="coupon-note"><span>Купон {user.coupon.code} · скидка {couponPercent}%</span><strong>−{personalDiscount.toLocaleString('ru-RU')} ₽</strong></div>}
          <div className="summary-line summary-total"><span>К оплате</span><strong>{total.toLocaleString('ru-RU')} ₽</strong></div>
          {!user && <p className="muted small">Для оформления записи войдите или зарегистрируйтесь.</p>}
          {error && <div className="error-message">{error}</div>}
          <button className="button button--primary button--wide" onClick={submitAppointments} disabled={loading}>
            {loading ? 'Создаём запись…' : user ? 'Оформить запись' : 'Войти для оформления'}
          </button>
          <p className="muted tiny">Оплата демонстрационная: реальные денежные средства не списываются.</p>
        </aside>
      </div>
    </div>
  )
}
