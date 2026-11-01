import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard.jsx'
import { products } from '../data/products.js'
import { useTheme } from '../context/ThemeContext.jsx'
import { useCart } from '../context/CartContext.jsx'

export default function HomePage() {
  const { toggleTheme, isDark } = useTheme()
  const { totalCount, totalSum } = useCart()
  const hits = products.filter((product) => product.tag === 'Хит').slice(0, 3)

  return (
    <div className="page">
      <section className="hero">
        <div>
          <span className="hero__label">SPA-каталог · React Router · Context API</span>
          <h1 className="hero__title">
            Игровые девайсы <br />
            для победы в каждой партии
          </h1>
          <p className="hero__text">
            9 товаров в каталоге, глобальная корзина и переключение светлой/тёмной темы.
            Сейчас активна <b>{isDark ? 'тёмная' : 'светлая'}</b> тема.
          </p>
          <div className="hero__actions">
            <Link to="/catalog" className="btn">
              Перейти в каталог
            </Link>
            <Link to="/cart" className="btn btn--ghost">
              Корзина ({totalCount}) · {totalSum.toLocaleString('ru-RU')} ₽
            </Link>
            <button className="btn btn--ghost" onClick={toggleTheme}>
              Сменить тему на {isDark ? 'светлую' : 'тёмную'}
            </button>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <h2>Хиты продаж</h2>
          <Link to="/catalog" className="link">
            Весь каталог →
          </Link>
        </div>
        <div className="grid grid--3">
          {hits.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  )
}
