import { motion } from 'framer-motion'
import BrandLogo from '../components/ui/BrandLogo'
import { partnersDoc } from '../data/logos'
import { pages } from '../data/pages'
import Heading from '../components/ui/Heading'

/**
 * "Partnered With" sits directly above the customer reviews.
 *
 * Client amendment: the heading was "As Featured In" set as house-type
 * wordmarks. It now reads "Partnered With" and carries the partner logos
 * supplied in the delivery, knocked out onto transparency so they sit on the
 * porcelain band without white plates behind them.
 *
 * Revision 4: the client drew the arrangement they wanted, six across, then
 * five, then three, and set the order of the logos within it. That replaces
 * the reverse pyramid of five, four, three and two this section opened with,
 * and is why src/content/partners.json keeps the logos row by row.
 *
 * Revision 5: the client circled Tourism Malaysia and asked for it bigger.
 * It is the one square mark in a wall of wide ones, so the shared height cap
 * leaves it reading much smaller than its neighbours. `tall` lifts those out
 * of the common height onto their own.
 */

export default function PartneredWith() {
  // Read at render, so a preview's drafts show.
  const rows = partnersDoc.rows
  return (
    <section className="border-t border-line bg-porcelain py-16 md:py-20">
      <div className="u-container">
        <h2 className="text-center font-display text-[clamp(1.7rem,3vw,2.4rem)]">
          <Heading text={pages.home.partners.heading} />
        </h2>

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
              {row.logos.map((p, j) => (
                <BrandLogo
                  key={`${j}-${p.logo}`}
                  logo={p.logo}
                  mono={p.mono}
                  name={p.name}
                  cellClassName={p.tall ? 'h-[4.5rem] w-[7.5rem] sm:h-20 sm:w-[8.5rem]' : 'h-11 w-[7.5rem] sm:h-12 sm:w-[8.5rem]'}
                  className={p.tall ? 'h-[4.5rem] sm:h-20' : 'h-11 md:h-12'}
                />
              ))}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
