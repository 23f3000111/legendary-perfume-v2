import { RevealGroup, RevealItem } from '../components/ui/Reveal'

/**
 * "As Featured In" — sits directly above the customer reviews, per the client.
 * Logos are set as wordmarks in the house type so no third-party brand artwork
 * is redistributed; swap for supplied logo files when the client sends them.
 */
const press = [
  { name: 'Watsons', className: 'tracking-[0.02em]' },
  { name: 'Tatler', className: 'tracking-[0.04em]' },
  { name: "L'OFFICIEL", className: 'tracking-[0.12em] text-[0.85em]' },
  { name: 'Beauty Insider', className: 'tracking-[0.02em]' },
]

export default function FeaturedIn() {
  return (
    <section className="border-t border-line bg-porcelain py-16 md:py-20">
      <div className="u-container">
        <h2 className="text-center font-display text-[clamp(1.7rem,3vw,2.4rem)]">As Featured In</h2>

        <RevealGroup className="mt-10 flex flex-wrap items-center justify-center gap-x-14 gap-y-8 md:gap-x-20">
          {press.map((p) => (
            <RevealItem key={p.name}>
              <span
                className={`font-display text-[clamp(1.3rem,2.4vw,1.9rem)] font-bold text-ink/45 transition-colors duration-500 hover:text-ink ${p.className}`}
              >
                {p.name}
              </span>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}
