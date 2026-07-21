import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getProduct, relatedProducts } from '../data/products'
import { accent } from '../lib/accents'
import { formatRM, discountPct } from '../lib/format'
import { useShop } from '../store/shop'
import { useUI } from '../store/ui'
import ScentPyramid from '../components/ScentPyramid'
import ProductCard from '../components/ProductCard'
import Reveal from '../components/ui/Reveal'
import { Kicker } from '../components/ui/SplitText'
import {
  Plus, Minus, Heart, HeartFilled, ShieldCheck, Truck, Droplet, Check, ArrowRight, ChevronDown,
} from '../components/ui/icons'

const tabs = [
  { key: 'know', label: 'Good to know', body: 'Halal certified · Refreshing · Lasts 4–7 hours · Easy to carry. An eau de parfum crafted for everyday wear in a tropical climate.' },
  { key: 'care', label: 'Care', body: 'Store away from direct sunlight and heat. Spray onto pulse points — wrists, neck and behind the ears — and let it settle without rubbing.' },
  { key: 'returns', label: 'Returns', body: 'Unopened items may be returned within 14 days. Exchanges are complimentary at any Legendary boutique across Malaysia.' },
]

export default function Product() {
  const { id } = useParams()
  const product = id ? getProduct(id) : undefined
  const [qty, setQty] = useState(1)
  const [active, setActive] = useState(0)
  const [openTab, setOpenTab] = useState<string | null>('know')
  const [added, setAdded] = useState(false)

  const add = useShop((s) => s.add)
  const toggleWish = useShop((s) => s.toggleWish)
  const wished = useShop((s) => (product ? s.wishlist.includes(product.id) : false))
  const { pulse, openCart } = useUI()

  if (!product) {
    return (
      <div className="grid min-h-[70vh] place-items-center pt-24 text-center">
        <div>
          <p className="font-display text-4xl">Fragrance not found</p>
          <Link to="/shop" className="btn-gold mt-6">Back to the collection</Link>
        </div>
      </div>
    )
  }

  const tone = accent(product.accent)
  const off = discountPct(product.price, product.compareAt)
  const related = relatedProducts(product, 4)

  const onAdd = () => {
    add(product.id, qty)
    pulse()
    setAdded(true)
    openCart()
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div className="bg-ivory pt-[62px] md:pt-[130px]">
      {/* Main */}
      <section className="u-container grid gap-12 py-10 md:py-16 lg:grid-cols-2 lg:gap-16">
        {/* Gallery */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <nav className="mb-5 flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.16em] text-smoke">
            <Link to="/" className="hover:text-gold">Home</Link><span>/</span>
            <Link to="/shop" className="hover:text-gold">Fragrances</Link><span>/</span>
            <span className="text-ink">{product.name}</span>
          </nav>
          <motion.div
            key={active}
            initial={{ opacity: 0.4, scale: 1.01 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-sm"
            style={{ background: `linear-gradient(160deg, ${tone.soft}, rgba(251,248,242,0.6))` }}
          >
            <div className="peranakan pointer-events-none absolute inset-0 opacity-[0.05]" style={{ color: tone.hex }} />
            {off && (
              <span className="absolute left-4 top-4 z-10 px-2.5 py-1 text-[0.64rem] uppercase tracking-[0.14em] text-ivory" style={{ background: tone.hex }}>
                Save {off}%
              </span>
            )}
            <img src={product.gallery[active]} alt={product.name} className="aspect-[4/5] w-full object-cover" />
          </motion.div>
          {product.gallery.length > 1 && (
            <div className="mt-4 flex gap-3">
              {product.gallery.map((g, i) => (
                <button
                  key={g}
                  onClick={() => setActive(i)}
                  className={`h-20 w-16 overflow-hidden rounded-sm ring-1 transition ${active === i ? 'ring-gold' : 'ring-line hover:ring-gold/50'}`}
                >
                  <img src={g} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <p className="eyebrow" style={{ color: tone.ink }}>{product.collection} Collection</p>
          <h1 className="mt-2 font-display text-[clamp(2.4rem,5vw,3.6rem)] leading-none">{product.name}</h1>
          <p className="mt-2 font-display text-lg italic text-smoke">{product.subtitle}</p>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-2xl text-ink">{formatRM(product.price)}</span>
            {product.compareAt && <span className="text-lg text-smoke line-through">{formatRM(product.compareAt)}</span>}
            <span className="text-xs text-smoke">Tax included</span>
          </div>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-soft">{product.description}</p>

          <div className="mt-6 flex flex-wrap gap-2">
            {product.badges.map((b) => (
              <span key={b} className="rounded-full border border-line px-3 py-1 text-[0.68rem] uppercase tracking-[0.1em] text-ink-soft">{b}</span>
            ))}
          </div>

          <p className="mt-6 flex items-center gap-2 text-sm text-jade">
            <span className="h-2 w-2 rounded-full bg-jade" /> In stock · {product.size}
          </p>

          {/* Qty + add */}
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <div className="flex items-center border border-line">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-12 w-12 place-items-center transition hover:bg-sand" aria-label="Decrease"><Minus width={15} /></button>
              <span className="w-10 text-center">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="grid h-12 w-12 place-items-center transition hover:bg-sand" aria-label="Increase"><Plus width={15} /></button>
            </div>
            <button onClick={onAdd} className="btn-solid flex-1 justify-center gap-2 min-w-[12rem]">
              {added ? <><Check width={16} /> Added to bag</> : <>Add to Bag — {formatRM(product.price * qty)}</>}
            </button>
            <button
              onClick={() => toggleWish(product.id)}
              className="grid h-12 w-12 place-items-center border border-line transition hover:border-gold"
              aria-label="Wishlist"
            >
              {wished ? <HeartFilled width={18} className="text-rose" /> : <Heart width={18} />}
            </button>
          </div>
          <Link to="/checkout" onClick={onAdd} className="btn-gold mt-3 w-full justify-center">Buy it now</Link>

          {/* Assurances */}
          <div className="mt-8 grid grid-cols-3 gap-4 border-t border-line pt-6 text-center">
            {[
              { I: ShieldCheck, t: 'Halal Certified' },
              { I: Truck, t: 'Free Delivery' },
              { I: Droplet, t: 'Free Samples' },
            ].map(({ I, t }) => (
              <div key={t} className="flex flex-col items-center gap-2">
                <I width={22} className="text-gold" />
                <span className="text-[0.7rem] uppercase tracking-[0.1em] text-smoke">{t}</span>
              </div>
            ))}
          </div>

          {/* Accordions */}
          <div className="mt-8 border-t border-line">
            {tabs.map((t) => (
              <div key={t.key} className="border-b border-line">
                <button onClick={() => setOpenTab(openTab === t.key ? null : t.key)} className="flex w-full items-center justify-between py-4 text-left">
                  <span className="font-display text-lg">{t.label}</span>
                  <ChevronDown width={18} className={`transition-transform ${openTab === t.key ? 'rotate-180' : ''}`} />
                </button>
                <motion.div initial={false} animate={{ height: openTab === t.key ? 'auto' : 0, opacity: openTab === t.key ? 1 : 0 }} className="overflow-hidden">
                  <p className="pb-5 text-sm leading-relaxed text-ink-soft">{t.body}</p>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scent pyramid */}
      <section className="py-20 md:py-28" style={{ background: tone.soft }}>
        <div className="u-container">
          <div className="mx-auto mb-14 max-w-xl text-center">
            <Kicker>The Composition</Kicker>
            <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3rem)]">A fragrance in three acts</h2>
          </div>
          <ScentPyramid notes={product.notes} accentKey={product.accent} />
        </div>
      </section>

      {/* Story */}
      <section className="u-container grid items-center gap-12 py-20 md:py-28 lg:grid-cols-2">
        <Reveal className="overflow-hidden rounded-sm">
          <img src={product.gallery[product.gallery.length - 1]} alt={product.name} className="aspect-[5/4] w-full object-cover" />
        </Reveal>
        <div>
          <Kicker>The Inspiration</Kicker>
          <Reveal><h2 className="mt-4 font-display text-[clamp(2rem,4vw,3.2rem)] leading-[1.05]">{product.subtitle}</h2></Reveal>
          <Reveal delay={0.1}><p className="mt-6 max-w-lg text-lg text-ink-soft">{product.story}</p></Reveal>
          {product.place && (
            <Reveal delay={0.15}>
              <p className="mt-6 flex items-center gap-2 text-sm text-smoke">
                Inspired by <span className="font-display text-lg italic text-ink" style={{ color: tone.ink }}>{product.place}</span>
              </p>
            </Reveal>
          )}
        </div>
      </section>

      {/* Related */}
      <section className="bg-porcelain py-20 md:py-28">
        <div className="u-container">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.8rem)]">You may also like</h2>
            <Link to="/shop" className="group flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-ink">
              All fragrances <ArrowRight width={15} className="text-gold transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-5 sm:gap-7 lg:grid-cols-4">
            {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </div>
      </section>
    </div>
  )
}
