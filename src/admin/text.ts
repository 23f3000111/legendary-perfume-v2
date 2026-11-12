/**
 * House style for what the Legendary team types into the dashboard.
 *
 * The site carries no em or en dashes; hyphenated words are fine. The editor
 * warns at a field with a long dash and offers this comma, but never changes
 * the text by itself.
 */
const LONG_DASH = /[–—]/

export function hasLongDash(s: string): boolean {
  return LONG_DASH.test(s)
}

export function replaceLongDashes(s: string): string {
  return s.replace(/\s*[–—]\s*/g, ', ').replace(/,\s*,/g, ',')
}

/**
 * An id for something new, made from its name: lowercase letters and digits
 * only, so it can never put a dash in an address, at most 24 characters, with
 * 2, 3 and so on added when it is already taken.
 */
export function newId(name: string, taken: Set<string>): string {
  const base =
    name
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 24) || 'item'
  if (!taken.has(base)) return base
  for (let n = 2; ; n++) {
    const suffix = String(n)
    const id = base.slice(0, 24 - suffix.length) + suffix
    if (!taken.has(id)) return id
  }
}
