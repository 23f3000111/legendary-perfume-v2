import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Product } from '../data/products'
import { accent } from '../lib/accents'
import { formatRM, discountPct } from '../lib/format'
import { useShop } from '../store/shop'
import { useUI } from '../store/ui'
import { Plus, Check } from './ui/icons'

export default function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const tone = accent(product.accent)
  const add = useShop((s) => s.add)
  const pulse = useUI((s) => s.pulse)
  const openCart = useUI((s) => s.openCart)
  const [added, setAdded] = useState(false)
  const off = discountPct(product.price, product.compareAt)

  const onAdd = (e: React.MouseEvent) => {
    e.preventDefault()
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
            Client amendment: every SKU sits on its own accent gradient. The
            pack shot is a transparent cut-out laid over that wash, so the
            colour reads through instead of being covered by the artboard's
            white. */}
        <div
          className="relative overflow-hidden"
          style={{ background: `linear-gradient(160deg, ${tone.soft}, rgba(251,248,242,0.5))` }}
        >
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

          {/* Quick add */}
          <div className="absolute inset-x-3 bottom-3 translate-y-3 opacity-0 transition-all duration-500 ease-luxe group-hover:translate-y-0 group-hover:opacity-100">
            <button
              onClick={onAdd}
              className="flex w-full items-center justify-center gap-2 bg-ink/90 py-3 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-ivory backdrop-blur transition hover:bg-ink"
            >
              {added ? <><Check width={15} /> Added</> : <><Plus width={15} /> Add to bag</>}
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
            <span className="text-[0.95rem] text-ink">{formatRM(product.price)}</span>
            {product.compareAt && (
              <span className="text-[0.8rem] text-smoke line-through">{formatRM(product.compareAt)}</span>
            )}
          </div>
        </div>
      </Link>
    </motion.article>
  )
}
