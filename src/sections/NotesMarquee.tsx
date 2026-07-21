const NOTES = [
  'Wild Orchid', 'Gula Melaka', 'Pandan', 'White Musk', 'Cardamom', 'Peach',
  'Magnolia', 'Amber', 'Sandalwood', 'Bergamot', 'Cattleya', 'Vetiver',
  'Rose Petals', 'Cedar', 'Ginger Flower',
]

export default function NotesMarquee() {
  const row = [...NOTES, ...NOTES]
  return (
    <div className="overflow-hidden border-y border-ivory/10 bg-ink py-5">
      <div className="flex w-max animate-marquee items-center gap-8 whitespace-nowrap">
        {row.map((n, i) => (
          <span key={i} className="flex items-center gap-8">
            <span className="font-display text-xl italic text-ivory/70 md:text-2xl">{n}</span>
            <span className="text-gold">✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}
