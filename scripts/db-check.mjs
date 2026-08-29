/**
 * Prove the database connection before trusting a deployment to it.
 *
 * Connects, creates the two tables if they are not there, writes a row, reads
 * it back and deletes it. That is the whole path the shop uses, so if this
 * passes there is nothing left to be surprised by at checkout.
 *
 * The common mistakes it names rather than leaving you to decode a driver
 * error: the direct Supabase connection instead of the pooler, and a password
 * with characters that needed URL encoding.
 *
 * Run: npm run db:check
 */
import { readFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { build } from 'esbuild'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// Same .env reader the dev API uses, so both see identical values.
if (existsSync(resolve(ROOT, '.env'))) {
  for (const line of readFileSync(resolve(ROOT, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/i)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
  }
}

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL is not set in .env')
  console.error('')
  console.error('Supabase: Project Settings -> Database -> Connection string ->')
  console.error('Transaction pooler (port 6543). See SETUP.md section 2.')
  process.exit(1)
}

// Warn before connecting, because the failure this causes is a timeout that
// looks like a network problem rather than a wrong choice of connection string.
if (/db\.[a-z0-9]+\.supabase\.co/.test(url)) {
  console.warn('! This looks like the DIRECT Supabase connection.')
  console.warn('  Serverless needs the transaction pooler: aws-0-REGION.pooler.supabase.com:6543')
  console.warn('  The direct connection runs out of connections, and on newer projects')
  console.warn('  it is IPv6 only. Carrying on so you can see whether it connects at all.')
  console.warn('')
}

// Use the functions' own TLS logic rather than a second copy of it, so a
// certificate that verifies here is one that verifies in production.
const { sslFor } = await (async () => {
  const out = await build({
    entryPoints: [resolve(ROOT, 'api/_lib/db.ts')],
    bundle: true, write: false, format: 'esm', platform: 'node', target: 'node18',
    external: ['pg'],
  })
  return import('data:text/javascript;base64,' + Buffer.from(out.outputFiles[0].text).toString('base64'))
})()

const pool = new pg.Pool({
  connectionString: url,
  ssl: sslFor(url),
  max: 1,
  connectionTimeoutMillis: 15000,
})

const step = (label) => process.stdout.write(`  ${label.padEnd(46, '.')} `)
const ok = (extra = '') => console.log(`ok${extra ? '  ' + extra : ''}`)

try {
  console.log('\nChecking the database\n')

  step('connecting')
  const { rows: [info] } = await pool.query(
    'SELECT current_database() AS db, version() AS version',
  )
  ok(info.db)

  step('server')
  ok(info.version.split(' ').slice(0, 2).join(' '))

  step('creating tables if absent')
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      reference text PRIMARY KEY, status text NOT NULL, currency text NOT NULL,
      lines jsonb NOT NULL, subtotal integer NOT NULL, shipping_cost integer NOT NULL,
      total integer NOT NULL, customer jsonb NOT NULL, shipping jsonb NOT NULL,
      note text, payment_intent_id text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(), paid_at timestamptz);
    CREATE INDEX IF NOT EXISTS orders_email_idx ON orders ((customer ->> 'email'));
    CREATE INDEX IF NOT EXISTS orders_intent_idx ON orders (payment_intent_id);
    CREATE TABLE IF NOT EXISTS product_overrides (
      product_id text PRIMARY KEY, in_stock boolean, price integer, compare_at integer,
      bestseller boolean, hidden boolean,
      updated_at timestamptz NOT NULL DEFAULT now());`)
  ok()

  const reference = `LG-TEST-${Date.now().toString(36).slice(-4).toUpperCase()}`
  step('writing a row')
  await pool.query(
    `INSERT INTO orders (reference, status, currency, lines, subtotal, shipping_cost,
                         total, customer, shipping, payment_intent_id)
     VALUES ($1,'pending','MYR','[]',0,0,0,'{}','{}','pi_dbcheck')`,
    [reference],
  )
  ok(reference)

  step('reading it back')
  const { rows } = await pool.query('SELECT status FROM orders WHERE reference = $1', [reference])
  if (rows[0]?.status !== 'pending') throw new Error('row did not read back')
  ok()

  step('deleting it')
  await pool.query('DELETE FROM orders WHERE reference = $1', [reference])
  ok()

  const { rows: [counts] } = await pool.query(
    `SELECT (SELECT count(*) FROM orders) AS orders,
            (SELECT count(*) FROM product_overrides) AS overrides`,
  )
  console.log(`\nReady. ${counts.orders} orders, ${counts.overrides} product overrides.\n`)
} catch (err) {
  console.log('FAILED\n')
  console.error(String(err.message ?? err))
  const hint =
    /ENOTFOUND|EAI_AGAIN/.test(String(err)) ? 'The host could not be resolved. Check the host name in DATABASE_URL.'
    : /ETIMEDOUT|timeout/i.test(String(err)) ? 'Timed out. This is usually the direct connection rather than the pooler, see SETUP.md section 2.'
    : /password|SASL|authentication/i.test(String(err)) ? 'Authentication failed. Check the password, and URL-encode any special characters in it (@ becomes %40).'
    : /self.signed|certificate/i.test(String(err)) ? 'TLS could not be verified. If this is a provider other than Supabase, put its root certificate in DATABASE_CA_CERT.'
    : null
  if (hint) console.error('\n' + hint)
  process.exitCode = 1
} finally {
  await pool.end()
}
