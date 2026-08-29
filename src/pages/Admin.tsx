import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ApiError, adminOrders, adminPatchProduct, adminProducts, adminSession, adminSignIn, adminSignOut,
  type AdminOrder, type AdminProduct, type AdminSession, type AdminSummary,
} from '../lib/api'
import { formatRM } from '../lib/format'
import Seo from '../components/Seo'
import { Check, ArrowRight, ShieldCheck, Truck, Bag, Sparkle } from '../components/ui/icons'

/**
 * The house dashboard.
 *
 * Deliberately not styled like the storefront. This is a tool, used daily by
 * someone who needs to see the state of the shop at a glance, so it is dense,
 * quiet and fast rather than cinematic. It keeps the house's typography and
 * palette so it still feels like the same company, and drops the ceremony.
 *
 * What it can change is a small, safe set: stock, price, the was price, whether
 * something is in the Bestsellers edit, and whether it appears at all. Copy,
 * photography and compositions stay in git where they are reviewed. See
 * api/_lib/overrides.ts for why the line is drawn there.
 */
export default function Admin() {
  const [session, setSession] = useState<AdminSession | null>(null)
  // A failed session request is not the same as one still in flight. Without
  // this the page sat on "Loading the dashboard" for ever whenever the API was
  // unreachable, which is exactly when someone needs to be told why.
  const [unreachable, setUnreachable] = useState(false)
  const [tab, setTab] = useState<'overview' | 'products' | 'orders'>('overview')

  useEffect(() => {
    adminSession()
      .then(setSession)
      .catch(() => setUnreachable(true))
  }, [])

  return (
    <div className="min-h-screen bg-porcelain">
      <Seo title="Dashboard" description="Legendary shop administration." noindex />
      {unreachable ? (
        <Centred>
          <div className="max-w-sm px-6 text-center">
            <p className="font-display text-xl text-ink">The dashboard is not available here</p>
            <p className="mt-3 leading-relaxed">
              This build has no API behind it, so there is nothing to sign in to. The dashboard
              lives on the deployed shop.
            </p>
            <Link to="/" className="btn-ghost mt-6">Back to the shop</Link>
          </div>
        </Centred>
      ) : !session ? (
        <Centred>Loading the dashboard…</Centred>
      ) : !session.signedIn ? (
        <SignIn session={session} onSignedIn={setSession} />
      ) : (
        <>
          <Chrome
            session={session}
            tab={tab}
            onTab={setTab}
            onSignOut={async () => setSession(await adminSignOut())}
          />
          <main className="u-container py-8">
            {tab === 'overview' && <Overview />}
            {tab === 'products' && <Products />}
            {tab === 'orders' && <Orders />}
          </main>
        </>
      )}
    </div>
  )
}

function Centred({ children }: { children: React.ReactNode }) {
  return <div className="grid min-h-screen place-items-center text-sm text-smoke">{children}</div>
}

// ------------------------------------------------------------------ sign in

function SignIn({
  session,
  onSignedIn,
}: {
  session: AdminSession
  onSignedIn: (s: AdminSession) => void
}) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      onSignedIn(await adminSignIn(password))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'We could not sign you in.')
      setPassword('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-5">
      <motion.div
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <Link to="/" className="block text-center font-display text-2xl tracking-[0.14em] text-ink">
          LEGENDARY
        </Link>
        <p className="mt-2 text-center text-[0.7rem] uppercase tracking-[0.22em] text-gold-deep">
          Dashboard
        </p>

        <form onSubmit={submit} className="mt-8 rounded-sm border border-line bg-ivory p-7">
          <label className="block">
            <span className="eyebrow text-smoke">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              autoComplete="current-password"
              className="mt-2 w-full border-b border-line bg-transparent py-2.5 outline-none transition focus:border-gold"
            />
          </label>
          {!session.passwordSet && (
            <p className="mt-4 border-l-2 border-gold bg-gold/5 py-3 pl-4 text-xs leading-relaxed text-ink-soft">
              No password is set yet. Add <code className="text-ink">ADMIN_PASSWORD</code> to the
              environment and restart to enable the dashboard.
            </p>
          )}
          {error && (
            <p role="alert" className="mt-4 text-sm text-[#A4352C]">{error}</p>
          )}
          <button
            type="submit"
            disabled={busy || !password}
            className="btn-solid mt-6 w-full justify-center gap-2 disabled:opacity-50"
          >
            {busy ? 'Checking' : 'Sign in'} <ArrowRight width={16} />
          </button>
        </form>
        <Link to="/" className="mt-6 block text-center text-xs text-smoke transition hover:text-ink">
          Back to the shop
        </Link>
      </motion.div>
    </div>
  )
}

// ------------------------------------------------------------------- chrome

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'products', label: 'Products' },
  { key: 'orders', label: 'Orders' },
] as const

function Chrome({
  session, tab, onTab, onSignOut,
}: {
  session: AdminSession
  tab: string
  onTab: (t: 'overview' | 'products' | 'orders') => void
  onSignOut: () => void
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-ivory/95 backdrop-blur">
      <div className="u-container flex flex-wrap items-center gap-x-8 gap-y-3 py-4">
        <Link to="/" className="font-display text-lg tracking-[0.14em] text-ink">LEGENDARY</Link>
        <span className="text-[0.65rem] uppercase tracking-[0.2em] text-gold-deep">Dashboard</span>
        <nav className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => onTab(t.key)}
              className={`px-3 py-1.5 text-xs uppercase tracking-[0.12em] transition ${
                tab === t.key ? 'bg-ink text-ivory' : 'text-ink-soft hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-4">
          {!session.durable && (
            <span
              title="Changes are written to a local file, which a serverless instance does not keep. Set DATABASE_URL for production."
              className="hidden rounded-full bg-[#A4352C]/10 px-3 py-1 text-[0.65rem] uppercase tracking-[0.1em] text-[#A4352C] sm:inline"
            >
              Not durable
            </span>
          )}
          <button onClick={onSignOut} className="text-xs text-smoke transition hover:text-ink">
            Sign out
          </button>
        </div>
      </div>
      {!session.durable && (
        <p className="border-t border-[#A4352C]/20 bg-[#A4352C]/5 px-5 py-2 text-center text-xs text-[#A4352C]">
          Storage is a local file, so changes will not survive a deploy. Set{' '}
          <code>DATABASE_URL</code> to make the dashboard durable.
        </p>
      )}
    </header>
  )
}

// ----------------------------------------------------------------- overview

function Overview() {
  const [data, setData] = useState<{ orders: AdminOrder[]; summary: AdminSummary } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    adminOrders(100)
      .then(setData)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Could not load the figures.'))
  }, [])

  if (error) return <Note>{error}</Note>
  if (!data) return <Note>Reading the till…</Note>

  const s = data.summary
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Revenue" value={formatRM(s.revenue)} hint={`${s.paid} paid orders`} I={Sparkle} />
        <Stat label="Average order" value={formatRM(s.averageOrder)} hint="Across paid orders" I={Bag} />
        <Stat label="Awaiting payment" value={String(s.pending)} hint="Opened, still settling" I={ShieldCheck} />
        <Stat
          label="Not completed"
          value={String(s.failed + s.abandoned)}
          hint={`${s.abandoned} abandoned, ${s.failed} declined`}
          I={Truck}
        />
      </div>

      <section className="rounded-sm border border-line bg-ivory p-6">
        <h2 className="font-display text-xl">What is selling</h2>
        <p className="mt-1 text-xs text-smoke">
          By units, across the last {s.window} orders. Paid orders only.
        </p>
        {s.top.length === 0 ? (
          <p className="mt-6 text-sm text-smoke">No paid orders yet.</p>
        ) : (
          <ul className="mt-5 space-y-3">
            {s.top.map((row) => {
              const width = Math.round((row.qty / s.top[0].qty) * 100)
              return (
                <li key={row.id}>
                  <div className="flex items-baseline justify-between gap-4 text-sm">
                    <span className="text-ink">{row.name}</span>
                    <span className="whitespace-nowrap text-smoke">
                      {row.qty} sold · {formatRM(row.revenue)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1 w-full bg-sand">
                    <div className="h-full bg-gold" style={{ width: `${width}%` }} />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

function Stat({
  label, value, hint, I,
}: {
  label: string
  value: string
  hint: string
  I: typeof Sparkle
}) {
  return (
    <div className="rounded-sm border border-line bg-ivory p-5">
      <div className="flex items-center justify-between">
        <span className="eyebrow text-smoke">{label}</span>
        <I width={16} className="text-gold" />
      </div>
      <p className="mt-3 font-display text-[1.9rem] leading-none text-ink">{value}</p>
      <p className="mt-2 text-xs text-smoke">{hint}</p>
    </div>
  )
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="py-16 text-center text-sm text-smoke">{children}</p>
}

// ----------------------------------------------------------------- products

function Products() {
  const [rows, setRows] = useState<AdminProduct[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(() => {
    adminProducts()
      .then((r) => setRows(r.products))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Could not load the products.'))
  }, [])

  useEffect(load, [load])

  const patch = async (id: string, change: Parameters<typeof adminPatchProduct>[1]) => {
    setBusy(id)
    setError(null)
    try {
      const { products } = await adminPatchProduct(id, change)
      setRows(products)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'That change did not save.')
    } finally {
      setBusy(null)
    }
  }

  const soldOut = useMemo(() => rows?.filter((r) => !r.inStock).length ?? 0, [rows])

  if (error && !rows) return <Note>{error}</Note>
  if (!rows) return <Note>Loading the shelf…</Note>

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="font-display text-xl">Products</h2>
          <p className="mt-1 text-xs text-smoke">
            {rows.length} fragrances · {soldOut} sold out. Changes are live on the shop within a
            minute.
          </p>
        </div>
        {error && <p className="text-sm text-[#A4352C]">{error}</p>}
      </div>

      <div className="overflow-x-auto rounded-sm border border-line bg-ivory">
        <table className="w-full min-w-[54rem] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[0.65rem] uppercase tracking-[0.14em] text-smoke">
              <th className="px-5 py-3 font-medium">Fragrance</th>
              <th className="px-3 py-3 font-medium">Price</th>
              <th className="px-3 py-3 font-medium">Was</th>
              <th className="px-3 py-3 text-center font-medium">In stock</th>
              <th className="px-3 py-3 text-center font-medium">Bestseller</th>
              <th className="px-3 py-3 text-center font-medium">On the shop</th>
              <th className="px-3 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={`border-b border-line/60 last:border-0 ${busy === row.id ? 'opacity-50' : ''}`}>
                <td className="px-5 py-3">
                  <span className="block text-ink">{row.name}</span>
                  <span className="block text-xs text-smoke">{row.collection} · {row.size}</span>
                </td>
                <td className="px-3 py-3">
                  {/* The selling price cannot be cleared, only changed, so the
                      null branch of Money never fires here. */}
                  <Money value={row.price} onSave={(v) => v !== null && patch(row.id, { price: v })} />
                  {row.price !== row.catalogue.price && (
                    <span className="mt-0.5 block text-[0.65rem] text-gold-deep">
                      was {formatRM(row.catalogue.price)} in the catalogue
                    </span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <Money value={row.compareAt} allowEmpty onSave={(v) => patch(row.id, { compareAt: v })} />
                </td>
                <td className="px-3 py-3 text-center">
                  <Toggle on={row.inStock} onChange={(v) => patch(row.id, { inStock: v })} />
                </td>
                <td className="px-3 py-3 text-center">
                  <Toggle on={row.bestseller} onChange={(v) => patch(row.id, { bestseller: v })} />
                </td>
                <td className="px-3 py-3 text-center">
                  <Toggle on={!row.hidden} onChange={(v) => patch(row.id, { hidden: !v })} />
                </td>
                <td className="px-3 py-3 text-right">
                  {row.overridden && (
                    <button
                      onClick={() => patch(row.id, { reset: true })}
                      className="text-xs text-smoke underline transition hover:text-ink"
                    >
                      Reset
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-smoke">
        Reset returns a fragrance to the price and state it was built with. Copy, photography and
        compositions are not edited here: they live with the code, so they are reviewed before they
        go live.
      </p>
    </div>
  )
}

/** A switch. Labelled by its row's column header, so it needs no text of its own. */
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
        on ? 'bg-jade' : 'bg-smoke/40'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-ivory shadow transition ${
          on ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

/**
 * An amount in whole ringgit, saved when it loses focus or on Enter.
 *
 * Saving on blur rather than on every keystroke: a price is not a search box,
 * and a request per digit would put nonsense prices on the shop in between.
 */
function Money({
  value, onSave, allowEmpty,
}: {
  value: number | null
  onSave: (v: number | null) => void
  allowEmpty?: boolean
}) {
  const [draft, setDraft] = useState(value === null ? '' : String(value))
  useEffect(() => setDraft(value === null ? '' : String(value)), [value])

  const commit = () => {
    const trimmed = draft.trim()
    if (trimmed === '') {
      if (allowEmpty && value !== null) onSave(null)
      else setDraft(value === null ? '' : String(value))
      return
    }
    const next = Number(trimmed)
    if (!Number.isInteger(next) || next < 1) {
      setDraft(value === null ? '' : String(value))
      return
    }
    if (next !== value) onSave(next)
  }

  return (
    <span className="inline-flex items-baseline gap-1">
      <span className="text-xs text-smoke">RM</span>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          if (e.key === 'Escape') setDraft(value === null ? '' : String(value))
        }}
        inputMode="numeric"
        placeholder={allowEmpty ? '—' : ''}
        className="w-16 border-b border-line bg-transparent py-1 text-ink outline-none transition focus:border-gold"
      />
    </span>
  )
}

// ------------------------------------------------------------------- orders

const STATUS_TONE: Record<AdminOrder['status'], string> = {
  paid: 'bg-jade/15 text-jade',
  pending: 'bg-gold/15 text-gold-deep',
  failed: 'bg-[#A4352C]/10 text-[#A4352C]',
  cancelled: 'bg-smoke/15 text-smoke',
  // A checkout nobody finished. Kept visible but quiet: it is not a sale, and
  // it is not a problem to chase either.
  abandoned: 'bg-smoke/10 text-smoke',
}

function Orders() {
  const [orders, setOrders] = useState<AdminOrder[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<string | null>(null)

  useEffect(() => {
    adminOrders(100)
      .then((r) => setOrders(r.orders))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Could not load the orders.'))
  }, [])

  const shown = useMemo(() => {
    if (!orders) return []
    const q = query.trim().toLowerCase()
    if (!q) return orders
    return orders.filter(
      (o) =>
        o.reference.toLowerCase().includes(q) ||
        o.customer.name.toLowerCase().includes(q) ||
        o.customer.email.toLowerCase().includes(q),
    )
  }, [orders, query])

  if (error) return <Note>{error}</Note>
  if (!orders) return <Note>Loading orders…</Note>

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl">Orders</h2>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Reference, name or email"
          className="w-64 border-b border-line bg-transparent py-2 text-sm outline-none transition focus:border-gold"
        />
      </div>

      {shown.length === 0 ? (
        <Note>{query ? 'Nothing matches that.' : 'No orders yet.'}</Note>
      ) : (
        <div className="overflow-hidden rounded-sm border border-line bg-ivory">
          {shown.map((o) => (
            <div key={o.reference} className="border-b border-line/60 last:border-0">
              <button
                onClick={() => setOpen(open === o.reference ? null : o.reference)}
                className="flex w-full flex-wrap items-center gap-x-5 gap-y-1 px-5 py-4 text-left transition hover:bg-porcelain"
              >
                <span className="w-36 shrink-0 tracking-[0.06em] text-ink">{o.reference}</span>
                <span className="w-52 shrink-0 truncate text-sm text-ink-soft">{o.customer.name}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[0.62rem] uppercase tracking-[0.1em] ${STATUS_TONE[o.status]}`}>
                  {o.status}
                </span>
                <span className="text-xs text-smoke">
                  {new Date(o.placedAt).toLocaleString('en-MY', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
                <span className="ml-auto text-ink">{formatRM(o.total)}</span>
              </button>

              {open === o.reference && (
                <div className="grid gap-6 border-t border-line/60 bg-porcelain px-5 py-5 sm:grid-cols-2">
                  <div>
                    <p className="eyebrow text-smoke">Items</p>
                    <ul className="mt-2 space-y-1 text-sm text-ink-soft">
                      {o.lines.map((l) => (
                        <li key={l.id} className="flex justify-between gap-4">
                          <span>{l.name} × {l.qty}</span>
                          <span className="whitespace-nowrap">{formatRM(l.lineTotal)}</span>
                        </li>
                      ))}
                    </ul>
                    {o.note && (
                      <>
                        <p className="eyebrow mt-4 text-smoke">Note</p>
                        <p className="mt-1 text-sm text-ink-soft">{o.note}</p>
                      </>
                    )}
                  </div>
                  <div>
                    <p className="eyebrow text-smoke">Deliver to</p>
                    <address className="mt-2 not-italic text-sm leading-relaxed text-ink-soft">
                      {o.customer.name}<br />
                      {o.shipping.line1}<br />
                      {o.shipping.line2 && <>{o.shipping.line2}<br /></>}
                      {o.shipping.postcode} {o.shipping.city}<br />
                      {o.shipping.state}, {o.shipping.country}
                    </address>
                    <p className="mt-3 text-sm text-ink-soft">
                      <a href={`mailto:${o.customer.email}`} className="link-gold">{o.customer.email}</a>
                      <br />
                      <a href={`tel:${o.customer.phone.replace(/\s/g, '')}`} className="link-gold">{o.customer.phone}</a>
                    </p>
                    {o.paidAt && (
                      <p className="mt-3 flex items-center gap-1.5 text-xs text-jade">
                        <Check width={13} /> Paid{' '}
                        {new Date(o.paidAt).toLocaleString('en-MY', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
