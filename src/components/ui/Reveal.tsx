import { motion, type Variants } from 'framer-motion'
import type { ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
  once?: boolean
  as?: 'div' | 'section' | 'span' | 'li' | 'article'
}

const build = (y: number, delay: number): Variants => ({
  hidden: { opacity: 0, y },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] },
  },
})

export default function Reveal({
  children,
  className,
  delay = 0,
  y = 28,
  once = true,
}: RevealProps) {
  return (
    <motion.div
      className={className}
      variants={build(y, delay)}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: '-10% 0px -10% 0px' }}
    >
      {children}
    </motion.div>
  )
}

/** Staggered container — pair with RevealItem children */
export function RevealGroup({
  children,
  className,
  stagger = 0.08,
  once = true,
}: {
  children: ReactNode
  className?: string
  stagger?: number
  once?: boolean
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: '-8% 0px' }}
      variants={{ show: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </motion.div>
  )
}

export function RevealItem({
  children,
  className,
  y = 26,
}: {
  children: ReactNode
  className?: string
  y?: number
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y },
        show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
      }}
    >
      {children}
    </motion.div>
  )
}
