import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { useToast } from '../context/ToastContext.jsx'












export default function ProductCard({ product, compact = false, redirectAfterAdd = false }) {
  const { addItem, items } = useCart()
  const { showToast } = useToast()
  const navigate = useNavigate()

  
  const inCart = items.find((item) => item.id === product.id)
  const qty = inCart ? inCart.qty : 0

  function handleAdd() {
    addItem(product)
    showToast(`«${product.name}» в корзине`)
    
    if (redirectAfterAdd) navigate('/cart')
  }

  
  function handleDetails() {
    navigate(`/product/${product.id}`)
  }

  if (compact) {
    return (
      <div className="mini-card">
        <img src={product.image} alt={product.name} />
        <p>{product.name}</p>
        <b>{product.price.toLocaleString('ru-RU')} ₽</b>
        <button className="btn btn--small btn--block" onClick={handleAdd}>
          В корзину
        </button>
      </div>
    )
  }

  return (
    <article className="card">
      <div className="card__image-box">
        {product.tag && <span className="card__tag">{product.tag}</span>}
        <img className="card__image" src={product.image} alt={product.name} />
      </div>

      <div className="card__body">
        <span className="card__category">{product.category}</span>

        
        <Link to={`/product/${product.id}`} className="card__title-link">
          <h3 className="card__title">{product.name}</h3>
        </Link>

        <p className="card__rating">★ {product.rating.toFixed(1)}</p>

        <p className="card__price">
          {product.oldPrice && (
            <span className="card__old-price">{product.oldPrice.toLocaleString('ru-RU')} ₽</span>
          )}
          {product.price.toLocaleString('ru-RU')} ₽
        </p>

        <div className="card__actions">
          <button className="btn btn--block" onClick={handleAdd}>
            В корзину
          </button>
          <button className="btn btn--ghost btn--block" onClick={handleDetails}>
            Подробнее
          </button>
        </div>

        <p className="card__counter">
          В корзине: <span className="card__counter-value">{qty}</span> шт.
        </p>
      </div>
    </article>
  )
}
