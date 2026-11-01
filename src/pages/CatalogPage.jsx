import { useMemo, useState } from 'react'
import ProductCard from '../components/ProductCard.jsx'
import { categories, products } from '../data/products.js'
import { useCart } from '../context/CartContext.jsx'


export default function CatalogPage() {
  const [category, setCategory] = useState('Все')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('popular')
  const [redirectToCart, setRedirectToCart] = useState(false)

  const { totalCount } = useCart()

  
  const visible = useMemo(() => {
    let list = products

    if (category !== 'Все') {
      list = list.filter((p) => p.category === category)
    }

    if (query.trim()) {
      const needle = query.trim().toLowerCase()
      list = list.filter((p) => p.name.toLowerCase().includes(needle))
    }

    const sorted = [...list]
    if (sort === 'price-asc') sorted.sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') sorted.sort((a, b) => b.price - a.price)
    if (sort === 'rating') sorted.sort((a, b) => b.rating - a.rating)
    if (sort === 'popular') sorted.sort((a, b) => Number(Boolean(b.tag)) - Number(Boolean(a.tag)))

    return sorted
  }, [category, query, sort])

  
  const cardExtra = { redirectAfterAdd: redirectToCart }

  return (
    <div className="page">
      <div className="section__head">
        <h1 className="page__title">Каталог товаров</h1>
        <span className="muted">В корзине: {totalCount} шт.</span>
      </div>

      <div className="toolbar">
        <input
          className="input"
          type="search"
          placeholder="Поиск по названию…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        <select className="input" value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="popular">Сначала популярные</option>
          <option value="price-asc">Цена: по возрастанию</option>
          <option value="price-desc">Цена: по убыванию</option>
          <option value="rating">По рейтингу</option>
        </select>

        <label className="checkbox">
          <input
            type="checkbox"
            checked={redirectToCart}
            onChange={(event) => setRedirectToCart(event.target.checked)}
          />
          Переходить в корзину после добавления
        </label>
      </div>

      <div className="chips">
        {categories.map((item) => (
          <button
            key={item}
            className={item === category ? 'chip chip--active' : 'chip'}
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="empty">Ничего не найдено. Попробуйте изменить запрос или категорию.</p>
      ) : (
        <div className="grid grid--3">
          {visible.map((product) => (
            <ProductCard key={product.id} product={product} {...cardExtra} />
          ))}
        </div>
      )}
    </div>
  )
}
