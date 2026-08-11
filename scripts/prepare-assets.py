"""
Normalise the client's delivery in `client-assets/Legendary digital/` into
web-ready assets under `public/assets/client/`.

The source folder ships 8000px PNGs, a 28MB .mov and filenames containing
spaces plus invisible U+2060 word-joiners, so nothing in it can be referenced
from the app directly. Files are matched by substring rather than exact name.

The originals deliberately live OUTSIDE `public/` — Vite copies `public/`
verbatim into `dist/`, so keeping them there would publish ~500MB of source
artwork plus the .docx price sheets on the live site.

Run:  python scripts/prepare-assets.py
Needs: Pillow, PyMuPDF, ffmpeg on PATH.
"""

from __future__ import annotations

import os
import re
import shutil
import subprocess
import sys
import unicodedata

from PIL import Image

Image.MAX_IMAGE_PIXELS = None

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "client-assets", "Legendary digital")
OUT = os.path.join(ROOT, "public", "assets", "client")

INVISIBLE = dict.fromkeys(map(ord, "⁠​‎‏﻿"), None)

# House gold, used to tint the supplied black line art.
GOLD = (176, 141, 62)


def norm(s: str) -> str:
    """Lowercase, strip invisible codepoints and collapse whitespace."""
    return re.sub(r"\s+", " ", unicodedata.normalize("NFC", s).translate(INVISIBLE)).strip().lower()


def resolve_dir(subdir: str) -> str:
    """Walk SRC/subdir one segment at a time, matching normalised folder names.

    Several client folders are named e.g. "3.0 ⁠Mahsuri" with a leading
    word-joiner, so an exact os.path.join never resolves.
    """
    path = SRC
    for segment in subdir.split("/"):
        if not segment:
            continue
        direct = os.path.join(path, segment)
        if os.path.isdir(direct):
            path = direct
            continue
        target = norm(segment)
        matches = [d for d in os.listdir(path) if os.path.isdir(os.path.join(path, d)) and norm(d) == target]
        if not matches:
            raise FileNotFoundError(f"no such source dir: {subdir} (at {segment!r})")
        path = os.path.join(path, matches[0])
    return path


def find(subdir: str, *needles: str) -> str:
    """First file under SRC/subdir whose normalised name contains every needle."""
    base = resolve_dir(subdir)
    wanted = [norm(n) for n in needles]
    for entry in sorted(os.listdir(base)):
        name = norm(entry)
        if all(w in name for w in wanted):
            return os.path.join(base, entry)
    raise FileNotFoundError(f"{subdir} :: {needles}")


# --------------------------------------------------------------------------
# Writers
# --------------------------------------------------------------------------

def save_webp(src: str, dest: str, max_side: int, quality: int = 82, keep_alpha: bool = False) -> None:
    im = Image.open(src)
    if keep_alpha:
        im = im.convert("RGBA")
        im = trim_alpha(im)
    else:
        if im.mode in ("RGBA", "LA", "P"):
            im = im.convert("RGBA")
            flat = Image.new("RGB", im.size, (255, 255, 255))
            flat.paste(im, mask=im.split()[-1])
            im = flat
        im = im.convert("RGB")
    if max(im.size) > max_side:
        scale = max_side / max(im.size)
        im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    write(im, dest, quality=quality)


def save_cutout(src: str, dest: str, max_side: int, quality: int = 84) -> None:
    """A transparent product cut-out, kept as lossy WebP with its alpha intact.

    The client's "…Website.png" and "…What you get.png" artboards are 3800px to
    8300px RGBA files of 2MB to 20MB each. Lossy WebP keeps the alpha channel,
    so the cut-out still sits on the tile's accent gradient, at a tenth of the
    weight of the equivalent PNG.
    """
    im = Image.open(src).convert("RGBA")
    if max(im.size) > max_side:
        scale = max_side / max(im.size)
        im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    if im.getchannel("A").getextrema() == (255, 255):
        # A few artboards (Spirit II's flat-lay among them) ship opaque on white.
        im = ground_to_alpha(im)
    im = trim_alpha(im)
    write(im, dest, quality=quality)


def ground_to_alpha(im: Image.Image, thresh: int = 26) -> Image.Image:
    """Knock out only the white that touches the artboard edge.

    A blanket "white becomes transparent" pass would punch holes through the
    white paper bag and gift boxes inside these flat-lays, so the fill starts
    from the four corners and stops at the product edges.
    """
    from PIL import ImageDraw

    KEY = (255, 0, 255)
    rgb = im.convert("RGB")
    w, h = rgb.size
    for seed in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)):
        if sum(rgb.getpixel(seed)) < 690:  # corner is not near-white: leave it
            continue
        ImageDraw.floodfill(rgb, seed, KEY, thresh=thresh)
    keyed = rgb.point(lambda v: v)  # materialise
    mask = Image.new("L", rgb.size, 255)
    px, mp = keyed.load(), mask.load()
    for y in range(h):
        for x in range(w):
            if px[x, y] == KEY:
                mp[x, y] = 0
    out = im.copy()
    out.putalpha(mask)
    return out


def write(im: Image.Image, dest: str, quality: int = 82) -> None:
    path = os.path.join(OUT, dest)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    if dest.endswith(".png"):
        im.save(path, "PNG", optimize=True)
    else:
        im.save(path, "WEBP", quality=quality, method=6)
    report(path)


def trim_alpha(im: Image.Image) -> Image.Image:
    box = im.getchannel("A").getbbox()
    return im.crop(box) if box else im


def opaque_to_alpha(im: Image.Image, threshold: int = 238) -> Image.Image:
    """Knock a flat near-white background out of artwork that ships opaque."""
    im = im.convert("RGBA")
    if im.getchannel("A").getextrema() != (255, 255):
        return im  # already has real transparency
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, _ = px[x, y]
            if r > threshold and g > threshold and b > threshold:
                px[x, y] = (0, 0, 0, 0)
    return im


def tinted_line_art(src: str, dest: str, max_side: int, colour: tuple[int, int, int] = GOLD) -> None:
    """Client icons are black line art on flat white.

    Knock the white out and repaint the strokes in the house gold, so the mood
    tiles and the perfume roundel read as one set with the drawn SVG icons.
    """
    im = Image.open(src).convert("RGBA")
    lum = im.convert("L")
    # Ink coverage becomes the alpha channel, keeping the anti-aliasing.
    alpha = Image.eval(lum, lambda v: 255 - v)
    if im.getchannel("A").getextrema() != (255, 255):
        # Artwork already has transparency: respect it as well as the ink.
        alpha = Image.eval(
            Image.merge("L", (alpha,)), lambda v: v
        )
        alpha = Image.composite(alpha, Image.new("L", im.size, 0), im.getchannel("A"))
    out = Image.new("RGBA", im.size, colour + (0,))
    out.putalpha(alpha)
    out = trim_alpha(out)
    if max(out.size) > max_side:
        scale = max_side / max(out.size)
        out = out.resize((round(out.width * scale), round(out.height * scale)), Image.LANCZOS)
    write(out, dest)


def flat_fill(src: str, dest: str, max_side: int, colour: tuple[int, int, int] = (255, 255, 255)) -> None:
    """Repaint a supplied silhouette in a flat colour, keeping its own alpha.

    The perfume bottle mark ships as a white cut-out, which is invisible in a
    contact sheet but correct in place: it sits inside the gold concierge
    roundel. Recolouring here rather than with a CSS filter keeps the edges
    clean at every size.
    """
    im = Image.open(src).convert("RGBA")
    alpha = im.getchannel("A")
    out = Image.new("RGBA", im.size, colour + (0,))
    out.putalpha(alpha)
    out = trim_alpha(out)
    if max(out.size) > max_side:
        scale = max_side / max(out.size)
        out = out.resize((round(out.width * scale), round(out.height * scale)), Image.LANCZOS)
    write(out, dest)


def logo_mask(src: str, dest: str, max_side: int, page: int = 0) -> None:
    """Turn a black-on-white logo artboard into a tintable alpha mask.

    Kept as a mask rather than a coloured PNG so one file serves the ivory
    header, the ink header and the gilt intro curtain.
    """
    import fitz

    doc = fitz.open(src)
    pix = doc[page].get_pixmap(matrix=fitz.Matrix(4, 4), alpha=False)
    im = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    alpha = Image.eval(im.convert("L"), lambda v: 255 - v)
    out = Image.new("RGBA", im.size, (255, 255, 255, 0))
    out.putalpha(alpha)
    out = trim_alpha(out)
    if max(out.size) > max_side:
        scale = max_side / max(out.size)
        out = out.resize((round(out.width * scale), round(out.height * scale)), Image.LANCZOS)
    write(out, dest)


def script_mask(src: str, dest: str, max_side: int) -> None:
    """"the legend of scent" ships as white script on a flat grey artboard.

    The client asked for that grey box gone. Reading the artboard's own
    background colour and scaling luminance above it into alpha lifts the
    script off cleanly and keeps the hairline strokes anti-aliased.
    """
    import fitz

    doc = fitz.open(src)
    pix = doc[0].get_pixmap(matrix=fitz.Matrix(4, 4), alpha=False)
    im = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    # The white lockup sits on the lower half of the artboard. Inset a little
    # so the artboard's own 1px lighter rule does not survive as a hairline.
    pad = max(4, round(im.width * 0.004))
    im = im.crop((pad, round(im.height * 0.52), im.width - pad, im.height - pad))
    lum = im.convert("L")
    # Sample the grey box along its own border. The fill is not perfectly flat,
    # so anything within a tolerance of that value is treated as background;
    # without the deadzone the whole rectangle survives as a faint wash.
    w, h = lum.size
    edge = [lum.getpixel(p) for p in ((2, 2), (w - 3, 2), (2, h - 3), (w - 3, h - 3), (w // 2, 2))]
    ground = sorted(edge)[len(edge) // 2]
    floor = ground + 20
    span = max(1, 255 - floor)
    alpha = Image.eval(lum, lambda v: 0 if v <= floor else min(255, round((v - floor) * 255 / span)))
    out = Image.new("RGBA", im.size, (255, 255, 255, 0))
    out.putalpha(alpha)
    out = trim_alpha(out)
    if max(out.size) > max_side:
        scale = max_side / max(out.size)
        out = out.resize((round(out.width * scale), round(out.height * scale)), Image.LANCZOS)
    write(out, dest)


def brand_mark(src: str, dest: str, max_side: int, pad: float = 0.06) -> None:
    """A partner or stockist logo, knocked out onto transparency and padded."""
    im = opaque_to_alpha(Image.open(src))
    im = trim_alpha(im)
    if max(im.size) > max_side:
        scale = max_side / max(im.size)
        im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    m = round(max(im.size) * pad)
    canvas = Image.new("RGBA", (im.width + m * 2, im.height + m * 2), (255, 255, 255, 0))
    canvas.paste(im, (m, m))
    write(canvas, dest)


def silhouette(src: str, dest: str, max_side: int) -> None:
    """Turn flat black-on-white artwork into a tintable alpha silhouette.

    The supplied map is opaque white behind black land, which cannot sit on the
    dark section. Inverting luminance into the alpha channel keeps the coastline
    anti-aliasing intact and lets CSS mask-image paint the land any colour.
    The canvas is NOT trimmed — pin positions are percentages of it.
    """
    im = Image.open(src).convert("RGB")
    if max(im.size) > max_side:
        scale = max_side / max(im.size)
        im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    lum = im.convert("L")
    alpha = Image.eval(lum, lambda v: 255 - v)
    out = Image.new("RGBA", im.size, (255, 255, 255, 0))
    out.putalpha(alpha)
    write(out, dest)


def transcode(
    src: str, dest: str, width: int = 1920, crf: int = 27, duration: float | None = None
) -> None:
    """Transcode for web. `duration` trims the tail (used to drop the end card)."""
    path = os.path.join(OUT, dest)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-i", src]
    if duration is not None:
        cmd += ["-t", str(duration)]
    cmd += [
        "-an",
        "-vf", f"scale={width}:-2",
        "-c:v", "libx264", "-crf", str(crf), "-preset", "slow",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart",
        path,
    ]
    subprocess.run(cmd, check=True)
    report(path)


def report(path: str) -> None:
    kb = os.path.getsize(path) / 1024
    print(f"  {os.path.relpath(path, ROOT).replace(os.sep, '/'):<52} {kb:>8.0f} KB")


# --------------------------------------------------------------------------
# Source map — one entry per asset the site actually references.
# --------------------------------------------------------------------------

HOME = "1.0 HOME"
COLL = "2.0 FRAGRANCES/Collections"
SHOP = "2.0 FRAGRANCES/Shop"
BANNER = "Banner Photo (ENLARGED)"

# id -> (source folder, radar "Asset NN", bloom "Legendary-NN" or None)
PRODUCTS = {
    "orchid":            (f"{COLL}/1.Signature/1.0 Orchid",   "asset 18", "legendary-01"),
    "violet":            (f"{COLL}/1.Signature/2.0 Violet",   "asset 19", "legendary-03"),
    "mahsuri":           (f"{COLL}/1.Signature/3.0 Mahsuri",  "asset 20", "legendary-05"),
    "man":               (f"{COLL}/1.Signature/4.0 Man",      "asset 21", "legendary-04"),
    "kebaya-blooms":     (f"{COLL}/2.Nyonya/Kebaya Blooms",   "asset 26", "legendary-08"),
    "ondeh-delights":    (f"{COLL}/2.Nyonya/Ondeh Delights",  "asset 25", "legendary-09"),
    "nyonya-aromatic":   (f"{COLL}/2.Nyonya/Nyonya Aromatic", "asset 24", "legendary-10"),
    "3-wishes":          (f"{COLL}/3.3 Wishes/3 Wishes",      "asset 31", None),
    "spirit":            (f"{COLL}/4.Spirit/Spirit 1",        "asset 23", None),
    "spirit-ii":         (f"{COLL}/4.Spirit/Spirit 2",        "asset 28", None),
    "spirit-travel-kit": (f"{COLL}/4.Spirit/Travel Kit",      None,       None),
}

# The pack shot is a transparent cut-out so the tile's SKU gradient shows
# through it. Filenames are inconsistent across the delivery, hence the needles.
PACK_NEEDLES = {
    "orchid":            ("orchid website",),
    "violet":            ("violet website",),
    "mahsuri":           ("mahsuri.png",),
    "man":               ("man website",),
    "kebaya-blooms":     ("kebaya blooms website",),
    "ondeh-delights":    ("ondeh delights website",),
    "nyonya-aromatic":   ("nyonya aromatic website",),
    "3-wishes":          ("3 wishes website",),
    "spirit":            ("spirit 1 website",),
    "spirit-ii":         ("spirit 2 website",),
    "spirit-travel-kit": ("travel kit_spirit 1 website", ".png"),
}

# The travel kit folder holds only its own lifestyle shot and pack cut-out, so
# the box shot and the "what you get" flat-lay come from Spirit I.
FALLBACK_FOLDER = {"spirit-travel-kit": f"{COLL}/4.Spirit/Spirit 1"}


def find_or_fallback(pid: str, folder: str, *needles: str) -> str:
    """Look in the product's own folder first, then its fallback."""
    try:
        return find(folder, *needles)
    except FileNotFoundError:
        fallback = FALLBACK_FOLDER.get(pid)
        if not fallback:
            raise
        return find(fallback, *needles)

# Sets whose composition band repeats once per fragrance in the box.
# (product id, source folder) -> [(slug, radar needle, bloom needle)]
VARIANTS = {
    "spirit": (
        f"{COLL}/4.Spirit/Spirit 1",
        [("hope", "asset 23", "hope"), ("love", "asset 22", "love"), ("confidence", "asset 27", "confidence")],
    ),
    "spirit-travel-kit": (
        f"{COLL}/4.Spirit/Spirit 1",
        [("hope", "asset 23", "hope"), ("love", "asset 22", "love"), ("confidence", "asset 27", "confidence")],
    ),
    "spirit-ii": (
        f"{COLL}/4.Spirit/Spirit 2",
        [("passion", "asset 28", "passion"), ("life", "asset 30", "life"), ("dream", "asset 29", "dream")],
    ),
    "3-wishes": (
        f"{COLL}/3.3 Wishes/3 Wishes",
        [("wish-i", "asset 31", "wish i.png"), ("wish-ii", "asset 32", "wish ii.png"), ("wish-iii", "asset 33", "wish iii.png")],
    ),
}

BANNERS = {
    "fragrances":  (f"{SHOP}/1.All Fragrances/{BANNER}", "all fragrances"),
    "bestsellers": (f"{SHOP}/2.Bestsellers/{BANNER}",    "bestsellers"),
    "gifts":       (f"{SHOP}/5.Gifts & Sets/{BANNER}",   "gift"),
    "stores":      (f"3.0 STORES/{BANNER}",              "stores"),
    "our-story":   (f"4.0 OUR STORY/{BANNER}",           "our story"),
    "journal":     (f"5.0 JOURNAL/{BANNER}",             "journal"),
    "contact":     (f"6.0 CONTACT/{BANNER}",             "contact"),
    "signature":   (f"{COLL}/1.Signature/{BANNER}",      "signature"),
    "nyonya":      (f"{COLL}/2.Nyonya/{BANNER}",         "nyonya"),
    "3wishes":     (f"{COLL}/3.3 Wishes/{BANNER}",       "3wishes"),
    "spirit":      (f"{COLL}/4.Spirit/{BANNER}",         "spirit"),
}

MOODS = {
    "serene":   (f"{HOME}/What mood are you wearing today_/1.Serene",   "serene"),
    "bold":     (f"{HOME}/What mood are you wearing today_/2.Bold",     "bold"),
    "romantic": (f"{HOME}/What mood are you wearing today_/3.Romantic", "romantic"),
    "playful":  (f"{HOME}/What mood are you wearing today_/4.Playful",  "playful"),
}

# The four collection covers the client re-shot for "Four worlds, bottled".
COLLECTION_COVERS = {
    "signature": (f"{HOME}/Four worlds, bottled/Signature", "home-signature"),
    "nyonya":    (f"{HOME}/Four worlds, bottled/Nyonya",    "home-nyonya"),
    "3-wishes":  (f"{HOME}/Four worlds, bottled/3 Wishes",  "home-3 wishes"),
    "spirit":    (f"{HOME}/Four worlds, bottled/Spirit",    "home-spirit"),
}

# Cards on the "Every scent is born of a place" map.
PLACES = {
    "melaka":        (f"{HOME}/Every scent is born of a place/Melaka",        "home-nyonya"),
    "kota-kinabalu": (f"{HOME}/Every scent is born of a place/Kota Kinabalu", "home-spirit"),
}

PARTNERS = {
    "airasia":          (f"{HOME}/Partnered with/AirAsia",          "airasia logo_red"),
    "bsas":             (f"{HOME}/Partnered with/BSAS",             "bsas"),
    "ctrip":            (f"{HOME}/Partnered with/Ctrip",            "ctrip"),
    "eraman":           (f"{HOME}/Partnered with/Eraman",           "eraman logo"),
    "honor":            (f"{HOME}/Partnered with/Honor",            "honor"),
    "isetan":           (f"{HOME}/Partnered with/ISETAN",           "isetan"),
    "parkson-elite":    (f"{HOME}/Partnered with/Parkson Elite",    "parkson"),
    "sasa":             (f"{HOME}/Partnered with/SaSa",             "sasa"),
    "segi":             (f"{HOME}/Partnered with/SEGI",             "segi"),
    "seibu":            (f"{HOME}/Partnered with/Seibu TRX",        "seibu"),
    "sogo":             (f"{HOME}/Partnered with/SOGO",             "kl-black"),
    "tourism-malaysia": (f"{HOME}/Partnered with/Tourism Malaysia", "tourism"),
    "valiram":          (f"{HOME}/Partnered with/Valiram",          "valiram"),
    "watsons":          (f"{HOME}/Partnered with/Watsons/Watsons",  "watsons"),
}

SELLERS = {
    "airasia":            ("3.0 STORES/Trusted Sellers/AirAsia",              "airasia logo_red"),
    "beauty-scent":       ("3.0 STORES/Trusted Sellers/Beauty Scent",         "beauty"),
    "colours-fragrances": ("3.0 STORES/Trusted Sellers/Colours & Fragrances", "logo-cf"),
    "discover-malaysia":  ("3.0 STORES/Trusted Sellers/Discover Malaysia",    "discover malaysia logo"),
    "eraman":             ("3.0 STORES/Trusted Sellers/Eraman",               "eraman logo"),
    "parkson":            ("3.0 STORES/Trusted Sellers/Parkson Elite",        "parkson.png"),
    "sasa":               ("3.0 STORES/Trusted Sellers/SaSa",                 "sasa"),
    "seibu":              ("3.0 STORES/Trusted Sellers/Seibu TRX",            "seibu"),
    "sogo":               ("3.0 STORES/Trusted Sellers/SOGO",                 "kl-black"),
    "star-glory":         ("3.0 STORES/Trusted Sellers/Star Glory",           "star-glory"),
    "watsons":            ("3.0 STORES/Trusted Sellers/Watsons/Watsons",      "watsons"),
    "zapin":              ("3.0 STORES/Trusted Sellers/Zapin",                "black logo"),
}

JOURNEY_YEARS = ["2015", "2016", "2017", "2018", "2019", "2022", "2023", "2024", "2025"]


def main() -> int:
    if not os.path.isdir(SRC):
        print(f"error: client delivery not found at {SRC}", file=sys.stderr)
        return 1
    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    os.makedirs(OUT, exist_ok=True)

    print("Brand marks")
    logos = os.path.join(SRC, "Legendary Logo")
    logo_mask(os.path.join(logos, "Legendary logo.pdf"), "logo-legendary.png", 1400)
    script_mask(os.path.join(logos, "the legend of scent.pdf"), "wordmark-scent.png", 1200)

    print("Scented-memory map")
    silhouette(os.path.join(ROOT, "public", "map.webp"), "map-malaysia.png", 1400)

    print("Icons")
    # The bottle mark rides inside the gold concierge roundel, so it stays white.
    flat_fill(find(f"{HOME}/ICON/Perfume Icon", "perfume icon", ".png"), "icon-perfume.png", 360)
    for key, (folder, needle) in MOODS.items():
        tinted_line_art(find(folder, needle), f"mood-{key}.png", 320)

    print("Home sections")
    save_webp(find(f"{HOME}/Orchid — the scent that began it all", "home-orchid"), "signature-orchid.webp", 1600)
    save_webp(find(f"{HOME}/A house rooted in Malaysian soul", "home-nyonya"), "heritage-nyonya.webp", 1800)

    print("Collection covers")
    for key, (folder, needle) in COLLECTION_COVERS.items():
        save_webp(find(folder, needle), f"collection-{key}.webp", 1600)

    print("Scented-memory cards")
    for key, (folder, needle) in PLACES.items():
        save_webp(find(folder, needle), f"place-{key}.webp", 1200)

    print("Partner logos")
    for key, (folder, needle) in PARTNERS.items():
        brand_mark(find(folder, needle), f"partner-{key}.png", 340)

    print("Stockist logos")
    for key, (folder, needle) in SELLERS.items():
        brand_mark(find(folder, needle), f"seller-{key}.png", 340)

    print("Products")
    for pid, (folder, radar, bloom) in PRODUCTS.items():
        save_webp(find_or_fallback(pid, folder, "travel kit.jpg")
                  if pid == "spirit-travel-kit"
                  else find(folder, "lifestyle picture"), f"p-{pid}-life.webp", 1400)
        save_webp(find_or_fallback(pid, folder, "white background box"), f"p-{pid}-box.webp", 1400)
        save_cutout(find(folder, *PACK_NEEDLES[pid]), f"p-{pid}-pack.webp", 1400)
        # Client note: the "What's included" flat-lay must sit on transparency
        # so the panel's own paper colour carries through behind it.
        save_cutout(find_or_fallback(pid, folder, "what you get"), f"p-{pid}-included.webp", 1600)
        if radar:
            save_webp(find(folder, radar), f"p-{pid}-radar.webp", 1100, keep_alpha=True)
        if bloom:
            save_webp(find(folder, bloom), f"p-{pid}-bloom.webp", 1000, keep_alpha=True)

    print("Set variants")
    for pid, (folder, entries) in VARIANTS.items():
        for slug, radar, bloom in entries:
            save_webp(find(folder, radar), f"p-{pid}-{slug}-radar.webp", 1100, keep_alpha=True)
            save_webp(find(folder, bloom), f"p-{pid}-{slug}-bloom.webp", 1000, keep_alpha=True)

    print("Page banners")
    for key, (folder, needle) in BANNERS.items():
        save_webp(find(folder, needle), f"banner-{key}.webp", 2000, quality=78)

    print("Our Story journey")
    for year in JOURNEY_YEARS:
        save_webp(find("4.0 OUR STORY/The Journey", year), f"journey-{year}.webp", 1000)

    print("Hero video")
    # The source fades to a Legendary end card at ~11.4s. The client asked for
    # that logo card cut, so the clip stops just before the fade begins.
    transcode(
        find(f"{HOME}/A Scented Memory of Malaysia", "home page video"),
        "home-hero.mp4",
        duration=11.3,
    )

    total = sum(
        os.path.getsize(os.path.join(dp, f))
        for dp, _, fs in os.walk(OUT)
        for f in fs
    )
    print(f"\nDone — {total / 1048576:.1f} MB in public/assets/client/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
