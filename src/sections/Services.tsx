import { RevealGroup, RevealItem } from '../components/ui/Reveal'
import { asset } from '../lib/asset'
import { ShieldCheck, Truck, Gift } from '../components/ui/icons'
import { pages } from '../data/pages'

type Service = {
  title: string
  copy: string
  /** A drawn icon, or the client's own artwork where they supplied it. */
  I?: typeof ShieldCheck
  art?: string
}

/**
 * Client amendment: Complimentary Samples carries the house vial artwork rather
 * than a drawn icon, so the tile shows the actual sample bottle a customer is
 * given. The vial is far taller than it is wide, so it is sized by height and
 * allowed to fill more of the ring than a 24px glyph would.
 */
/* Revision 5: wording from the client's Our Story copy sheet. "Secure Payment"
   becomes "Secure Checkout" and "Gift Wrapping" becomes "Art of Gifting". */
const ICONS: Pick<Service, 'I' | 'art'>[] = [
  { I: ShieldCheck },
  { art: '/assets/client/icon-vial.png' },
  { I: Truck },
  { I: Gift },
]

export default function Services() {
  // The words are the Our Story page's (src/content/pages.json), read at render; the icons stay by position.
  const services: Service[] = pages.about.services.map((s, i) => ({ ...ICONS[i], ...s }))
  return (
    <section className="border-y border-line bg-sand/40 py-16">
      <RevealGroup className="u-container grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
        {services.map((s, i) => (
          <RevealItem key={i} className="flex flex-col items-center gap-3 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full border border-gold/30 text-gold">
              {s.art ? (
                <img src={asset(s.art)} alt="" aria-hidden className="h-9 w-auto" />
              ) : (
                s.I && <s.I width={24} />
              )}
            </span>
            <h3 className="font-display text-lg">{s.title}</h3>
            <p className="max-w-[16rem] text-sm text-smoke">{s.copy}</p>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  )
}
