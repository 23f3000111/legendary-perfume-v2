import { asset } from '../lib/asset'
import { RevealGroup, RevealItem } from '../components/ui/Reveal'

/**
 * "Partnered With" — sits directly above the customer reviews.
 *
 * Client amendment: the heading was "As Featured In" set as house-type
 * wordmarks. It now reads "Partnered With" and carries the fourteen partner
 * logos supplied in the delivery, knocked out onto transparency at build time
 * so they sit on the porcelain band without white plates behind them.
 */
const partners: { name: string; file: string }[] = [
  { name: 'AirAsia', file: 'partner-airasia.png' },
  { name: 'Bangunan Sultan Abdul Samad', file: 'partner-bsas.png' },
  { name: 'Ctrip', file: 'partner-ctrip.png' },
  { name: 'Eraman', file: 'partner-eraman.png' },
  { name: 'Honor', file: 'partner-honor.png' },
  { name: 'Isetan', file: 'partner-isetan.png' },
  { name: 'Parkson Pavilion', file: 'partner-parkson-elite.png' },
  { name: 'SaSa', file: 'partner-sasa.png' },
  { name: 'SEGi', file: 'partner-segi.png' },
  { name: 'Seibu', file: 'partner-seibu.png' },
  { name: 'SOGO', file: 'partner-sogo.png' },
  { name: 'Tourism Malaysia', file: 'partner-tourism-malaysia.png' },
  { name: 'Valiram', file: 'partner-valiram.png' },
  { name: 'Watsons', file: 'partner-watsons.png' },
]

export default function PartneredWith() {
  return (
    <section className="border-t border-line bg-porcelain py-16 md:py-20">
      <div className="u-container">
        <h2 className="text-center font-display text-[clamp(1.7rem,3vw,2.4rem)]">Partnered With</h2>

        <RevealGroup className="mx-auto mt-11 grid max-w-5xl grid-cols-2 items-center gap-x-10 gap-y-9 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {partners.map((p) => (
            <RevealItem key={p.file} className="flex items-center justify-center">
              <img
                src={asset(`/assets/client/${p.file}`)}
                alt={p.name}
                loading="lazy"
                className="h-11 w-auto max-w-[9.5rem] object-contain opacity-70 grayscale transition duration-500 hover:opacity-100 hover:grayscale-0 md:h-12"
              />
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}
