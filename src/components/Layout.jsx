import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar.jsx'
import Toasts from './Toasts.jsx'
import ScrollToTop from './ScrollToTop.jsx'

export default function Layout() {
  const { pathname } = useLocation()
  const serviceArea = pathname.startsWith('/services')

  return (
    <div className="layout">
      <ScrollToTop />
      {!serviceArea && <Navbar />}
      <main className={serviceArea ? 'layout__services' : 'layout__content'}>
        <Outlet />
      </main>
      {!serviceArea && (
        <footer className="footer">
          Учебная практика • React + React Router + Context API • данные из локального каталога
          (позже — из СУБД через API)
        </footer>
      )}
      <Toasts />
    </div>
  )
}
