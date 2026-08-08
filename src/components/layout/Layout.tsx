import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import CartDrawer from '../CartDrawer'
import Concierge from '../Concierge'
import Atmosphere from '../Atmosphere'
import Intro from '../Intro'
import { useContentGuard } from '../../lib/contentGuard'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])
  return null
}

export default function Layout() {
  useContentGuard()
  return (
    <div className="grain relative min-h-screen">
      <Intro />
      <Atmosphere />
      <ScrollToTop />
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <Concierge />
    </div>
  )
}
