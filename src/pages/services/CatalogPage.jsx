import { useEffect, useMemo, useState } from 'react'
import ServiceCard from '../../components/ServiceCard.jsx'
import { apiRequest } from '../../api/serviceClient.js'

export default function CatalogPage() {
  const [services, setServices] = useState([])
  const [categories, setCategories] = useState([])
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sortBy, setSortBy] = useState('default')

  async function loadCatalog() {
    setLoading(true)
    setError('')
    try {
      const [serviceData, categoryData] = await Promise.all([
        apiRequest('/services'),
        apiRequest('/categories'),
      ])
      setServices(serviceData.services)
      setCategories(categoryData.categories)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadCatalog() }, [])

  function toggleCategory(id) {
    setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id])
  }

  function resetFilters() {
    setSelected([])
    setQuery('')
    setMinPrice('')
    setMaxPrice('')
    setSortBy('default')
  }

  const visible = useMemo(() => {
    const filtered = services.filter((service) => {
      const categoryId = categories.find((item) => item.name === service.category)?.id
      const price = Number(service.final_price ?? service.price)
      const matchesCategory = selected.length === 0 || selected.includes(categoryId)
      const matchesQuery = `${service.name} ${service.description}`.toLowerCase().includes(query.trim().toLowerCase())
      const matchesMin = minPrice === '' || price >= Number(minPrice)
      const matchesMax = maxPrice === '' || price <= Number(maxPrice)
      return matchesCategory && matchesQuery && matchesMin && matchesMax
    })
    if (sortBy === 'price-asc') filtered.sort((a, b) => a.final_price - b.final_price)
    if (sortBy === 'price-desc') filtered.sort((a, b) => b.final_price - a.final_price)
    if (sortBy === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name, 'ru'))
    return filtered
  }, [services, categories, selected, query, minPrice, maxPrice, sortBy])

  return (
    <div className="catalog-layout">
      <aside className="category-sidebar">
        <div className="filter-heading">
          <h2>Фильтры</h2>
          <button className="text-button" onClick={resetFilters}>Сбросить</button>
        </div>
        <section className="filter-section">
          <h3>Категории</h3>
          <label className="checkbox-row">
            <input type="checkbox" checked={selected.length === 0} onChange={() => setSelected([])} />
            Все услуги
          </label>
          {categories.map((category) => (
            <label className="checkbox-row" key={category.id}>
              <input type="checkbox" checked={selected.includes(category.id)} onChange={() => toggleCategory(category.id)} />
              {category.name}
            </label>
          ))}
        </section>
        <section className="filter-section">
          <h3>Цена со скидкой, ₽</h3>
          <div className="price-inputs">
            <label><span className="visually-hidden">Цена от</span><input className="input" type="number" min="0" placeholder="От" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} /></label>
            <span>—</span>
            <label><span className="visually-hidden">Цена до</span><input className="input" type="number" min="0" placeholder="До" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} /></label>
          </div>
        </section>
        <p className="muted small">Цены указаны в рублях. Фильтрация учитывает действующие скидки.</p>
      </aside>

      <section className="catalog-content">
        <div className="page-heading catalog-heading">
          <div><span className="eyebrow">СЕРВИС GAMECARE</span><h1>Каталог услуг</h1></div>
          <input className="input search-input" type="search" aria-label="Поиск услуг" placeholder="Поиск услуг…" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <div className="catalog-toolbar">
          <span className="muted">{loading ? 'Загружаем каталог…' : `Найдено услуг: ${visible.length}`}</span>
          <label className="sort-control">Сортировка
            <select className="input" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="default">По умолчанию</option>
              <option value="price-asc">Сначала дешевле</option>
              <option value="price-desc">Сначала дороже</option>
              <option value="name">По названию</option>
            </select>
          </label>
        </div>
        {loading && <div className="notice">Загружаем каталог услуг с сервера…</div>}
        {error && <div className="error-panel"><span>{error}</span><button className="button button--outline" onClick={loadCatalog}>Повторить</button></div>}
        {!loading && !error && visible.length === 0 && <div className="notice">По выбранным условиям услуги не найдены.</div>}
        {!loading && !error && <div className="service-grid">{visible.map((service) => <ServiceCard key={service.id} service={service} />)}</div>}
      </section>
    </div>
  )
}
