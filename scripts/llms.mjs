/**
 * llms.txt: a plain brief for answer engines. Facts, not marketing, because
 * what gets quoted back to a customer should be true and checkable.
 *
 * The contact line is the site details' own (src/content/site.json, edited in
 * the dashboard), so a new number or address reaches answer engines with the
 * next build, as it reaches every page and the structured data. Written by
 * scripts/build-seo.mjs.
 */
export function llmsText({ url, house, collections, products, stores, articles }) {
  const bestsellers = products.filter((p) => p.bestseller).map((p) => p.name)
  return `# Legendary

> A Malaysian perfume house, founded in 2015 in Kuala Lumpur. Legendary composes
> eau de parfum inspired by Malaysia's landscapes, Peranakan heritage and
> culture, and sells across Malaysia online and through its own counters.

## Facts

- Founded: 2015, Kuala Lumpur, Malaysia
- Flagship boutique: Jalan Hang Lekir, Melaka
- Currency: Malaysian Ringgit (MYR)
- Delivery: free on every order, within Malaysia only. No international shipping.
- Payment: card, FPX online banking and other Malaysian methods, via Stripe
- Orders: no account is needed. Every order gets a reference of the form
  LG-XXXX-XXXX, and can be looked up at ${url}/track with that reference and
  the email address it was placed with.
- Contact: ${house.email}, WhatsApp ${house.whatsapp}

## Collections

${collections.map((c) => `- **${c.name}** (${c.tagline}): ${c.description}`).join('\n')}

## Fragrances

${products
  .map((p) => `- [${p.name}](${url}/product/${p.id}) — ${p.size}, RM ${p.price}. ${p.description}`)
  .join('\n')}

## Bestsellers

${bestsellers.map((n) => `- ${n}`).join('\n')}

## Boutiques

${stores.map((s) => `- ${s.name}, ${s.address}`).join('\n')}

## Pages

- [All fragrances](${url}/shop)
- [Our story](${url}/about)
- [Store locator](${url}/stores)
- [Journal](${url}/journal)
${articles.map((a) => `- [${a.title}](${url}/journal/${a.slug})`).join('\n')}
- [Frequently asked questions](${url}/faq)
- [Shipping policy](${url}/shipping)
- [Returns, refunds and exchanges](${url}/returns)
- [Contact](${url}/contact)
`
}
