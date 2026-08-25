import { motion } from 'framer-motion'
import { asset } from '../lib/asset'

/**
 * "Partnered With" — sits directly above the customer reviews.
 *
 * Client amendment: the heading was "As Featured In" set as house-type
 * wordmarks. It now reads "Partnered With" and carries the fourteen partner
 * logos supplied in the delivery, knocked out onto transparency at build time
 * so they sit on the porcelain band without white plates behind them.
 */
/**
 * Revision 4: the client drew the arrangement they wanted, six across, then
 * five, then three, and set the order of the logos within it. That replaces
 * the reverse pyramid of five, four, three and two this section opened with.
 */
const partners: { name: string; file: string }[] = [
  { name: 'AirAsia', file: 'partner-airasia.png' },
  { name: 'Watsons', file: 'partner-watsons.png' },
  { name: 'SaSa', file: 'partner-sasa.png' },
  { name: 'Isetan', file: 'partner-isetan.png' },
  { name: 'Seibu TRX', file: 'partner-seibu.png' },
  { name: 'Honor', file: 'partner-honor.png' },

  { name: 'Eraman', file: 'partner-eraman.png' },
  { name: 'Parkson Elite', file: 'partner-parkson-elite.png' },
  { name: 'SOGO', file: 'partner-sogo.png' },
  { name: 'Bangunan Sultan Abdul Samad', file: 'partner-bsas.png' },
  { name: 'Ctrip', file: 'partner-ctrip.png' },

  { name: 'Valiram', file: 'partner-valiram.png' },
  { name: 'SEGi', file: 'partner-segi.png' },
  { name: 'Tourism Malaysia', file: 'partner-tourism-malaysia.png' },
]

/** Six, five, three: the client's own layout for the fourteen. */
const PYRAMID = [6, 5, 3]

const rows = PYRAMID.reduce<(typeof partners)[]>((acc, count) => {
  const taken = acc.reduce((n, r) => n + r.length, 0)
  acc.push(partners.slice(taken, taken + count))
  return acc
}, [])

export default function PartneredWith() {
  return (
    <section className="border-t border-line bg-porcelain py-16 md:py-20">
      <div className="u-container">
        <h2 className="text-center font-display text-[clamp(1.7rem,3vw,2.4rem)]">Partnered With</h2>

        {/* Each row animates as a unit. Row wrappers sit between the group and
            the logos, and variant state only travels through motion elements,
            so staggering per logo from a parent group leaves them stuck
            hidden. A delay per row gives the same cascade far more simply.

            The rows only taper from sm up; below that they wrap, which keeps
            the narrow layout from reading as a ragged column. */}
        <div className="mx-auto mt-11 flex max-w-6xl flex-col items-center gap-y-9">
          {rows.map((row, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-8% 0px' }}
              transition={{ duration: 0.8, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap items-center justify-center gap-x-6 gap-y-9 sm:gap-x-10"
            >
              {row.map((p) => (
                <span key={p.file} className="brand-cell w-[7.5rem] sm:w-[8.5rem]">
                  <img
                    src={asset(`/assets/client/${p.file}`)}
                    alt={p.name}
                    loading="lazy"
                    className="brand-logo h-11 md:h-12"
                  />
                </span>
              ))}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
