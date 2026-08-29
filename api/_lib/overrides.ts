import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { db } from './db.js'
import { optionalEnv } from './http.js'

/**
 * What the dashboard is allowed to change about a product.
 *
 * The catalogue itself stays in `src/data/products.ts` and in git: the copy,
 * the photography and the compositions are design work, versioned and reviewed
 * like the rest of the site. What a shopkeeper needs to change between deploys
 * is a much smaller set, and that is what lives here as an override layer on
 * top. Anything not overridden falls through to the catalogue.
 */
export interface ProductOverride {
  /** Out of stock hides the buy button and is refused at checkout. */
  inStock?: boolean
  /** Whole ringgit. Replaces the catalogue price everywhere, including checkout. */
  price?: number
  /** The struck through "was" price. Zero or null clears it. */
  compareAt?: number | null
  /** Whether it appears in the Bestsellers edit. */
  bestseller?: boolean
  /** Hidden products are gone from the shop and cannot be bought. */
  hidden?: boolean
  updatedAt?: string
}

export type Overrides = Record<string, ProductOverride>

export interface OverrideStore {
  readonly kind: 'postgres' | 'file'
  /** True when changes will outlive this function instance. */
  readonly durable: boolean
  all(): Promise<Overrides>
  set(id: string, patch: ProductOverride): Promise<void>
  clear(id: string): Promise<void>
}

// ------------------------------------------------------------------ postgres

function postgresStore(): OverrideStore {
  return {
    kind: 'postgres',
    durable: true,
    async all() {
            const { rows } = await (await db()).query('SELECT * FROM product_overrides')
      const out: Overrides = {}
      for (const r of rows) {
        out[r.product_id] = {
          inStock: r.in_stock ?? undefined,
          price: r.price ?? undefined,
          compareAt: r.compare_at ?? undefined,
          bestseller: r.bestseller ?? undefined,
          hidden: r.hidden ?? undefined,
          updatedAt: new Date(r.updated_at).toISOString(),
        }
      }
      return out
    },
    async set(id, patch) {
            // COALESCE on the excluded value, so a patch touching one field leaves
      // the others as they were rather than blanking them.
      await (await db()).query(
        `INSERT INTO product_overrides (product_id, in_stock, price, compare_at, bestseller, hidden, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6, now())
         ON CONFLICT (product_id) DO UPDATE SET
           in_stock   = COALESCE(EXCLUDED.in_stock,   product_overrides.in_stock),
           price      = COALESCE(EXCLUDED.price,      product_overrides.price),
           compare_at = COALESCE(EXCLUDED.compare_at, product_overrides.compare_at),
           bestseller = COALESCE(EXCLUDED.bestseller, product_overrides.bestseller),
           hidden     = COALESCE(EXCLUDED.hidden,     product_overrides.hidden),
           updated_at = now()`,
        [
          id,
          patch.inStock ?? null,
          patch.price ?? null,
          patch.compareAt === null ? 0 : patch.compareAt ?? null,
          patch.bestseller ?? null,
          patch.hidden ?? null,
        ],
      )
    },
    async clear(id) {
            await (await db()).query('DELETE FROM product_overrides WHERE product_id = $1', [id])
    },
  }
}

// ---------------------------------------------------------------------- file

/**
 * A JSON file beside the project, for local development only.
 *
 * A serverless instance has no durable disk, so this is deliberately reported
 * as `durable: false` and the dashboard says so plainly. Production sets
 * DATABASE_URL and gets the Postgres store instead.
 */
function fileStore(): OverrideStore {
  const path = resolve(process.cwd(), '.data/overrides.json')

  const read = (): Overrides => {
    try {
      return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {}
    } catch {
      return {}
    }
  }
  const write = (data: Overrides) => {
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, JSON.stringify(data, null, 2), 'utf8')
  }

  return {
    kind: 'file',
    durable: false,
    async all() {
      return read()
    },
    async set(id, patch) {
      const data = read()
      data[id] = { ...data[id], ...patch, updatedAt: new Date().toISOString() }
      write(data)
    },
    async clear(id) {
      const data = read()
      delete data[id]
      write(data)
    },
  }
}

let cached: OverrideStore | undefined

export function overrideStore(): OverrideStore {
  if (!cached) {
    const url = optionalEnv('DATABASE_URL')
    cached = url ? postgresStore() : fileStore()
  }
  return cached
}

/** Nothing is out of stock until someone says so, so absent means available. */
export function isBuyable(o: ProductOverride | undefined): boolean {
  if (!o) return true
  if (o.hidden) return false
  return o.inStock !== false
}
