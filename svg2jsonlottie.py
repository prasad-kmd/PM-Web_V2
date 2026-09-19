#!/usr/bin/env python3
"""
Generic SVG → Lottie converter with path-reveal animation
Supports any SVG (not just pm.svg/pm2.svg structure)

Features:
- Parses viewBox / width / height for composition size
- Recursively handles <g> transforms (matrix, translate, scale, rotate, skewX/Y)
- Supports path commands: M,m,L,l,H,h,V,v,C,c,S,s,Q,q,T,t,Z,z (A/a approximated as line)
- Preserves geometry by baking transforms
- Transparent background, ease-in-out timing, staggered reveal following natural order
- Black/white or custom color, adjustable stroke width, duration, stagger

Usage:
  python svg2lottie.py input.svg -o output.json --color black
  python svg2lottie.py public/svg/ --all --color both  (batch convert folder)
  python svg2lottie.py logo.svg -o public/lottie/logo-black.json --color 000000 --stroke 3 --duration 50 --stagger 4

This is an evolution of the pm-specific script, now generic.
"""

import re
import json
import math
import argparse
from pathlib import Path
import xml.etree.ElementTree as ET

# -------------------- Math helpers --------------------

def identity_matrix():
    return (1,0,0,1,0,0)  # a,b,c,d,e,f

def compose_matrices(m2, m1):
    """ m2 * m1 : apply m1 then m2 """
    a2,b2,c2,d2,e2,f2 = m2
    a1,b1,c1,d1,e1,f1 = m1
    a = a2*a1 + c2*b1
    b = b2*a1 + d2*b1
    c = a2*c1 + c2*d1
    d = b2*c1 + d2*d1
    e = a2*e1 + c2*f1 + e2
    f = b2*e1 + d2*f1 + f2
    return (a,b,c,d,e,f)

def apply_point(mat, x, y):
    a,b,c,d,e,f = mat
    return (a*x + c*y + e, b*x + d*y + f)

def apply_vector(mat, vx, vy):
    a,b,c,d,e,f = mat
    return (a*vx + c*vy, b*vx + d*vy)

def parse_transform(transform_str):
    """
    Parse SVG transform attribute. Supports:
    matrix(a,b,c,d,e,f)
    translate(tx,ty?) , translate(tx)
    scale(sx,sy?) 
    rotate(angle, cx,cy?)
    skewX(angle), skewY(angle)
    Multiple transforms space/comma separated, applied left-to-right.
    Returns composed matrix.
    """
    if not transform_str:
        return identity_matrix()
    # Find all func(...)
    pattern = r'(\w+)\s*\(([^)]+)\)'
    matches = re.findall(pattern, transform_str)
    current = identity_matrix()
    for func, args_str in matches:
        args = [float(v) for v in re.split(r'[,\s]+', args_str.strip()) if v!='']
        mat = identity_matrix()
        if func == 'matrix':
            if len(args)==6:
                mat = tuple(args)
        elif func == 'translate':
            tx = args[0] if len(args)>=1 else 0
            ty = args[1] if len(args)>=2 else 0
            mat = (1,0,0,1,tx,ty)
        elif func == 'scale':
            sx = args[0] if len(args)>=1 else 1
            sy = args[1] if len(args)>=2 else sx
            mat = (sx,0,0,sy,0,0)
        elif func == 'rotate':
            angle = args[0] if len(args)>=1 else 0
            rad = math.radians(angle)
            ca, sa = math.cos(rad), math.sin(rad)
            if len(args)>=3:
                cx, cy = args[1], args[2]
                # T(cx,cy) * R * T(-cx,-cy)
                t1 = (1,0,0,1,cx,cy)
                r = (ca,sa,-sa,ca,0,0)
                t2 = (1,0,0,1,-cx,-cy)
                mat = compose_matrices(t1, compose_matrices(r, t2))
            else:
                mat = (ca,sa,-sa,ca,0,0)
        elif func == 'skewX':
            angle = args[0] if args else 0
            mat = (1,0,math.tan(math.radians(angle)),1,0,0)
        elif func == 'skewY':
            angle = args[0] if args else 0
            mat = (1,math.tan(math.radians(angle)),0,1,0,0)
        # SVG transform list: rightmost applied first, so final = T1 * T2 * ... * Tn * p
        # Accumulate left-to-right: current = current * mat
        current = compose_matrices(current, mat)
    return current

# -------------------- Path parsing --------------------

def tokenize_path(d):
    pattern = r'[A-Za-z]|[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?'
    raw = re.findall(pattern, d)
    tokens = []
    for t in raw:
        if re.match(r'^[A-Za-z]$', t):
            tokens.append(t)
        else:
            try:
                if t in ('-','+','.','-.','+.'):
                    continue
                tokens.append(float(t))
            except:
                pass
    return tokens

def parse_path_to_subpaths(d):
    """
    Generic parser supporting M,m,L,l,H,h,V,v,C,c,S,s,Q,q,T,t,Z,z
    Returns list of subpaths: {verts, in_tangents, out_tangents, closed}
    """
    tokens = tokenize_path(d)
    subpaths = []
    curr = None
    cx, cy = 0.0, 0.0
    sx, sy = 0.0, 0.0
    last_cmd = None
    # For smooth curves
    prev_cx2, prev_cy2 = None, None  # previous cubic control point
    prev_qx1, prev_qy1 = None, None  # previous quadratic control point
    i = 0
    while i < len(tokens):
        tok = tokens[i]
        if isinstance(tok, str):
            cmd = tok
            i+=1
        else:
            if last_cmd is None:
                i+=1
                continue
            cmd = last_cmd

        # Helper to ensure current subpath exists
        def ensure_subpath():
            nonlocal curr, sx, sy
            if curr is None:
                curr = {'verts':[(cx,cy)], 'in_tangents':[(0,0)], 'out_tangents':[(0,0)], 'closed':False}
                sx, sy = cx, cy
            return curr

        if cmd == 'M':
            if i+1 >= len(tokens): break
            x, y = tokens[i], tokens[i+1]; i+=2
            if curr and curr['verts']:
                subpaths.append(curr)
            curr = {'verts':[(x,y)], 'in_tangents':[(0,0)], 'out_tangents':[(0,0)], 'closed':False}
            cx, cy = x, y
            sx, sy = x, y
            last_cmd = 'L'
            prev_cx2 = prev_qx1 = None
        elif cmd == 'm':
            if i+1 >= len(tokens): break
            dx, dy = tokens[i], tokens[i+1]; i+=2
            x, y = cx+dx, cy+dy
            if curr and curr['verts']:
                subpaths.append(curr)
            curr = {'verts':[(x,y)], 'in_tangents':[(0,0)], 'out_tangents':[(0,0)], 'closed':False}
            cx, cy = x, y
            sx, sy = x, y
            last_cmd = 'l'
            prev_cx2 = prev_qx1 = None
        elif cmd == 'L':
            if i+1 >= len(tokens): break
            x, y = tokens[i], tokens[i+1]; i+=2
            ensure_subpath()
            curr['verts'].append((x,y))
            curr['in_tangents'].append((0,0))
            curr['out_tangents'].append((0,0))
            cx, cy = x, y
            prev_cx2 = prev_qx1 = None
            last_cmd = 'L'
        elif cmd == 'l':
            if i+1 >= len(tokens): break
            dx, dy = tokens[i], tokens[i+1]; i+=2
            x, y = cx+dx, cy+dy
            ensure_subpath()
            curr['verts'].append((x,y))
            curr['in_tangents'].append((0,0))
            curr['out_tangents'].append((0,0))
            cx, cy = x, y
            prev_cx2 = prev_qx1 = None
            last_cmd = 'l'
        elif cmd == 'H':
            if i >= len(tokens): break
            x = tokens[i]; i+=1
            ensure_subpath()
            curr['verts'].append((x,cy))
            curr['in_tangents'].append((0,0))
            curr['out_tangents'].append((0,0))
            cx = x
            prev_cx2 = prev_qx1 = None
            last_cmd = 'H'
        elif cmd == 'h':
            if i >= len(tokens): break
            dx = tokens[i]; i+=1
            x = cx+dx
            ensure_subpath()
            curr['verts'].append((x,cy))
            curr['in_tangents'].append((0,0))
            curr['out_tangents'].append((0,0))
            cx = x
            prev_cx2 = prev_qx1 = None
            last_cmd = 'h'
        elif cmd == 'V':
            if i >= len(tokens): break
            y = tokens[i]; i+=1
            ensure_subpath()
            curr['verts'].append((cx,y))
            curr['in_tangents'].append((0,0))
            curr['out_tangents'].append((0,0))
            cy = y
            prev_cx2 = prev_qx1 = None
            last_cmd = 'V'
        elif cmd == 'v':
            if i >= len(tokens): break
            dy = tokens[i]; i+=1
            y = cy+dy
            ensure_subpath()
            curr['verts'].append((cx,y))
            curr['in_tangents'].append((0,0))
            curr['out_tangents'].append((0,0))
            cy = y
            prev_cx2 = prev_qx1 = None
            last_cmd = 'v'
        elif cmd == 'C':
            if i+5 >= len(tokens): break
            x1,y1,x2,y2,x,y = tokens[i:i+6]; i+=6
            ensure_subpath()
            prev_idx = len(curr['verts'])-1
            px, py = curr['verts'][prev_idx]
            curr['out_tangents'][prev_idx] = (x1-px, y1-py)
            curr['verts'].append((x,y))
            curr['in_tangents'].append((x2-x, y2-y))
            curr['out_tangents'].append((0,0))
            cx, cy = x, y
            prev_cx2, prev_cy2 = x2, y2
            prev_qx1 = None
            last_cmd = 'C'
        elif cmd == 'c':
            if i+5 >= len(tokens): break
            dx1,dy1,dx2,dy2,dx,dy = tokens[i:i+6]; i+=6
            x1, y1 = cx+dx1, cy+dy1
            x2, y2 = cx+dx2, cy+dy2
            x, y = cx+dx, cy+dy
            ensure_subpath()
            prev_idx = len(curr['verts'])-1
            px, py = curr['verts'][prev_idx]
            curr['out_tangents'][prev_idx] = (x1-px, y1-py)
            curr['verts'].append((x,y))
            curr['in_tangents'].append((x2-x, y2-y))
            curr['out_tangents'].append((0,0))
            cx, cy = x, y
            prev_cx2, prev_cy2 = x2, y2
            prev_qx1 = None
            last_cmd = 'c'
        elif cmd == 'S':
            if i+3 >= len(tokens): break
            x2,y2,x,y = tokens[i:i+4]; i+=4
            # Reflect previous control point
            if prev_cx2 is not None:
                x1 = 2*cx - prev_cx2
                y1 = 2*cy - prev_cy2
            else:
                x1, y1 = cx, cy
            ensure_subpath()
            prev_idx = len(curr['verts'])-1
            px, py = curr['verts'][prev_idx]
            curr['out_tangents'][prev_idx] = (x1-px, y1-py)
            curr['verts'].append((x,y))
            curr['in_tangents'].append((x2-x, y2-y))
            curr['out_tangents'].append((0,0))
            cx, cy = x, y
            prev_cx2, prev_cy2 = x2, y2
            prev_qx1 = None
            last_cmd = 'S'
        elif cmd == 's':
            if i+3 >= len(tokens): break
            dx2,dy2,dx,dy = tokens[i:i+4]; i+=4
            x2, y2 = cx+dx2, cy+dy2
            x, y = cx+dx, cy+dy
            if prev_cx2 is not None:
                x1 = 2*cx - prev_cx2
                y1 = 2*cy - prev_cy2
            else:
                x1, y1 = cx, cy
            ensure_subpath()
            prev_idx = len(curr['verts'])-1
            px, py = curr['verts'][prev_idx]
            curr['out_tangents'][prev_idx] = (x1-px, y1-py)
            curr['verts'].append((x,y))
            curr['in_tangents'].append((x2-x, y2-y))
            curr['out_tangents'].append((0,0))
            cx, cy = x, y
            prev_cx2, prev_cy2 = x2, y2
            prev_qx1 = None
            last_cmd = 's'
        elif cmd == 'Q':
            if i+3 >= len(tokens): break
            x1,y1,x,y = tokens[i:i+4]; i+=4
            # Convert quadratic to cubic
            # Cubic: (x0 + 2/3*(x1-x0), y0+2/3*(y1-y0)), (x + 2/3*(x1-x), y+2/3*(y1-y)), (x,y)
            ensure_subpath()
            prev_idx = len(curr['verts'])-1
            x0, y0 = curr['verts'][prev_idx]
            cx1 = x0 + (2/3)*(x1 - x0)
            cy1 = y0 + (2/3)*(y1 - y0)
            cx2 = x + (2/3)*(x1 - x)
            cy2 = y + (2/3)*(y1 - y)
            curr['out_tangents'][prev_idx] = (cx1 - x0, cy1 - y0)
            curr['verts'].append((x,y))
            curr['in_tangents'].append((cx2 - x, cy2 - y))
            curr['out_tangents'].append((0,0))
            cx, cy = x, y
            prev_qx1, prev_qy1 = x1, y1
            prev_cx2 = None
            last_cmd = 'Q'
        elif cmd == 'q':
            if i+3 >= len(tokens): break
            dx1,dy1,dx,dy = tokens[i:i+4]; i+=4
            x1, y1 = cx+dx1, cy+dy1
            x, y = cx+dx, cy+dy
            ensure_subpath()
            prev_idx = len(curr['verts'])-1
            x0, y0 = curr['verts'][prev_idx]
            cx1 = x0 + (2/3)*(x1 - x0)
            cy1 = y0 + (2/3)*(y1 - y0)
            cx2 = x + (2/3)*(x1 - x)
            cy2 = y + (2/3)*(y1 - y)
            curr['out_tangents'][prev_idx] = (cx1 - x0, cy1 - y0)
            curr['verts'].append((x,y))
            curr['in_tangents'].append((cx2 - x, cy2 - y))
            curr['out_tangents'].append((0,0))
            cx, cy = x, y
            prev_qx1, prev_qy1 = x1, y1
            prev_cx2 = None
            last_cmd = 'q'
        elif cmd == 'T':
            if i+1 >= len(tokens): break
            x, y = tokens[i], tokens[i+1]; i+=2
            if prev_qx1 is not None:
                x1 = 2*cx - prev_qx1
                y1 = 2*cy - prev_qy1
            else:
                x1, y1 = cx, cy
            ensure_subpath()
            prev_idx = len(curr['verts'])-1
            x0, y0 = curr['verts'][prev_idx]
            cx1 = x0 + (2/3)*(x1 - x0)
            cy1 = y0 + (2/3)*(y1 - y0)
            cx2 = x + (2/3)*(x1 - x)
            cy2 = y + (2/3)*(y1 - y)
            curr['out_tangents'][prev_idx] = (cx1 - x0, cy1 - y0)
            curr['verts'].append((x,y))
            curr['in_tangents'].append((cx2 - x, cy2 - y))
            curr['out_tangents'].append((0,0))
            cx, cy = x, y
            prev_qx1, prev_qy1 = x1, y1
            prev_cx2 = None
            last_cmd = 'T'
        elif cmd == 't':
            if i+1 >= len(tokens): break
            dx, dy = tokens[i], tokens[i+1]; i+=2
            x, y = cx+dx, cy+dy
            if prev_qx1 is not None:
                x1 = 2*cx - prev_qx1
                y1 = 2*cy - prev_qy1
            else:
                x1, y1 = cx, cy
            ensure_subpath()
            prev_idx = len(curr['verts'])-1
            x0, y0 = curr['verts'][prev_idx]
            cx1 = x0 + (2/3)*(x1 - x0)
            cy1 = y0 + (2/3)*(y1 - y0)
            cx2 = x + (2/3)*(x1 - x)
            cy2 = y + (2/3)*(y1 - y)
            curr['out_tangents'][prev_idx] = (cx1 - x0, cy1 - y0)
            curr['verts'].append((x,y))
            curr['in_tangents'].append((cx2 - x, cy2 - y))
            curr['out_tangents'].append((0,0))
            cx, cy = x, y
            prev_qx1, prev_qy1 = x1, y1
            prev_cx2 = None
            last_cmd = 't'
        elif cmd in ('Z','z'):
            if curr:
                curr['closed'] = True
                cx, cy = sx, sy
                subpaths.append(curr)
                curr = None
            prev_cx2 = prev_qx1 = None
            last_cmd = None
        elif cmd in ('A','a'):
            # Elliptical arc - approximate as line to endpoint for now (or skip)
            # For better quality, we could convert arc to cubics, but for simplicity:
            # A rx ry xAxisRotate largeArcFlag sweepFlag x y
            if i+6 >= len(tokens): break
            # We just take endpoint and line to it
            if cmd == 'A':
                x, y = tokens[i+5], tokens[i+6]
            else:
                dx, dy = tokens[i+5], tokens[i+6]
                x, y = cx+dx, cy+dy
            i+=7
            ensure_subpath()
            curr['verts'].append((x,y))
            curr['in_tangents'].append((0,0))
            curr['out_tangents'].append((0,0))
            cx, cy = x, y
            prev_cx2 = prev_qx1 = None
            last_cmd = cmd
        else:
            i+=1
    if curr and curr['verts']:
        subpaths.append(curr)
    return subpaths

def subpath_to_lottie(subpath, mat):
    verts = subpath['verts']
    ins = subpath['in_tangents']
    outs = subpath['out_tangents']
    if not verts:
        return None
    tv, ti, to = [], [], []
    for (x,y),(ix,iy),(ox,oy) in zip(verts, ins, outs):
        vx, vy = apply_point(mat, x, y)
        tv.append([vx, vy])
        ivx, ivy = apply_vector(mat, ix, iy)
        ovx, ovy = apply_vector(mat, ox, oy)
        ti.append([ivx, ivy])
        to.append([ovx, ovy])
    return {
        "ty":"sh",
        "ks":{"a":0,"k":{"i":ti,"o":to,"v":tv,"c":subpath['closed']}}
    }

# -------------------- SVG extraction --------------------

def extract_paths_from_svg(svg_path):
    """
    Returns: (width, height, list of {d, matrix})
    Recursively walks SVG, accumulating transforms
    """
    # Use ET, but need to handle namespaces
    # Read raw text to get viewBox etc via regex, as ET may strip
    text = Path(svg_path).read_text()
    # viewBox
    vb_match = re.search(r'viewBox="([^"]+)"', text)
    width, height = 1920, 1080
    if vb_match:
        try:
            _,_,w,h = [float(v) for v in vb_match.group(1).split()]
            width, height = w, h
        except:
            pass
    else:
        # Try width/height attributes
        w_match = re.search(r'width="([^"]+)"', text)
        h_match = re.search(r'height="([^"]+)"', text)
        if w_match and h_match:
            try:
                # Remove px, %, etc
                ws = re.sub(r'[^\d.]','', w_match.group(1))
                hs = re.sub(r'[^\d.]','', h_match.group(1))
                width = float(ws) if ws else width
                height = float(hs) if hs else height
            except:
                pass

    # Parse XML
    # Remove namespace for easier parsing
    # ET needs handling
    try:
        # Replace xmlns to avoid
        # Use regex to strip namespace? We'll try ET with wildcard
        root = ET.fromstring(text.encode('utf-8') if isinstance(text,str) else text)
    except Exception as e:
        # Fallback to regex extraction for paths (like original script)
        print(f"Warning: XML parse failed ({e}), falling back to regex")
        # Regex fallback: find all <path d="..."> and preceding <g transform>
        # This is simplistic but works for pm.svg style
        glyphs = []
        # Find all g transforms + path as before
        inner_pattern = r'<g transform="([^"]+)">\s*<path d="([^"]+)"'
        for trans_str, d in re.findall(inner_pattern, text):
            mat = parse_transform(trans_str)
            glyphs.append({'d':d, 'matrix':mat})
        # Also find paths without g
        for d in re.findall(r'<path[^>]*d="([^"]+)"', text):
            # Avoid duplicates already captured
            if not any(g['d']==d for g in glyphs):
                glyphs.append({'d':d, 'matrix':identity_matrix()})
        return width, height, glyphs

    # Recursive walk
    paths = []

    def walk(elem, current_mat):
        # Get transform for this element
        trans = elem.attrib.get('transform','')
        mat = parse_transform(trans)
        # SVG: parent transform applied first, then child
        # So final = parent * child
        combined = compose_matrices(current_mat, mat) if trans else current_mat

        # If this is a path
        tag = elem.tag
        # Remove namespace
        if '}' in tag:
            tag = tag.split('}')[-1]
        if tag == 'path':
            d = elem.attrib.get('d','')
            if d:
                paths.append({'d':d, 'matrix':combined, 'elem':elem})
        # Also handle <g>, <svg>, etc
        for child in elem:
            walk(child, combined)

    walk(root, identity_matrix())
    return width, height, paths

# -------------------- Lottie generation --------------------

def create_lottie(width, height, path_groups, color_rgb, output_path, stroke_width=3, fr=60, op=120, stagger=4, duration=50):
    layers = []
    for idx, pg in enumerate(path_groups):
        mat = pg['matrix']
        d = pg['d']
        subpaths = parse_path_to_subpaths(d)
        shapes = []
        for sp in subpaths:
            sh = subpath_to_lottie(sp, mat)
            if sh:
                shapes.append(sh)
        if not shapes:
            continue

        stroke = {
            "ty":"st",
            "c":{"a":0,"k":[color_rgb[0],color_rgb[1],color_rgb[2],1]},
            "o":{"a":0,"k":100},
            "w":{"a":0,"k":stroke_width},
            "lc":2, "lj":2, "ml":4, "bm":0, "nm":"Stroke"
        }

        t0 = idx * stagger
        t1 = t0 + duration
        if t1 > op: t1 = op
        if t0 >= op: t0 = op-1

        trim = {
            "ty":"tm",
            "s":{"a":0,"k":0},
            "e":{"a":1,"k":[
                {"t":t0,"s":[0],"o":{"x":[0.42],"y":[0]},"i":{"x":[0.58],"y":[1]}},
                {"t":t1,"s":[100]}
            ]},
            "o":{"a":0,"k":0},
            "m":1,
            "nm":"Trim"
        }

        layer = {
            "ddd":0,
            "ind":idx+1,
            "ty":4,
            "nm":f"path-{idx}",
            "sr":1,
            "ks":{
                "o":{"a":0,"k":100},
                "r":{"a":0,"k":0},
                "p":{"a":0,"k":[0,0,0]},
                "a":{"a":0,"k":[0,0,0]},
                "s":{"a":0,"k":[100,100,100]}
            },
            "ao":0,
            "shapes": shapes + [stroke, trim],
            "ip":0,
            "op":op,
            "st":0,
            "bm":0
        }
        layers.append(layer)

    lottie = {
        "v":"5.7.4",
        "fr":fr,
        "ip":0,
        "op":op,
        "w":width,
        "h":height,
        "nm":Path(output_path).stem,
        "ddd":0,
        "assets":[],
        "layers":layers
    }
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    with open(output_path,'w') as f:
        json.dump(lottie,f,indent=2)
    print(f"✓ {output_path} | {len(layers)} layers | {width}x{height} | {op}f @ {fr}fps | color {color_rgb} | stroke {stroke_width}")

def parse_color(cstr):
    cstr = cstr.lower().strip()
    if cstr == 'black': return [0,0,0]
    if cstr == 'white': return [1,1,1]
    if cstr.startswith('#'): cstr = cstr[1:]
    if len(cstr)==3:
        r = int(cstr[0]*2,16)/255
        g = int(cstr[1]*2,16)/255
        b = int(cstr[2]*2,16)/255
        return [r,g,b]
    if len(cstr)==6:
        r = int(cstr[0:2],16)/255
        g = int(cstr[2:4],16)/255
        b = int(cstr[4:6],16)/255
        return [r,g,b]
    # try rgb
    m = re.match(r'(\d+)[,\s]+(\d+)[,\s]+(\d+)', cstr)
    if m:
        return [int(m.group(1))/255, int(m.group(2))/255, int(m.group(3))/255]
    return [0,0,0]

def main():
    parser = argparse.ArgumentParser(description="Generic SVG → Lottie path-reveal converter")
    parser.add_argument("input", help="Input SVG file or folder")
    parser.add_argument("-o","--output", help="Output JSON file (if input is file). If input is folder, output is treated as folder")
    parser.add_argument("--color", default="black", help="black, white, hex #RRGGBB, or 'both' to generate black+white")
    parser.add_argument("--stroke", type=float, default=3, help="Stroke width")
    parser.add_argument("--fr", type=int, default=60, help="Framerate")
    parser.add_argument("--op", type=int, default=120, help="Total frames (duration)")
    parser.add_argument("--stagger", type=int, default=4, help="Frames between each path reveal")
    parser.add_argument("--duration", type=int, default=50, help="Duration of each path reveal")
    parser.add_argument("--all", action="store_true", help="If input is folder, convert all SVGs inside")
    args = parser.parse_args()

    in_path = Path(args.input)
    if not in_path.exists():
        print(f"Input not found: {in_path}")
        return

    files = []
    if in_path.is_dir() or args.all:
        folder = in_path if in_path.is_dir() else in_path.parent
        files = list(folder.glob("*.svg"))
        if not files:
            print(f"No SVGs found in {folder}")
            return
        out_dir = Path(args.output) if args.output else folder.parent / "lottie" if folder.name=="svg" else folder / "lottie"
        out_dir.mkdir(parents=True, exist_ok=True)
        print(f"Batch converting {len(files)} SVGs from {folder} → {out_dir}")
    else:
        files = [in_path]
        out_dir = None

    for svg_file in files:
        w,h,paths = extract_paths_from_svg(svg_file)
        print(f"{svg_file.name}: {len(paths)} paths, viewBox {w}x{h}")
        if not paths:
            print("  No paths found, skipping")
            continue

        # Determine outputs
        if len(files)==1 and args.output:
            base_out = Path(args.output)
            # If output is dir, use svg stem
            if base_out.is_dir() or base_out.suffix=='':
                base_out = base_out / f"{svg_file.stem}.json"
        else:
            base_out = (out_dir / f"{svg_file.stem}.json") if out_dir else Path(f"{svg_file.stem}.json")

        colors = []
        if args.color == 'both':
            colors = [('black',[0,0,0]), ('white',[1,1,1])]
        else:
            colors = [(args.color, parse_color(args.color))]

        for cname, crgb in colors:
            if args.color == 'both':
                # Insert color name before extension
                out_path = base_out.with_name(f"{base_out.stem}-{cname}{base_out.suffix}")
            else:
                out_path = base_out
            create_lottie(w,h,paths,crgb,out_path, stroke_width=args.stroke, fr=args.fr, op=args.op, stagger=args.stagger, duration=args.duration)

if __name__ == "__main__":
    main()
