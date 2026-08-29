import Stripe from 'stripe'
import { env } from './http.js'

let client: Stripe | undefined

/**
 * The Stripe client, built once per warm function instance.
 *
 * Constructed lazily rather than at module load so that importing this file in
 * an environment without keys, a type check or the catalogue build among them,
 * does not throw.
 */
export function stripe(): Stripe {
  if (!client) {
    client = new Stripe(env('STRIPE_SECRET_KEY'), {
      // Pinned to the version this SDK was generated against, so an account
      // default that moves under us cannot change response shapes without a
      // deploy. Bump it alongside the stripe package, never on its own.
      apiVersion: '2026-08-26.dahlia',
      appInfo: { name: 'Legendary Perfume', url: 'https://legendaryperfume.com' },
      maxNetworkRetries: 2,
    })
  }
  return client
}

/** True while the shop is wired to Stripe's test mode. */
export function isTestMode(): boolean {
  return (process.env.STRIPE_SECRET_KEY ?? '').startsWith('sk_test_')
}
