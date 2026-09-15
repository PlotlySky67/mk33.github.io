from PIL import Image, ImageDraw
import math

GRADIENT = [(255, 153, 102), (255, 94, 98), (106, 48, 147)]
BG = (20, 11, 24)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def gradient_pixel(x, y, w, h):
    t = (x / w + y / h) / 2
    if t < 0.5:
        return lerp(GRADIENT[0], GRADIENT[1], t / 0.5)
    return lerp(GRADIENT[1], GRADIENT[2], (t - 0.5) / 0.5)


def make_gradient(w, h):
    img = Image.new("RGB", (w, h))
    px = img.load()
    for y in range(h):
        for x in range(w):
            px[x, y] = gradient_pixel(x, y, w, h)
    return img


def draw_sun_arc(draw, cx, cy, r, color, width_ratio=0.16):
    bbox = [cx - r, cy - r, cx + r, cy + r]
    draw.pieslice(bbox, 0, 360, fill=color)
    # horizon line band
    band_h = int(r * width_ratio)
    draw.rectangle([cx - r * 1.4, cy - band_h / 2, cx + r * 1.4, cy + band_h / 2], fill=BG)


def make_icon(size, transparent_bg=False, monochrome=False):
    img = make_gradient(size, size)
    draw = ImageDraw.Draw(img)
    cx, cy = size / 2, size * 0.56
    r = size * 0.30
    sun_color = (255, 236, 214) if not monochrome else (255, 255, 255)
    draw_sun_arc(draw, cx, cy, r, sun_color)
    return img


def make_icon_with_margin(size, content_ratio=0.6):
    full = make_icon(size)
    inner = int(size * content_ratio)
    resized = full.resize((inner, inner))
    canvas = Image.new("RGB", (size, size), BG)
    offset = (size - inner) // 2
    canvas.paste(resized, (offset, offset))
    return canvas


# Main app icon (1024x1024)
make_icon(1024).save("assets/icon.png")

# Android adaptive icon foreground (transparent-ish, but keep flat bg since adaptive icon masks it)
make_icon_with_margin(1024, content_ratio=0.55).save("assets/android-icon-foreground.png")

bg_only = Image.new("RGB", (1024, 1024), BG)
bg_only.save("assets/android-icon-background.png")

mono = make_icon(1024, monochrome=True).convert("L").convert("RGB")
mono.save("assets/android-icon-monochrome.png")

# Favicon
make_icon(196).save("assets/favicon.png")

# Splash icon (square, for expo-splash-screen if configured later)
make_icon_with_margin(1200, content_ratio=0.4).save("assets/splash-icon.png")

print("done")
