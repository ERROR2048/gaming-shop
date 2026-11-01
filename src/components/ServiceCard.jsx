import { useCart } from '../context/ServiceCartContext.jsx'

export default function ServiceCard({ service }) {
  const { add } = useCart()

  return (
    <article className="service-card">
      <div className="service-card__top">
        <span className="category-label">{service.category}</span>
        {service.discount_percent > 0 && <span className="discount-label">−{service.discount_percent}%</span>}
      </div>
      <h2>{service.name}</h2>
      <p className="service-description">{service.description}</p>
      <div className="service-meta">
        <span>◷ {service.duration_minutes} мин.</span>
        <span className="price-area">
          {service.discount_percent > 0 && <del>{service.price.toLocaleString('ru-RU')} ₽</del>}
          <strong>{service.final_price.toLocaleString('ru-RU')} ₽</strong>
        </span>
      </div>
      <button className="button button--primary button--wide" onClick={() => add(service)}>Добавить в корзину</button>
    </article>
  )
}
