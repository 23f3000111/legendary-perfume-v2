import type { Pool, PoolConfig } from 'pg'
import { optionalEnv } from './http.js'
import { SUPABASE_CA } from './supabase-ca.js'

/**
 * The one Postgres connection this shop makes.
 *
 * Orders and product overrides both live in the same database, so they share a
 * pool rather than opening one each: a serverless instance is small, and two
 * pools on one instance is two connections held for no reason.
 *
 * TLS is always verified. Which roots to verify against depends on the host:
 *
 *  - Supabase signs Postgres with its own private CA, so those roots are
 *    pinned. See supabase-ca.ts for why that is stricter than the public set
 *    rather than a workaround.
 *  - `DATABASE_CA_CERT` overrides everything, for a provider that publishes its
 *    own root. Paste the PEM in.
 *  - Anything else verifies against Node's public roots, which is right for
 *    Neon, Vercel Postgres and RDS.
 *  - A local socket, or a connection string that has explicitly turned TLS off,
 *    connects in plaintext.
 *
 * There is deliberately no way to switch verification off. The answer to a
 * certificate that will not verify is the right CA, not a disabled check.
 */

function sslFor(url: string): PoolConfig['ssl'] {
  if (/^postgres(ql)?:\/\/[^/]*localhost/i.test(url) || /sslmode=disable/i.test(url)) {
    return false
  }
  const custom = optionalEnv('DATABASE_CA_CERT')
  if (custom) return { ca: custom.replace(/\\n/g, '\n'), rejectUnauthorized: true }
  if (/supabase\.(com|co)/i.test(url)) return { ca: SUPABASE_CA, rejectUnauthorized: true }
  return { rejectUnauthorized: true }
}

let pool: Pool | undefined
let schema: Promise<void> | undefined

/** The pool, and the schema, created once per warm instance. */
export async function db(): Promise<Pool> {
  const url = optionalEnv('DATABASE_URL')
  if (!url) throw new Error('DATABASE_URL is not set')

  if (!pool) {
    const { Pool: PgPool } = await import('pg')
    pool = new PgPool({
      connectionString: url,
      ssl: sslFor(url),
      // One per warm instance. The pooler multiplexes on its side, so holding
      // more here only takes connections from other instances.
      max: 1,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 30_000,
    })
    // A pool that emits an unhandled 'error' takes the process with it, and an
    // idle connection dropped by the pooler is routine rather than fatal.
    pool.on('error', (err) => console.error('[db] idle client error:', err.message))
  }

  if (!schema) {
    schema = pool
      .query(
        `CREATE TABLE IF NOT EXISTS orders (
           reference         text PRIMARY KEY,
           status            text NOT NULL,
           currency          text NOT NULL,
           lines             jsonb NOT NULL,
           subtotal          integer NOT NULL,
           shipping_cost     integer NOT NULL,
           total             integer NOT NULL,
           customer          jsonb NOT NULL,
           shipping          jsonb NOT NULL,
           note              text,
           payment_intent_id text NOT NULL,
           created_at        timestamptz NOT NULL DEFAULT now(),
           paid_at           timestamptz
         );
         CREATE INDEX IF NOT EXISTS orders_email_idx ON orders ((customer ->> 'email'));
         CREATE INDEX IF NOT EXISTS orders_intent_idx ON orders (payment_intent_id);
         CREATE INDEX IF NOT EXISTS orders_created_idx ON orders (created_at DESC);

         CREATE TABLE IF NOT EXISTS product_overrides (
           product_id  text PRIMARY KEY,
           in_stock    boolean,
           price       integer,
           compare_at  integer,
           bestseller  boolean,
           hidden      boolean,
           updated_at  timestamptz NOT NULL DEFAULT now()
         );`,
      )
      .then(() => undefined)
      .catch((err) => {
        // Let the next call try again rather than caching the failure for the
        // life of the instance.
        schema = undefined
        throw err
      })
  }
  await schema
  return pool
}

/** The SSL choice, exposed so scripts outside the functions can match it. */
export { sslFor }
