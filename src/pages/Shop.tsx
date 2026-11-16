import { pages } from '../data/pages'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { products, type Product } from '../data/products'
import { collections } from '../data/collections'
import ProductCard from '../components/ProductCard'
import { isBestseller, isListed, useStock } from '../store/stock'
import PageHeader from '../components/ui/PageHeader'
import Seo from '../components/Seo'
import { absolute } from '../lib/seo'

type Sort = 'featured' | 'price-asc' | 'price-desc' | 'az'

const audiences = ['All', 'For Her', 'For Him', 'Unisex'] as const

/**
 * Standfirsts for the title bar, from the client's "Fragrance Page Headline"
 * and "All Fragrance Page" sheets.
 *
 * Every view used to share one line about olfactory postcards, whichever chip
 * or collection you had pressed. The client wrote a paragraph for each, so the
 * bar now introduces the edit you are actually looking at. Keys are the view
 * the header resolves to; `all` is the fallback. The words are the Shop
 * page's (src/content/pages.json), and each collection's own paragraph lives
 * with the collection, in src/content/collections.json.
 */

function isGift(p: Product) {
  return p.gift === true
}

export default function Shop() {
  const [params, setParams] = useSearchParams()
  const collectionParam = params.get('collection') ?? 'all'
  const filterParam = params.get('filter') // bestsellers | her | him | gifts
  const [sort, setSort] = useState<Sort>('featured')

  /* Client amendment: "For Her" and "For Him" in the footer and mega-menu did
     nothing once you were already on the shop, because the audience was read
     from the URL only on first mount. The audience is now derived from the
     URL on every render, so those links always land on the right filter. */
  const audienceParam = params.get('for')
  const audience: string =
    filterParam === 'her' || audienceParam === 'her' ? 'For Her'
    : filterParam === 'him' || audienceParam === 'him' ? 'For Him'
    : audienceParam === 'unisex' ? 'Unisex'
    : 'All'

  // These are in-page controls, so they replace rather than push. Layout's
  // ScrollToTop only jumps on a pushed navigation, which keeps you beside the
  // grid you are filtering instead of throwing you back up to the banner.
  const setCollection = (id: string) => {
    const next = new URLSearchParams(params)
    if (id === 'all') next.delete('collection')
    else next.set('collection', id)
    next.delete('filter')
    next.delete('for')
    setParams(next, { replace: true })
  }

  const setAudience = (value: string) => {
    const next = new URLSearchParams(params)
    const slug = value === 'For Her' ? 'her' : value === 'For Him' ? 'him' : value === 'Unisex' ? 'unisex' : null
    if (slug) next.set('for', slug)
    else next.delete('for')
    // The footer arrives with ?filter=her; keep one source of truth.
    if (filterParam === 'her' || filterParam === 'him') next.delete('filter')
    setParams(next, { replace: true })
  }

  // Anything the dashboard has hidden is gone from the shop entirely. Out of
  // stock is different: those still list, marked sold out.
  const hidden = useStock((s) => s.hidden)
  const changes = useStock((s) => s.changes)

  const list = useMemo(() => {
    let out = products.filter((p) => isListed(p, hidden))
    if (collectionParam !== 'all') out = out.filter((p) => p.collectionId === collectionParam)
    if (audience !== 'All') out = out.filter((p) => p.audience === audience)
    if (filterParam === 'bestsellers') out = out.filter((p) => isBestseller(p, changes))
    if (filterParam === 'gifts') out = out.filter(isGift)

    switch (sort) {
      case 'price-asc': out.sort((a, b) => a.price - b.price); break
      case 'price-desc': out.sort((a, b) => b.price - a.price); break
      case 'az': out.sort((a, b) => a.name.localeCompare(b.name)); break
      // "Featured" keeps the merchandising sequence the client specified:
      // Orchid · Violet · Mahsuri · Man · Nyonya · 3 Wishes · Spirit
      default: break
    }
    return out
  }, [collectionParam, audience, filterParam, sort, hidden, changes])

  const activeCollection = collections.find((c) => c.id === collectionParam)

  /* Revision 4: For Her and For Him had no banner of their own in the original
     delivery and fell back to All Fragrances. The client has now supplied both.
     Reading them off the audience rather than the footer's ?filter= means the
     title bar and the chip you pressed always agree. */
  const forHer = audience === 'For Her'
  const forHim = audience === 'For Him'

  const activeTitle =
    filterParam === 'bestsellers' ? 'Bestsellers'
    : filterParam === 'gifts' ? 'Gifts & Sets'
    : forHer ? 'For Her'
    : forHim ? 'For Him'
    : collectionParam !== 'all' ? activeCollection?.name ?? 'Fragrances'
    : 'All Fragrances'

  const INTROS = pages.shop.intros
  const intro =
    filterParam === 'bestsellers' ? INTROS.bestsellers
    : filterParam === 'gifts' ? INTROS.gifts
    : forHer ? INTROS.her
    : forHim ? INTROS.him
    : (collectionParam !== 'all' ? activeCollection?.intro : undefined) ?? INTROS.all

  const banners = pages.shop.banners
  const banner =
    filterParam === 'bestsellers' ? banners.bestsellers
    : filterParam === 'gifts' ? banners.gifts
    : forHer ? banners.her
    : forHim ? banners.him
    : activeCollection?.banner ?? banners.all

  /* Every filter combination is a distinct URL, and most of them list the same
     fragrances in a different order. Canonicalising each view onto its own
     clean path keeps the shop out of duplicate content territory while still
     letting the four the client merchandises be indexed in their own right. */
  const canonicalPath =
    filterParam === 'bestsellers' ? '/shop?filter=bestsellers'
    : filterParam === 'gifts' ? '/shop?filter=gifts'
    : forHer ? '/shop?for=her'
    : forHim ? '/shop?for=him'
    : collectionParam !== 'all' ? `/shop?collection=${collectionParam}`
    : '/shop'

  return (
    <>
      <Seo
        title={activeTitle}
        description={intro}
        image={banner.image}
        canonicalPath={canonicalPath}
        crumbs={[
          { name: 'Home', path: '/' },
          { name: 'Fragrances', path: '/shop' },
          ...(canonicalPath === '/shop' ? [] : [{ name: activeTitle, path: canonicalPath }]),
        ]}
        jsonLd={[
          {
            '@type': 'ItemList',
            name: activeTitle,
            numberOfItems: list.length,
            itemListElement: list.map((p, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: p.name,
              url: absolute(`/product/${p.id}`),
            })),
          },
        ]}
      />
      <PageHeader
        eyebrow={pages.shop.eyebrow}
        title={activeTitle}
        intro={intro}
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Fragrances' }]}
        banner={banner}
      />

      <section className="bg-ivory py-12 md:py-16">
        <div className="u-container">
          {/* Collection tabs */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-line pb-6">
            {[{ id: 'all', name: 'All' }, ...collections].map((c) => (
              <button
                key={c.id}
                onClick={() => setCollection(c.id)}
                className={`link-gold pb-1 font-display text-lg transition ${
                  collectionParam === c.id && !filterParam ? 'text-ink [background-size:100%_1px]' : 'text-smoke'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Filters row */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {audiences.map((a) => (
                <button
                  key={a}
                  onClick={() => setAudience(a)}
                  className={`rounded-full border px-4 py-1.5 text-xs uppercase tracking-[0.12em] transition ${
                    audience === a ? 'border-ink bg-ink text-ivory' : 'border-line text-ink-soft hover:border-gold/60'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-smoke">{list.length} scents</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="border border-line bg-porcelain px-3 py-2 text-xs uppercase tracking-[0.1em] text-ink-soft outline-none focus:border-gold"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price · Low to High</option>
                <option value="price-desc">Price · High to Low</option>
                <option value="az">Alphabetical</option>
              </select>
            </div>
          </div>

          {/* Grid */}
          {list.length === 0 ? (
            <p className="py-24 text-center text-smoke">No fragrances match these filters yet.</p>
          ) : (
            <div className="mt-10 grid grid-cols-2 gap-5 sm:gap-7 lg:grid-cols-4">
              {list.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
