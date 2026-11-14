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
 * own colours and `<name>-mono.png` beside it, the dashboard makes the same
 * pair from one upload, and the two are crossfaded.
 *
 * The mono print is the one in flow, so it sets the cell's height; the colour
 * print is absolutely positioned over it and lifted on hover.
 */
export default function BrandLogo({
  logo,
  mono,
  name,
  className = '',
  cellClassName = '',
}: {
  /** The print in the logo's own colours: a root path, such as /assets/client/partner-sogo.png. */
  logo: string
  /** The black and white print the wall rests in. */
  mono: string
  name: string
  /** Sizing for the artwork itself. Both prints are given the same box. */
  className?: string
  /** Sizing for the cell that holds the pair. */
  cellClassName?: string
}) {
  return (
    <span className={`brand-cell ${cellClassName}`}>
      <img
        src={asset(mono)}
        alt={name}
        loading="lazy"
        className={`brand-logo brand-logo-mono ${className}`}
      />
      {/* Decorative: the mono print above already carries the name. */}
      <img
        src={asset(logo)}
        alt=""
        aria-hidden
        loading="lazy"
        className={`brand-logo brand-logo-colour ${className}`}
      />
    </span>
  )
}
