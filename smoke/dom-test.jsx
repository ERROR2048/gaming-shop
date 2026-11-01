












import { JSDOM } from 'jsdom'

const results = []
function check(name, condition, extra = '') {
  results.push({ name, ok: Boolean(condition) })
  console.log(`${condition ? 'OK  ' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`)
}

async function main() {
  
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url: 'http://localhost/',
    pretendToBeVisual: true,
  })

  global.window = dom.window
  global.document = dom.window.document
  global.navigator = dom.window.navigator
  global.localStorage = dom.window.localStorage
  global.HTMLElement = dom.window.HTMLElement
  global.IS_REACT_ACT_ENVIRONMENT = true

  const { createRoot } = await import('react-dom/client')
  const { act } = await import('react-dom/test-utils')
  const React = (await import('react')).default
  const { MemoryRouter } = await import('react-router-dom')
  const { ThemeProvider } = await import('../src/context/ThemeContext.jsx')
  const { CartProvider } = await import('../src/context/CartContext.jsx')
  const { AuthProvider } = await import('../src/context/AuthContext.jsx')
  const { ToastProvider } = await import('../src/context/ToastContext.jsx')
  const App = (await import('../src/App.jsx')).default

  const container = document.getElementById('root')
  const root = createRoot(container)

  await act(async () => {
    root.render(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/catalog'] },
        React.createElement(
          ThemeProvider,
          null,
          React.createElement(
            AuthProvider,
            null,
            React.createElement(
              CartProvider,
              null,
              React.createElement(ToastProvider, null, React.createElement(App)),
            ),
          ),
        ),
      ),
    )
  })

  
  
  const norm = (value) => String(value).replace(/[\s\u00a0\u202f]+/g, ' ')
  const text = () => norm(container.textContent || '')
  const findByText = (tag, value) =>
    [...container.querySelectorAll(tag)].find((el) => (el.textContent || '').trim() === value)
  const clickText = async (tag, value) => {
    const el = findByText(tag, value)
    if (!el) throw new Error(`Не найден элемент <${tag}> с текстом "${value}"`)
    await act(async () => {
      el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }))
    })
    return el
  }

  
  check('Каталог: отображается 9 карточек товаров', container.querySelectorAll('.card').length === 9,
    `найдено карточек: ${container.querySelectorAll('.card').length}`)

  
  const addButtons = [...container.querySelectorAll('.card .btn')].filter((b) => b.textContent.trim() === 'В корзину')
  await act(async () => {
    addButtons[0].dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }))
    addButtons[0].dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }))
    addButtons[1].dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }))
  })

  check('Кнопка «В корзину» увеличивает счётчик в меню до 3', text().includes('Корзина') &&
    container.querySelector('.badge')?.textContent === '3',
    `бейдж: ${container.querySelector('.badge')?.textContent}`)

  const saved = JSON.parse(localStorage.getItem('gamedeck-cart') || '[]')
  check('Корзина сохраняется в localStorage (2 позиции)', saved.length === 2,
    `позиций: ${saved.length}, количеств: ${saved.map((i) => i.qty).join('/')}`)
  check('Количество у одной и той же позиции суммируется (qty=2)', saved[0]?.qty === 2)

  
  const expectedSum = saved.reduce((sum, item) => sum + item.price * item.qty, 0)
  const readable = norm(expectedSum.toLocaleString('ru-RU'))
  check('Сумма корзины сразу видна в меню', norm(container.querySelector('.navbar__cart-link')?.textContent).includes(readable))
  const cartLink = container.querySelector('.navbar__cart-link')
  await act(async () => {
    cartLink.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }))
  })
  check('Клик по NavLink «Корзина» открывает страницу корзины', text().includes('Итого'))
  check(`Итоговая сумма совпадает с ценой товаров (${readable} ₽)`, text().includes(readable))

  check('Кнопка «Удалить» есть в каждой строке корзины',
    container.querySelectorAll('.cart-row').length === container.querySelectorAll('.cart-row .btn--danger').length &&
    container.querySelectorAll('.cart-row').length === 2)

  
  await clickText('.cart-row .btn--danger', 'Удалить')
  check('После удаления в корзине осталась 1 позиция', container.querySelectorAll('.cart-row').length === 1)

  await clickText('.btn--ghost', 'Очистить корзину')
  check('Очистка корзины показывает пустое состояние', text().includes('Корзина пуста'))

  
  const themeAtStart = document.documentElement.dataset.theme
  await clickText('.navbar__actions .btn--ghost', '☀️ Светлая')
  const themeAfter = document.documentElement.dataset.theme
  check('Кнопка темы меняет data-theme у <html>', themeAtStart !== themeAfter,
    `${themeAtStart} → ${themeAfter}`)
  check('Выбранная тема сохраняется в localStorage', localStorage.getItem('gamedeck-theme') === themeAfter)

  
  await clickText('.navbar__menu a', 'Кабинет')
  check('Без входа /dashboard перенаправляет на форму входа',
    text().includes('Вход в аккаунт') && !text().includes('Личный кабинет'))

  const submit = container.querySelector('form button[type=submit]')
  await act(async () => {
    submit.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }))
  })
  check('После успешного входа — редирект на /dashboard',
    text().includes('Личный кабинет') && text().includes('student@mail.ru'))

  const failed = results.filter((r) => !r.ok).length
  console.log(failed === 0
    ? `\n✅ Пройдено все ${results.length} проверок`
    : `\n❌ Не пройдено проверок: ${failed} из ${results.length}`)

  await act(async () => root.unmount())
  process.exit(failed === 0 ? 0 : 1)
}

main().catch((error) => {
  console.error('Ошибка теста:', error)
  process.exit(1)
})
