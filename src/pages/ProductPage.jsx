import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getProductById, products } from '../data/products.js'
import { useCart } from '../context/CartContext.jsx'
import { useToast } from '../context/ToastContext.jsx'


export default function ProductPage() {
  const { id } = useParams()               
  const product = getProductById(id)
  const navigate = useNavigate()
  const { addItem, items, removeItem } = useCart()
  const { showToast } = useToast()
  const [redirectToCart, setRedirectToCart] = useState(true)

  
  if (!product) {
    return (
      <div className="page">
        <div className="empty-block">
          <h1>Товар не найден</h1>
          <p className="muted">Возможно, он был удалён из каталога.</p>
          <Link to="/catalog" className="btn">
            Вернуться в каталог
          </Link>
        </div>
      </div>
    )
  }

  const inCart = items.find((item) => item.id === product.id)
  const qty = inCart ? inCart.qty : 0

  function handleAdd() {
    addItem(product)
    showToast(`«${product.name}» в корзине`)

    
    if (redirectToCart) navigate('/cart')
  }

  const similar = products.filter((p) => p.category === product.category && p.id !== product.id)

  return (
    <div className="page">
      
      <nav className="crumbs">
        <Link to="/">Главная</Link> / <Link to="/catalog">Каталог</Link> /{' '}
        <span>{product.name}</span>
      </nav>

      <div className="product">
        <div className="product__image-box">
          {product.tag && <span className="card__tag">{product.tag}</span>}
          <img src={product.image} alt={product.name} />
        </div>

        <div className="product__info">
          <span className="card__category">{product.category}</span>
          <h1>{product.name}</h1>
          <p className="card__rating">★ {product.rating.toFixed(1)} · в наличии</p>
          <p className="muted">{product.description}</p>

          <p className="product__price">
            {product.oldPrice && (
              <span className="card__old-price">{product.oldPrice.toLocaleString('ru-RU')} ₽</span>
            )}
            {product.price.toLocaleString('ru-RU')} ₽
          </p>

          <div className="product__actions">
            <button className="btn" onClick={handleAdd}>
              Добавить в корзину
            </button>

            {qty > 0 && (
              <button className="btn btn--ghost" onClick={() => removeItem(product.id)}>
                Убрать из корзины ({qty})
              </button>
            )}

            <button className="btn btn--ghost" onClick={() => navigate(-1)}>
              ← Назад
            </button>
          </div>

          <label className="checkbox">
            <input
              type="checkbox"
              checked={redirectToCart}
              onChange={(event) => setRedirectToCart(event.target.checked)}
            />
            Переходить в корзину после добавления
          </label>

          <p className="card__counter">
            Сейчас в корзине: <span className="card__counter-value">{qty}</span> шт.
          </p>
        </div>
      </div>

      {similar.length > 0 && (
        <section className="section">
          <h2>Похожие товары</h2>
          <div className="grid grid--3">
            {similar.map((item) => (
              <Link key={item.id} to={`/product/${item.id}`} className="mini-card mini-card--link">
                <img src={item.image} alt={item.name} />
                <p>{item.name}</p>
                <b>{item.price.toLocaleString('ru-RU')} ₽</b>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
