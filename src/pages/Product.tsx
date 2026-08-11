import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getProduct, relatedProducts } from '../data/products'
import { productFaq } from '../data/faq'
import { accent } from '../lib/accents'
import { formatRM, discountPct } from '../lib/format'
import { useShop } from '../store/shop'
import { useUI } from '../store/ui'
import ScentPyramid from '../components/ScentPyramid'
import ProductCard from '../components/ProductCard'
import Reveal from '../components/ui/Reveal'
import { Kicker } from '../components/ui/SplitText'
import {
  Plus, Minus, ShieldCheck, Truck, Vial, Check, ArrowRight, ChevronDown,
} from '../components/ui/icons'

const tabs = [
  { key: 'know', label: 'Good to know', body: 'Refreshing, lasts 4 to 7 hours and easy to carry. An eau de parfum made for everyday wear in a tropical climate.' },
  { key: 'care', label: 'Care', body: 'Store away from direct sunlight and heat. Spray onto pulse points at the wrists, neck and behind the ears, then let it settle without rubbing.' },
  { key: 'returns', label: 'Returns', body: 'Unopened items may be returned within 14 days. Exchanges are complimentary at any Legendary boutique across Malaysia.' },
]

export default function Product() {
  const { id } = useParams()
  const product = id ? getProduct(id) : undefined
  const [qty, setQty] = useState(1)
  const [active, setActive] = useState(0)
  const [openTab, setOpenTab] = useState<string | null>('know')
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [added, setAdded] = useState(false)

  const add = useShop((s) => s.add)
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

  // A set breaks into one composition band per fragrance; anything else keeps
  // the single band it has always had.
  const compositions = product.variants?.length
    ? product.variants.map((v) => ({
        key: v.name,
        kicker: `The Composition · ${v.name}`,
        family: v.family,
        label: `${product.name} ${v.name}`,
        notes: v.notes,
        radar: v.radar,
        bloom: v.bloom,
      }))
    : [{
        key: product.id,
        kicker: 'The Composition',
        family: undefined as string | undefined,
        label: product.name,
        notes: product.notes,
        radar: product.radar,
        bloom: product.bloom,
      }]

  const onAdd = () => {
    add(product.id, qty)
    pulse()
    setAdded(true)
    openCart()
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div className="bg-ivory pt-[62px] md:pt-[130px]">
      {/* Main — left gallery pins while the right column scrolls past it */}
      {/* Client note: image column narrowed and capped so the shot sits in
          proportion to the copy, with the thumbnails visible alongside it.
          The gallery stays pinned while only this right column scrolls. */}
      <section className="u-container grid items-start gap-12 py-10 md:py-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        {/* Gallery */}
        <div className="lg:sticky lg:top-[150px] lg:self-start">
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
            {off && (
              <span className="absolute left-4 top-4 z-10 px-2.5 py-1 text-[0.64rem] uppercase tracking-[0.14em] text-ivory" style={{ background: tone.hex }}>
                Save {off}%
              </span>
            )}
            <img
              src={product.gallery[active]}
              alt={product.name}
              className={`aspect-square max-h-[52vh] w-full ${
                // The pack cut-out is transparent, so it is fitted on the
                // accent wash rather than cropped to fill.
                product.gallery[active] === product.hoverImage
                  ? 'object-contain p-8'
                  : 'object-cover'
              }`}
            />
          </motion.div>
          {product.gallery.length > 1 && (
            <div className="mt-4 flex gap-3">
              {product.gallery.map((g, i) => (
                <button
                  key={g}
                  onClick={() => setActive(i)}
                  className={`h-20 w-16 overflow-hidden rounded-sm ring-1 transition ${active === i ? 'ring-gold' : 'ring-line hover:ring-gold/50'}`}
                  style={{ background: `linear-gradient(160deg, ${tone.soft}, rgba(251,248,242,0.6))` }}
                >
                  <img src={g} alt="" className={g === product.hoverImage ? 'h-full w-full object-contain p-1.5' : 'h-full w-full object-cover'} />
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

          {product.badges.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {product.badges.map((b) => (
                <span key={b} className="rounded-full border border-line px-3 py-1 text-[0.68rem] uppercase tracking-[0.1em] text-ink-soft">{b}</span>
              ))}
            </div>
          )}

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
              {added ? <><Check width={16} /> Added to bag</> : <>Add to Bag · {formatRM(product.price * qty)}</>}
            </button>
          </div>
          <Link to="/checkout" onClick={onAdd} className="btn-gold mt-3 w-full justify-center">Buy it now</Link>

          {/* Assurances */}
          <div className="mt-8 grid grid-cols-3 gap-4 border-t border-line pt-6 text-center">
            {[
              { I: ShieldCheck, t: 'Secure Checkout' },
              { I: Truck, t: 'Free Delivery' },
              { I: Vial, t: 'Free Samples' },
            ].map(({ I, t }) => (
              <div key={t} className="flex flex-col items-center gap-2">
                <I width={22} className="text-gold" />
                <span className="text-[0.7rem] uppercase tracking-[0.1em] text-smoke">{t}</span>
              </div>
            ))}
          </div>

          {/* What's included.
              Client amendment: the flat-lay now sits on transparency and runs
              larger, so the panel's own paper colour carries behind it rather
              than a white plate inside a beige box. */}
          <div className="mt-10 rounded-sm border border-line bg-porcelain p-6 sm:p-7">
            <h2 className="font-display text-2xl">What’s included</h2>
            <div className="mt-5 grid gap-6 sm:grid-cols-[0.95fr_1.05fr] sm:items-center">
              <ul className="space-y-3">
                {product.includedItems.map((item) => (
                  <li key={item.label} className="flex gap-3">
                    <Check width={16} className="mt-1 shrink-0 text-gold" />
                    <span>
                      <span className="text-[0.95rem] text-ink">{item.label}</span>
                      <span className="block text-[0.82rem] leading-snug text-smoke">{item.detail}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <img
                src={product.included}
                alt={`Everything included with ${product.name}`}
                className="w-full object-contain sm:-mr-2 sm:w-[112%] sm:max-w-none"
                loading="lazy"
              />
            </div>
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

      {/* Composition.
          Client amendment: a set shows one band per fragrance in the box,
          in the order the client listed, each with its own occasion chart,
          botanical and notes. Single scents keep the one band they had. */}
      {compositions.map((c, i) => (
        <section
          key={c.key}
          className="relative overflow-hidden py-20 md:py-28"
          style={{ background: product.compositionTint ?? tone.soft }}
        >
          {/* The scent's botanical, bleeding off the right edge. The supplied
              cut-outs are cropped flush at the artboard, so fade the lower edge
              rather than letting it end on a hard horizontal line. */}
          {c.bloom && (
            <img
              src={c.bloom}
              alt=""
              aria-hidden
              className="pointer-events-none absolute -right-10 bottom-0 top-0 my-auto hidden h-[85%] w-auto max-w-[38%] object-contain opacity-90 lg:block"
              style={{
                WebkitMaskImage: 'linear-gradient(to bottom, #000 78%, transparent 100%)',
                maskImage: 'linear-gradient(to bottom, #000 78%, transparent 100%)',
              }}
            />
          )}
          <div className="u-container relative">
            <div className="mx-auto mb-14 max-w-xl text-center">
              <Kicker>{c.kicker}</Kicker>
              <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3rem)]">
                A fragrance in three acts
              </h2>
              {c.family && <p className="mt-3 text-sm text-ink-soft">{c.family}</p>}
            </div>
            <ScentPyramid
              notes={c.notes}
              radar={c.radar}
              accentKey={product.accent}
              name={c.label}
            />
          </div>
          {i < compositions.length - 1 && (
            <span className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-ink/10" />
          )}
        </section>
      ))}

      {/* FAQ — replaces the former inspiration split, per the client */}
      <section className="u-container py-20 md:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <Kicker>Good to Know</Kicker>
            <Reveal>
              <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3.2rem)] leading-[1.05]">
                Frequently asked questions
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-5 max-w-sm text-ink-soft">
                Still unsure? Our concierge answers in minutes, or you can message us on WhatsApp.
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <Link to="/contact" className="btn-ghost group mt-7">
                Contact us
                <ArrowRight width={16} className="transition-transform duration-500 group-hover:translate-x-1" />
              </Link>
            </Reveal>
          </div>

          <div className="border-t border-line">
            {productFaq.map((f, i) => (
              <div key={f.q} className="border-b border-line">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between gap-6 py-5 text-left"
                  aria-expanded={openFaq === i}
                >
                  <span className="font-display text-xl leading-snug">{f.q}</span>
                  <ChevronDown width={20} className={`shrink-0 text-gold transition-transform duration-500 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: openFaq === i ? 'auto' : 0, opacity: openFaq === i ? 1 : 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <p className="pb-6 pr-10 leading-relaxed text-ink-soft">{f.a}</p>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related */}
      <section className="bg-porcelain py-20 md:py-28">
        <div className="u-container">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.8rem)]">You may also like</h2>
            <Link to="/shop" className="group flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-ink">
              All fragrances <ArrowRight width={15} className="text-gold transition-transform duration-500 group-hover:translate-x-1" />
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
