/**
 * A banner's focus point from a click on its photo: fractions across and
 * down, rounded to two places, and kept on the photo however wide the click.
 */
export function focusFrom(x: number, y: number, width: number, height: number): { x: number; y: number } {
  const fraction = (at: number, size: number) => Math.round(Math.min(1, Math.max(0, at / size)) * 100) / 100
  return { x: fraction(x, width), y: fraction(y, height) }
}
