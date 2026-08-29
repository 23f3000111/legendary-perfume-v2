import { loadStripe, type Stripe } from '@stripe/stripe-js'

const KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined

let promise: Promise<Stripe | null> | undefined

/**
 * Stripe.js, fetched once and only when a checkout actually begins.
 *
 * Deliberately not called at module scope: Stripe's script would then load on
 * every page of the site, including the ones nobody is buying from, and it is
 * not a small one.
 */
export function getStripe(): Promise<Stripe | null> {
  if (!KEY) return Promise.resolve(null)
  if (!promise) promise = loadStripe(KEY)
  return promise
}

/** Whether the shop has been given a publishable key at all. */
export const stripeConfigured = Boolean(KEY)

/** True while the shop is pointed at Stripe's test mode. */
export const stripeTestMode = (KEY ?? '').startsWith('pk_test_')

/**
 * Elements is themed to the house rather than left on Stripe's default blue,
 * so the payment step does not read as a different site.
 */
export const stripeAppearance = {
  theme: 'flat' as const,
  variables: {
    colorPrimary: '#B08D3E',
    colorBackground: '#FBF8F2',
    colorText: '#1C1815',
    colorTextSecondary: '#5A524B',
    colorDanger: '#A4352C',
    fontFamily: 'Jost, system-ui, sans-serif',
    borderRadius: '2px',
    spacingUnit: '4px',
  },
  rules: {
    '.Input': {
      border: '1px solid #E6DFD2',
      boxShadow: 'none',
      padding: '11px 12px',
    },
    '.Input:focus': { border: '1px solid #B08D3E', boxShadow: 'none' },
    '.Label': {
      fontSize: '0.72rem',
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: '#8A8078',
    },
    '.Tab': { border: '1px solid #E6DFD2', boxShadow: 'none' },
    '.Tab--selected': { border: '1px solid #B08D3E', boxShadow: 'none' },
  },
}
