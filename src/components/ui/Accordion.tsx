import { useState, type ReactNode } from 'react'
import { ChevronDown } from './icons'

export interface AccordionItem {
  title: string
  body: ReactNode
}

/**
 * The disclosure pattern already used by the contact page's FAQ block,
 * lifted out so the FAQ, Terms and Privacy pages all open the same way.
 * `defaultOpen` of -1 leaves every panel closed.
 */
export default function Accordion({
  items,
  defaultOpen = 0,
}: {
  items: AccordionItem[]
  defaultOpen?: number
}) {
  const [open, setOpen] = useState<number | null>(defaultOpen >= 0 ? defaultOpen : null)

  return (
    <div className="border-t border-line">
      {items.map((item, i) => (
        <div key={`${i}-${item.title}`} className="border-b border-line">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-6 py-5 text-left"
            aria-expanded={open === i}
          >
            <span className="font-display text-lg leading-snug sm:text-xl">{item.title}</span>
            <ChevronDown
              width={20}
              className={`shrink-0 text-gold transition-transform duration-500 ${open === i ? 'rotate-180' : ''}`}
            />
          </button>
          <div
            className="grid overflow-hidden transition-all duration-500 ease-luxe"
            style={{ gridTemplateRows: open === i ? '1fr' : '0fr' }}
          >
            <div className="min-h-0">
              <div className="pb-7 pr-2">{item.body}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
