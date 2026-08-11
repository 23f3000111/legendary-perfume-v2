import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Sparkle } from './icons'

/* ------------------------------------------------------------------
   A tiny content model shared by the policy pages and the journal
   articles. Copy lives in src/data as Block[] so the house typography
   is defined once, here, and every long-form page reads the same.
   ------------------------------------------------------------------ */

export type Block =
  | { t: 'p'; text: string }
  | { t: 'lead'; text: string }
  | { t: 'h2'; text: string }
  | { t: 'h3'; text: string }
  | { t: 'ul'; items: string[] }
  | { t: 'ol'; items: string[] }
  | { t: 'quote'; text: string; cite?: string }
  | { t: 'tip'; text: string }
  | { t: 'image'; src: string; alt: string; caption?: string }
  | { t: 'duo'; images: { src: string; alt: string }[] }
  | { t: 'table'; head: string[]; rows: string[][] }
  | { t: 'refs'; items: string[] }

/**
 * Inline markup understood inside any `text` field:
 *   [label](/route)  → internal link      [label](https://…) → external link
 *   **bold**         → emphasis           bare https://…     → auto-linked
 */
const TOKEN = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|(https?:\/\/[^\s)]+)/g

const linkClass = 'link-gold text-gold-deep'

export function RichText({ text }: { text: string }) {
  const nodes: ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  TOKEN.lastIndex = 0

  while ((m = TOKEN.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index))

    if (m[1]) {
      nodes.push(anchor(m[1], m[2], nodes.length))
    } else if (m[3]) {
      nodes.push(<strong key={nodes.length} className="font-medium text-ink">{m[3]}</strong>)
    } else if (m[4]) {
      // Bare URLs in citation lists often end a sentence — keep the full stop
      // outside the anchor so the link resolves.
      const trail = /[.,;]$/.test(m[4]) ? m[4].slice(-1) : ''
      const href = trail ? m[4].slice(0, -1) : m[4]
      nodes.push(anchor(href, href, nodes.length, 'break-all'))
      if (trail) nodes.push(trail)
    }
    last = m.index + m[0].length
  }
  if (last < text.length) nodes.push(text.slice(last))

  return <>{nodes}</>
}

function anchor(label: string, href: string, key: number, extra = '') {
  const cls = `${linkClass} ${extra}`.trim()
  if (href.startsWith('/') || href.startsWith('#')) {
    return <Link key={key} to={href} className={cls}>{label}</Link>
  }
  const external = href.startsWith('http')
  return (
    <a key={key} href={href} className={cls} {...(external && { target: '_blank', rel: 'noreferrer' })}>
      {label}
    </a>
  )
}

/** Renders a Block[] with the house's long-form typography. */
export default function Prose({ blocks, className = '' }: { blocks: Block[]; className?: string }) {
  return (
    <div className={className}>
      {blocks.map((b, i) => (
        <BlockView key={i} block={b} first={i === 0} />
      ))}
    </div>
  )
}

function BlockView({ block: b, first }: { block: Block; first: boolean }) {
  switch (b.t) {
    case 'lead':
      return (
        <p className={`${first ? '' : 'mt-8'} font-display text-[clamp(1.25rem,2.2vw,1.6rem)] leading-[1.5] text-ink`}>
          <RichText text={b.text} />
        </p>
      )

    case 'p':
      return (
        <p className={`${first ? '' : 'mt-5'} leading-[1.85] text-ink-soft`}>
          <RichText text={b.text} />
        </p>
      )

    case 'h2':
      return (
        <h2 className={`${first ? '' : 'mt-14'} font-display text-[clamp(1.6rem,3vw,2.2rem)] leading-[1.15] text-ink`}>
          <span className="mb-4 block h-px w-10 bg-gold/60" />
          {b.text}
        </h2>
      )

    case 'h3':
      return (
        <h3 className={`${first ? '' : 'mt-10'} font-display text-[1.4rem] leading-snug text-ink`}>
          {b.text}
        </h3>
      )

    case 'ul':
      return (
        <ul className={`${first ? '' : 'mt-5'} space-y-3`}>
          {b.items.map((it, i) => (
            <li key={i} className="relative pl-6 leading-[1.8] text-ink-soft">
              <span className="absolute left-0 top-[0.72em] h-1.5 w-1.5 rotate-45 bg-gold/70" />
              <RichText text={it} />
            </li>
          ))}
        </ul>
      )

    case 'ol':
      return (
        <ol className={`${first ? '' : 'mt-5'} space-y-3`}>
          {b.items.map((it, i) => (
            <li key={i} className="relative pl-9 leading-[1.8] text-ink-soft">
              <span className="absolute left-0 top-0 font-display text-lg text-gold-deep">
                {String(i + 1).padStart(2, '0')}
              </span>
              <RichText text={it} />
            </li>
          ))}
        </ol>
      )

    case 'quote':
      return (
        <blockquote className={`${first ? '' : 'mt-8'} border-l-2 border-gold/60 pl-6`}>
          <p className="font-display text-[clamp(1.2rem,2.2vw,1.55rem)] italic leading-[1.5] text-ink">
            <RichText text={b.text} />
          </p>
          {b.cite && <cite className="mt-3 block not-italic text-xs uppercase tracking-[0.16em] text-smoke">{b.cite}</cite>}
        </blockquote>
      )

    case 'tip':
      return (
        <div className={`${first ? '' : 'mt-8'} flex gap-4 border border-gold/25 bg-porcelain p-5`}>
          <Sparkle width={20} className="mt-0.5 shrink-0 text-gold" />
          <p className="text-sm leading-[1.8] text-ink-soft">
            <span className="eyebrow eyebrow-gold mr-2">Tip</span>
            <RichText text={b.text} />
          </p>
        </div>
      )

    case 'image':
      return (
        <figure className={`${first ? '' : 'mt-10'}`}>
          <img src={b.src} alt={b.alt} loading="lazy" className="w-full rounded-sm object-cover" />
          {b.caption && <figcaption className="mt-3 text-xs text-smoke">{b.caption}</figcaption>}
        </figure>
      )

    case 'duo':
      return (
        <div className={`${first ? '' : 'mt-10'} grid gap-3 sm:grid-cols-2`}>
          {b.images.map((im) => (
            <img key={im.src} src={im.src} alt={im.alt} loading="lazy" className="aspect-[4/5] w-full rounded-sm object-cover" />
          ))}
        </div>
      )

    case 'table':
      return (
        <div className={`${first ? '' : 'mt-8'} -mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0`}>
          <table className="w-full min-w-[34rem] border-collapse text-left">
            <thead>
              <tr className="border-y border-line">
                {b.head.map((h) => (
                  <th key={h} className="py-3 pr-6 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-gold-deep">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((row, i) => (
                <tr key={i} className="border-b border-line/70 align-top">
                  {row.map((cell, j) => (
                    <td key={j} className={`py-4 pr-6 text-sm leading-[1.7] ${j === 0 ? 'text-ink' : 'text-ink-soft'}`}>
                      <RichText text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )

    case 'refs':
      return (
        <ol className={`${first ? '' : 'mt-6'} space-y-3 border-t border-line pt-6`}>
          {b.items.map((it, i) => (
            <li key={i} className="relative pl-8 text-[0.82rem] leading-[1.75] text-smoke">
              <span className="absolute left-0 top-0 tabular-nums text-gold-deep">{i + 1}.</span>
              <RichText text={it} />
            </li>
          ))}
        </ol>
      )
  }
}
