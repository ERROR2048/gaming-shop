import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/ServiceAuthContext.jsx'

export default function LoginPage() {
  const [mode, setMode] = useState('login')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, register, user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const destination = location.state?.from || '/services/appointments'

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (!email.trim() || !password) {
      setError('Заполните поля e-mail и пароля.')
      return
    }
    if (!email.includes('@')) {
      setError('Введите корректный адрес электронной почты.')
      return
    }
    if (mode === 'register' && password.length < 8) {
      setError('Для регистрации пароль должен содержать не менее 8 символов.')
      return
    }
    setLoading(true)
    try {
      if (mode === 'register') await register(fullName, email, password)
      else await signIn(email, password)
      navigate(destination, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (user) return <section className="panel centered-panel"><h1>Вы уже вошли</h1><button className="button button--primary" onClick={() => navigate('/services')}>Перейти в каталог</button></section>

  return (
    <section className="auth-panel panel">
      <span className="eyebrow">ЛИЧНЫЙ ПРОФИЛЬ</span>
      <h1>{mode === 'login' ? 'Вход в аккаунт' : 'Создание аккаунта'}</h1>
      <p className="muted">Войдите, чтобы оформить запись и применить персональный купон.</p>
      <form className="form" onSubmit={handleSubmit}>
        {mode === 'register' && <label>Имя и фамилия<input className="input" value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" /></label>}
        <label>E-mail<input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
        <label>Пароль<input className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required /></label>
        {error && <div className="error-message" role="alert">{error}</div>}
        <button className="button button--primary button--wide" type="submit" disabled={loading}>{loading ? 'Отправляем запрос…' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}</button>
      </form>
      <button className="text-button mode-button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}>
        {mode === 'login' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
      </button>
      <div className="demo-credentials"><strong>Демо-пользователь</strong><span>user@student.ru / User1234!</span><strong>Демо-администратор</strong><span>admin@service.local / Admin123!</span></div>
    </section>
  )
}
