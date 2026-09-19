# SVG → Lottie Converter Guide

Yes — you can absolutely use the Python script for **any** SVG now.  
I upgraded your original `pm.svg`-specific script to a **generic CLI tool**: `svg2lottie.py`

---

## 1. What changed?

**Old script (`svg_to_lottie.py`):**
- Hardcoded for `pm.svg` / `pm2.svg` structure
- Only understood `matrix(...)` transforms and `M,C,L,Z` absolute commands
- Output paths fixed to `public/lottie/pm-*.json`

**New script (`svg2lottie.py`):**
- Works with **any SVG**
- Parses `viewBox`, `width`, `height` automatically for Lottie composition size
- Recursively handles `<g transform="...">` with `matrix()`, `translate()`, `scale()`, `rotate()`, `skewX/Y`
- Supports path commands: `M,m,L,l,H,h,V,v,C,c,S,s,Q,q,T,t,Z,z` (and `A/a` as line fallback)
- Converts quadratic → cubic automatically
- Bakes transforms into vertices (preserves geometry)
- Same animation style: trim-path reveal with ease-in-out, staggered left-to-right

---

## 2. Installation

No extra dependencies — just Python 3.10+

```bash
py svg2lottie.py --help
```

---

## 3. Usage Examples

### Single file, black stroke
```bash
py svg2lottie.py public/svg/logo.svg -o public/lottie/logo-black.json --color black
```

### Single file, white stroke
```bash
py svg2lottie.py public/svg/logo.svg -o public/lottie/logo-white.json --color white --stroke 4
```

### Custom hex color
```bash
py svg2lottie.py icon.svg -o icon-lottie.json --color "#FF5500" --stroke 2.5
```

### Both black & white at once
```bash
py svg2lottie.py public/svg/logo.svg -o public/lottie/logo.json --color both
# Creates: logo-black.json + logo-white.json
```

### Batch convert entire folder
```bash
py svg2lottie.py public/svg/ --all --color both -o public/lottie/
# Converts every .svg in public/svg/ to black+white variants
```

### Adjust timing
```bash
py svg2lottie.py logo.svg -o logo.json --op 150 --duration 60 --stagger 5 --fr 60
# op = total frames, duration = per-path reveal, stagger = delay between paths
```

### Full options
```bash
py svg2lottie.py input.svg -o output.json \
  --color black \
  --stroke 3 \
  --fr 60 \
  --op 120 \
  --stagger 4 \
  --duration 50
```

---

## 4. Best Practices for Your SVGs

For cleanest Lottie output:

1. **Outline text** - Convert text to paths in Illustrator/Figma before export
2. **Simplify** - Remove filters, gradients, clipPaths, masks (Lottie stroke reveal works best with pure paths)
3. **ViewBox** - Ensure SVG has `viewBox="0 0 W H"` - script uses it for Lottie `w`/`h`
4. **No embedded images** - Only `<path>` elements are converted (rect/circle/line should be converted to path first)
5. **Stroke vs Fill** - Script always creates stroke reveal. If you want filled final frame, you can add a fill animation layer manually or keep stroke only for loader style.

---

## 5. How it works (same as text-to-lottie skill)

1. **Parse SVG** - XML parse + recursive transform accumulation
2. **Extract paths** - All `<path d="...">` with final baked matrix
3. **Tokenize path** - `M0.5,-0.2C...` → commands + numbers
4. **Convert to Lottie bezier** - Each `C` becomes `i/o/v` (in/out tangents + vertex)
5. **Create layers** - One layer per original path, with:
   - `sh` shape (baked coords)
   - `st` stroke (black/white/custom)
   - `tm` trim-path `e: 0→100%` with `cubic-bezier(0.42,0,0.58,1)` ease-in-out
6. **Stagger** - `t0 = index * stagger`, `t1 = t0 + duration` follows natural document order

Result: Transparent background, 1920x1080 (or your viewBox), 60fps, ready for `lottie-react`.

---

## 6. Using in Next.js (you already have this)

```tsx
import { Lottie } from "lottie-react";
import logoBlack from "@/public/lottie/logo-black.json";

<Lottie src={logoBlack} autoplay loop style={{background:"transparent"}} />
```

Your existing `LoadingScreen.tsx` already does this with `pm-black.json`.

---

## 7. Files in this repo

- `svg_to_lottie.py` - Original pm-specific script (kept for reference)
- `svg2lottie.py` - **Generic version (use this for new SVGs)**
- `public/lottie/pm-black.json` etc - Your 4 generated files
- `public/lottie/preview.html` - Open in browser to preview all Lotties without Next.js

---

## 8. Quick test with your current SVGs

```bash
# Regenerate exactly what you have
py svg2lottie.py public/svg/pm.svg -o public/lottie/pm-black.json --color black --op 120 --duration 50 --stagger 4
py svg2lottie.py public/svg/pm2.svg -o public/lottie/pm2-black.json --color black --op 150 --duration 60 --stagger 5
```

Want me to add support for `rect`, `circle`, `ellipse` → path conversion or fill-then-stroke reveal? Just drop another SVG and I can test it.
