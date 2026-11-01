import { useEffect, useState } from 'react'
import { apiRequest } from '../../api/serviceClient.js'

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiRequest('/appointments')
      .then((data) => setAppointments(data.appointments))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="page-stack">
      <div className="page-heading"><div><span className="eyebrow">ИСТОРИЯ ЗАКАЗОВ</span><h1>Мои записи</h1></div></div>
      {loading && <div className="notice">Загружаем записи с сервера…</div>}
      {error && <div className="error-panel">{error}</div>}
      {!loading && !error && appointments.length === 0 && <div className="panel notice">Пока нет оформленных записей.</div>}
      {!loading && !error && appointments.length > 0 && <div className="panel appointment-list">
        {appointments.map((item) => (
          <article className="appointment-row" key={item.id}>
            <div><h2>{item.service_name}</h2><p className="muted">Запись №{item.id} · {new Date(item.appointment_datetime).toLocaleString('ru-RU')}</p></div>
            <span>{item.quantity} шт.</span>
            <strong>{item.amount.toLocaleString('ru-RU')} ₽</strong>
            <span className="status-pill">{item.payment_status === 'simulated' ? 'Оплата демо' : item.payment_status}</span>
          </article>
        ))}
      </div>}
    </section>
  )
}
