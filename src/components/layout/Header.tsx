import { asset } from '../../lib/asset'
import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useShop, cartCount } from '../../store/shop'
import { useUI } from '../../store/ui'
import { collections } from '../../data/collections'
import { Search, User, Bag, Heart, Menu, Close, ArrowUpRight } from '../ui/icons'

const megaShop = [
  { label: 'All Fragrances', to: '/shop' },
  { label: 'Bestsellers', to: '/shop?filter=bestsellers' },
  { label: 'For Her', to: '/shop?filter=her' },
  { label: 'For Him', to: '/shop?filter=him' },
  { label: 'Gifts & Sets', to: '/shop?filter=gifts' },
]

export default function Header() {
  const loc = useLocation()
  const isHome = loc.pathname === '/'
  const [scrolled, setScrolled] = useState(false)
  const [mega, setMega] = useState(false)
  const items = useShop((s) => s.items)
  const wishlist = useShop((s) => s.wishlist)
  const count = cartCount(items)
  const { openCart, toggleMenu, menuOpen, closeMenu, cartPulse } = useUI()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { closeMenu() }, [loc.pathname, closeMenu])

  const dark = isHome && !scrolled && !mega // light text over hero
  const solid = !dark

  return (
    <>
      <header
        onMouseLeave={() => setMega(false)}
        className={`fixed inset-x-0 top-0 z-[80] transition-colors duration-500 ${
          solid ? 'bg-ivory/90 backdrop-blur-md shadow-[0_1px_0_rgba(217,207,189,0.7)]' : 'bg-transparent'
        }`}
      >
        <div className="u-container">
          {/* Top row — logo centered */}
          <div className="flex h-[62px] items-center justify-between gap-4 md:h-[78px]">
            {/* Left (mobile menu / spacer) */}
            <div className="flex flex-1 items-center">
              <button
                onClick={toggleMenu}
                className={`lg:hidden ${dark ? 'text-ivory' : 'text-ink'}`}
                aria-label="Open menu"
              >
                <Menu width={24} />
              </button>
            </div>

            {/* Logo */}
            <Link
              to="/"
              className={`shrink-0 font-display text-[1.5rem] leading-none tracking-[0.26em] transition-colors md:text-[2.15rem] ${dark ? 'text-ivory' : 'text-ink'}`}
              aria-label="Legendary — home"
            >
              LEGENDARY
            </Link>

            {/* Right icons */}
            <div className={`flex flex-1 items-center justify-end gap-4 md:gap-5 ${dark ? 'text-ivory' : 'text-ink'}`}>
              <button className="hidden sm:block transition hover:text-gold" aria-label="Search"><Search width={20} /></button>
              <Link to="/wishlist" className="relative transition hover:text-gold" aria-label="Wishlist">
                <Heart width={20} />
                {wishlist.length > 0 && (
                  <span className="absolute -right-2 -top-2 grid h-4 w-4 place-items-center rounded-full bg-rose text-[0.55rem] text-ivory">
                    {wishlist.length}
                  </span>
                )}
              </Link>
              <Link to="/checkout" className="hidden transition hover:text-gold sm:block" aria-label="Account"><User width={20} /></Link>
              <motion.button
                key={cartPulse}
                onClick={openCart}
                animate={cartPulse ? { scale: [1, 1.28, 1] } : {}}
                transition={{ duration: 0.4 }}
                className="relative transition hover:text-gold"
                aria-label={`Bag, ${count} items`}
              >
                <Bag width={20} />
                {count > 0 && (
                  <span className="absolute -right-2 -top-2 grid h-4 w-4 place-items-center rounded-full bg-gold text-[0.55rem] text-ink">
                    {count}
                  </span>
                )}
              </motion.button>
            </div>
          </div>

          {/* Bottom row — navigation (desktop) */}
          <nav
            className={`hidden h-[52px] items-center justify-center gap-10 border-t text-[0.75rem] uppercase tracking-[0.2em] transition-colors lg:flex ${
              dark ? 'border-ivory/15 text-ivory' : 'border-line/70 text-ink'
            }`}
          >
            <button
              onMouseEnter={() => setMega(true)}
              onClick={() => setMega((v) => !v)}
              className="link-gold py-1"
            >
              FRAGRANCES
            </button>
            <NavLink to="/stores" className="link-gold py-1">Stores</NavLink>
            <NavLink to="/about" className="link-gold py-1">Our Story</NavLink>
            <NavLink to="/journal" className="link-gold py-1">Journal</NavLink>
            <NavLink to="/contact" className="link-gold py-1">Contact</NavLink>
          </nav>
        </div>

        {/* Mega menu */}
        <AnimatePresence>
          {mega && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-x-0 top-full hidden border-t border-line bg-ivory shadow-[0_30px_50px_-28px_rgba(28,24,21,0.45)] lg:block"
            >
              <div className="u-container grid grid-cols-[1fr_1fr_1.2fr] gap-10 py-10">
                <div>
                  <p className="eyebrow mb-5">Shop</p>
                  <ul className="space-y-3">
                    {megaShop.map((l) => (
                      <li key={l.to}>
                        <Link to={l.to} onClick={() => setMega(false)} className="link-gold font-display text-lg text-ink">{l.label}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="eyebrow mb-5">Collections</p>
                  <ul className="space-y-3">
                    {collections.map((c) => (
                      <li key={c.id}>
                        <Link to={`/shop?collection=${c.id}`} onClick={() => setMega(false)} className="link-gold font-display text-lg text-ink">{c.name}</Link>
                        <span className="ml-2 text-xs text-smoke">{c.tagline}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link to="/product/orchid" onClick={() => setMega(false)} className="group relative overflow-hidden">
                  <img src={asset("/assets/orchid-mirror.webp")} alt="Orchid" className="h-56 w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-ivory">
                    <p className="eyebrow eyebrow-gold">The Signature</p>
                    <p className="mt-1 flex items-center gap-1 font-display text-2xl">Orchid <ArrowUpRight width={18} /></p>
                  </div>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile drawer */}
      <MobileMenu open={menuOpen} onClose={closeMenu} />
    </>
  )
}

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const links = [
    { label: 'All Fragrances', to: '/shop' },
    ...collections.map((c) => ({ label: c.name, to: `/shop?collection=${c.id}` })),
    { label: 'Stores', to: '/stores' },
    { label: 'Our Story', to: '/about' },
    { label: 'Journal', to: '/journal' },
    { label: 'Wishlist', to: '/wishlist' },
  ]
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[90] bg-ink/40 lg:hidden"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed inset-y-0 left-0 z-[91] flex w-[84%] max-w-sm flex-col bg-ivory px-7 py-6 lg:hidden"
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-xl tracking-[0.22em]">LEGENDARY</span>
              <button onClick={onClose} aria-label="Close menu"><Close width={24} /></button>
            </div>
            <nav className="mt-10 flex flex-col gap-1">
              {links.map((l, i) => (
                <motion.div
                  key={l.to + l.label}
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 * i + 0.1 }}
                >
                  <Link to={l.to} onClick={onClose} className="block border-b border-line py-3.5 font-display text-2xl text-ink">
                    {l.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
            <a href="https://api.whatsapp.com/send/?phone=%2B60193836633" target="_blank" rel="noreferrer" className="btn-gold mt-auto justify-center">
              Chat with a Concierge
            </a>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
