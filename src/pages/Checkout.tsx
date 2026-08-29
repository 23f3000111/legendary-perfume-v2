import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { useShop, cartDetails, cartSubtotal } from '../store/shop'
import { formatRM } from '../lib/format'
import { ApiError, startCheckout, type CheckoutSession } from '../lib/api'
import { getStripe, stripeAppearance, stripeConfigured, stripeTestMode } from '../lib/stripe'
import Seo from '../components/Seo'
import { Check, ArrowRight, ArrowLeft, ShieldCheck, Sparkle, Bag } from '../components/ui/icons'

/*
 * Checkout.
 *
 * Revision 5: this was a simulation. It now opens a real Stripe payment.
 *
 * The shape is deliberately narrow: no account, no login, just the details
 * needed to deliver a parcel and a payment. Two steps, because asking for a
 * card before an address is how carts get abandoned.
 *
 * Step one collects the customer, and posting it opens the payment: the server
 * prices the basket from its own catalogue, records the order and returns a
 * client secret and the order reference. Step two mounts Stripe's Payment
 * Element against that secret, so card details are entered inside Stripe's own
 * iframe and never touch this origin.
 *
 * Client amendment (revision 4): there is no delivery choice to make and
 * everything ships free, so there is no delivery step.
 */

const steps = ['Details', 'Payment']

interface Form {
  name: string
  email: string
  phone: string
  line1: string
  line2: string
  city: string
  postcode: string
  state: string
  note: string
}

const EMPTY: Form = {
  name: '', email: '', phone: '', line1: '', line2: '',
  city: '', postcode: '', state: '', note: '',
}

const MALAYSIAN_STATES = [
  'Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan', 'Pahang', 'Perak', 'Perlis',
  'Pulau Pinang', 'Sabah', 'Sarawak', 'Selangor', 'Terengganu',
  'WP Kuala Lumpur', 'WP Labuan', 'WP Putrajaya',
]

export default function Checkout() {
  const items = useShop((s) => s.items)
  const details = cartDetails(items)
  const subtotal = cartSubtotal(items)

  const [step, setStep] = useState(0)
  const [form, setForm] = useState<Form>(EMPTY)
  /* The email is carried alongside the server's response so the confirmation
     page can look the order up without asking for it again. */
  const [session, setSession] = useState<(CheckoutSession & { email: string }) | null>(null)
  const [opening, setOpening] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (k: keyof Form) => (v: string) => setForm((f) => ({ ...f, [k]: v }))

  const missing = useMemo(() => {
    const required: (keyof Form)[] = ['name', 'email', 'phone', 'line1', 'city', 'postcode', 'state']
    return required.filter((k) => !form[k].trim())
  }, [form])

  if (details.length === 0 && !session) {
    return (
      <div className="grid min-h-[70vh] place-items-center bg-ivory px-5 pt-24 text-center">
        <Seo title="Checkout" description="Complete your Legendary order." noindex />
        <div className="flex flex-col items-center gap-5">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-sand text-gold"><Bag width={26} /></span>
          <p className="font-display text-3xl">Your bag is empty</p>
          <p className="max-w-sm text-smoke">Add a fragrance to begin checkout.</p>
          <Link to="/shop" className="btn-gold mt-2">Explore Fragrances</Link>
        </div>
      </div>
    )
  }

  /** Opening the payment is what moves us to step two. */
  const openPayment = async () => {
    if (missing.length) {
      setError('Please fill in every field marked required.')
      return
    }
    setError(null)
    setOpening(true)
    try {
      const opened = await startCheckout({
        items: items.map((i) => ({ id: i.id, qty: i.qty })),
        customer: { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() },
        shipping: {
          line1: form.line1.trim(),
          line2: form.line2.trim() || undefined,
          city: form.city.trim(),
          postcode: form.postcode.trim(),
          state: form.state.trim(),
        },
        note: form.note.trim() || undefined,
      })
      setSession({ ...opened, email: form.email.trim() })
      setStep(1)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'We could not start the payment. Please try again.')
    } finally {
      setOpening(false)
    }
  }

  const total = session?.total ?? subtotal

  return (
    <div className="bg-ivory pb-24 pt-28 md:pt-36">
      <Seo title="Checkout" description="Complete your Legendary order." noindex />
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
          <div>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35 }}
              >
                {step === 0 ? (
                  <div className="space-y-5">
                    <h2 className="font-display text-2xl">Contact and delivery</h2>
                    <p className="text-sm text-smoke">
                      There is no account to create. We take only what we need to reach you and
                      deliver your order.
                    </p>
                    <Field label="Full name" required value={form.name} onChange={set('name')} placeholder="Nur Ahmad" autoComplete="name" />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Email" required type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" autoComplete="email" />
                      <Field label="Phone" required type="tel" value={form.phone} onChange={set('phone')} placeholder="+60 12 345 6789" autoComplete="tel" />
                    </div>
                    <Field label="Street address" required value={form.line1} onChange={set('line1')} placeholder="No. 37, Jalan Bangsar" autoComplete="address-line1" />
                    <Field label="Apartment, unit, floor" value={form.line2} onChange={set('line2')} placeholder="Optional" autoComplete="address-line2" />
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Field label="City" required value={form.city} onChange={set('city')} placeholder="Kuala Lumpur" autoComplete="address-level2" />
                      <Field label="Postcode" required value={form.postcode} onChange={set('postcode')} placeholder="59200" autoComplete="postal-code" inputMode="numeric" />
                      <label className="block">
                        <span className="eyebrow text-smoke">State <span className="text-gold">*</span></span>
                        <select
                          value={form.state}
                          onChange={(e) => set('state')(e.target.value)}
                          autoComplete="address-level1"
                          className="mt-1.5 w-full border-b border-line bg-transparent py-2.5 outline-none transition focus:border-gold"
                        >
                          <option value="">Choose</option>
                          {MALAYSIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </label>
                    </div>
                    <Field label="Order note" value={form.note} onChange={set('note')} placeholder="Anything we should know? Optional." />
                    <p className="text-xs text-smoke">We deliver within Malaysia only.</p>
                  </div>
                ) : (
                  <PaymentStep session={session!} onError={setError} />
                )}
              </motion.div>
            </AnimatePresence>

            {error && (
              <p role="alert" className="mt-6 border-l-2 border-[#A4352C] bg-[#A4352C]/5 py-3 pl-4 text-sm text-[#A4352C]">
                {error}
              </p>
            )}

            {step === 0 && (
              <div className="mt-8 flex items-center justify-between">
                <Link to="/shop" className="flex items-center gap-2 text-sm text-ink-soft transition hover:text-ink">
                  <ArrowLeft width={16} /> Continue shopping
                </Link>
                <button onClick={openPayment} disabled={opening} className="btn-solid gap-2 disabled:opacity-60">
                  {opening ? 'Opening payment' : 'Continue to payment'} <ArrowRight width={16} />
                </button>
              </div>
            )}
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
                <div className="flex justify-between text-ink-soft"><dt>Delivery</dt><dd>Free</dd></div>
                <div className="flex justify-between border-t border-line pt-3 font-display text-xl text-ink"><dt>Total</dt><dd>{formatRM(total)}</dd></div>
              </dl>
              {session && (
                <p className="mt-4 border-t border-line pt-4 text-xs text-ink-soft">
                  Order reference{' '}
                  <span className="select-all font-medium tracking-[0.08em] text-ink">{session.reference}</span>
                </p>
              )}
              <p className="mt-4 flex items-center gap-2 text-xs text-ink-soft">
                <Sparkle width={14} className="text-gold" /> Complimentary samples included with every order.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

/**
 * Step two: Stripe's Payment Element, mounted against this order's secret.
 *
 * Elements has to sit above the component that calls `useStripe`, so the
 * provider and the form are split.
 */
function PaymentStep({
  session,
  onError,
}: {
  session: CheckoutSession & { email: string }
  onError: (message: string | null) => void
}) {
  if (!stripeConfigured) {
    return (
      <div className="space-y-4">
        <h2 className="font-display text-2xl">Payment</h2>
        <p className="rounded-sm border border-line bg-porcelain p-5 text-sm text-ink-soft">
          The shop is not connected to a payment account yet. Set
          {' '}<code className="text-ink">VITE_STRIPE_PUBLISHABLE_KEY</code>{' '}
          and reload to take payments.
        </p>
      </div>
    )
  }
  return (
    <Elements
      stripe={getStripe()}
      options={{ clientSecret: session.clientSecret, appearance: stripeAppearance }}
    >
      <PaymentForm session={session} onError={onError} />
    </Elements>
  )
}

function PaymentForm({
  session,
  onError,
}: {
  session: CheckoutSession & { email: string }
  onError: (message: string | null) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const navigate = useNavigate()
  const clear = useShop((s) => s.clear)
  const [paying, setPaying] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setPaying(true)
    onError(null)

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      // Card payments settle here. A method that has to leave the site, FPX and
      // GrabPay among them, comes back to the order page instead.
      redirect: 'if_required',
      confirmParams: {
        return_url: `${window.location.origin}/order?reference=${encodeURIComponent(session.reference)}`,
      },
    })

    if (error) {
      onError(error.message ?? 'That payment could not be completed. Please try another method.')
      setPaying(false)
      return
    }

    if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing')) {
      // Hand the confirmation page the address this order was placed with, so
      // it can show the order rather than asking a customer who has just
      // finished typing to type their email again. It is theirs, it is on this
      // device only, and it is cleared as soon as the page has used it.
      try {
        sessionStorage.setItem(
          'legendary:lastOrder',
          JSON.stringify({ reference: session.reference, email: session.email }),
        )
      } catch {
        // Private browsing can refuse this; the lookup form still works.
      }
      // The webhook is what actually settles the order; this only moves the
      // customer on to a page that can show them what happened.
      clear()
      navigate(`/order?reference=${encodeURIComponent(session.reference)}&placed=1`, { replace: true })
      return
    }

    onError('That payment did not complete. Please try again.')
    setPaying(false)
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <h2 className="font-display text-2xl">Payment</h2>
      {stripeTestMode && (
        <p className="border-l-2 border-gold bg-gold/5 py-3 pl-4 text-xs text-ink-soft">
          Test mode. Use card 4242 4242 4242 4242 with any future expiry and any CVC. No money moves.
        </p>
      )}
      <div className="rounded-sm border border-line bg-porcelain p-5">
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>
      <p className="flex items-center gap-2 text-xs text-smoke">
        <ShieldCheck width={15} className="text-gold" />
        Card details are entered with Stripe and never reach our servers.
      </p>
      <div className="flex items-center justify-between pt-2">
        <Link to="/shop" className="flex items-center gap-2 text-sm text-ink-soft transition hover:text-ink">
          <ArrowLeft width={16} /> Continue shopping
        </Link>
        <button type="submit" disabled={!stripe || paying} className="btn-gold gap-2 disabled:opacity-60">
          {paying ? 'Taking payment' : `Pay ${formatRM(session.total)}`}
        </button>
      </div>
    </form>
  )
}

function Field({
  label, value, onChange, placeholder, type = 'text', required, autoComplete, inputMode,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  required?: boolean
  autoComplete?: string
  inputMode?: 'numeric' | 'text' | 'tel' | 'email'
}) {
  return (
    <label className="block">
      <span className="eyebrow text-smoke">
        {label} {required && <span className="text-gold">*</span>}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        className="mt-1.5 w-full border-b border-line bg-transparent py-2.5 outline-none transition focus:border-gold"
      />
    </label>
  )
}
