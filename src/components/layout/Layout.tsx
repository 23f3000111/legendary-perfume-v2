import { useEffect } from 'react'
import { Outlet, useLocation, useNavigationType } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import CartDrawer from '../CartDrawer'
import Concierge from '../Concierge'
import Atmosphere from '../Atmosphere'
import Intro from '../Intro'
import { useContentGuard } from '../../lib/contentGuard'
import { useStock } from '../../store/stock'

/**
 * Every followed link opens at the top of the page.
 *
 * Client amendment: this used to watch the path only, so the Fragrances menu
 * and the footer links left you halfway down the grid whenever the path
 * already matched, for example /shop to /shop?filter=her. It now watches the
 * query string too.
 *
 * The navigation type keeps that honest. PUSH is a followed link and jumps to
 * the top; REPLACE is an in-page control such as the shop's own filter chips
 * and stays put; POP is the back button, where the browser restores the
 * previous position itself.
 */
function ScrollToTop() {
  const { pathname, search } = useLocation()
  const navType = useNavigationType()

  useEffect(() => {
    if (navType !== 'PUSH') return
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname, search, navType])

  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'
  }, [])

  return null
}

export default function Layout() {
  useContentGuard()

  /* Stock and any price the dashboard has changed, fetched once for the whole
     session. It resolves in the background: nothing waits on it, and if it
     never arrives the shop simply shows the catalogue it was built with. */
  const loadStock = useStock((s) => s.load)
  useEffect(() => {
    void loadStock()
  }, [loadStock])

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
