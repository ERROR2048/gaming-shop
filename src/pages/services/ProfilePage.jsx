import { Link } from 'react-router-dom'
import { useAuth } from '../../context/ServiceAuthContext.jsx'

export default function ProfilePage() {
  const { user, isAdmin } = useAuth()

  return (
    <section className="page-stack">
      <div className="page-heading"><div><span className="eyebrow">АККАУНТ GAMECARE</span><h1>Личный кабинет</h1><p className="muted">Данные профиля, персональные предложения и быстрый доступ к записям.</p></div></div>
      <div className="profile-layout">
        <section className="panel profile-card">
          <div className="profile-avatar" aria-hidden="true">{(user?.name || 'П').trim().charAt(0).toLocaleUpperCase('ru-RU')}</div>
          <span className="eyebrow">ВАШ ПРОФИЛЬ</span>
          <h2>{user?.name || 'Пользователь'}</h2>
          <p className="muted">{user?.email}</p>
          <span className="category-label">{isAdmin ? 'Администратор' : 'Клиент'}</span>
          <div className="profile-links">
            <Link className="button button--primary" to="/services/appointments">Мои записи</Link>
            {isAdmin && <Link className="button button--outline" to="/services/admin">Панель управления</Link>}
          </div>
        </section>
        <section className="panel profile-benefit">
          <span className="eyebrow">ПЕРСОНАЛЬНОЕ ПРЕДЛОЖЕНИЕ</span>
          {user?.coupon ? <>
            <h2>Ваша скидка — {user.coupon.discount_percent}%</h2>
            <p className="muted">Персональный купон применяется автоматически при оформлении записи.</p>
            <div className="coupon-code-display">{user.coupon.code}</div>
          </> : <>
            <h2>Пока без купона</h2>
            <p className="muted">Если вам назначат персональную скидку, она появится здесь и применится к корзине автоматически.</p>
          </>}
          <Link className="text-button" to="/services">Перейти в каталог услуг →</Link>
        </section>
      </div>
      <section className="panel profile-note">
        <h2>Управление учётной записью</h2>
        <p className="muted">В этой учебной версии персональные данные отображаются из базы MS SQL Server. Для изменения имени или адреса электронной почты обратитесь к администратору.</p>
      </section>
    </section>
  )
}
