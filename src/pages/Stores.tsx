import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { asset } from '../lib/asset'
import { stores, regions, mapEmbedUrl, directionsUrl } from '../data/stores'
import PageHeader from '../components/ui/PageHeader'
import { Pin, Phone, Clock, ArrowUpRight, WhatsApp } from '../components/ui/icons'
import { waLink } from '../lib/concierge'

/** Authorised stockists, from the client's Trusted Sellers artwork. */
const sellers: { name: string; file: string }[] = [
  { name: 'AirAsia', file: 'seller-airasia.png' },
  { name: 'Beauty Scent', file: 'seller-beauty-scent.png' },
  { name: 'Colours & Fragrances', file: 'seller-colours-fragrances.png' },
  { name: 'Discover Malaysia', file: 'seller-discover-malaysia.png' },
  { name: 'Eraman', file: 'seller-eraman.png' },
  { name: 'Parkson', file: 'seller-parkson.png' },
  { name: 'SaSa', file: 'seller-sasa.png' },
  { name: 'Seibu', file: 'seller-seibu.png' },
  { name: 'SOGO', file: 'seller-sogo.png' },
  { name: 'Star Glory', file: 'seller-star-glory.png' },
  { name: 'Watsons', file: 'seller-watsons.png' },
  { name: 'Zapin', file: 'seller-zapin.png' },
]

export default function Stores() {
  const [region, setRegion] = useState('All')
  const list = useMemo(
    () => (region === 'All' ? stores : stores.filter((s) => s.region === region)),
    [region],
  )
  const [selectedId, setSelectedId] = useState(stores[0].id)
  const selected = stores.find((s) => s.id === selectedId) ?? list[0]

  return (
    <>
      <PageHeader
        eyebrow="Find Us"
        title="Boutiques across Malaysia"
        intro="From Pavilion KL to the shores of Langkawi, visit a Legendary perfume counter to discover your scent in person. Live maps and directions below."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Stores' }]}
        image={asset('/assets/client/banner-stores.webp')}
      />

      <section className="bg-ivory py-12 md:py-16">
        <div className="u-container">
          {/* Region filter */}
          <div className="flex flex-wrap gap-2 border-b border-line pb-6">
            {regions.map((r) => (
              <button
                key={r}
                onClick={() => setRegion(r)}
                className={`rounded-full border px-4 py-1.5 text-xs uppercase tracking-[0.12em] transition ${
                  region === r ? 'border-ink bg-ink text-ivory' : 'border-line text-ink-soft hover:border-gold/60'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
            {/* Store list */}
            <div className="order-2 max-h-none space-y-3 lg:order-1 lg:max-h-[76vh] lg:overflow-y-auto lg:pr-2">
              {list.map((s) => {
                const isSel = s.id === selected?.id
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedId(s.id)}
                    className={`block w-full overflow-hidden rounded-sm border text-left transition ${
                      isSel ? 'border-gold bg-porcelain shadow-lg' : 'border-line bg-porcelain/50 hover:border-gold/50'
                    }`}
                  >
                    <div className="flex gap-4 p-4">
                      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-sm bg-sand">
                        {s.image ? (
                          <img src={s.image} alt={s.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center bg-ink/90 px-1 text-center text-ivory">
                            <span className="font-display text-[0.62rem] leading-tight tracking-[0.1em]">NOW<br />OPEN</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="eyebrow eyebrow-gold">{s.region}</p>
                        <h3 className="mt-1 font-display text-xl leading-tight">{s.name}</h3>
                        <p className="mt-1 line-clamp-2 text-xs text-smoke">{s.address}</p>
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-soft"><Clock width={13} className="text-gold" /> {s.hours[0]}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Map panel */}
            <div className="order-1 lg:order-2 lg:sticky lg:top-[150px] lg:self-start">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selected?.id}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="overflow-hidden rounded-sm border border-line bg-porcelain"
                >
                  {/* Shorter frame so the map plus its details fit one screen */}
                  <div className="aspect-[16/9] max-h-[38vh] w-full bg-sand">
                    {selected && (
                      <iframe
                        key={selected.id}
                        title={`Map of ${selected.name}`}
                        src={mapEmbedUrl(selected.mapQuery)}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        className="h-full w-full border-0"
                      />
                    )}
                  </div>
                  {selected && (
                    <div className="p-6">
                      <p className="eyebrow eyebrow-gold">{selected.region}</p>
                      <h3 className="mt-1 font-display text-2xl">{selected.name}</h3>
                      <div className="mt-4 space-y-2.5 text-sm text-ink-soft">
                        <p className="flex items-start gap-2.5"><Pin width={17} className="mt-0.5 shrink-0 text-gold" /> {selected.address}</p>
                        <p className="flex items-center gap-2.5"><Phone width={16} className="shrink-0 text-gold" /> <a href={`tel:${selected.phone.replace(/\s/g, '')}`} className="link-gold">{selected.phone}</a></p>
                        {selected.hours.map((h) => (
                          <p key={h} className="flex items-center gap-2.5"><Clock width={16} className="shrink-0 text-gold" /> {h}</p>
                        ))}
                      </div>
                      <div className="mt-6 flex flex-wrap gap-3">
                        <a href={directionsUrl(selected.mapQuery)} target="_blank" rel="noreferrer" className="btn-solid gap-2">
                          Get Directions <ArrowUpRight width={16} />
                        </a>
                        <a href={waLink(`Hi Legendary! I’d like to visit your ${selected.name} boutique.`)} target="_blank" rel="noreferrer" className="btn-ghost gap-2">
                          <WhatsApp width={16} /> Ask us
                        </a>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Trusted sellers — client change from "Also available at" */}
          <div className="mt-14 border-t border-line pt-14">
            <h2 className="text-center font-display text-[clamp(1.7rem,3vw,2.4rem)]">Trusted Sellers</h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-sm text-smoke">
              Beyond our own boutiques, Legendary is stocked by these authorised partners.
            </p>
            {/* Logos come from the client's Trusted Sellers folder, knocked
                out onto transparency in scripts/prepare-assets.py. Revision 4:
                each one comes up in its own colour when its cell is hovered,
                and shows coloured outright where there is no hover to give. */}
            <div className="mx-auto mt-9 grid max-w-4xl grid-cols-2 items-center gap-x-10 gap-y-8 sm:grid-cols-3 md:grid-cols-4">
              {sellers.map((s) => (
                <div key={s.file} className="brand-cell">
                  <img
                    src={asset(`/assets/client/${s.file}`)}
                    alt={s.name}
                    loading="lazy"
                    className="brand-logo h-10 max-w-[9rem] md:h-11"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
