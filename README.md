# Legendary — *A Scented Memory of Malaysia*

A premium, cinematic build of the Legendary Perfume storefront. Heritage luxe
aesthetic (ivory, antique gold, Peranakan motifs), scroll driven storytelling and
a working shop experience.

This repository carries **revision 2**, the client's amendments from
*Legendary New Website (rev 2, 10 August 2026)*.

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

## Notes

- Prices are in **RM (MYR)**.
- This is a demo: checkout processes **no real payment**, and the concierge is
  rule based (it deep links to WhatsApp for human follow up).
- All product, store, collection and policy copy lives in `src/data/`.
- Web assets in `public/assets/client/` are generated from the client's delivery by
  `python scripts/prepare-assets.py`. The originals live in `client-assets/`, which is
  deliberately outside `public/` and not committed.
- "Minion Variable Concept" is an Adobe licence the site cannot host. The CSS names it
  first and falls back to Source Serif 4, so the real family takes over automatically on
  any machine where it is installed.
