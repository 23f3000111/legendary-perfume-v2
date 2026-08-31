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
Needs: Pillow, NumPy, PyMuPDF, ffmpeg on PATH.
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
# Revision 4 arrived as its own drop rather than a replacement delivery, so
# its files are read from here and everything else still comes from SRC.
AMD4 = os.path.join(ROOT, "client-assets", "amendment-4")
# Revision 6: For Her and For Him supplied again, this time already cropped to
# roughly 5:1 with the bottle close to full height. Nothing to re-frame.
AMD6 = os.path.join(ROOT, "client-assets", "amendment-6")
OUT = os.path.join(ROOT, "public", "assets", "client")

INVISIBLE = dict.fromkeys(map(ord, "⁠​‎‏﻿"), None)

# House gold, used to tint the supplied black line art.
GOLD = (176, 141, 62)


def norm(s: str) -> str:
    """Lowercase, strip invisible codepoints and collapse whitespace."""
    return re.sub(r"\s+", " ", unicodedata.normalize("NFC", s).translate(INVISIBLE)).strip().lower()


def resolve_dir(subdir: str, root: str = SRC) -> str:
    """Walk root/subdir one segment at a time, matching normalised folder names.

    Several client folders are named e.g. "3.0 ⁠Mahsuri" with a leading
    word-joiner, so an exact os.path.join never resolves.
    """
    path = root
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


def find(subdir: str, *needles: str, root: str = SRC) -> str:
    """First file under root/subdir whose normalised name contains every needle."""
    base = resolve_dir(subdir, root)
    wanted = [norm(n) for n in needles]
    for entry in sorted(os.listdir(base)):
        name = norm(entry)
        if all(w in name for w in wanted):
            return os.path.join(base, entry)
    raise FileNotFoundError(f"{subdir} :: {needles}")


def find4(subdir: str, *needles: str) -> str:
    """The same lookup, against the revision 4 drop."""
    return find(subdir, *needles, root=AMD4)


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


def subject_band(im: Image.Image, centre: float = 0.42, keep: float = 0.22) -> tuple[float, float]:
    """Where the product sits in a banner, top and bottom as fractions of height.

    The bottle is the sharpest thing in any of these frames: the backdrop is a
    soft gradient or a defocused set, and the glass carries hard specular edges.
    So each row is scored by the edge energy it carries across the middle of the
    frame, and the rows standing clear of that image's own baseline are the
    subject.

    Checked against two bands read by hand off a grid overlay: For Her measured
    0.245 to 0.80 and detects 0.258 to 0.787; For Him measured 0.165 to 0.79 and
    detects 0.178 to 0.792.
    """
    import numpy as np

    small = im.convert("L")
    small.thumbnail((1400, 1400), Image.LANCZOS)
    a = np.asarray(small, dtype=float)
    h, w = a.shape

    lo, hi = round(w * (0.5 - centre / 2)), round(w * (0.5 + centre / 2))
    strip = a[:, lo:hi]

    # Mean absolute gradient per row, both axes. Pillow's FIND_EDGES is a
    # sharper kernel and reads the soft fabric in the For Her frame as subject,
    # which is why this is done numerically rather than with a filter.
    gy = np.abs(np.diff(strip, axis=0)).mean(axis=1)
    gx = np.abs(np.diff(strip, axis=1)).mean(axis=1)[: len(gy)]
    score = gy + gx

    # Smooth, so one bright speck cannot pass for the subject.
    k = max(3, h // 60)
    score = np.convolve(score, np.ones(k) / k, mode="same")

    floor = float(np.percentile(score, 40))
    peak = float(score.max())
    if peak <= floor:
        return 0.0, 1.0
    hits = np.where(score > floor + (peak - floor) * keep)[0]
    if hits.size == 0:
        return 0.0, 1.0
    return float(hits.min()) / h, float(hits.max()) / h


def save_banner_mobile(
    src: str,
    dest: str,
    width: int = 1200,
    ratio: float = 1.2,
    quality: int = 80,
) -> None:
    """The same banner, cropped for a phone.

    A title bar on a phone is roughly square: about 390 by 400. A 4.5:1
    photograph can only fill that by magnifying itself four times over, which
    leaves a narrow vertical slice of an enormous bottle with its cap grazing
    the top edge. No amount of re-framing a wide image fixes that, because the
    problem is the shape rather than the placement.

    So a phone gets its own crop, taken from the original near 2:1 delivery
    rather than from the wide one, and framed at 1.2:1 with the subject centred
    and given room. `PageHeader` picks it up through a <picture> element.
    """
    im = Image.open(src)
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA")
        flat = Image.new("RGB", im.size, (255, 255, 255))
        flat.paste(im, mask=im.split()[-1])
        im = flat
    im = im.convert("RGB")

    height = round(width / ratio)
    top, bottom = subject_band(im)
    mid_y = (top + bottom) / 2

    # Fill the frame, then take the crop around the subject rather than the
    # middle of the photograph, which is rarely the same place.
    cover = max(width / im.width, height / im.height)
    big = im.resize((max(width, round(im.width * cover)), max(height, round(im.height * cover))), Image.LANCZOS)

    left = max(0, min(round((big.width - width) / 2), big.width - width))
    want_top = round(mid_y * big.height - height / 2)
    top_px = max(0, min(want_top, big.height - height))
    write(big.crop((left, top_px, left + width, top_px + height)), dest, quality=quality)


def save_banner(
    src: str,
    dest: str,
    width: int = 2400,
    ratio: float = 3.0,
    safe: float = 0.58,
    quality: int = 80,
) -> None:
    """A page banner, re-framed so its subject survives a wide title bar.

    The delivery shoots every banner at roughly 2:1 with the bottle close to
    full bleed top to bottom. A page header is nearer 3.5:1, so `object-fit:
    cover` scales the shot by width and takes the crop out of the height. The
    client's note, twice, was that the perfume was being cut off.

    Two things happen here rather than growing the header until a 2:1 frame
    fits, which would push the title bar off the bottom of a laptop screen:

    1. The frame is rebuilt at 3:1, with the width either side filled by a
       blown-up, blurred copy of the same shot and feathered into it. The
       extension carries the shot's own light rather than a flat band, and the
       header's dark scrim sits over the join.
    2. The product is placed inside a safe band. `subject_band` finds where the
       bottle actually is, and the frame is scaled and offset so that band sits
       centred and occupies no more than `safe` of the canvas height. A centre
       crop keeping at least that fraction therefore always holds the whole
       bottle, whatever the header's proportions turn out to be.

    `safe` is set below the tightest crop the header can produce, which measures
    0.688 at its most extreme, a wide and short window. The margin is deliberate:
    the subject band is found by a detector, and a detector that is a little out
    on one photograph should cost some breathing room rather than the base of a
    bottle. See PageHeader for where 0.688 comes from.
    """
    from PIL import ImageFilter

    im = Image.open(src)
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA")
        flat = Image.new("RGB", im.size, (255, 255, 255))
        flat.paste(im, mask=im.split()[-1])
        im = flat
    im = im.convert("RGB")

    height = round(width / ratio)

    # A little air, so the crop never lands exactly on the bottle's edge.
    top, bottom = subject_band(im)
    top, bottom = max(0.0, top - 0.02), min(1.0, bottom + 0.02)
    span = max(bottom - top, 0.05)

    # Scale and place so the subject ends up centred and no larger than `safe`
    # of the canvas height.
    #
    # Three limits, and the smallest wins:
    #
    #   safe / span     the subject must fit inside the safe band
    #   0.5 / mid       centring must not push the frame's top off the canvas
    #   0.5 / (1 - mid) nor its bottom
    #
    # The last two are what the first version of this got wrong. It scaled by
    # the first limit alone, which often left the scale at 1.0, and a frame
    # already filling the canvas has nowhere to shift to. The offset was then
    # clamped back to zero and the subject stayed exactly where it started: the
    # For Her bottle sat at 0.26 to 0.90 of the frame, so a wide crop took its
    # base off. Solving for all three means there is always room to move.
    subject_mid = (top + bottom) / 2
    scale = min(
        1.0,
        safe / span,
        0.5 / max(subject_mid, 1e-6),
        0.5 / max(1.0 - subject_mid, 1e-6),
    )

    inner_h = round(height * scale)
    inner_w = round(im.width * inner_h / im.height)
    inner = im.resize((inner_w, inner_h), Image.LANCZOS)

    # The subject's own centre on the canvas centre, and the frame stays inside
    # the canvas because the scale above guaranteed it fits.
    offset_y = round(height / 2 - subject_mid * inner_h)
    offset_y = max(0, min(offset_y, height - inner_h))
    offset_x = (width - inner_w) // 2

    cover = max(width / im.width, height / im.height)
    ground = im.resize((round(im.width * cover) + 2, round(im.height * cover) + 2), Image.LANCZOS)
    gx, gy = (ground.width - width) // 2, (ground.height - height) // 2
    ground = ground.crop((gx, gy, gx + width, gy + height)).filter(
        ImageFilter.GaussianBlur(max(8, width * 0.022))
    )

    # Feather every edge of the sharp frame into the blur, so no join reads as
    # a seam under the header's scrim.
    fx = max(24, round(inner_w * 0.06))
    fy = max(16, round(inner_h * 0.06))
    mask = Image.new("L", inner.size, 255)
    px = mask.load()
    for x in range(min(fx, inner_w // 2)):
        v = round(255 * x / fx)
        for y in range(inner_h):
            px[x, y] = min(px[x, y], v)
            px[inner_w - 1 - x, y] = min(px[inner_w - 1 - x, y], v)
    if inner_h < height:
        for y in range(min(fy, inner_h // 2)):
            v = round(255 * y / fy)
            for x in range(inner_w):
                px[x, y] = min(px[x, y], v)
                px[x, inner_h - 1 - y] = min(px[x, inner_h - 1 - y], v)

    ground.paste(inner, (offset_x, offset_y), mask)
    write(ground, dest, quality=quality)


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


def _padded(im: Image.Image, max_side: int, pad: float) -> Image.Image:
    im = trim_alpha(im)
    if max(im.size) > max_side:
        scale = max_side / max(im.size)
        im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    m = round(max(im.size) * pad)
    canvas = Image.new("RGBA", (im.width + m * 2, im.height + m * 2), (255, 255, 255, 0))
    canvas.paste(im, (m, m))
    return canvas


def ink_median(lum: Image.Image, alpha: Image.Image, cutoff: int = 110) -> float:
    """Median luminance of the solid ink, ignoring anti-aliased edges."""
    mask = alpha.point(lambda v: 255 if v > cutoff else 0)
    hist = lum.histogram(mask)
    total = sum(hist)
    if total == 0:
        mask = alpha.point(lambda v: 255 if v > 40 else 0)
        hist = lum.histogram(mask)
        total = sum(hist)
    if total == 0:
        return -1.0
    half, run = total / 2, 0
    for value, count in enumerate(hist):
        run += count
        if run >= half:
            return float(value)
    return 255.0


def monochrome(im: Image.Image, target: int = 46) -> Image.Image:
    """A legible black and white rendition of a partner logo.

    The client asked for the logo wall to sit in black and white and come up in
    real colour on hover. A plain CSS `grayscale(1)` cannot do it: half the
    supplied marks are gold or white cut-outs drawn for a dark ground, and
    desaturating those leaves a pale ghost on the ivory band. Parkson vanished
    outright.

    So the mono state is rendered here instead. The body of the mark is found as
    the median luminance of its solid ink, then a gamma curve pins that median
    to one house tone. Every logo therefore arrives at the same weight, while
    tones lighter or darker than the body keep their relative order: Watsons
    keeps its knocked-out white wordmark, SOGO keeps the rule under it darker
    than the mark above.
    """
    import math

    im = im.convert("RGBA")
    alpha = im.getchannel("A")
    lum = im.convert("L")

    mid = ink_median(lum, alpha)
    if mid < 0:
        return im

    # Only artwork that is essentially white, drawn to sit on a dark ground,
    # is read the other way up. Gold and pastel lockups are left alone: they
    # are already darker than ivory, and flipping them would turn the black
    # halves of two tone marks like Zapin white.
    if mid > 200:
        lum = Image.eval(lum, lambda v: 255 - v)
        mid = 255.0 - mid

    if mid > target:
        gamma = math.log(target / 255.0) / math.log(max(mid, 1.0) / 255.0)
        lut = [round(255 * (v / 255.0) ** gamma) for v in range(256)]
        lum = lum.point(lut)

    return Image.merge("RGBA", (lum, lum, lum, alpha))


def brand_mark(src: str, dest: str, max_side: int, pad: float = 0.06) -> None:
    """A partner or stockist logo, in real colour and in black and white.

    Writes two files: `dest` carries the supplied colours for the hover state,
    and `<dest stem>-mono.png` the black and white rendition the wall rests in.
    """
    im = opaque_to_alpha(Image.open(src))
    colour = _padded(im, max_side, pad)
    write(colour, dest)

    stem, ext = os.path.splitext(dest)
    write(_padded(monochrome(im), max_side, pad), f"{stem}-mono{ext}")


def passthrough(src: str, dest: str) -> None:
    """Copy an asset that already ships web ready.

    The sample vial is delivered as finished gold artwork on transparency, so
    unlike the black line art icons it needs no knock-out or re-tinting. It is
    still listed here rather than left sitting in public/, because this script
    empties public/assets/client before it writes.
    """
    path = os.path.join(OUT, dest)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    shutil.copyfile(src, path)
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
    write(out, dest)


def transcode(
    src: str, dest: str, width: int = 1280, crf: int = 26, duration: float | None = None
) -> None:
    """Transcode for web. `duration` trims the tail (used to drop the end card).

    Encoded conservatively so an iPhone will actually play it. The first pass
    produced High profile at level 5.0 and 1080p, which iOS is entitled to
    refuse; Main profile at level 4.0 is the widely supported floor and no
    phone will decline it. `yuv420p` is required rather than preferred: Safari
    plays nothing in 4:2:2 or 4:4:4.

    720p is plenty for a background clip behind a scrim, and halves what a
    visitor on mobile data has to fetch before anything moves.
    """
    path = os.path.join(OUT, dest)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-i", src]
    if duration is not None:
        cmd += ["-t", str(duration)]
    cmd += [
        "-an",
        "-vf", f"scale={width}:-2",
        "-c:v", "libx264", "-crf", str(crf), "-preset", "slow",
        "-profile:v", "main", "-level:v", "4.0",
        "-pix_fmt", "yuv420p",
        # The index has to precede the media or a phone will not begin until
        # the whole file has arrived.
        "-movflags", "+faststart",
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
    # Revision 4: the seven SKUs the client listed as missing from the shop.
    # The 3 Wishes 15ml singles, the 3 Wishes travel kit and the Spirit II
    # 50ml singles all have their own folders in the delivery already.
    "wish-i":              (f"{COLL}/3.3 Wishes/Wish 1",           "asset 31", "legendary-02"),
    "wish-ii":             (f"{COLL}/3.3 Wishes/Wish 2",           "asset 32", "legendary-06"),
    "wish-iii":            (f"{COLL}/3.3 Wishes/Wish 3",           "asset 33", "legendary-07"),
    "3-wishes-travel-kit": (f"{COLL}/3.3 Wishes/Travel Kit",       None,       None),
    # Named for the fragrance alone, the way the bottles are: prefixing them
    # "spirit-ii-" would collide with the Spirit II set's own per-fragrance art.
    "passion":             (f"{COLL}/4.Spirit/Spirit 2 - Passion", "asset 28", "copy of passion"),
    "life":                (f"{COLL}/4.Spirit/Spirit 2 - Life",    "asset 30", "copy of life"),
    "dream":               (f"{COLL}/4.Spirit/Spirit 2 - Dream",   "asset 29", "copy of dream"),
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
    "wish-i":              ("website_wish 1",),
    "wish-ii":             ("website_wish 2",),
    "wish-iii":            ("website_wish 3",),
    "3-wishes-travel-kit": ("travel kit_3 wishes website",),
    # The Spirit II singles ship their cut-outs named "Spirit 1_…", a client
    # typo; the folder they sit in is the authority.
    "passion":             ("passion website",),
    "life":                ("spirit 1_life",),
    "dream":               ("dream website",),
}

# The lifestyle shot is normally "lifestyle picture_<name>"; the two travel
# kits name theirs after the kit instead.
LIFE_NEEDLES = {
    "spirit-travel-kit":   ("travel kit.jpg",),
    "3-wishes-travel-kit": ("travel kit.jpg",),
}

# "What you get" flat-lays that only arrived with the revision 4 drop.
AMD4_INCLUDED = {
    "3-wishes-travel-kit": "Collections/3.3 Wishes/Travel Kit",
}

# The travel kit folder holds only its own lifestyle shot and pack cut-out, so
# the box shot and the "what you get" flat-lay come from Spirit I.
FALLBACK_FOLDER = {
    "spirit-travel-kit": f"{COLL}/4.Spirit/Spirit 1",
    "3-wishes-travel-kit": f"{COLL}/3.3 Wishes/3 Wishes",
}


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
    # The 3 Wishes travel kit holds the same three wishes, so it borrows their
    # charts and botanicals.
    "3-wishes-travel-kit": (
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

# Revision 4: For Her and For Him were the two shop views with no banner of
# their own in the original delivery, so they fell back to All Fragrances.
BANNERS_4 = {
    "for-her": ("", "banner photo_for her"),
    "for-him": ("", "banner photo_for him"),
}

# Banners the client cropped themselves. These are wider than any title bar the
# site produces, so `object-fit: cover` scales them by height and takes the crop
# out of the width, and the bottle is never cut top or bottom. That is a better
# answer than anything re-framing can do, so these pass straight through.
BANNERS_6 = {
    "for-her": "banner-for-her",
    "for-him": "banner-for-him",
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
    # Revision 5: the client asked for real logo colour on hover and named
    # SOGO Kuala Lumpur specifically, red over dark grey. The delivery holds
    # that file alongside the flat black and white ones; take the colour one.
    "sogo":             (f"{HOME}/Partnered with/SOGO",             "kl.png"),
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
    # The plain Parkson file is a white cut-out, invisible on the ivory band.
    # The gold lockup is the one that belongs on a light ground.
    "parkson":            ("3.0 STORES/Trusted Sellers/Parkson Elite",        "gold"),
    "sasa":               ("3.0 STORES/Trusted Sellers/SaSa",                 "sasa"),
    "seibu":              ("3.0 STORES/Trusted Sellers/Seibu TRX",            "seibu"),
    "sogo":               ("3.0 STORES/Trusted Sellers/SOGO",                 "kl.png"),
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
    # Complimentary Samples on the trust row. Already gold, so it passes through.
    passthrough(find(f"{HOME}/ICON/Vial Icon", "website vial", ".png"), "icon-vial.png")
    for key, (folder, needle) in MOODS.items():
        tinted_line_art(find(folder, needle), f"mood-{key}.png", 320)

    print("Home sections")
    save_webp(find(f"{HOME}/Orchid — the scent that began it all", "home-orchid"), "signature-orchid.webp", 1600)
    save_webp(find(f"{HOME}/A house rooted in Malaysian soul", "home-nyonya"), "heritage-nyonya.webp", 1800)
    # Revision 4: Our Story's "It started with a single flower" was reusing the
    # home page orchid shot; the client supplied its own photograph.
    save_webp(find4("", "it started with a single flower"), "about-beginning.webp", 1800)

    print("Collection covers")
    for key, (folder, needle) in COLLECTION_COVERS.items():
        # Revision 4 re-shot the Signature family photo.
        src = find4("", "home-signature") if key == "signature" else find(folder, needle)
        save_webp(src, f"collection-{key}.webp", 1600)

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
        life = LIFE_NEEDLES.get(pid, ("lifestyle picture",))
        save_webp(find_or_fallback(pid, folder, *life), f"p-{pid}-life.webp", 1400)
        save_webp(find_or_fallback(pid, folder, "white background box"), f"p-{pid}-box.webp", 1400)
        save_cutout(find(folder, *PACK_NEEDLES[pid]), f"p-{pid}-pack.webp", 1400)
        # Client note: the "What's included" flat-lay must sit on transparency
        # so the panel's own paper colour carries through behind it.
        included = (
            find4(AMD4_INCLUDED[pid], "what you get")
            if pid in AMD4_INCLUDED
            else find_or_fallback(pid, folder, "what you get")
        )
        save_cutout(included, f"p-{pid}-included.webp", 1600)
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
        save_banner(find(folder, needle), f"banner-{key}.webp")
        save_banner_mobile(find(folder, needle), f"banner-{key}-sm.webp")
    for key, (folder, needle) in BANNERS_4.items():
        save_banner(find4(folder, needle), f"banner-{key}.webp")
        # The phone crop comes from the original near 2:1 frame, which still has
        # the whole scene in it, rather than from the client's wide crop.
        save_banner_mobile(find4(folder, needle), f"banner-{key}-sm.webp")
    # Last, so a client-cropped banner wins over anything generated above.
    for key, needle in BANNERS_6.items():
        save_webp(find("", needle, root=AMD6), f"banner-{key}.webp", 2400, quality=82)

    # 2026 has no photograph in the delivery, so its card carries the client's
    # own Bangunan Sultan Abdul Samad mark, which is what the milestone is
    # about, over a gold ground. Alpha is kept so it sits on that ground.
    save_webp(
        find(f"{HOME}/Partnered with/BSAS", "bsas"),
        "journey-2026-mark.webp",
        900,
        quality=88,
        keep_alpha=True,
    )

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
