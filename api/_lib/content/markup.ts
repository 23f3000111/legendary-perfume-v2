/**
 * The light markup long-form text uses, read one way by everything that reads it.
 *
 *   [label](/route)  a link on the site     [label](https://…)  a link out
 *   **bold**         emphasis               *italic*            stress
 *   bare https://…   linked as it is
 *
 * The page (src/components/ui/Prose.tsx) draws text with these tokens, and the
 * content schemas check links with the same ones. Two different readers could
 * disagree on where a link is: a check that looked for links alone would pass
 * `*z[a*](/ok[x](javascript:…)` as one link to /ok…, while the page, reading
 * the italic first, finds a javascript: link in it.
 *
 * No imports, so the public site can use it without pulling in zod.
 */

/**
 * The tokens in reading order. Bold sits before italic: alternation is
 * ordered, so a lone `*` first would swallow the opening pair of every
 * `**bold**`. A fresh expression each time, since a global one keeps its
 * place between uses.
 */
export const inlineTokens = () => /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|(https?:\/\/[^\s)]+)/g

/**
 * An address on this site. `//example.com` starts with a slash too but leaves
 * the site, and browsers read `/\` the same way, so neither counts.
 */
export const ON_SITE = /^\/(?![/\\])\S*$/

/** Where else a link may go: a place on the page, or out to the web, mail or phone. */
export const OFF_SITE = /^(#|https?:\/\/|mailto:|tel:)\S*$/

/** Whether a link may go to `href`. A javascript: address, or `product/orchid` without its slash, may not. */
export function linkAllowed(href: string): boolean {
  return ON_SITE.test(href) || OFF_SITE.test(href)
}

/** Every address the page would link to in `text`, in order. */
export function linksIn(text: string): string[] {
  const tokens = inlineTokens()
  const found: string[] = []
  let m: RegExpExecArray | null
  while ((m = tokens.exec(text)) !== null) {
    if (m[1]) found.push(m[2])
    else if (m[5]) found.push(m[5])
  }
  return found
}
