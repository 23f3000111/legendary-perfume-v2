import type { Box, PosterImage } from '../../api/_lib/content/schema'

/**
 * The hero poster's framing, as plain functions of the window, the poster and
 * the header, so the site and the dashboard's previews crop it alike.
 *
 * No React and no DOM: the hero measures the window and the header and passes
 * them in.
 */

/**
 * How the poster meets the frame.
 *
 * cover  A desktop window is close enough to the poster's own 16:9 that it can
 *        fill the frame edge to edge. A frame narrower than the poster loses
 *        width, split so the picture on one side and the words on the other
 *        keep equal margins; it covers for as long as both keep at least 2% of
 *        the width, which for the balloon is down to about 1.5:1. A frame wider
 *        than the poster loses height instead, decided as described below.
 * band   A tablet or a squarish window. Covering it would cut into the words or
 *        the picture, so the poster is shown whole across the full width and
 *        set on the bottom edge. The space above sits behind the header, on a
 *        blurred field cut from the poster.
 * card   A phone held upright, where a 16:9 picture can only fill the screen by
 *        losing two thirds of its width. It is shown whole and centred on the
 *        same field instead, clear of the controls and the concierge button.
 *
 * The vertical cut, when there is one, keeps the words below the header and
 * above the arrows where the two overlap, and within that keeps the picture in
 * frame and below the header, splitting whatever room is left down the middle.
 * If the picture cannot be kept whole, the cut goes as near to it as the words
 * allow; if even the words cannot clear both, they stay clear of the arrows.
 *
 * Measured off the hero rather than the window, because the hero has a minimum
 * height and the two part company on a phone turned sideways.
 */
export type Fit = 'cover' | 'band' | 'card'

export interface PosterFrame {
  fit: Fit
  /** For `cover`, the poster's object-position, in percent. */
  x: number
  y: number
}

/** What the framing needs to know of a poster: its shape and its two regions. */
export interface PosterLayout {
  image: { width: number; height: number }
  words: Box
  picture: Box
}

/** Room kept between the poster's important parts and anything over them. */
export const AIR = 12
/** The arrows wherever the poster can cover: 88px wide, 96px in from the right, top edge 76px up. */
export const ARROWS = { width: 88, right: 96, top: 76 }

/**
 * How tall the site's fixed header is in a window `width` px wide, as
 * `--header-h` in src/index.css sets it: one row on a phone, a taller one from
 * a tablet, and from a laptop up a second row for the menu. The hero reads the
 * real value from the page; the Poster tab's previews, which have no such
 * page, use this. A test holds it to the stylesheet.
 */
export function headerHeight(width: number): number {
  if (width >= 1024) return 130
  if (width >= 768) return 78
  return 62
}

/** The frame for a hero `width` by `height` px, under a header `header` px tall. */
export function frameFor(width: number, height: number, poster: PosterLayout, header: number): PosterFrame {
  const { words, picture } = poster
  const ratio = width / height
  const posterRatio = poster.image.width / poster.image.height

  // Narrower than the poster: the share of its width that would be lost,
  // against the room either side of the words and the picture together.
  const left = Math.min(words[0], picture[0])
  const right = Math.max(words[2], picture[2])
  const room = left + (1 - right)
  const widthLost = 1 - ratio / posterRatio
  if (widthLost > room - 0.04) return { fit: ratio >= 1 ? 'band' : 'card', x: 50, y: 50 }
  if (widthLost > 0) {
    // Held between 0% and 100%. A frame only a hair narrower than the poster,
    // which is what a 16:9 screen in full screen leaves once a scrollbar takes
    // its 10 to 17px, loses a few pixels of width, and the split worked out
    // above then asks for many times that from the left: 635% at 1920x1080.
    // Past 100% the picture slid left off its own edge and the film showed
    // through a strip down the right, which is what the client saw.
    const margin = (room - widthLost) / 2
    const x = Math.min(1, Math.max(0, (left - margin) / widthLost))
    return { fit: 'cover', x: Math.round(x * 100), y: 50 }
  }

  // Wider than the poster: how far down to start it, in px of its own height.
  const shown = width / posterRatio
  const excess = shown - height
  if (excess <= 0) return { fit: 'cover', x: 50, y: 50 }
  const at = (fraction: number) => fraction * shown
  const arrowsLeft = (width - ARROWS.right - ARROWS.width) / width
  const arrowsRight = (width - ARROWS.right) / width
  const floor = arrowsLeft < words[2] && arrowsRight > words[0] ? height - ARROWS.top - AIR : height - AIR
  const lo = Math.max(0, at(words[3]) - floor)
  const hi = Math.min(excess, at(words[1]) - header - AIR)
  const pictureLo = Math.max(lo, at(picture[3]) - height)
  const pictureHi = Math.min(hi, at(picture[1]) - header - AIR)
  const cut =
    pictureLo <= pictureHi ? (pictureLo + pictureHi) / 2
    : lo <= hi ? Math.min(hi, Math.max(lo, pictureLo))
    : lo
  return { fit: 'cover', x: 50, y: Math.round((Math.min(excess, Math.max(0, cut)) / excess) * 100) }
}

/**
 * The poster's `src` and `srcset`. Each print is named at its own width, so a
 * poster narrower than 3200 px never claims a print it does not have. `src`,
 * for a browser that reads no srcset, is the widest print up to 2400 px.
 */
export function posterSources(image: PosterImage, resolve: (path: string) => string = (path) => path): { src: string; srcSet: string } {
  const upTo = image.prints.filter((p) => p.width <= 2400)
  const chosen = upTo.length ? upTo[upTo.length - 1] : image.prints[0]
  return {
    src: resolve(chosen.path),
    srcSet: image.prints.map((p) => `${resolve(p.path)} ${p.width}w`).join(', '),
  }
}

/** The hero's slides: the film, then the poster while it is shown. */
export function heroSlides(poster: { show: boolean }): readonly ('film' | 'poster')[] {
  return poster.show ? ['film', 'poster'] : ['film']
}
