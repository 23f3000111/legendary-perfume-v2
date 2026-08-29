import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAdmin } from '../_lib/auth.js'
import { handler, HttpError, json } from '../_lib/http.js'
import { catalogueList } from '../_lib/catalogue.js'
import { isBuyable, overrideStore, type ProductOverride } from '../_lib/overrides.js'

/**
 * The product list the dashboard edits.
 *
 *   GET   every product, with its override applied and its raw values beside it
 *   PATCH { id, ...fields } change one product
 *
 * Only the fields in ProductOverride can be touched. Copy, photography and
 * compositions stay in git, where they are reviewed.
 */
function parsePatch(body: Record<string, unknown>): ProductOverride {
  const patch: ProductOverride = {}

  if ('inStock' in body) {
    if (typeof body.inStock !== 'boolean') throw new HttpError(400, 'inStock must be true or false.')
    patch.inStock = body.inStock
  }
  if ('bestseller' in body) {
    if (typeof body.bestseller !== 'boolean') throw new HttpError(400, 'bestseller must be true or false.')
    patch.bestseller = body.bestseller
  }
  if ('hidden' in body) {
    if (typeof body.hidden !== 'boolean') throw new HttpError(400, 'hidden must be true or false.')
    patch.hidden = body.hidden
  }
  if ('price' in body && body.price !== null && body.price !== '') {
    const price = Number(body.price)
    if (!Number.isInteger(price) || price < 1 || price > 100000) {
      throw new HttpError(400, 'Price must be a whole number of ringgit between 1 and 100000.')
    }
    patch.price = price
  }
  if ('compareAt' in body) {
    if (body.compareAt === null || body.compareAt === '' || Number(body.compareAt) === 0) {
      patch.compareAt = null
    } else {
      const was = Number(body.compareAt)
      if (!Number.isInteger(was) || was < 1 || was > 100000) {
        throw new HttpError(400, 'The was price must be a whole number of ringgit.')
      }
      patch.compareAt = was
    }
  }

  if (Object.keys(patch).length === 0) throw new HttpError(400, 'Nothing to change.')
  return patch
}

export default handler(async (req: VercelRequest, res: VercelResponse) => {
  requireAdmin(req)
  const store = overrideStore()

  if (req.method === 'PATCH') {
    const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) ?? {}
    const id = typeof body.id === 'string' ? body.id : ''
    if (!catalogueList().some((p) => p.id === id)) throw new HttpError(404, 'No such product.')
    if (body.reset === true) {
      await store.clear(id)
    } else {
      await store.set(id, parsePatch(body))
    }
  } else if (req.method !== 'GET') {
    throw new HttpError(405, 'Use GET or PATCH for this endpoint.')
  }

  const overrides = await store.all()
  const products = catalogueList().map((p) => {
    const o = overrides[p.id]
    return {
      id: p.id,
      name: p.name,
      size: p.size,
      collection: p.collection,
      catalogue: { price: p.price },
      price: o?.price ?? p.price,
      compareAt: o?.compareAt ?? null,
      inStock: o?.inStock !== false,
      bestseller: o?.bestseller ?? false,
      hidden: o?.hidden ?? false,
      buyable: isBuyable(o),
      overridden: Boolean(o && Object.keys(o).some((k) => k !== 'updatedAt')),
      updatedAt: o?.updatedAt ?? null,
    }
  })

  json(res, 200, { products, storage: store.kind, durable: store.durable })
})
