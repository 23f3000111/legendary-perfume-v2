# Banner artwork specification

What to send for every page title bar on legendary.com.my, and why these numbers
rather than others.

Every figure below was measured from the site as it actually renders, across
nine viewport sizes from a 390px phone to a 2560px desktop, rather than assumed.

---

## The two sizes

**Two crops are needed per banner, not one.** This is the whole reason the
bottle kept looking wrong.

A title bar is a very different shape depending on the screen:

| | Bar aspect ratio |
| --- | --- |
| Tablet and desktop | between **1.88:1 and 4.30:1** |
| Phone | about **1.03:1**, near square |

A photograph fills that bar by covering it, so whichever way it does not match,
it gets cropped. One 4.5:1 image dropped into a near-square phone bar can only
fill it by magnifying itself four times over, which is what produced a narrow
slice of an enormous bottle with its cap against the top edge. No amount of
re-cropping a wide image fixes that: the problem is the shape.

### 1. Wide banner — tablet and desktop

```
2400 × 540 px      (4.44 : 1)
```

Wider than the widest bar the site produces (4.30:1), so **the full height is
always visible** and the bottle can never be cut top or bottom.

### 2. Phone banner — same shot, framed square-ish

```
1200 × 1000 px     (1.2 : 1)
```

Slightly wider than the phone bar (1.03:1), so the full height shows there too.

---

## Where the bottle has to sit

Because the bar is never exactly the image's shape, the sides get trimmed. How
much depends on the screen, and the worst case is a tablet.

### Wide banner (2400 × 540)

| | Keep the bottle within |
| --- | --- |
| Horizontally | the middle **42%** — x from **1000px to 1400px** |
| Vertically | **65px to 475px** (12% clear at top and bottom) |

The horizontal band is the tight one. On a tablet only the middle 42% of the
width is on screen, so anything outside `1000–1400px` will not be seen there.
Props, flowers and shadows can run to the edges; the bottle cannot.

### Phone banner (1200 × 1000)

| | Keep the bottle within |
| --- | --- |
| Horizontally | the middle **86%** — x from **85px to 1115px** |
| Vertically | **120px to 880px** (12% clear at top and bottom) |

Much more forgiving, because the shapes nearly match.

**The 12% clear space matters.** The last set of artwork had the bottle at 5%
from the top edge. Nothing was technically cropped, but with almost no margin it
still read as cut. Give it room to breathe.

---

## Everything else

- **Format**: JPEG at quality 85, or PNG. The site converts to WebP itself, so
  send the best quality available rather than something already compressed.
- **Colour**: sRGB.
- **Tone**: these sit behind a dark transparency with white text over the left
  third, so a darker or lower contrast shot works better than a bright one. Keep
  the left third free of detail that matters.
- **Naming**: `banner-<page>-wide.jpg` and `banner-<page>-mobile.jpg`.

---

## The thirteen banners

| Page | File names |
| --- | --- |
| All Fragrances | `banner-fragrances-wide.jpg` / `-mobile.jpg` |
| Bestsellers | `banner-bestsellers-…` |
| For Her | `banner-for-her-…` |
| For Him | `banner-for-him-…` |
| Gifts & Sets | `banner-gifts-…` |
| Signature | `banner-signature-…` |
| Nyonya | `banner-nyonya-…` |
| 3 Wishes | `banner-3wishes-…` |
| Spirit | `banner-spirit-…` |
| Stores | `banner-stores-…` |
| Our Story | `banner-our-story-…` |
| Journal | `banner-journal-…` |
| Contact | `banner-contact-…` |

---

## Until the artwork arrives

The site is not waiting on any of it. `scripts/prepare-assets.py` generates both
crops from whatever the delivery holds: the wide one at 3:1 with the subject
found and placed inside a safe band, and the phone one at 1.2:1 cropped around
the same subject. For Her and For Him currently use the client's own wide crops,
which are already the right shape, with phone crops derived from the original
photography.

Artwork that follows this specification simply replaces the generated version
and will always look better, because a person framed it.
