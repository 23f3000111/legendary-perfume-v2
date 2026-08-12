import { useLocation } from 'react-router-dom'
import { Facebook, WhatsApp, LinkedIn, Mail } from './icons'

/**
 * Share links for an article. These point at the real share endpoints and carry
 * the live URL, so they work from the deployed site rather than sitting there
 * as decoration.
 *
 * The location hook is what keeps them honest: this component stays mounted
 * when the reader moves from one article to the next, so reading the URL once
 * at first render would leave every later share pointing at the first piece.
 */
export default function ShareRow({ title }: { title: string }) {
  useLocation()
  const url = typeof window === 'undefined' ? '' : window.location.href
  const e = encodeURIComponent

  const targets = [
    { I: Facebook, label: 'Share on Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${e(url)}` },
    { I: WhatsApp, label: 'Share on WhatsApp', href: `https://wa.me/?text=${e(`${title} ${url}`)}` },
    { I: LinkedIn, label: 'Share on LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${e(url)}` },
    { I: Mail, label: 'Share by email', href: `mailto:?subject=${e(title)}&body=${e(url)}` },
  ]

  return (
    <div className="mt-14 flex items-center gap-4 border-t border-line pt-8">
      <span className="eyebrow text-smoke">Share</span>
      <ul className="flex items-center gap-3">
        {targets.map(({ I, label, href }) => (
          <li key={label}>
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={label}
              title={label}
              className="grid h-10 w-10 place-items-center rounded-full border border-line text-ink-soft transition hover:border-gold hover:text-gold-deep"
            >
              <I width={17} />
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
