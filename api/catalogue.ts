import type { VercelRequest, VercelResponse } from '@vercel/node'
import { catalogueList } from './_lib/catalogue'
import { handler, json, requireMethod } from './_lib/http'
import { isBuyable, overrideStore } from './_lib/overrides'

/**
 * What the shop needs to know that the build could not.
 *
 * Stock and price are the two things the dashboard can change between deploys,
 * so the storefront asks for them at runtime rather than baking them into the
 * bundle. Everything else about a product, the copy and the photography, still
 * comes from the build.
 *
 * The response only carries products that actually differ from the catalogue,
 * so it is a few hundred bytes on a normal day and empty when nothing has been
 * touched. Cached briefly at the edge, and revalidated in the background, so
 * flipping a switch in the dashboard reaches customers within the minute
 * without every page view hitting a function.
 */
export default handler(async (req: VercelRequest, res: VercelResponse) => {
  requireMethod(req, 'GET')

  const overrides = await overrideStore().all()
  const changes: Record<
    string,
    { inStock: boolean; price?: number; compareAt?: number | null; bestseller?: boolean }
  > = {}
  // Out of stock and hidden are different things and the shop treats them
  // differently: one still appears, marked sold out, because a customer
  // looking for it should find it and see that it exists. The other is gone.
  const hidden: string[] = []

  for (const product of catalogueList()) {
    const o = overrides[product.id]
    if (!o) continue
    if (o.hidden) {
      hidden.push(product.id)
      continue
    }
    const inStock = isBuyable(o)
    const { price, compareAt, bestseller } = o
    if (inStock && price === undefined && compareAt === undefined && bestseller === undefined) continue
    changes[product.id] = {
      inStock,
      ...(price !== undefined ? { price } : {}),
      ...(compareAt !== undefined ? { compareAt } : {}),
      ...(bestseller !== undefined ? { bestseller } : {}),
    }
  }

  res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=60, stale-while-revalidate=300')
  json(res, 200, { products: changes, hidden })
})
