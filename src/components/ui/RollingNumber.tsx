import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'

/*
 * Client amendment (revision 4): "Add rolling number animation" against the
 * 30,000,000+ figure beside "Since 2015".
 *
 * Each digit is its own column of 0 to 9, repeated, that slides up to land on
 * its final value — an odometer rather than a figure that simply counts. The
 * columns nearest the units turn through the most revolutions and settle last,
 * which is what gives the roll its weight.
 *
 * Every cell, separators included, is the same fixed height, so the group sets
 * as one figure rather than a row of boxes that drift off each other's
 * baseline once the digit columns are clipped.
 */

/** Revolutions the leftmost digit turns before settling. Each digit to its
 *  right adds one more, so the units column turns the longest. */
const BASE_TURNS = 1

/** The line box every cell is clipped to, in ems of the type size. Kept close
 *  to the lining figures' own height: tall enough that nothing is shaved off
 *  the digit that has landed, tight enough that only a sliver of the one
 *  behind it shows while the column is still turning. Separators keep their
 *  overflow visible, so a comma's tail is never cut. */
const LINE = 1.05

export default function RollingNumber({
  value,
  suffix = '',
  className = '',
  duration = 2.1,
}: {
  /** The figure to land on. Rendered with thousands separators. */
  value: number
  /** Static text pinned after the figure, e.g. "+". */
  suffix?: string
  className?: string
  /** Seconds the slowest column takes to settle. */
  duration?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-12% 0px' })
  const reduced = useReducedMotion()
  const [rolling, setRolling] = useState(false)

  useEffect(() => {
    if (inView) setRolling(true)
  }, [inView])

  const figure = value.toLocaleString('en-US')
  const cells = (figure + suffix).split('')
  // Rank each digit among the digits alone, so the separators do not throw the
  // stagger out.
  let seen = 0
  const rank = cells.map((c) => (/\d/.test(c) ? seen++ : -1))
  const digitCount = Math.max(1, seen)

  const cellStyle = { height: `${LINE}em`, lineHeight: `${LINE}em` }

  return (
    <span ref={ref} className={`inline-flex items-start ${className}`}>
      <span className="sr-only">
        {figure}
        {suffix}
      </span>

      {cells.map((char, i) =>
        rank[i] === -1 ? (
          <span key={i} aria-hidden className="inline-block" style={cellStyle}>
            {char}
          </span>
        ) : (
          <RollColumn
            key={i}
            digit={Number(char)}
            // Left to right: the leftmost column turns fewest times, the units
            // column the most, so the figure settles the way a counter does.
            turns={BASE_TURNS + rank[i]}
            run={rolling}
            reduced={!!reduced}
            // The shorter columns finish first; every column shares the easing
            // so they decelerate together.
            duration={duration * (0.62 + (0.38 * (rank[i] + 1)) / digitCount)}
            style={cellStyle}
          />
        ),
      )}
    </span>
  )
}

function RollColumn({
  digit,
  turns,
  run,
  reduced,
  duration,
  style,
}: {
  digit: number
  turns: number
  run: boolean
  reduced: boolean
  duration: number
  style: React.CSSProperties
}) {
  const target = turns * 10 + digit

  return (
    <span aria-hidden className="relative inline-block overflow-hidden" style={style}>
      {/* Sets the column's width from the type itself rather than a guess. */}
      <span className="invisible">0</span>
      <motion.span
        className="absolute inset-x-0 top-0 flex flex-col items-center"
        initial={{ y: 0 }}
        animate={{ y: run || reduced ? `-${target * LINE}em` : 0 }}
        transition={reduced ? { duration: 0 } : { duration, ease: [0.16, 1, 0.3, 1] }}
      >
        {Array.from({ length: target + 1 }, (_, n) => (
          <span key={n} style={style}>
            {n % 10}
          </span>
        ))}
      </motion.span>
    </span>
  )
}
