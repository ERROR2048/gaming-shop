import { Link, useLocation } from 'react-router-dom'


export default function NotFoundPage() {
  const { pathname } = useLocation()

  return (
    <div className="page">
      <div className="empty-block">
        <h1>404 — страница не найдена</h1>
        <p className="muted">
          Маршрут <code>{pathname}</code> не существует.
        </p>
        <Link to="/" className="btn">
          На главную
        </Link>
      </div>
    </div>
  )
}
