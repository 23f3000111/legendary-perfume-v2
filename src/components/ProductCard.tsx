import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Product } from '../data/products'
import { accent } from '../lib/accents'
import { formatRM, discountPct } from '../lib/format'
import { useShop } from '../store/shop'
import { useUI } from '../store/ui'
import { live, useStock } from '../store/stock'
import { Plus, Check } from './ui/icons'

export default function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const tone = accent(product.accent)
  const add = useShop((s) => s.add)
  const pulse = useUI((s) => s.pulse)
  const openCart = useUI((s) => s.openCart)
  const [added, setAdded] = useState(false)
  // Price and stock come from the dashboard when it has something to say
  // about this product, and from the built catalogue otherwise.
  const now = live(product, useStock((s) => s.changes))
  const off = discountPct(now.price, now.compareAt)

  const onAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!now.inStock) return
    add(product.id)
    pulse()
    setAdded(true)
    openCart()
    setTimeout(() => setAdded(false), 1400)
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-8% 0px' }}
      transition={{ duration: 0.7, delay: Math.min(index, 5) * 0.07, ease: [0.16, 1, 0.3, 1] }}
      className="group relative"
    >
      <Link to={`/product/${product.id}`} className="block">
        {/* Image tile.
            Client amendment: every SKU sits on its own accent gradient with
            the Peranakan dot pattern behind it, as it was originally. The pack
            shot is a transparent cut-out laid over that wash, so both the
            colour and the pattern read through instead of being covered by the
            artboard's white. */}
        <div
          className="relative overflow-hidden"
          style={{ background: `linear-gradient(160deg, ${tone.soft}, rgba(251,248,242,0.5))` }}
        >
          <div className="peranakan pointer-events-none absolute inset-0 opacity-[0.05]" style={{ color: tone.hex }} />
          {off && (
            <span
              className="absolute left-4 top-4 z-10 px-2.5 py-1 text-[0.62rem] font-medium uppercase tracking-[0.16em] text-ivory"
              style={{ background: product.accent === 'graphite' ? '#1C1815' : tone.hex }}
            >
              {off}% off
            </span>
          )}

          {/* Lifestyle shot cross-fades to the box + bottle cut-out on hover */}
          <div className="relative aspect-[4/5] w-full">
            <img
              src={product.image}
              alt={product.name}
              loading={index < 4 ? 'eager' : 'lazy'}
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-luxe group-hover:opacity-0"
            />
            <img
              src={product.hoverImage}
              alt=""
              aria-hidden
              loading="lazy"
              className="absolute inset-0 h-full w-full object-contain p-6 opacity-0 transition-opacity duration-700 ease-luxe group-hover:opacity-100"
            />
          </div>

          {/* Sold out sits over the tile rather than replacing the quick add,
              so the fragrance still reads as part of the house. */}
          {!now.inStock && (
            <span className="absolute left-3 top-3 z-10 bg-ink/85 px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.14em] text-ivory backdrop-blur">
              Sold out
            </span>
          )}

          {/* Quick add */}
          <div className="absolute inset-x-3 bottom-3 translate-y-3 opacity-0 transition-all duration-500 ease-luxe group-hover:translate-y-0 group-hover:opacity-100">
            <button
              onClick={onAdd}
              disabled={!now.inStock}
              className="flex w-full items-center justify-center gap-2 bg-ink/90 py-3 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-ivory backdrop-blur transition hover:bg-ink disabled:cursor-not-allowed disabled:bg-smoke/70 disabled:hover:bg-smoke/70"
            >
              {!now.inStock ? 'Sold out' : added ? <><Check width={15} /> Added</> : <><Plus width={15} /> Add to bag</>}
            </button>
          </div>
        </div>

        {/* Meta */}
        <div className="pt-4">
          <div className="flex items-center gap-2">
            <span className="eyebrow" style={{ color: tone.ink }}>{product.collection}</span>
          </div>
          <h3 className="mt-1.5 font-display text-[1.35rem] leading-none text-ink">{product.name}</h3>
          <p className="mt-1 text-[0.82rem] text-smoke">{product.family}</p>
          <div className="mt-2 flex items-baseline gap-2.5">
            <span className="text-[0.95rem] text-ink">{formatRM(now.price)}</span>
            {now.compareAt && (
              <span className="text-[0.8rem] text-smoke line-through">{formatRM(now.compareAt)}</span>
            )}
          </div>
        </div>
      </Link>
    </motion.article>
  )
}
