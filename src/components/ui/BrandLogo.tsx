import { asset } from '../../lib/asset'

/**
 * A partner or stockist logo, black and white until it is hovered.
 *
 * Client amendment (revision 5): "make sure the logos are black and white,
 * when hovered over, they change to real logo colour", and separately "make
 * sure the logos are real colour logo, i.e. Sogo Kuala Lumpur is red and dark
 * grey".
 *
 * Both states are real artwork rather than a CSS filter, because half the
 * supplied marks are gold or white lockups drawn for a dark ground and
 * `grayscale(1)` only desaturates them: Parkson disappeared into the ivory
 * band entirely. scripts/prepare-assets.py writes `<name>.png` in the client's
 * own colours and `<name>-mono.png` beside it, and the two are crossfaded.
 *
 * The mono print is the one in flow, so it sets the cell's height; the colour
 * print is absolutely positioned over it and lifted on hover.
 */
export default function BrandLogo({
  file,
  name,
  className = '',
  cellClassName = '',
}: {
  /** File name inside /assets/client, e.g. `partner-sogo.png`. */
  file: string
  name: string
  /** Sizing for the artwork itself. Both prints are given the same box. */
  className?: string
  /** Sizing for the cell that holds the pair. */
  cellClassName?: string
}) {
  const mono = file.replace(/\.png$/, '-mono.png')
  return (
    <span className={`brand-cell ${cellClassName}`}>
      <img
        src={asset(`/assets/client/${mono}`)}
        alt={name}
        loading="lazy"
        className={`brand-logo brand-logo-mono ${className}`}
      />
      {/* Decorative: the mono print above already carries the name. */}
      <img
        src={asset(`/assets/client/${file}`)}
        alt=""
        aria-hidden
        loading="lazy"
        className={`brand-logo brand-logo-colour ${className}`}
      />
    </span>
  )
}
