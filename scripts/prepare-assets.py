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
    path = os.path.join(OUT, dest)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    im.save(path, "WEBP", quality=quality, method=6)
    report(path)


def trim_alpha(im: Image.Image) -> Image.Image:
    box = im.getchannel("A").getbbox()
    return im.crop(box) if box else im


def white_to_alpha(src: str, dest: str, max_side: int, threshold: int = 238) -> None:
    """Client mood icons are black line art on flat white; knock the white out."""
    im = Image.open(src).convert("RGBA")
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, _ = px[x, y]
            if r > threshold and g > threshold and b > threshold:
                px[x, y] = (0, 0, 0, 0)
    im = trim_alpha(im)
    if max(im.size) > max_side:
        scale = max_side / max(im.size)
        im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    path = os.path.join(OUT, dest)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    im.save(path, "PNG", optimize=True)
    report(path)


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
    path = os.path.join(OUT, dest)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    out.save(path, "PNG", optimize=True)
    report(path)


def render_pdf(src: str, dest: str, zoom: float, crop: tuple[float, float, float, float] | None = None) -> None:
    import fitz

    doc = fitz.open(src)
    pix = doc[0].get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=True)
    im = Image.frombytes("RGBA", (pix.width, pix.height), pix.samples)
    if crop:
        l, t, r, b = crop
        im = im.crop((round(im.width * l), round(im.height * t), round(im.width * r), round(im.height * b)))
    im = trim_alpha(im)
    path = os.path.join(OUT, dest)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    im.save(path, "PNG", optimize=True)
    report(path)


def transcode(src: str, dest: str, width: int = 1920, crf: int = 27) -> None:
    path = os.path.join(OUT, dest)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    subprocess.run(
        [
            "ffmpeg", "-y", "-loglevel", "error", "-i", src,
            "-an",
            "-vf", f"scale={width}:-2",
            "-c:v", "libx264", "-crf", str(crf), "-preset", "slow",
            "-pix_fmt", "yuv420p", "-movflags", "+faststart",
            path,
        ],
        check=True,
    )
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

# id -> (folder with box/lifestyle, radar "Asset NN", bloom "Legendary-NN", what-you-get folder)
PRODUCTS = {
    "orchid":          (f"{COLL}/1.Signature/1.0 Orchid",        "asset 18", "legendary-01", None),
    "violet":          (f"{COLL}/1.Signature/2.0 Violet",        "asset 19", "legendary-03", None),
    "mahsuri":         (f"{COLL}/1.Signature/3.0 Mahsuri",       "asset 20", "legendary-05", None),
    "man":             (f"{COLL}/1.Signature/4.0 Man",           "asset 21", "legendary-04", None),
    "kebaya-blooms":   (f"{COLL}/2.Nyonya/Kebaya Blooms",        "asset 26", "legendary-08", None),
    "ondeh-delights":  (f"{COLL}/2.Nyonya/Ondeh Delights",       "asset 25", "legendary-09", None),
    "nyonya-aromatic": (f"{COLL}/2.Nyonya/Nyonya Aromatic",      "asset 24", "legendary-10", None),
    "3-wishes":        (f"{COLL}/3.3 Wishes/3 Wishes",           "asset 31", None,           None),
    "spirit":          (f"{COLL}/4.Spirit/Spirit 1",             "asset 22", None,           None),
}

BANNERS = {
    "fragrances":  (f"{SHOP}/1.All Fragrances/Banner Photo", "all fragrances"),
    "bestsellers": (f"{SHOP}/2.Bestsellers/Banner Photo",    "bestsellers"),
    "gifts":       (f"{SHOP}/5.Gifts & Sets/Banner Photo",   "gift"),
    "stores":      ("3.0 STORES/Banner Photo",               "stores"),
    "our-story":   ("4.0 OUR STORY/Banner Photo",            "our story"),
    "journal":     ("5.0 JOURNAL/Banner Photo",              "journal"),
    "contact":     ("6.0 CONTACT/Banner Photo",              "contact"),
    "signature":   (f"{COLL}/1.Signature/Banner Photo",      "signature"),
    "nyonya":      (f"{COLL}/2.Nyonya/Banner Photo",         "nyonya"),
    "3wishes":     (f"{COLL}/3.3 Wishes/Banner Photo",       "3wishes"),
}

MOODS = {
    "serene":   (f"{HOME}/What mood are you wearing today_/1.Serene",   "serene"),
    "bold":     (f"{HOME}/What mood are you wearing today_/2.Bold",     "bold"),
    "romantic": (f"{HOME}/What mood are you wearing today_/3.Romantic", "romantic"),
    "playful":  (f"{HOME}/What mood are you wearing today_/4.Playful",  "playful"),
}

JOURNEY_YEARS = ["2015", "2016", "2017", "2018", "2019", "2022", "2023"]


def main() -> int:
    if not os.path.isdir(SRC):
        print(f"error: client delivery not found at {SRC}", file=sys.stderr)
        return 1
    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    os.makedirs(OUT, exist_ok=True)

    print("Brand marks")
    logo = os.path.join(SRC, "Legendary Logo", "the legend of scent.pdf")
    # The supplied artboard stacks a dark lockup over a white one.
    render_pdf(logo, "wordmark-scent-dark.png", 3.0, crop=(0, 0.0, 1, 0.52))
    render_pdf(logo, "wordmark-scent-light.png", 3.0, crop=(0, 0.52, 1, 1.0))

    print("Scented-memory map")
    silhouette(os.path.join(ROOT, "public", "map.webp"), "map-malaysia.png", 1400)

    print("Icons")
    save_webp(find(f"{HOME}/ICON/Perfume Icon", "perfume icon", ".png"), "icon-perfume.webp", 420, keep_alpha=True)
    save_webp(find(f"{HOME}/ICON/Vial Icon", "website vial", ".png"), "icon-vial.webp", 420, keep_alpha=True)
    for key, (folder, needle) in MOODS.items():
        white_to_alpha(find(folder, needle), f"mood-{key}.png", 320)

    print("Home sections")
    save_webp(find(f"{HOME}/Orchid — the scent that began it all", "orchid"), "signature-orchid.webp", 1600)
    save_webp(find(f"{HOME}/A house rooted in Malaysian soul", "home-nyonya"), "heritage-nyonya.webp", 1800)
    save_webp(find(f"{HOME}/The Art of Gifting", "wishes"), "gifting-wishes.webp", 1800)

    print("Collection covers")
    save_webp(find(f"{HOME}/Four worlds, bottled/Signature", "signature family"), "collection-signature.webp", 1600)
    save_webp(find(f"{HOME}/Four worlds, bottled/Spirit", "spirit 1,2 family"), "collection-spirit.webp", 1600)
    save_webp(find(f"{HOME}/Four worlds, bottled/3 Wishes", "photo-01"), "collection-3-wishes.webp", 1600)
    save_webp(find(f"{COLL}/2.Nyonya/Banner Photo", "nyonya"), "collection-nyonya.webp", 1600)

    print("Products")
    for pid, (folder, radar, bloom, _) in PRODUCTS.items():
        save_webp(find(folder, "lifestyle picture"), f"p-{pid}-life.webp", 1400)
        save_webp(find(folder, "white background box"), f"p-{pid}-box.webp", 1400)
        save_webp(find(folder, "what you get"), f"p-{pid}-included.webp", 1500)
        save_webp(find(folder, radar), f"p-{pid}-radar.webp", 1100, keep_alpha=True)
        if bloom:
            save_webp(find(folder, bloom), f"p-{pid}-bloom.webp", 1000, keep_alpha=True)

    print("Page banners")
    for key, (folder, needle) in BANNERS.items():
        save_webp(find(folder, needle), f"banner-{key}.webp", 2000, quality=78)

    print("Our Story journey")
    for year in JOURNEY_YEARS:
        save_webp(find("4.0 OUR STORY/The Journey", year), f"journey-{year}.webp", 1000)

    print("Hero video")
    transcode(find(f"{HOME}/A Scented Memory of Malaysia", "home page video"), "home-hero.mp4")

    total = sum(
        os.path.getsize(os.path.join(dp, f))
        for dp, _, fs in os.walk(OUT)
        for f in fs
    )
    print(f"\nDone — {total / 1048576:.1f} MB in public/assets/client/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
