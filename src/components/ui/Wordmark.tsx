import { asset } from '../../lib/asset'

/* ------------------------------------------------------------------
   The house lockup.

   Client amendment: the site was typesetting "LEGENDARY" in Cormorant
   rather than using the supplied logo. Both marks now come from the
   client's own artwork, exported as alpha masks so a single file paints
   ink on the light header, ivory on the dark footer, and the gilt
   gradient on the intro curtain.

   The script lockup ships on a flat grey artboard; that grey box is
   knocked out in scripts/prepare-assets.py, not hidden with CSS.
   ------------------------------------------------------------------ */

const LOGO = { src: '/assets/client/logo-legendary.png', ratio: 1400 / 206 }
const SCRIPT = { src: '/assets/client/wordmark-scent.png', ratio: 1200 / 106 }

type MarkProps = {
  /** Rendered height. Width follows the artwork's own aspect ratio. */
  height: string
  className?: string
  /** Paints the mark with the house gilt gradient instead of currentColor. */
  gilt?: boolean
  title?: string
}

function Mark({ art, height, className = '', gilt = false, title }: MarkProps & { art: typeof LOGO }) {
  const url = `url(${asset(art.src)})`
  return (
    <span
      role="img"
      aria-label={title}
      className={`block ${className}`}
      style={{
        height,
        width: `calc(${height} * ${art.ratio})`,
        background: gilt
          ? 'linear-gradient(100deg, #8A6D2A 0%, #CBAA5D 30%, #f0dca2 50%, #CBAA5D 70%, #8A6D2A 100%)'
          : 'currentColor',
        WebkitMaskImage: url,
        maskImage: url,
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
      }}
    />
  )
}

/** "LEGENDARY", the primary wordmark. */
export function Wordmark(props: MarkProps) {
  return <Mark art={LOGO} title="Legendary" {...props} />
}

/** "the legend of scent", the script strapline. */
export function ScentScript(props: MarkProps) {
  return <Mark art={SCRIPT} title="the legend of scent" {...props} />
}
