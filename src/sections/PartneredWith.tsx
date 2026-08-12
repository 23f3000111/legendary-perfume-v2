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
 * Order follows the numbering the client marked on the Partnered with folder,
 * and the fourteen fall into a reverse pyramid of five, four, three and two.
 */
const partners: { name: string; file: string }[] = [
  { name: 'AirAsia', file: 'partner-airasia.png' },                     // 1
  { name: 'Watsons', file: 'partner-watsons.png' },                     // 2
  { name: 'SaSa', file: 'partner-sasa.png' },                           // 3
  { name: 'Parkson Elite', file: 'partner-parkson-elite.png' },         // 4
  { name: 'Isetan', file: 'partner-isetan.png' },                       // 5
  { name: 'Honor', file: 'partner-honor.png' },                         // 6
  { name: 'SOGO', file: 'partner-sogo.png' },                           // 7
  { name: 'Seibu TRX', file: 'partner-seibu.png' },                     // 8
  { name: 'Eraman', file: 'partner-eraman.png' },                       // 9
  { name: 'SEGi', file: 'partner-segi.png' },                           // 10
  { name: 'Tourism Malaysia', file: 'partner-tourism-malaysia.png' },   // 11
  { name: 'Valiram', file: 'partner-valiram.png' },                     // 12
  { name: 'Bangunan Sultan Abdul Samad', file: 'partner-bsas.png' },    // 13
  { name: 'Ctrip', file: 'partner-ctrip.png' },                         // 14
]

/** Five, four, three, two: fourteen logos, tapering to a point. */
const PYRAMID = [5, 4, 3, 2]

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
        <div className="mx-auto mt-11 flex max-w-5xl flex-col items-center gap-y-9">
          {rows.map((row, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-8% 0px' }}
              transition={{ duration: 0.8, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap items-center justify-center gap-x-10 gap-y-9 sm:gap-x-14"
            >
              {row.map((p) => (
                <span key={p.file} className="flex w-[7.5rem] items-center justify-center sm:w-[9rem]">
                  <img
                    src={asset(`/assets/client/${p.file}`)}
                    alt={p.name}
                    loading="lazy"
                    className="h-11 w-auto max-w-full object-contain opacity-70 grayscale transition duration-500 hover:opacity-100 hover:grayscale-0 md:h-12"
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
