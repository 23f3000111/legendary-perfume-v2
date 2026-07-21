import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const WORD = 'LEGENDARY'

export default function Intro() {
  const [show, setShow] = useState(() => {
    if (typeof window === 'undefined') return false
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
    return !sessionStorage.getItem('legendary-intro')
  })

  useEffect(() => {
    if (!show) return
    sessionStorage.setItem('legendary-intro', '1')
    const t = setTimeout(() => setShow(false), 3200)
    document.body.style.overflow = 'hidden'
    return () => {
      clearTimeout(t)
      document.body.style.overflow = ''
    }
  }, [show])

  const dismiss = () => setShow(false)

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink text-ivory"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* curtain panels */}
          <motion.div
            className="absolute inset-x-0 top-0 h-1/2 bg-ink"
            initial={{ y: 0 }}
            animate={{ y: '-100%' }}
            transition={{ delay: 2.7, duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
          />
          <motion.div
            className="absolute inset-x-0 bottom-0 h-1/2 bg-ink"
            initial={{ y: 0 }}
            animate={{ y: '100%' }}
            transition={{ delay: 2.7, duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
          />

          <div className="relative z-10 px-6 text-center">
            <motion.p
              className="eyebrow eyebrow-gold mb-6"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              Est. 2015 · Malaysia
            </motion.p>

            <h1 className="flex justify-center overflow-hidden font-display text-[clamp(2.6rem,10vw,6rem)] leading-none tracking-[0.04em]">
              {WORD.split('').map((c, i) => (
                <motion.span
                  key={i}
                  className="text-gilt inline-block"
                  initial={{ y: '110%', opacity: 0 }}
                  animate={{ y: '0%', opacity: 1 }}
                  transition={{ delay: 0.45 + i * 0.075, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                >
                  {c}
                </motion.span>
              ))}
            </h1>

            <motion.div
              className="mx-auto mt-6 h-px bg-gradient-to-r from-transparent via-gold to-transparent"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '14rem', opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            />

            <motion.p
              className="mt-6 font-display text-lg italic text-ivory/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.9, duration: 1 }}
            >
              A Scented Memory of Malaysia
            </motion.p>
          </div>

          <button
            onClick={dismiss}
            className="absolute bottom-8 right-8 z-10 text-[0.68rem] uppercase tracking-[0.24em] text-ivory/50 transition hover:text-ivory"
          >
            Skip
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
