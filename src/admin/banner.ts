import type { BannerEntry } from '../../api/_lib/content/schema'

/**
 * A banner's focus point from a click on its photo: fractions across and
 * down, rounded to two places, and kept on the photo however wide the click.
 */
export function focusFrom(x: number, y: number, width: number, height: number): { x: number; y: number } {
  const fraction = (at: number, size: number) => Math.round(Math.min(1, Math.max(0, at / size)) * 100) / 100
  return { x: fraction(x, width), y: fraction(y, height) }
}

/**
 * What a phone shows is the banner's `phone`: the designer's phone crop, or
 * the wide photo itself when there is none (a smaller copy of it would only be
 * blurrier in a phone's near square title bar). So a banner whose `phone` is
 * its `image` has no phone crop.
 */
export function phoneCrop(banner: BannerEntry): string | undefined {
  return banner.phone !== banner.image ? banner.phone : undefined
}

/** The banner with this phone crop, or with none: phones then show the wide photo. */
export function withPhoneCrop(banner: BannerEntry, crop: string | undefined): BannerEntry {
  return { ...banner, phone: crop ?? banner.image }
}
