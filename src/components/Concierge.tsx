import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useUI } from '../store/ui'
import { asset } from '../lib/asset'
import { GREETING, handle, waLink, type BotReply } from '../lib/concierge'
import { Close, Send, WhatsApp, ArrowRight, ArrowUpRight } from './ui/icons'

interface Msg { role: 'bot' | 'user'; text?: string; reply?: BotReply }

export default function Concierge() {
  const open = useUI((s) => s.conciergeOpen)
  const toggle = useUI((s) => s.toggleConcierge)
  const setOpen = useUI((s) => s.setConcierge)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [typing, setTyping] = useState(false)
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  // seed greeting the first time it opens
  useEffect(() => {
    if (open && msgs.length === 0) {
      setTyping(true)
      const t = setTimeout(() => {
        setMsgs([{ role: 'bot', reply: GREETING }])
        setTyping(false)
      }, 650)
      return () => clearTimeout(t)
    }
  }, [open, msgs.length])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [msgs, typing])

  const send = (text: string) => {
    const clean = text.trim()
    if (!clean) return
    setMsgs((m) => [...m, { role: 'user', text: clean }])
    setInput('')
    setTyping(true)
    const reply = handle(clean)
    setTimeout(() => {
      setMsgs((m) => [...m, { role: 'bot', reply }])
      setTyping(false)
    }, 700 + Math.random() * 500)
  }

  return (
    <>
      {/* Launcher */}
      <div className="fixed bottom-5 right-5 z-[85] flex flex-col items-end gap-3 md:bottom-7 md:right-7">
        <AnimatePresence>
          {!open && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              onClick={toggle}
              className="group relative grid h-14 w-14 place-items-center rounded-full text-ink shadow-[0_14px_40px_-12px_rgba(138,109,42,0.75)]"
              style={{ background: 'linear-gradient(135deg,#CBAA5D,#B08D3E 55%,#8A6D2A)' }}
              aria-label="Open the Legendary concierge"
            >
              <span className="absolute inset-0 animate-ping rounded-full bg-gold/40 [animation-duration:2.6s]" />
              <img
                src={asset('/assets/client/icon-perfume.webp')}
                alt=""
                className="relative h-7 w-7 object-contain"
              />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-4 right-3 z-[86] flex h-[560px] max-h-[80vh] w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl bg-ivory shadow-2xl ring-1 ring-line md:bottom-7 md:right-7"
          >
            {/* header */}
            <div className="relative flex items-center gap-3 bg-ink px-5 py-4 text-ivory">
              <div className="pointer-events-none absolute inset-0 opacity-10 peranakan" style={{ color: '#CBAA5D' }} />
              <div className="relative grid h-10 w-10 place-items-center rounded-full" style={{ background: 'linear-gradient(135deg,#CBAA5D,#8A6D2A)' }}>
                <img src={asset('/assets/client/icon-perfume.webp')} alt="" className="h-5 w-5 object-contain" />
              </div>
              <div className="relative flex-1">
                <p className="font-display text-lg leading-none">Concierge</p>
                <p className="mt-1 flex items-center gap-1.5 text-[0.68rem] text-ivory/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-jade" /> Online · replies instantly
                </p>
              </div>
              <button onClick={toggle} aria-label="Close concierge" className="relative text-ivory/70 transition hover:text-ivory"><Close width={20} /></button>
            </div>

            {/* messages */}
            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-porcelain px-4 py-5">
              {msgs.map((m, i) => (
                <MessageBubble key={i} msg={m} onChip={send} />
              ))}
              {typing && <Typing />}
            </div>

            {/* input */}
            <form
              onSubmit={(e) => { e.preventDefault(); send(input) }}
              className="flex items-center gap-2 border-t border-line bg-ivory px-3 py-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about a scent, gift or store…"
                className="flex-1 bg-transparent px-2 py-2 text-sm outline-none placeholder-smoke"
              />
              <button type="submit" className="grid h-10 w-10 place-items-center rounded-full text-ink" style={{ background: 'linear-gradient(135deg,#CBAA5D,#B08D3E)' }} aria-label="Send">
                <Send width={18} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function MessageBubble({ msg, onChip }: { msg: Msg; onChip: (t: string) => void }) {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-ink px-4 py-2.5 text-sm text-ivory">{msg.text}</div>
      </div>
    )
  }
  const r = msg.reply!
  return (
    <div className="flex flex-col items-start gap-2.5">
      <div className="max-w-[86%] rounded-2xl rounded-bl-sm bg-ivory px-4 py-3 text-sm leading-relaxed text-ink-soft shadow-sm ring-1 ring-line">
        {r.text}
      </div>

      {r.products && r.products.length > 0 && (
        <div className="w-full space-y-2">
          {r.products.map((p) => (
            <Link
              key={p.id}
              to={`/product/${p.id}`}
              className="flex items-center justify-between gap-3 rounded-xl bg-ivory px-3 py-2.5 text-sm ring-1 ring-line transition hover:ring-gold"
            >
              <span>
                <span className="font-display text-base text-ink">{p.name}</span>
                <span className="block text-xs text-smoke">{p.family}</span>
              </span>
              <span className="flex items-center gap-1.5 text-ink">{p.price}<ArrowUpRight width={15} className="text-gold" /></span>
            </Link>
          ))}
        </div>
      )}

      {r.link && (
        <Link to={r.link.to} className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.14em] text-gold-deep">
          {r.link.label} <ArrowRight width={14} />
        </Link>
      )}

      {r.wa && (
        <a href={waLink(r.wa.text)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-xs font-medium text-white">
          <WhatsApp width={16} /> {r.wa.label}
        </a>
      )}

      {r.chips && r.chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {r.chips.map((c) => (
            <button key={c} onClick={() => onChip(c)} className="rounded-full border border-gold/40 bg-ivory px-3 py-1.5 text-xs text-ink-soft transition hover:border-gold hover:bg-gold/10">
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Typing() {
  return (
    <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-ivory px-4 py-3 text-ink shadow-sm ring-1 ring-line" style={{ width: 'fit-content' }}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-gold"
          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  )
}
