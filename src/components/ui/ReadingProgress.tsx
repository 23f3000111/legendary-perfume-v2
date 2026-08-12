import type { RefObject } from 'react'
import { motion, useScroll, useSpring } from 'framer-motion'

/**
 * A gold hairline across the top of the window that fills as the reader moves
 * through an article.
 *
 * It measures the article body rather than the whole document, so the bar sits
 * empty under the title banner and reads full at the last line of prose, not
 * somewhere inside the footer.
 */
export default function ReadingProgress({ target }: { target: RefObject<HTMLElement> }) {
  const { scrollYProgress } = useScroll({ target, offset: ['start start', 'end end'] })
  // Smoothed, or the bar twitches on trackpads and on the shorter articles.
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.25 })

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="pointer-events-none fixed inset-x-0 top-0 z-[85] h-[3px] origin-left bg-gold"
    />
  )
}
