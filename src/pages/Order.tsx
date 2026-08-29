import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ApiError, findOrder, type TrackedOrder } from '../lib/api'
import { formatRM } from '../lib/format'
import Seo from '../components/Seo'
import PageHeader from '../components/ui/PageHeader'
import { asset } from '../lib/asset'
import { Check, Truck, ArrowRight, Sparkle } from '../components/ui/icons'

/**
 * One page for both halves of life after the bag: the confirmation you land on
 * when you have just paid, and the lookup you come back to a week later.
 *
 * There are no accounts on this shop, so the order reference is how a customer
 * finds their order again. It is shown large on the confirmation, repeated in
 * both emails, and this page takes it plus the email address it was placed
 * with. Arriving with `?reference=` prefills the form so a link from an email
 * only asks for the address.
 *
 * A payment method that has to leave the site, FPX and GrabPay among them,
 * returns here with Stripe's own query parameters attached. Those are not
 * trusted for anything: the order's status is always read back from our API,
 * which reads it from the payment itself.
 */
export default function Order() {
  const [params, setParams] = useSearchParams()
  const prefilled = params.get('reference') ?? ''
  const justPlaced = params.get('placed') === '1' || params.get('redirect_status') === 'succeeded'

  const [reference, setReference] = useState(prefilled)
  const [email, setEmail] = useState('')
  const [order, setOrder] = useState<TrackedOrder | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)

  const lookup = useCallback(
    async (opts?: { ref?: string; mail?: string; patient?: boolean; quiet?: boolean }) => {
      const ref = (opts?.ref ?? reference).trim()
      const mail = (opts?.mail ?? email).trim()
      if (!ref || !mail) {
        setError('Enter both your order reference and the email address you ordered with.')
        return
      }
      // A background re-check leaves the card on screen and says nothing: the
      // customer is reading their order, not waiting on a form.
      if (!opts?.quiet) {
        setLoading(true)
        setError(null)
      }

      /*
       * With no database configured the order lives on its Stripe payment, and
       * Stripe's search index takes a few seconds to catch up with a write. So
       * a customer arriving straight off the payment is given a little patience
       * rather than being told their brand new order does not exist.
       */
      const tries = opts?.patient ? 8 : 1
      for (let attempt = 0; attempt < tries; attempt++) {
        try {
          const { order: found } = await findOrder(ref, mail)
          setOrder(found)
          setAttempts(0)
          if (!opts?.quiet) setLoading(false)
          // Keep the reference in the URL so the page can be reloaded or given
          // to the house, but never the email address.
          setParams({ reference: found.reference }, { replace: true })
          return
        } catch (err) {
          const last = attempt === tries - 1
          if (!last && err instanceof ApiError && err.status === 404) {
            await new Promise((r) => setTimeout(r, 5000))
            continue
          }
          if (last && !opts?.quiet) {
            setOrder(null)
            setAttempts((n) => n + 1)
            setError(
              err instanceof ApiError ? err.message : 'We could not look that order up. Please try again.',
            )
          }
        }
      }
      if (!opts?.quiet) setLoading(false)
    },
    [reference, email, setParams],
  )

  /*
   * Ask again for an order that has not settled yet.
   *
   * Kept stable with useCallback: OrderCard runs it from an effect, and a fresh
   * function identity on every render would restart that effect in a loop.
   */
  const recheck = useCallback(() => {
    if (!order) return
    void lookup({ ref: order.reference, mail: email, quiet: true })
  }, [lookup, order?.reference, email])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void lookup()
  }

  /*
   * Straight off a payment, the checkout leaves the reference and the address
   * it was placed with in this tab's own storage, so the order can simply be
   * shown rather than asked for a second time. It is read once and cleared.
   */
  const [autoTried, setAutoTried] = useState(false)
  useEffect(() => {
    if (!justPlaced || autoTried) return
    setAutoTried(true)
    let stored: { reference?: string; email?: string } | null = null
    try {
      const raw = sessionStorage.getItem('legendary:lastOrder')
      if (raw) {
        stored = JSON.parse(raw)
        sessionStorage.removeItem('legendary:lastOrder')
      }
    } catch {
      // Private browsing; the form below is still there.
    }
    if (stored?.email && stored.reference && stored.reference === prefilled) {
      setEmail(stored.email)
      void lookup({ ref: stored.reference, mail: stored.email, patient: true })
    }
  }, [justPlaced, autoTried, prefilled, lookup])

  return (
    <>
      <Seo
        title={justPlaced ? 'Thank you for your order' : 'Track your order'}
        description="Look up a Legendary order with your order reference and the email address you ordered with."
        noindex
      />
      <PageHeader
        eyebrow={justPlaced ? 'Order Received' : 'Customer Care'}
        title={justPlaced ? 'Thank you for your order' : 'Track your order'}
        intro={
          justPlaced
            ? 'Your payment went through. A confirmation is on its way to your inbox, with complimentary samples tucked into the parcel.'
            : 'Enter your order reference and the email address you ordered with, and we will show you where it is.'
        }
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Order' }]}
        image={asset('/assets/client/banner-contact.webp')}
      />

      <section className="bg-ivory py-16 md:py-24">
        <div className="u-narrow">
          {justPlaced && !order && (
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              className="mb-12 flex flex-col items-center gap-5 border-b border-line pb-12 text-center"
            >
              <motion.span
                className="grid h-16 w-16 place-items-center rounded-full text-ink"
                style={{ background: 'linear-gradient(135deg,#CBAA5D,#8A6D2A)' }}
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 13, delay: 0.15 }}
              >
                <Check width={30} />
              </motion.span>
              {prefilled && (
                <div>
                  <p className="eyebrow eyebrow-gold">Your order reference</p>
                  <p className="mt-2 select-all font-display text-[clamp(1.8rem,4vw,2.6rem)] tracking-[0.06em]">
                    {prefilled}
                  </p>
                </div>
              )}
              <p className="max-w-md text-sm text-ink-soft">
                Keep this reference. It is how you check on your order, and how we find it if you
                write to us. Enter it below with your email address at any time.
              </p>
            </motion.div>
          )}

          {!order && loading && justPlaced && (
            <p className="mx-auto max-w-xl text-center text-sm text-smoke">
              Fetching your order…
            </p>
          )}

          {!order && !(loading && justPlaced) && (
            <form onSubmit={onSubmit} className="mx-auto max-w-xl space-y-5">
              <label className="block">
                <span className="eyebrow text-smoke">Order reference</span>
                <input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="LG-XXXX-XXXX"
                  autoComplete="off"
                  spellCheck={false}
                  className="mt-1.5 w-full border-b border-line bg-transparent py-2.5 tracking-[0.08em] outline-none transition focus:border-gold"
                />
              </label>
              <label className="block">
                <span className="eyebrow text-smoke">Email address you ordered with</span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="mt-1.5 w-full border-b border-line bg-transparent py-2.5 outline-none transition focus:border-gold"
                />
              </label>
              {error && (
                <p role="alert" className="border-l-2 border-[#A4352C] bg-[#A4352C]/5 py-3 pl-4 text-sm text-[#A4352C]">
                  {error}
                  {attempts >= 2 && (
                    <>
                      {' '}If you have just paid, give it a minute and try again, or{' '}
                      <Link to="/contact" className="underline">write to us</Link>.
                    </>
                  )}
                </p>
              )}
              <button type="submit" disabled={loading} className="btn-solid gap-2 disabled:opacity-60">
                {loading ? 'Looking' : 'Find my order'} <ArrowRight width={16} />
              </button>
            </form>
          )}

          {order && (
            <OrderCard
              order={order}
              onReset={() => { setOrder(null); setEmail('') }}
              onRecheck={recheck}
            />
          )}
        </div>
      </section>
    </>
  )
}

const STATUS: Record<TrackedOrder['status'], { label: string; body: string; tone: string }> = {
  pending: {
    label: 'Awaiting payment',
    body: 'We have your order and are waiting for the payment to settle. This usually takes a moment.',
    tone: '#8A6D2A',
  },
  paid: {
    label: 'Paid, preparing your parcel',
    body: 'Your payment is in. Orders are packed on business days and usually arrive within one to five business days after dispatch.',
    tone: '#3F6B4E',
  },
  failed: {
    label: 'Payment did not go through',
    body: 'The payment was declined, so nothing has been charged and the order has not been packed. Place it again, or write to us and we will help.',
    tone: '#A4352C',
  },
  cancelled: {
    label: 'Cancelled',
    body: 'This order was cancelled and nothing has been charged.',
    tone: '#8A8078',
  },
  abandoned: {
    label: 'Not completed',
    body:
      'This order was started but the payment was never completed, so nothing has been charged. ' +
      'Your bag is still waiting if you would like to try again.',
    tone: '#8A8078',
  },
}

function OrderCard({
  order, onReset, onRecheck,
}: {
  order: TrackedOrder
  onReset: () => void
  /** Ask the server again, for an order that has not settled yet. */
  onRecheck: () => void
}) {
  const status = STATUS[order.status]
  const placed = useMemo(
    () => new Date(order.placedAt).toLocaleDateString('en-MY', {
      day: 'numeric', month: 'long', year: 'numeric',
    }),
    [order.placedAt],
  )

  /*
   * A payment that is still settling resolves within a few seconds, so the page
   * checks back rather than leaving the customer to refresh.
   *
   * Stripe returns the customer here the moment the card is accepted, which is
   * usually before its webhook has reached us, so the first read of a brand new
   * order is very often "awaiting payment". Without this the page would sit on
   * that wording indefinitely and a customer who had genuinely paid would think
   * they had not.
   */
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (order.status !== 'pending' || tick >= 6) return
    const t = setTimeout(() => {
      onRecheck()
      setTick((n) => n + 1)
    }, tick === 0 ? 2500 : 5000)
    return () => clearTimeout(t)
  }, [order.status, tick, onRecheck])

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <p className="eyebrow eyebrow-gold">Order</p>
          <p className="mt-1 select-all font-display text-3xl tracking-[0.06em]">{order.reference}</p>
          <p className="mt-1 text-sm text-smoke">Placed {placed}</p>
        </div>
        <span
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs uppercase tracking-[0.12em] text-ivory"
          style={{ background: status.tone }}
        >
          {order.status === 'paid' ? <Truck width={14} /> : null}
          {status.label}
        </span>
      </div>

      <p className="mt-5 max-w-xl text-ink-soft">{status.body}</p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <h2 className="font-display text-xl">What you ordered</h2>
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {order.lines.map((l) => (
              <li key={l.id} className="flex items-baseline justify-between gap-4 py-4">
                <span>
                  <span className="block font-display text-lg leading-tight">{l.name}</span>
                  <span className="block text-xs text-smoke">{l.size} &middot; {l.qty} &times; {formatRM(l.unitPrice)}</span>
                </span>
                <span className="whitespace-nowrap text-sm">{formatRM(l.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-ink-soft"><dt>Subtotal</dt><dd>{formatRM(order.subtotal)}</dd></div>
            <div className="flex justify-between text-ink-soft"><dt>Delivery</dt><dd>{order.shippingCost === 0 ? 'Free' : formatRM(order.shippingCost)}</dd></div>
            <div className="flex justify-between border-t border-line pt-3 font-display text-xl text-ink"><dt>Total</dt><dd>{formatRM(order.total)}</dd></div>
          </dl>
          <p className="mt-5 flex items-center gap-2 text-xs text-ink-soft">
            <Sparkle width={14} className="text-gold" /> Complimentary samples are packed with every order.
          </p>
        </div>

        <aside className="rounded-sm border border-line bg-porcelain p-6">
          <p className="eyebrow eyebrow-gold">Delivering to</p>
          <address className="mt-3 not-italic text-sm leading-relaxed text-ink-soft">
            {order.customer.name}<br />
            {order.shipping.line1}<br />
            {order.shipping.line2 && <>{order.shipping.line2}<br /></>}
            {order.shipping.postcode} {order.shipping.city}<br />
            {order.shipping.state}<br />
            {order.shipping.country}
          </address>
          <p className="mt-4 border-t border-line pt-4 text-xs text-smoke">{order.customer.email}</p>
          <div className="mt-6 flex flex-col gap-3">
            <Link to="/shop" className="btn-solid justify-center">Continue shopping</Link>
            <button onClick={onReset} className="btn-ghost justify-center">Look up another order</button>
          </div>
        </aside>
      </div>
    </motion.div>
  )
}
