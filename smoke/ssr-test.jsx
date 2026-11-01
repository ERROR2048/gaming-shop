








global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] ?? null },
  setItem(k, v) { this.store[k] = String(v) },
  removeItem(k) { delete this.store[k] },
}
global.window = { scrollTo() {}, localStorage: global.localStorage }

import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import React from 'react'
import { ThemeProvider } from '../src/context/ThemeContext.jsx'
import { CartProvider } from '../src/context/CartContext.jsx'
import { AuthProvider } from '../src/context/AuthContext.jsx'
import { ToastProvider } from '../src/context/ToastContext.jsx'
import App from '../src/App.jsx'

function render(url) {
  return renderToString(
    <StaticRouter location={url}>
      <ThemeProvider><AuthProvider><CartProvider><ToastProvider>
        <App />
      </ToastProvider></CartProvider></AuthProvider></ThemeProvider>
    </StaticRouter>,
  )
}

const profile = { name: 'student', email: 'student@mail.ru' }

const checks = [
  { url: '/', expect: ['Игровые девайсы', 'Хиты продаж', 'Каталог'] },
  { url: '/catalog', expect: ['Каталог товаров', 'Геймпад Aurora X Pro', 'Коврик HyperGlide XL', 'VR-шлем Nebula One'] },
  { url: '/product/3', expect: ['Nova TKL', 'Добавить в корзину', 'Похожие товары', 'Phantom 26K'] },
  { url: '/cart', expect: ['Корзина пуста', 'В каталог'] },
  { url: '/login', expect: ['Вход в аккаунт', 'E-mail', 'Пароль'] },
  { url: '/nonexistent', expect: ['404', 'не найдена'] },
  
  { url: '/dashboard', expect: ['Корзина'], absent: ['Личный кабинет'] },
  
  { url: '/dashboard', asUser: true, expect: ['Личный кабинет', 'student@mail.ru', 'единиц в корзине'] },
]

let failed = 0

for (const check of checks) {
  
  if (check.asUser) global.localStorage.setItem('gamedeck-user', JSON.stringify(profile))
  else global.localStorage.removeItem('gamedeck-user')

  const html = render(check.url)
  const missing = (check.expect || []).filter((n) => !html.includes(n))
  const unexpected = (check.absent || []).filter((n) => html.includes(n))

  const label = `${check.url}${check.asUser ? ' (авторизован)' : ''}`
  const ok = missing.length === 0 && unexpected.length === 0
  if (!ok) failed++

  console.log(`${ok ? 'OK  ' : 'FAIL'} ${label.padEnd(24)} HTML: ${html.length} символов`)
  if (missing.length) console.log('     не найдено:', missing.join(', '))
  if (unexpected.length) console.log('     не должно быть:', unexpected.join(', '))
}

console.log(failed === 0 ? '\n✅ Все страницы рендерятся корректно' : `\n❌ Проблем: ${failed}`)
process.exit(failed === 0 ? 0 : 1)
