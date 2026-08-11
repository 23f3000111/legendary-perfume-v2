import { RevealGroup, RevealItem } from '../components/ui/Reveal'
import { ShieldCheck, Truck, Gift, Vial } from '../components/ui/icons'

type Service = {
  title: string
  copy: string
  I: typeof ShieldCheck
}

/**
 * Client amendment: the Complimentary Samples icon was a raster of the vial
 * artwork and sat at a different weight and colour to the rest of the row. All
 * four are now drawn icons on the same stroke and the same gold.
 */
const services: Service[] = [
  { I: ShieldCheck, title: 'Secure Payment', copy: 'SSL encrypted checkout for complete peace of mind.' },
  { I: Vial, title: 'Complimentary Samples', copy: 'Discover new scents with every purchase.' },
  { I: Truck, title: 'Complimentary Delivery', copy: 'Free, fully tracked shipping across Malaysia.' },
  { I: Gift, title: 'Gift Wrapping', copy: 'Elegantly wrapped, perfect for gifting.' },
]

export default function Services() {
  return (
    <section className="border-y border-line bg-sand/40 py-16">
      <RevealGroup className="u-container grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
        {services.map((s) => (
          <RevealItem key={s.title} className="flex flex-col items-center gap-3 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full border border-gold/30 text-gold">
              <s.I width={24} />
            </span>
            <h3 className="font-display text-lg">{s.title}</h3>
            <p className="max-w-[16rem] text-sm text-smoke">{s.copy}</p>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  )
}
