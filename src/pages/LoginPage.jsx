import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'






export default function LoginPage() {
  const [email, setEmail] = useState('student@mail.ru')
  const [password, setPassword] = useState('1234')
  const [error, setError] = useState('')

  const { isAuth, user, login } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  
  const from = location.state?.from || '/dashboard'

  
  if (isAuth) {
    return <Navigate to={from} replace />
  }

  function handleSubmit(event) {
    event.preventDefault() 

    const result = login(email, password)

    if (!result.ok) {
      setError(result.error)
      showToast(result.error, 'warning')
      return
    }

    showToast('Вход выполнен')
    
    navigate(from, { replace: true })
  }

  return (
    <div className="page page--narrow">
      <div className="auth">
        <h1>Вход в аккаунт</h1>
        <p className="muted">
          Учебная имитация авторизации: подойдёт любой e-mail и пароль от 4 символов.
        </p>

        <form className="form" onSubmit={handleSubmit}>
          <label className="field">
            <span>E-mail</span>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="student@mail.ru"
            />
          </label>

          <label className="field">
            <span>Пароль</span>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="минимум 4 символа"
            />
          </label>

          {error && <p className="error">{error}</p>}

          <button className="btn btn--block" type="submit">
            Войти
          </button>
        </form>

        <p className="muted small">
          Вошедший пользователь: <b>{user ? user.email : '—'}</b>. После входа выполняется
          редирект на <code>{from}</code>.
        </p>
      </div>
    </div>
  )
}
