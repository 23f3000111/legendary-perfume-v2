import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useShop, cartDetails, cartSubtotal } from '../store/shop'
import { formatRM } from '../lib/format'
import { Check, ArrowRight, ArrowLeft, ShieldCheck, Sparkle, Bag } from '../components/ui/icons'

const steps = ['Details', 'Delivery', 'Payment']
const deliveryOptions = [
  { id: 'standard', label: 'Standard Delivery', note: '2–4 business days · fully tracked', price: 0 },
  { id: 'express', label: 'Express Delivery', note: 'Next business day', price: 20 },
]
const payMethods = ['Card', 'FPX Online Banking', 'GrabPay', 'Touch ’n Go']

export default function Checkout() {
  const items = useShop((s) => s.items)
  const clear = useShop((s) => s.clear)
  const details = cartDetails(items)
  const subtotal = cartSubtotal(items)

  const [step, setStep] = useState(0)
  const [done, setDone] = useState(false)
  const [delivery, setDelivery] = useState('standard')
  const [pay, setPay] = useState('Card')
  const [orderNo] = useState(() => 'LGD-' + Math.floor(100000 + Math.random() * 899999))

  const shipping = delivery === 'express' ? 20 : subtotal >= 200 ? 0 : 10
  const total = subtotal + shipping

  if (done) {
    return (
      <div className="grid min-h-[80vh] place-items-center bg-ivory px-5 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
          className="max-w-lg text-center"
        >
          <motion.span
            className="mx-auto grid h-20 w-20 place-items-center rounded-full text-ink"
            style={{ background: 'linear-gradient(135deg,#CBAA5D,#8A6D2A)' }}
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.15 }}
          >
            <Check width={38} />
          </motion.span>
          <p className="eyebrow eyebrow-gold mt-8">Order Confirmed</p>
          <h1 className="mt-4 font-display text-[clamp(2.2rem,5vw,3.4rem)] leading-tight">Thank you, your scent is on its way</h1>
          <p className="mt-4 text-ink-soft">
            Order <span className="font-medium text-ink">{orderNo}</span> is confirmed. A receipt and tracking
            link are on their way to your inbox, with complimentary samples tucked inside.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <Link to="/shop" className="btn-solid">Continue shopping</Link>
            <Link to="/stores" className="btn-ghost">Find a boutique</Link>
          </div>
        </motion.div>
      </div>
    )
  }

  if (details.length === 0) {
    return (
      <div className="grid min-h-[70vh] place-items-center bg-ivory px-5 pt-24 text-center">
        <div className="flex flex-col items-center gap-5">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-sand text-gold"><Bag width={26} /></span>
          <p className="font-display text-3xl">Your bag is empty</p>
          <p className="max-w-sm text-smoke">Add a fragrance to begin checkout.</p>
          <Link to="/shop" className="btn-gold mt-2">Explore Fragrances</Link>
        </div>
      </div>
    )
  }

  const next = () => setStep((s) => Math.min(2, s + 1))
  const back = () => setStep((s) => Math.max(0, s - 1))
  const placeOrder = () => { clear(); setDone(true) }

  return (
    <div className="bg-ivory pb-24 pt-28 md:pt-36">
      <div className="u-narrow">
        <h1 className="font-display text-[clamp(2rem,4vw,3rem)]">Checkout</h1>

        {/* Stepper */}
        <div className="mt-6 flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s} className="flex flex-1 items-center gap-2">
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs transition ${
                i <= step ? 'bg-ink text-ivory' : 'bg-sand text-smoke'
              }`}>{i < step ? <Check width={15} /> : i + 1}</span>
              <span className={`text-xs uppercase tracking-[0.12em] ${i <= step ? 'text-ink' : 'text-smoke'}`}>{s}</span>
              {i < steps.length - 1 && <span className="mx-1 hidden h-px flex-1 bg-line sm:block" />}
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-12 lg:grid-cols-[1.3fr_0.9fr]">
          {/* Steps */}
          <div>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35 }}
              >
                {step === 0 && <DetailsStep />}
                {step === 1 && (
                  <div className="space-y-3">
                    <h2 className="font-display text-2xl">Delivery method</h2>
                    {deliveryOptions.map((o) => (
                      <button
                        key={o.id} onClick={() => setDelivery(o.id)}
                        className={`flex w-full items-center justify-between rounded-sm border p-4 text-left transition ${
                          delivery === o.id ? 'border-gold bg-porcelain' : 'border-line hover:border-gold/50'
                        }`}
                      >
                        <span>
                          <span className="block font-display text-lg">{o.label}</span>
                          <span className="block text-xs text-smoke">{o.note}</span>
                        </span>
                        <span className="text-sm">{o.price === 0 ? (subtotal >= 200 ? 'Free' : formatRM(10)) : formatRM(o.price)}</span>
                      </button>
                    ))}
                    <p className="flex items-center gap-2 pt-2 text-xs text-ink-soft"><Sparkle width={14} className="text-gold" /> Complimentary samples included with every order.</p>
                  </div>
                )}
                {step === 2 && (
                  <div className="space-y-5">
                    <h2 className="font-display text-2xl">Payment</h2>
                    <div className="grid grid-cols-2 gap-2">
                      {payMethods.map((m) => (
                        <button
                          key={m} onClick={() => setPay(m)}
                          className={`rounded-sm border px-3 py-3 text-sm transition ${pay === m ? 'border-gold bg-porcelain text-ink' : 'border-line text-ink-soft hover:border-gold/50'}`}
                        >{m}</button>
                      ))}
                    </div>
                    {pay === 'Card' && (
                      <div className="space-y-4 rounded-sm border border-line bg-porcelain p-5">
                        <Field label="Card number" placeholder="4242 4242 4242 4242" />
                        <div className="grid grid-cols-2 gap-4">
                          <Field label="Expiry" placeholder="MM / YY" />
                          <Field label="CVC" placeholder="123" />
                        </div>
                        <Field label="Name on card" placeholder="Your name" />
                      </div>
                    )}
                    {pay !== 'Card' && (
                      <p className="rounded-sm border border-line bg-porcelain p-5 text-sm text-ink-soft">
                        You’ll be redirected to {pay} to complete your payment securely. (Demo only, no charge is made.)
                      </p>
                    )}
                    <p className="flex items-center gap-2 text-xs text-smoke"><ShieldCheck width={15} className="text-gold" /> This is a demo checkout. No real payment is processed.</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Nav */}
            <div className="mt-8 flex items-center justify-between">
              {step > 0 ? (
                <button onClick={back} className="flex items-center gap-2 text-sm text-ink-soft transition hover:text-ink">
                  <ArrowLeft width={16} /> Back
                </button>
              ) : <Link to="/shop" className="flex items-center gap-2 text-sm text-ink-soft transition hover:text-ink"><ArrowLeft width={16} /> Continue shopping</Link>}
              {step < 2 ? (
                <button onClick={next} className="btn-solid gap-2">Continue <ArrowRight width={16} /></button>
              ) : (
                <button onClick={placeOrder} className="btn-gold gap-2">Place order · {formatRM(total)}</button>
              )}
            </div>
          </div>

          {/* Summary */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-sm border border-line bg-porcelain p-6">
              <h2 className="font-display text-xl">Order summary</h2>
              <ul className="mt-5 divide-y divide-line">
                {details.map(({ product, qty, lineTotal }) => (
                  <li key={product.id} className="flex gap-3 py-3">
                    <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-sm bg-sand">
                      <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                      <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-ink text-[0.62rem] text-ivory">{qty}</span>
                    </div>
                    <div className="flex flex-1 justify-between">
                      <span>
                        <span className="block font-display text-base leading-tight">{product.name}</span>
                        <span className="block text-xs text-smoke">{product.size}</span>
                      </span>
                      <span className="text-sm">{formatRM(lineTotal)}</span>
                    </div>
                  </li>
                ))}
              </ul>
              <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
                <div className="flex justify-between text-ink-soft"><dt>Subtotal</dt><dd>{formatRM(subtotal)}</dd></div>
                <div className="flex justify-between text-ink-soft"><dt>Delivery</dt><dd>{shipping === 0 ? 'Free' : formatRM(shipping)}</dd></div>
                <div className="flex justify-between border-t border-line pt-3 font-display text-xl text-ink"><dt>Total</dt><dd>{formatRM(total)}</dd></div>
              </dl>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

function Field({ label, placeholder }: { label: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="eyebrow text-smoke">{label}</span>
      <input placeholder={placeholder} className="mt-1.5 w-full border-b border-line bg-transparent py-2.5 outline-none transition focus:border-gold" />
    </label>
  )
}

function DetailsStep() {
  return (
    <div className="space-y-5">
      <h2 className="font-display text-2xl">Contact & shipping</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" placeholder="Nur" />
        <Field label="Last name" placeholder="Ahmad" />
      </div>
      <Field label="Email" placeholder="you@example.com" />
      <Field label="Phone" placeholder="+60 12-345 6789" />
      <Field label="Address" placeholder="Street address" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="City" placeholder="Kuala Lumpur" />
        <Field label="Postcode" placeholder="50000" />
        <Field label="State" placeholder="WP Kuala Lumpur" />
      </div>
    </div>
  )
}
