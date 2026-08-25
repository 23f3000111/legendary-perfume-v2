import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useShop, cartDetails, cartSubtotal } from '../store/shop'
import { useUI } from '../store/ui'
import { formatRM } from '../lib/format'
import { Close, Plus, Minus, Bag, Sparkle, ArrowRight, Truck } from './ui/icons'

export default function CartDrawer() {
  const open = useUI((s) => s.cartOpen)
  const close = useUI((s) => s.closeCart)
  const items = useShop((s) => s.items)
  const setQty = useShop((s) => s.setQty)
  const remove = useShop((s) => s.remove)

  const details = cartDetails(items)
  const subtotal = cartSubtotal(items)

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[92] bg-ink/45 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={close}
          />
          <motion.aside
            className="fixed inset-y-0 right-0 z-[93] flex w-full max-w-md flex-col bg-ivory"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* header */}
            <div className="flex items-center justify-between border-b border-line px-6 py-5">
              <h3 className="font-display text-xl">Your Bag <span className="text-smoke">({details.length})</span></h3>
              <button onClick={close} aria-label="Close bag" className="transition hover:text-gold"><Close width={22} /></button>
            </div>

            {/* Client amendment (revision 4): anything bought ships free, so
                the spend-to-unlock meter is gone and the bag simply says so. */}
            {details.length > 0 && (
              <div className="border-b border-line px-6 py-4">
                <p className="flex items-center gap-2 text-xs text-ink-soft">
                  <Truck width={16} className="text-gold" />
                  <b className="text-ink">Free delivery</b> on every order, whatever you buy
                </p>
              </div>
            )}

            {/* items */}
            <div className="flex-1 overflow-y-auto px-6">
              {details.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                  <div className="grid h-16 w-16 place-items-center rounded-full bg-sand text-gold"><Bag width={26} /></div>
                  <p className="font-display text-2xl">Your bag is empty</p>
                  <p className="max-w-xs text-sm text-smoke">Discover a scent that feels like a memory.</p>
                  <Link to="/shop" onClick={close} className="btn-gold mt-2">Explore Fragrances</Link>
                </div>
              ) : (
                <ul className="divide-y divide-line">
                  {details.map(({ product, qty, lineTotal }) => (
                    <li key={product.id} className="flex gap-4 py-5">
                      <Link to={`/product/${product.id}`} onClick={close} className="h-24 w-20 shrink-0 overflow-hidden bg-porcelain">
                        <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                      </Link>
                      <div className="flex flex-1 flex-col">
                        <div className="flex justify-between gap-2">
                          <div>
                            <Link to={`/product/${product.id}`} onClick={close} className="font-display text-lg leading-tight">{product.name}</Link>
                            <p className="text-xs text-smoke">{product.size}</p>
                          </div>
                          <button onClick={() => remove(product.id)} className="text-xs text-smoke underline underline-offset-2 transition hover:text-rose">Remove</button>
                        </div>
                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex items-center border border-line">
                            <button onClick={() => setQty(product.id, qty - 1)} className="grid h-8 w-8 place-items-center transition hover:bg-sand" aria-label="Decrease"><Minus width={13} /></button>
                            <span className="w-8 text-center text-sm">{qty}</span>
                            <button onClick={() => setQty(product.id, qty + 1)} className="grid h-8 w-8 place-items-center transition hover:bg-sand" aria-label="Increase"><Plus width={13} /></button>
                          </div>
                          <span className="text-sm">{formatRM(lineTotal)}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* footer */}
            {details.length > 0 && (
              <div className="border-t border-line px-6 py-5">
                <p className="mb-3 flex items-center gap-2 text-xs text-ink-soft"><Sparkle width={15} className="text-gold" /> Complimentary samples added to every order</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-smoke">Subtotal</span>
                  <span className="font-display text-2xl">{formatRM(subtotal)}</span>
                </div>
                <Link to="/checkout" onClick={close} className="btn-solid mt-4 w-full justify-center gap-2">
                  Checkout <ArrowRight width={16} />
                </Link>
                <button onClick={close} className="mt-3 w-full text-center text-xs uppercase tracking-[0.18em] text-smoke transition hover:text-ink">Continue shopping</button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
