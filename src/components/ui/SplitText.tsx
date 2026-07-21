import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface SplitTextProps {
  text: string
  className?: string
  delay?: number
  stagger?: number
  once?: boolean
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span'
}

/** Reveals a heading word-by-word with an upward mask wipe. */
export default function SplitText({
  text,
  className,
  delay = 0,
  stagger = 0.055,
  once = true,
}: SplitTextProps) {
  const words = text.split(' ')
  return (
    <motion.span
      className={className}
      style={{ display: 'inline-block' }}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: '-12% 0px' }}
      variants={{ show: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
      aria-label={text}
    >
      {words.map((word, i) => (
        <span
          key={i}
          style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top' }}
          aria-hidden
        >
          <motion.span
            style={{ display: 'inline-block' }}
            variants={{
              hidden: { y: '110%', opacity: 0 },
              show: {
                y: '0%',
                opacity: 1,
                transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] },
              },
            }}
          >
            {word}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </motion.span>
  )
}

export function Kicker({ children }: { children: ReactNode }) {
  return (
    <motion.span
      className="eyebrow inline-flex items-center gap-3"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
    >
      <span className="inline-block h-px w-8 bg-gold/60" />
      {children}
    </motion.span>
  )
}
