import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'


export default function CartPage() {
  const { items, totalCount, totalSum, increaseItem, decreaseItem, removeItem, clearCart } = useCart()
  const { isAuth } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  
  if (items.length === 0) {
    return (
      <div className="page">
        <div className="empty-block">
          <h1>Корзина пуста</h1>
          <p className="muted">Добавьте товары из каталога — они появятся здесь.</p>
          <Link to="/catalog" className="btn">
            В каталог
          </Link>
        </div>
      </div>
    )
  }

  
  
  function handleCheckout() {
    if (!isAuth) {
      showToast('Сначала войдите в аккаунт', 'warning')
      return navigate('/login', { state: { from: '/cart' } })
    }

    const sum = totalSum
    clearCart()
    showToast(`Заказ на ${sum.toLocaleString('ru-RU')} ₽ оформлен`)
    navigate('/dashboard') 
  }

  return (
    <div className="page">
      <div className="section__head">
        <h1 className="page__title">Корзина</h1>
        <button className="btn btn--ghost btn--small" onClick={clearCart}>
          Очистить корзину
        </button>
      </div>

      <div className="cart">
        <div className="cart__list">
          {items.map((item) => (
            <div className="cart-row" key={item.id}>
              <img className="cart-row__image" src={item.image} alt={item.name} />

              <div className="cart-row__info">
                <Link to={`/product/${item.id}`} className="cart-row__name">
                  {item.name}
                </Link>
                <span className="muted">{item.price.toLocaleString('ru-RU')} ₽ / шт.</span>
              </div>

              
              <div className="stepper">
                <button
                  className="stepper__btn"
                  onClick={() => decreaseItem(item.id)}
                  title="Уменьшить количество"
                >
                  −
                </button>
                <span className="stepper__value">{item.qty}</span>
                <button
                  className="stepper__btn"
                  onClick={() => increaseItem(item.id)}
                  title="Увеличить количество"
                >
                  +
                </button>
              </div>

              <b className="cart-row__sum">{(item.price * item.qty).toLocaleString('ru-RU')} ₽</b>

              
              <button
                className="btn btn--danger btn--small"
                onClick={() => removeItem(item.id)}
                title="Удалить товар из корзины"
              >
                Удалить
              </button>
            </div>
          ))}
        </div>

        <aside className="cart__summary">
          <h2>Итого</h2>
          <div className="summary-row">
            <span>Позиций</span>
            <b>{items.length}</b>
          </div>
          <div className="summary-row">
            <span>Единиц товара</span>
            <b>{totalCount}</b>
          </div>
          <div className="summary-row summary-row--total">
            <span>Сумма</span>
            <b>{totalSum.toLocaleString('ru-RU')} ₽</b>
          </div>

          <button className="btn btn--block" onClick={handleCheckout}>
            {isAuth ? 'Оформить заказ' : 'Войти и оформить'}
          </button>
          <Link to="/catalog" className="btn btn--ghost btn--block">
            Продолжить покупки
          </Link>
          <p className="muted small">
            Итоговая сумма считается из глобального состояния `<code>useCart()</code>`.
          </p>
        </aside>
      </div>
    </div>
  )
}
