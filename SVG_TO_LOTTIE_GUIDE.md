# SVG → dotLottie Converter Guide — `svg2dotlottie_mod.py`

Single script at project root that converts SVGs in `public/svg/` to optimized `.lottie` files in `public/lottie/` with advanced animation: **forward → fill → pulse → reverse**.

---

## What it does

**Input:** `public/svg/*.svg` (also checks `public/SVG/` case-insensitive)  
**Output:** Only `.lottie` files in `public/lottie/` — no JSON, no HTML, no bundle

For each SVG (e.g., `pm.svg`):

```
public/svg/pm.svg (12KB, 16 paths, viewBox 0 0 1920 1080)
  ↓ parse + bake transforms
  → pm-black-fill-pulse.lottie (6.3KB, 96% smaller, op 265f)
  → pm-white-fill-pulse.lottie (6.3KB)
```

**Animation sequence per glyph (16 glyphs, staggered left-to-right):**

1. **Forward** — stroke reveal via trim-path `e: 0→100%` with ease-in-out `cubic-bezier(0.42,0,0.58,1)`
   - `t0 = delay + idx*stagger`, `t1 = t0 + duration`
2. **Fill** — once forward complete, closed contours get filled (fill opacity `0→100%`)
   - `t1 → t_fill_end = t1 + fill-duration` (default 15f)
3. **Pulse color** — fill color pulses `base ↔ pulse_color`
   - Black `[0,0,0]` pulses to `[0.4,0.4,0.4]` (gray)
   - White `[1,1,1]` pulses to `[0.6,0.6,0.6]` (dark gray)
   - `t_fill_end → t_pulse_end = t_fill_end + pulse-duration` (default 40f, 2 pulses)
   - Both color (`c`) and opacity (`o: 100→60→100`) pulse
4. **Reverse** — hold at filled+pulsed state for `reverse-delay`, then hide stroke + fill `100→0`
   - `t_pulse_end → t_reverse_start = t_pulse_end + reverse-delay` (default 30f)
   - `t_reverse_start → t_reverse_end = t_reverse_start + reverse-duration`

Total composition `op` auto-calculated as `max glyph t_reverse_end + loop-delay`.

**Preserves geometry:** viewBox baked, transforms (`matrix()`, `translate()`, `scale()`, `rotate()`, `skew`) composed as `parent * child`, path commands `M,m,L,l,H,h,V,v,C,c,S,s,Q,q,T,t,Z,z` supported (quadratic→cubic, arc→line fallback).

---

## Installation

No deps, Python 3.10+ stdlib only (`zipfile`, `json`, `xml.etree`).

```bash
python3 svg2dotlottie_mod.py --help
```

---

## Usage

### Basic — single file, black
```bash
python3 svg2dotlottie_mod.py pm.svg
# → public/lottie/pm-black-fill-pulse.lottie
```

### Both black & white variants
```bash
python3 svg2dotlottie_mod.py pm.svg --color both
# → pm-black-fill-pulse.lottie + pm-white-fill-pulse.lottie
```

### All SVGs in public/svg/
```bash
python3 svg2dotlottie_mod.py all --color both
# Converts pm.svg + pm2.svg → 4 .lottie files
```

### Boomerang with custom delays (forward→fill→pulse→reverse)
```bash
python3 svg2dotlottie_mod.py pm.svg --color both --boomerang --reverse-delay 30 --loop --speed 1.0
# reverse-delay = hold at filled+pulsed state before reverse starts
```

### Control fill & pulse
```bash
# No pulse, only fill then reverse
python3 svg2dotlottie_mod.py pm.svg --no-pulse --fill-duration 20

# 3 pulses, stronger intensity, longer pulse time
python3 svg2dotlottie_mod.py pm.svg --pulse --pulse-count 3 --pulse-intensity 0.6 --pulse-duration 60

# No fill at all (just forward→reverse like old script)
python3 svg2dotlottie_mod.py pm.svg --no-fill --boomerang
```

### Custom color & stroke
```bash
python3 svg2dotlottie_mod.py logo.svg --color "#00DDB3" --stroke 2.5 --output-name my-logo
# → public/lottie/my-logo.lottie
```

### Full timing control
```bash
python3 svg2dotlottie_mod.py pm.svg \
  --fr 60 --stagger 4 --duration 50 \
  --fill-duration 15 --pulse-duration 40 --pulse-count 2 \
  --reverse-delay 30 --reverse-duration 50 \
  --delay 0 --loop-delay 20 \
  --loop --autoplay --speed 1.0
```

---

## Parameters

| Param | Default | Description |
|-------|---------|-------------|
| `files` | required | SVG names: `pm`, `pm.svg`, `public/svg/pm.svg`, or `all` |
| `--color` | `black` | `black`, `white`, `#RRGGBB`, or `both` |
| `--stroke` | `3` | Stroke width |
| `--fr` | `60` | Framerate |
| `--op` | `0` (auto) | Total frames, 0=auto from max glyph timeline |
| `--stagger` | `4` | Frames between each path reveal |
| `--duration` | `50` | Forward reveal per path |
| `--fill` / `--no-fill` | `True` | Fill closed contours after forward |
| `--fill-duration` | `15` | Fill fade-in duration |
| `--pulse` / `--no-pulse` | `True` | Pulse color after fill |
| `--pulse-duration` | `40` | Total pulse time |
| `--pulse-count` | `2` | Number of pulses |
| `--pulse-intensity` | `0.4` | 0-1, how much color lightens (black→gray) or darkens (white→gray) |
| `--boomerang` / `--ping-pong` | `False` | Enable forward→fill→pulse→reverse (sets mode=boomerang) |
| `--mode` | `boomerang` | `forward` (stop after pulse), `reverse` (hide), `boomerang` (forward→fill→pulse→reverse) |
| `--reverse-delay` | `30` | Hold frames at filled+pulsed state before reverse |
| `--reverse-duration` | `0` | Reverse duration, 0=same as --duration |
| `--delay` | `0` | Initial delay before first path |
| `--loop-delay` | `20` | Extra frames after animation before loop restarts |
| `--loop` / `--no-loop` | `True` | dotLottie manifest loop |
| `--autoplay` / `--no-autoplay` | `True` | dotLottie autoplay |
| `--speed` | `1.0` | Playback speed in manifest |
| `--output-name` | auto | Custom output name without extension |

---

## Output Structure

```
public/lottie/
  pm-black-fill-pulse.lottie  6.3KB | op 265 | 16 layers
    manifest.json
      { loop:true, autoplay:true, speed:1.0 }
    animations/
      pm-black-fill-pulse.json
        layers[16]:
          - stroke-group: [shapes + stroke + trim (0→100→0)]
          - fill-group: [closed shapes + fill (c animated pulse, o 0→100→pulse→0)]

  pm-white-fill-pulse.lottie  6.3KB
  pm2-black-fill-pulse.lottie 26KB | op 300 (complex SVG auto-detected)
```

No JSON, no HTML, no collection bundle — only `.lottie` as requested.

---

## Using .lottie in Next.js / HTML

### Next.js with npm package
```bash
npm i @lottiefiles/dotlottie-react
```
```tsx
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
<DotLottieReact src="/lottie/pm-black-fill-pulse.lottie" loop autoplay />
```

### HTML with CDN (as per docs you linked)
```html
<script type="module">
  import { DotLottie } from "https://cdn.jsdelivr.net/npm/@lottiefiles/dotlottie-web/+esm";

  new DotLottie({
    canvas: document.getElementById('canvas'),
    src: '/lottie/pm-black-fill-pulse.lottie',
    loop: true,
    autoplay: true,
    speed: 1
  });
</script>
<canvas id="canvas" style="width:100%;aspect-ratio:1920/1080"></canvas>
```

Docs: https://docs.lottiefiles.com/en/runtimes/distributions/js/v0.x/getting-started/installation#load-from-a-cdn

---

## Examples from this repo

```bash
# Current files were built with:
python3 svg2dotlottie_mod.py all --color both --boomerang --pulse --pulse-count 2 --reverse-delay 30 --loop

# Results:
# pm.svg (12KB, 16 paths) → pm-black-fill-pulse.lottie 6.3KB (95% smaller than JSON)
# pm2.svg (43KB, 16 paths) → pm2-black-fill-pulse.lottie 26KB
```

To regenerate after adding new SVG to `public/svg/`:
```bash
python3 svg2dotlottie_mod.py all --color both --boomerang --pulse --reverse-delay 30
```

---

## Why fill only closed contours?

`parse_path()` marks subpaths with `closed=True` when `Z/z` encountered. Only those get fill shapes — open strokes (like underline) stay stroke-only, preventing unwanted fill artifacts.

Pulse uses both color and opacity: color interpolates `base ↔ base±intensity`, opacity dips `100→60→100` per pulse for extra liveliness.
