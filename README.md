# Legendary — *A Scented Memory of Malaysia*

A premium, cinematic build of the Legendary Perfume storefront. Heritage luxe
aesthetic (ivory, antique gold, Peranakan motifs), scroll driven storytelling and
a working shop experience.

This repository carries the client's amendments up to and including
**amendment 4** (the deck itself is titled *Revision #3*, dated 24 August 2026).

### 🔗 Live demo → **https://23f3000111.github.io/legendary-perfume-v2/**

Deployed automatically to GitHub Pages on every push to `main`.

## Run it

```bash
npm install
npm run dev
```

Open the URL Vite prints (e.g. http://localhost:5173).

```bash
npm run build   # type-check + production build → /dist
npm run preview # preview the production build
```

Requires Node 18+.

## Tech

- **Vite + React 18 + TypeScript**
- **Tailwind CSS** — custom design tokens (`tailwind.config.js`, `src/index.css`)
- **Framer Motion** — intro ritual, scroll reveals, parallax, the pinned collections rail
- **Zustand** (+ `localStorage`) — cart persistence (`src/store/`)
- **React Router** — multi page routing

## What's inside

- **Cinematic hero** with the brand video, a page load intro ritual, ambient gold
  particles and a trailing cursor.
- **The Signature** — the Orchid feature, with the house's own figures.
- **Pinned horizontal collections rail** (desktop) / snap scroller (mobile).
- **"A Scented Memory of Malaysia"** — an interactive stylised map linking places to
  scents (`src/components/MalaysiaMap.tsx`).
- **The Olfactory Finder** — pick a mood, get matched fragrances.
- **Shop** with filtering and sorting, **product pages** whose composition band repeats
  once per fragrance for the sets, a slide over **cart** and a simulated
  multi step **checkout**.
- **Store locator** with embedded Google Maps and live directions (`src/pages/Stores.tsx`).
- **Customer care pages** — FAQ, Shipping Policy, Return, Refund & Exchange, Terms of
  Service and Privacy Policy (`src/data/policies.ts`, `src/pages/Policy.tsx`).
- **Concierge** — an in page assistant that answers scent, gift and store questions and
  hands off to the real WhatsApp number (`src/lib/concierge.ts`).

## Revision 2 amendments

Applied from the client's annotated deck, in deck order:

| Page | Change |
| --- | --- |
| Intro | Supplied Legendary logo in place of typeset text, grey box removed from behind the script mark, lockup holds about three seconds |
| Home | Est. 2015 counter strip removed; Art of Gifting section removed |
| Home | "Since 2015" in Minion Bold, "30,000,000+" in Noto Serif Medium, "bottles loved worldwide" |
| Home | New Four worlds, bottled photography; new Melaka and Kota Kinabalu map cards; Spirit I & II card renamed "Spirit" |
| Home | Every product tile carries its SKU gradient behind a transparent pack cut out |
| Home | Mood icons in gold, tile titles aligned |
| Home | "As Featured In" becomes "Partnered With", with the fourteen supplied partner logos |
| Shop | Spirit II and the Spirit I Travel Kit added to the Spirit collection |
| Shop | "For Her" and "For Him" now filter correctly from the footer and mega menu |
| Product | "What's included" flat lay on transparency and larger |
| Product | Composition plate given breathing space at the right edge |
| Product | Sets show three composition bands, one per fragrance, in the client's order |
| Product | Spirit I band tinted `#d1e5ed`, Spirit II `#d9dfd2` |
| Our Story | Journey figures in Minion Regular; 2024 and 2025 added |
| Services | Complimentary Samples icon redrawn to match its neighbours |
| Contact | "Collaborate With Us", WhatsApp only, head office address, single centred form |
| Site wide | No hyphen or dash characters anywhere in the copy |

## Amendment 4

Applied from `amendament_4.pdf`, in deck order. Source artwork for this round
lives in `client-assets/amendment-4/`.

| Page | Change |
| --- | --- |
| Intro | "the legend of scent" set in the same gold as "Est. 2015 · Malaysia" |
| Home | The 30,000,000+ figure rolls up on an odometer as the Signature section arrives (`src/components/ui/RollingNumber.tsx`) |
| Home | New Signature family photograph on the "Four worlds, bottled" rail |
| Home | "Partnered With" laid out six, five, three, in the order the client drew |
| Home / Stores | Partner and stockist logos come up in their own colour when hovered. They were already meant to, but `img { pointer-events: none }` meant the hover could never fire; the whole cell is the target now. Pointers with no hover to give show them coloured outright |
| Shop | Seven SKUs added: Wish I, Wish II and Wish III in 15ml, the 3 Wishes Travel Kit, and Passion, Life and Dream in 50ml |
| Shop | For Her and For Him carry the banners the client supplied, and the title bar follows the chip you pressed |
| Product | The three Wishes quote their own notes rather than one list shared across the box; Kebaya Blooms, Ondeh Delights and Nyonya Aromatic corrected to the client's sheet |
| Bag | Free delivery on every order, so the spend to unlock meter is gone |
| Checkout | Standard and express delivery removed. With nothing left to choose, the delivery step goes with them and the summary reads Free |
| Shipping Policy | Cost table reduced to one line, free on every order |
| Our Story | Its own "It started with a single flower" photograph, rather than the home page's orchid shot |
| Our Story | The Journey panel brings its title forward first, then unfolds the body under it |
| Contact | The WhatsApp card carries the client's ringed handset |

Two notes for the client on this round:

- The Orchid photograph supplied for "Orchid, the scent that began it all" is
  byte for byte the one already on the site, so there was nothing to swap.
- Prices for the seven new SKUs follow the house's existing ladder and need
  confirming: RM 79 (was RM 99) for a 15ml Wish, RM 68 (was RM 98) for the
  3 Wishes Travel Kit, RM 189 (was RM 229) for a 50ml Spirit II.

## Notes

- Prices are in **RM (MYR)**.
- This is a demo: checkout processes **no real payment**, and the concierge is
  rule based (it deep links to WhatsApp for human follow up).
- All product, store, collection and policy copy lives in `src/data/`.
- Web assets in `public/assets/client/` are generated from the client's delivery by
  `python scripts/prepare-assets.py`. The originals live in `client-assets/`, which is
  deliberately outside `public/` and not committed: `Legendary digital/` is the main
  delivery, `amendment-4/` the later drop. The script empties
  `public/assets/client/` before it writes, so anything the site references has to be
  produced by it rather than dropped in by hand.
- "Minion Variable Concept" is an Adobe licence the site cannot host. The CSS names it
  first and falls back to Source Serif 4, so the real family takes over automatically on
  any machine where it is installed.
