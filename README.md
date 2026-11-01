# 🎮 GameDeck — практическая работа: SPA-каталог и корзина

Проект расширяет первую практическую работу с `ProductCard` до полноценного SPA на React + Vite: **каталог товаров**, **глобальная корзина** (Context + `useReducer`), **смена светлой/тёмной темы** с сохранением выбора в `localStorage` и **навигация без перезагрузки** (React Router 6).

---

## 1. Что установить

| Инструмент | Ссылка | Что выбрать |
|---|---|---|
| Visual Studio Code | https://code.visualstudio.com/ | версия для своей ОС |
| Node.js (LTS) | https://nodejs.org/ | кнопка **LTS** (вместе с npm) |

Расширения для VS Code (`Ctrl+Shift+X`): **ES7+ React/Redux/React-Native snippets**, **Prettier**.

Проверка установки в терминале VS Code (`Терминал → Создать терминал`):

```bash
node -v     # например v20.20.2
npm -v      # например 10.8.2
```

> ❗ Если Windows отвечает `npm : Имя "npm" не распознано...` — смотрите файл
> `windows-помощь/ИНСТРУКЦИЯ-Windows.md` (пошаговое исправление) и скрипты
> `proverka-node.bat`, `start.bat`.

---

## 2. Запуск

```bash
cd gaming-shop       # папка с package.json
npm install          # один раз: ставит React, React Router и Vite
npm run dev          # сервер разработки → http://localhost:5173/
```

Прочие команды: `npm run build` (сборка в `dist`), `npm run preview` (просмотр сборки).

> СУБД пока не нужна: товары лежат в `src/data/products.js`.
> Когда появится API — этот файл заменяется на `fetch` внутри `useEffect`, остальной код не меняется.

---

## 3. Структура проекта

```
gaming-shop/
├── index.html
├── package.json
├── vite.config.js
├── public/images/              # 9 SVG-заглушек товаров
├── smoke/                      # авто-тесты (необязательные, для самопроверки)
│   ├── ssr-test.jsx            # рендер всех страниц
│   └── dom-test.jsx            # клики: корзина, тема, редиректы
└── src/
    ├── main.jsx                # точка входа + все провайдеры + BrowserRouter
    ├── App.jsx                 # карта маршрутов <Routes>
    ├── index.css               # стили + CSS-переменные тем
    ├── data/
    │   └── products.js         # каталог: 9 товаров, категории, поиск по id
    ├── context/
    │   ├── CartContext.jsx     # КОРЗИНА: Context + useReducer
    │   ├── ThemeContext.jsx    # ТЕМА light/dark: Context
    │   ├── AuthContext.jsx     # вход/выход (для редиректа на /dashboard)
    │   └── ToastContext.jsx    # всплывающие уведомления
    ├── components/
    │   ├── Layout.jsx          # рамка с меню и подвалом (<Outlet />)
    │   ├── Navbar.jsx          # меню на NavLink, бейдж корзины, кнопка темы
    │   ├── ProductCard.jsx     # карточка товара (props) + «В корзину»
    │   ├── ProtectedRoute.jsx  # защита приватных маршрутов (<Navigate />)
    │   ├── ScrollToTop.jsx     # прокрутка вверх при переходе
    │   └── Toasts.jsx          # контейнер уведомлений
    └── pages/
        ├── HomePage.jsx        # /            баннер, хиты, возможности
        ├── CatalogPage.jsx     # /catalog     поиск, фильтры, сортировка
        ├── ProductPage.jsx     # /product/:id подробнее + похожие товары
        ├── CartPage.jsx        # /cart        список, удаление, итог
        ├── LoginPage.jsx       # /login       вход → редирект на /dashboard
        ├── DashboardPage.jsx   # /dashboard   приватная страница
        └── NotFoundPage.jsx    # *            404
```

---

## 4. Соответствие требованиям задания

| № | Требование | Где реализовано |
|---|---|---|
| 1 | **Каталог: список товаров (минимум 5)**, у каждого название, цена, кнопка «В корзину» | 9 товаров в `src/data/products.js`; карточка — `components/ProductCard.jsx`; страница — `pages/CatalogPage.jsx` |
| 1 | Кнопка добавляет товар в **глобальное состояние** | `addItem(product)` из `useCart()` → `dispatch({ type: 'ADD_ITEM' })` |
| 2 | **Корзина**: список добавленных товаров | `pages/CartPage.jsx`, строки `.cart-row` |
| 2 | В каждой строке: название, цена, **кнопка удалить** | кнопка «Удалить» → `removeItem(item.id)` (плюс счётчик `− / +`) |
| 2 | **Итоговая сумма** всех товаров | `totalSum` считается в `CartContext.jsx` через `reduce`, показана в корзине и рядом со ссылкой «Корзина» в меню |
| 2 | Данные из **глобального состояния (Context или useReducer)** | `context/CartContext.jsx` — `createContext` + `useReducer` + хук `useCart()` |
| 3 | **Светлая/тёмная тема через Context** | `context/ThemeContext.jsx`; `data-theme` на `<html>`, цвета — CSS-переменные в `index.css` |
| 3 | **Кнопка переключения темы в меню** | `Navbar.jsx` → `toggleTheme()` («☀️ Светлая» / «🌙 Тёмная») |
| 3 | Цвет фона, текста и кнопок меняется по теме | наборы переменных `--bg/--surface/--text/--accent/...` для `dark` и `light` |
| 4 | **Меню со ссылками на все страницы** | `Navbar.jsx`: Главная, Каталог, Корзина, Кабинет, Войти |
| 4 | **Активная ссылка подсвечивается** | CSS-правило `.navbar__menu a.active` — класс добавляет сам `NavLink` |
| 4 | Использовать **NavLink** | все ссылки меню — `<NavLink to="...">`, для «Главной» — атрибут `end` |
| 5 | **После добавления товара → переход на /cart** | галочка «Переходить в корзину после добавления» в каталоге и на странице товара → `navigate('/cart')` в `ProductCard.jsx` |
| 5 | **После успешного входа → редирект на /dashboard** | `LoginPage.jsx`: `navigate(from, { replace: true })`, где `from = '/dashboard'`; `ProtectedRoute.jsx` делает `<Navigate to="/login">` для гостей |
| 6 | Глобальное состояние: **корзина + тема** | `CartProvider` (useReducer) и `ThemeProvider` (Context) в `src/main.jsx` |

Дополнительно: сохранение корзины и темы в `localStorage`, поиск/фильтры/сортировка,
страница товара, уведомления (toasts), страница 404, адаптивная вёрстка.

---

## 5. Ключевые фрагменты кода (для отчёта)

**Корзина: reducer и значения-итоги** — `src/context/CartContext.jsx`:

```jsx
function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': { return state }
    case 'DECREASE_ITEM': { return state }
    case 'REMOVE_ITEM':  return { ...state, items: state.items.filter(i => i.id !== action.payload) }
    case 'CLEAR_CART':   return { ...state, items: [] }
    default: return state
  }
}

const totalCount = state.items.reduce((sum, i) => sum + i.qty, 0)
const totalSum   = state.items.reduce((sum, i) => sum + i.price * i.qty, 0)
```

Плюс собственный хук-обёртка:

```jsx
export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart() нужно вызывать внутри <CartProvider>')
  return context
}
```

**Тема** — `src/context/ThemeContext.jsx` и `src/index.css`:

```jsx
useEffect(() => {
  document.documentElement.dataset.theme = theme        // <html data-theme="dark">
  localStorage.setItem('gamedeck-theme', theme)
}, [theme])
```

```css
:root[data-theme='dark']  { --bg: #0b0f1c; --text: #e8ecf6; --accent: #6a5cff; }
:root[data-theme='light'] { --bg: #f2f5fc; --text: #131a2b; --accent: #5236e0; }
```

**Маршруты** — `src/App.jsx`:

```jsx
<Routes>
  <Route path="/" element={<Layout />}>
    <Route index element={<HomePage />} />
    <Route path="catalog" element={<CatalogPage />} />
    <Route path="product/:id" element={<ProductPage />} />
    <Route path="cart" element={<CartPage />} />
    <Route path="login" element={<LoginPage />} />
    <Route path="dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
    <Route path="*" element={<NotFoundPage />} />
  </Route>
</Routes>
```

**Программные переходы** — `src/pages/LoginPage.jsx` и `src/components/ProductCard.jsx`:

```jsx
const navigate = useNavigate()
...
navigate(from, { replace: true })   // после входа → /dashboard
navigate('/cart')                   // после добавления товара (если включена галочка)
```

---

## 6. Как самому проверить работу

1. **Каталог:** откройте `/catalog` — 9 карточек, поиск, категории, сортировка.
2. **Корзина:** нажмите «В корзину» у двух-трёх товаров — в меню появится бейдж со счётчиком.
   Перейдите на `/cart`: позиции, кнопки `−`/`+`, «Удалить», итоговая сумма.
3. **Тема:** кнопка в правом верхнем углу — фон, текст и кнопки меняются мгновенно.
   Обновите страницу — выбор сохранился.
4. **Навигация:** переходите по меню — активная ссылка подсвечена, страница не перезагружается.
5. **Redirect:** нажмите «Кабинет» без входа → откроется `/login`. Введите любой e-mail и пароль
   (от 4 символов) → после входа автоматический переход на `/dashboard`.
6. **Переход после добавления:** включите галочку «Переходить в корзину после добавления» в
   каталоге и нажмите «В корзину» — приложение сразу откроет `/cart`.

### Автотесты (по желанию)

```bash
npm install jsdom --no-save
npx vite build --ssr smoke/dom-test.jsx --outDir ./.smoke-out --emptyOutDir
node .smoke-out/dom-test.js

npx vite build --ssr smoke/ssr-test.jsx --outDir ./.smoke-out --emptyOutDir
node .smoke-out/ssr-test.js
```

`dom-test` проверяет 13 сценариев: добавление товара, счётчик, сумму, удаление, очистку,
смену темы, защиту `/dashboard` и редирект после входа. `ssr-test` рендерит все страницы.

---

## 7. Частые проблемы

| Ошибка | Причина | Решение |
|---|---|---|
| `npm : Имя "npm" не распознано...` | Node.js не установлен / терминал не видит PATH | `windows-помощь/ИНСТРУКЦИЯ-Windows.md`, перезапуск VS Code |
| `'vite' не является внутренней или внешней командой` | не выполнен `npm install` | `npm install` |
| `Failed to resolve import "react-router-dom"` | не установились зависимости | `npm install` в папке с `package.json` |
| Белый экран, в консоли ошибка контекста | компонент вызван вне провайдера | проверьте, что `useCart()`/`useTheme()` используются внутри `<CartProvider>`/`<ThemeProvider>` в `main.jsx` |
| Обновление `/catalog` даёт 404 на сервере | не настроен fallback для SPA | Vite dev-сервер делает это сам; для продакшена нужно правило `try_files ... /index.html` |

---

## 8. Что улучшить дальше (идеи для отчёта)

1. Подключить API и СУБД: заменить `src/data/products.js` на `fetch` в `useEffect` + экран загрузки.
2. Сохранять корзину на сервере для авторизованного пользователя.
3. Добавить оформление заказа с формой доставки (React Hook Form).
4. Перевести состояние на Redux Toolkit и сравнить объём кода с Context.
5. Написать unit-тесты reducer'а через Jest/Vitest.

---

## Лабораторная работа №3: каталог услуг с MS SQL Server

Третья лабораторная добавлена в этот же проект, не заменяя прежний каталог игровых девайсов. Ссылка **«Услуги»** в меню открывает модуль GameCare по адресу `/services`; прошлые страницы остаются на `/`, `/catalog`, `/cart` и остальных старых маршрутах.

Модуль GameCare использует React-компоненты из `src/pages/services`, отдельные глобальные состояния корзины услуг и серверной авторизации (`src/context/ServiceCartContext.jsx`, `ServiceAuthContext.jsx`), общий переключатель темы проекта и API из `src/api/serviceClient.js`. Категории находятся в боковом aside с checkbox. Для сервера используется `server.py` на Python и Microsoft SQL Server через `pyodbc`.

### Подготовка базы MS SQL Server

1. Установите SQL Server Express/Developer и ODBC Driver 18 for SQL Server. Для запуска скрипта используйте SSMS.
2. В SSMS подключитесь к своему экземпляру SQL Server, откройте `sql/001_create_schema.sql` и выполните его. Сценарий создаст базу `GameCareDB` и таблицы.
3. Установите Python-пакет: `python -m pip install -r requirements.txt`.

### Запуск в Windows

Первый терминал PowerShell — API:

```powershell
cd путь\к\gaming-shop-practice-1-theme
$env:DB_SERVER = 'localhost\SQLEXPRESS'
$env:DB_NAME = 'GameCareDB'
$env:DB_DRIVER = 'ODBC Driver 18 for SQL Server'
python server.py
```

Второй терминал — сайт:

```powershell
cd путь\к\gaming-shop-practice-1-theme
npm install
npm run dev
```

Откройте `http://localhost:5173/services`. Vite передаёт запросы `/api` на API-сервер `http://127.0.0.1:8000`.

Демо-аккаунты модуля услуг: администратор `admin@service.local` / `Admin123!`; пользователь `user@student.ru` / `User1234!` с купоном `WELCOME10`.

Отчёт третьей лабораторной находится в `П50-3-24, УП 01.02, Папазов М.Ю. (работа 3).docx`.
