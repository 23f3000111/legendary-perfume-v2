import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wordmark, ScentScript } from './ui/Wordmark'

/*
 * Client amendments to the opening curtain:
 *   1. use the supplied Legendary logo, not typeset Cormorant
 *   2. lose the grey box behind "the legend of scent"
 *   3. hold the finished lockup longer, around three seconds
 *
 * The lockup lands at roughly 1.6s and the curtain lifts at 3.9s, so the
 * complete mark rests on screen for about three seconds before the site
 * appears.
 */
const LOCKUP_REST = 3.9

export default function Intro() {
  const [show, setShow] = useState(() => {
    if (typeof window === 'undefined') return false
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
    return !sessionStorage.getItem('legendary-intro')
  })

  useEffect(() => {
    if (!show) return
    sessionStorage.setItem('legendary-intro', '1')
    const t = setTimeout(() => setShow(false), (LOCKUP_REST + 0.8) * 1000)
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
            transition={{ delay: LOCKUP_REST, duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
          />
          <motion.div
            className="absolute inset-x-0 bottom-0 h-1/2 bg-ink"
            initial={{ y: 0 }}
            animate={{ y: '100%' }}
            transition={{ delay: LOCKUP_REST, duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
          />

          <div className="relative z-10 flex flex-col items-center px-6 text-center">
            <motion.p
              className="eyebrow eyebrow-gold mb-7"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.7 }}
            >
              Est. 2015 · Malaysia
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <Wordmark height="clamp(2.4rem,7.5vw,4.6rem)" gilt />
            </motion.div>

            <motion.div
              className="mt-7 h-px bg-gradient-to-r from-transparent via-gold to-transparent"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '14rem', opacity: 1 }}
              transition={{ delay: 1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            />

            {/* No grey plate here: the script is a knocked-out mask on the ink. */}
            <motion.div
              className="mt-7 text-ivory/90"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.25, duration: 0.9 }}
            >
              <ScentScript height="clamp(0.8rem,2vw,1.35rem)" />
            </motion.div>
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
