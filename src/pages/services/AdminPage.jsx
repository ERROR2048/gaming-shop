import { useEffect, useState } from 'react'
import { apiRequest } from '../../api/serviceClient.js'

const emptyService = { name: '', description: '', duration_minutes: 30, price: '', category_id: '', discount_percent: 0 }

export default function AdminPage() {
  const [services, setServices] = useState([])
  const [categories, setCategories] = useState([])
  const [users, setUsers] = useState([])
  const [appointments, setAppointments] = useState([])
  const [newService, setNewService] = useState(emptyService)
  const [categoryName, setCategoryName] = useState('')
  const [coupons, setCoupons] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function refresh(showLoading = true) {
    if (showLoading) setLoading(true)
    setError('')
    try {
      const [serviceData, userData, categoryData, appointmentData] = await Promise.all([
        apiRequest('/admin/services'),
        apiRequest('/admin/users'),
        apiRequest('/categories'),
        apiRequest('/admin/appointments'),
      ])
      setServices(serviceData.services)
      setUsers(userData.users)
      setCategories(categoryData.categories)
      setAppointments(appointmentData.appointments)
      setCoupons(Object.fromEntries(userData.users.map((user) => [user.id, { code: user.coupon_code || '', percent: user.coupon_percent || 0 }])))
      setNewService((current) => ({ ...current, category_id: current.category_id || categoryData.categories[0]?.id || '' }))
    } catch (err) {
      setError(err.message)
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  function updateService(serviceId, field, value) {
    setServices((current) => current.map((service) => service.id === serviceId ? { ...service, [field]: value } : service))
  }

  async function addCategory(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await apiRequest('/admin/categories', { method: 'POST', body: JSON.stringify({ name: categoryName }) })
      setCategoryName('')
      await refresh(false)
      setMessage('Категория добавлена и доступна в каталоге.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function createService(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await apiRequest('/admin/services', { method: 'POST', body: JSON.stringify({ ...newService, duration_minutes: Number(newService.duration_minutes), price: Number(newService.price), category_id: Number(newService.category_id), discount_percent: Number(newService.discount_percent) }) })
      setNewService({ ...emptyService, category_id: categories[0]?.id || '' })
      await refresh(false)
      setMessage('Новая услуга добавлена в каталог.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function saveService(service) {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await apiRequest(`/admin/services/${service.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: service.name, description: service.description, duration_minutes: Number(service.duration_minutes), price: Number(service.price), category_id: Number(service.category_id), discount_percent: Number(service.discount_percent), active: Boolean(service.active) }),
      })
      await refresh(false)
      setMessage(`Изменения услуги «${service.name}» сохранены.`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function saveUserCoupon(userId) {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const coupon = coupons[userId] || { code: '', percent: 0 }
      await apiRequest(`/admin/users/${userId}/coupon`, {
        method: 'PATCH',
        body: JSON.stringify({ code: coupon.code, discount_percent: Number(coupon.percent || 0) }),
      })
      await refresh(false)
      setMessage('Персональный купон пользователя обновлён.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="page-stack">
      <div className="page-heading"><div><span className="eyebrow">ПАНЕЛЬ УПРАВЛЕНИЯ</span><h1>Администрирование</h1><p className="muted">Управление каталогом, клиентами и записями</p></div><button className="button button--outline" onClick={() => refresh()} disabled={loading}>Обновить данные</button></div>
      {loading && <div className="notice">Загружаем данные администратора…</div>}
      {error && <div className="error-message" role="alert">{error}</div>}
      {message && <div className="success-message" role="status">{message}</div>}

      <section className="panel admin-section">
        <div className="admin-section__heading"><div><span className="eyebrow">КАТАЛОГ</span><h2>Услуги и категории</h2></div><span className="category-label">{services.filter((service) => service.active).length} активных</span></div>
        <p className="muted">Создавайте и редактируйте услуги, задавайте цены и скидки, временно скрывайте предложения из каталога.</p>
        <form className="service-create-form" onSubmit={createService}>
          <label>Название<input className="input" value={newService.name} onChange={(event) => setNewService({ ...newService, name: event.target.value })} maxLength={160} required /></label>
          <label>Категория<select className="input" value={newService.category_id} onChange={(event) => setNewService({ ...newService, category_id: event.target.value })} required><option value="" disabled>Выберите категорию</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          <label>Длительность, мин<input className="input" type="number" min="1" max="1440" value={newService.duration_minutes} onChange={(event) => setNewService({ ...newService, duration_minutes: event.target.value })} required /></label>
          <label>Цена, ₽<input className="input" type="number" min="0" step="1" value={newService.price} onChange={(event) => setNewService({ ...newService, price: event.target.value })} required /></label>
          <label className="service-create-form__wide">Описание<textarea className="input" rows="2" value={newService.description} onChange={(event) => setNewService({ ...newService, description: event.target.value })} required /></label>
          <button className="button button--primary" disabled={saving || categories.length === 0}>Добавить услугу</button>
        </form>
        <form className="inline-form category-create-form" onSubmit={addCategory}>
          <input className="input" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} minLength={2} maxLength={50} placeholder="Название новой категории" required />
          <button className="button button--outline" disabled={saving}>Добавить категорию</button>
        </form>
        <div className="admin-service-list">
          {services.map((service) => (
            <article className={`admin-service-row${service.active ? '' : ' admin-service-row--inactive'}`} key={service.id}>
              <div className="admin-service-row__fields">
                <label>Название<input className="input" value={service.name} onChange={(event) => updateService(service.id, 'name', event.target.value)} /></label>
                <label>Категория<select className="input" value={service.category_id} onChange={(event) => updateService(service.id, 'category_id', event.target.value)}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
                <label>Цена, ₽<input className="input" type="number" min="0" step="1" value={service.price} onChange={(event) => updateService(service.id, 'price', event.target.value)} /></label>
                <label>Минуты<input className="input" type="number" min="1" max="1440" value={service.duration_minutes} onChange={(event) => updateService(service.id, 'duration_minutes', event.target.value)} /></label>
                <label>Скидка, %<input className="input" type="number" min="0" max="90" value={service.discount_percent} onChange={(event) => updateService(service.id, 'discount_percent', event.target.value)} /></label>
                <label className="admin-service-row__description">Описание<textarea className="input" rows="2" value={service.description} onChange={(event) => updateService(service.id, 'description', event.target.value)} /></label>
              </div>
              <div className="admin-service-row__actions">
                <label className="active-toggle"><input type="checkbox" checked={Boolean(service.active)} onChange={(event) => updateService(service.id, 'active', event.target.checked)} /> Показывать в каталоге</label>
                <button className="button button--outline" onClick={() => saveService(service)} disabled={saving}>Сохранить</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel admin-section">
        <div className="admin-section__heading"><div><span className="eyebrow">КЛИЕНТЫ</span><h2>Пользователи и купоны</h2></div><span className="category-label">{users.length} пользователей</span></div>
        <p className="muted">Назначайте клиентам персональные скидки. Значение 0 снимает купон.</p>
        <div className="admin-list">
          {users.map((user) => (
            <div className="admin-row admin-row--user" key={user.id}>
              <div><strong>{user.full_name}</strong><span className="muted">{user.email} · {user.role}</span></div>
              <input className="input coupon-code" value={coupons[user.id]?.code ?? ''} placeholder="КОД КУПОНА" onChange={(event) => setCoupons((current) => ({ ...current, [user.id]: { ...current[user.id], code: event.target.value } }))} />
              <label className="percent-input"><input className="input" type="number" min="0" max="90" value={coupons[user.id]?.percent ?? 0} onChange={(event) => setCoupons((current) => ({ ...current, [user.id]: { ...current[user.id], percent: event.target.value } }))} />%</label>
              <button className="button button--outline" onClick={() => saveUserCoupon(user.id)} disabled={saving}>Сохранить купон</button>
            </div>
          ))}
        </div>
      </section>

      <section className="panel admin-section">
        <div className="admin-section__heading"><div><span className="eyebrow">ЗАКАЗЫ</span><h2>Все записи</h2></div><span className="category-label">{appointments.length} записей</span></div>
        {appointments.length === 0 ? <p className="muted">Записей пока нет.</p> : <div className="admin-appointment-list">
          {appointments.map((appointment) => <article className="admin-appointment-row" key={appointment.id}>
            <div><strong>{appointment.service_name}</strong><span className="muted">№{appointment.id} · {appointment.full_name} · {appointment.email}</span></div>
            <span>{new Date(appointment.appointment_datetime).toLocaleString('ru-RU')}</span>
            <span>{appointment.quantity} шт.</span>
            <strong>{Number(appointment.amount || 0).toLocaleString('ru-RU')} ₽</strong>
            <span className="status-pill">{appointment.payment_status === 'simulated' ? 'Демо-оплата' : appointment.payment_status || appointment.status}</span>
          </article>)}
        </div>}
      </section>
    </section>
  )
}
