import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { asset } from '../lib/asset'
import { products, type Product } from '../data/products'
import { collections } from '../data/collections'
import ProductCard from '../components/ProductCard'
import PageHeader from '../components/ui/PageHeader'

type Sort = 'featured' | 'price-asc' | 'price-desc' | 'az'

const audiences = ['All', 'For Her', 'For Him', 'Unisex'] as const

function isGift(p: Product) {
  return p.size.includes('×') || p.collectionId === 'three-wishes' || p.collectionId === 'spirit'
}

export default function Shop() {
  const [params, setParams] = useSearchParams()
  const collectionParam = params.get('collection') ?? 'all'
  const filterParam = params.get('filter') // bestsellers | her | him | gifts
  const [audience, setAudience] = useState<string>(
    filterParam === 'her' ? 'For Her' : filterParam === 'him' ? 'For Him' : 'All',
  )
  const [sort, setSort] = useState<Sort>('featured')

  const setCollection = (id: string) => {
    const next = new URLSearchParams(params)
    if (id === 'all') next.delete('collection')
    else next.set('collection', id)
    next.delete('filter')
    setParams(next)
  }

  const list = useMemo(() => {
    let out = [...products]
    if (collectionParam !== 'all') out = out.filter((p) => p.collectionId === collectionParam)
    if (audience !== 'All') out = out.filter((p) => p.audience === audience)
    if (filterParam === 'bestsellers') out = out.filter((p) => p.bestseller)
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
  }, [collectionParam, audience, filterParam, sort])

  const activeCollection = collections.find((c) => c.id === collectionParam)

  const activeTitle =
    filterParam === 'bestsellers' ? 'Bestsellers'
    : filterParam === 'gifts' ? 'Gifts & Sets'
    : collectionParam !== 'all' ? activeCollection?.name ?? 'Fragrances'
    : 'All Fragrances'

  const banner =
    filterParam === 'bestsellers' ? asset('/assets/client/banner-bestsellers.webp')
    : filterParam === 'gifts' ? asset('/assets/client/banner-gifts.webp')
    : activeCollection?.banner ?? asset('/assets/client/banner-fragrances.webp')

  return (
    <>
      <PageHeader
        eyebrow="The Collection"
        title={activeTitle}
        intro="Nine fragrances, each an olfactory postcard of Malaysia — crafted, Halal-certified, and made to be worn as a memory."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Fragrances' }]}
        image={banner}
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
