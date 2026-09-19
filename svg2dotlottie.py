#!/usr/bin/env python3
"""
All-in-one converter: public/svg/ → public/lottie/ + root preview.html

Does:
  1. SVG → Lottie JSON (path-reveal, transparent bg, ease-in-out, black+white)
  2. JSON → .lottie (dotLottie ZIP, 95% smaller)
  3. Creates preview.html in project root showcasing JSON + .lottie

Usage:
  python3 convert.py
  python3 convert.py --stroke 3 --op 120 --stagger 4
  python3 convert.py --color black --no-white  (only black)
  python3 convert.py --clean  (removes old generated files first)

Inputs:  public/svg/*.svg  (also checks public/SVG/)
Outputs: public/lottie/
  - {name}-black.json (original)
  - {name}-white.json
  - {name}-black.opt.json (optimized, precision 2, minified)
  - {name}-white.opt.json
  - {name}-black.lottie (ZIP)
  - {name}-white.lottie
  - {name}-black.opt.lottie
  - {name}-white.opt.lottie
  - collection.lottie (bundle of all)
  - preview.html (root) + public/lottie/preview.html (lottie-only)

No external deps, only stdlib.
"""

import re
import json
import math
import argparse
import zipfile
import shutil
from pathlib import Path
import xml.etree.ElementTree as ET

# -------------------- Config --------------------
SVG_DIRS = [Path("public/svg"), Path("public/SVG"), Path("public/Svg")]
LOTTIE_DIR = Path("public/lottie")
ROOT_PREVIEW = Path("preview.html")
LOTTIE_PREVIEW = LOTTIE_DIR / "preview.html"

# -------------------- Math --------------------
def identity():
    return (1,0,0,1,0,0)

def compose(m2, m1):
    """m2 * m1 : apply m1 then m2"""
    a2,b2,c2,d2,e2,f2 = m2
    a1,b1,c1,d1,e1,f1 = m1
    return (
        a2*a1 + c2*b1,
        b2*a1 + d2*b1,
        a2*c1 + c2*d1,
        b2*c1 + d2*d1,
        a2*e1 + c2*f1 + e2,
        b2*e1 + d2*f1 + f2
    )

def apply_point(mat, x, y):
    a,b,c,d,e,f = mat
    return (a*x + c*y + e, b*x + d*y + f)

def apply_vector(mat, vx, vy):
    a,b,c,d,e,f = mat
    return (a*vx + c*vy, b*vx + d*vy)

def parse_transform(tstr):
    if not tstr:
        return identity()
    pattern = r'(\w+)\s*\(([^)]+)\)'
    matches = re.findall(pattern, tstr)
    cur = identity()
    for func, args_str in matches:
        args = [float(v) for v in re.split(r'[,\s]+', args_str.strip()) if v!='']
        mat = identity()
        if func == 'matrix' and len(args)==6:
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
            ang = args[0] if len(args)>=1 else 0
            rad = math.radians(ang)
            ca, sa = math.cos(rad), math.sin(rad)
            if len(args)>=3:
                cx, cy = args[1], args[2]
                t1 = (1,0,0,1,cx,cy)
                r = (ca,sa,-sa,ca,0,0)
                t2 = (1,0,0,1,-cx,-cy)
                mat = compose(t1, compose(r, t2))
            else:
                mat = (ca,sa,-sa,ca,0,0)
        elif func == 'skewX':
            mat = (1,0,math.tan(math.radians(args[0] if args else 0)),1,0,0)
        elif func == 'skewY':
            mat = (1,math.tan(math.radians(args[0] if args else 0)),0,1,0,0)
        # SVG: T1 T2 ... Tn * p = T1*(T2*(...Tn*p)) → accumulate left-to-right
        cur = compose(cur, mat)
    return cur

# -------------------- Path parsing --------------------
def tokenize(d):
    raw = re.findall(r'[A-Za-z]|[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?', d)
    toks = []
    for t in raw:
        if re.match(r'^[A-Za-z]$', t):
            toks.append(t)
        else:
            try:
                if t not in ('-','+','.','-.','+.'):
                    toks.append(float(t))
            except:
                pass
    return toks

def parse_path(d):
    tokens = tokenize(d)
    subpaths = []
    curr = None
    cx, cy = 0.0, 0.0
    sx, sy = 0.0, 0.0
    last = None
    prev_cx2 = prev_cy2 = None
    prev_qx1 = prev_qy1 = None
    i = 0
    def ensure():
        nonlocal curr, sx, sy
        if curr is None:
            curr = {'verts':[(cx,cy)], 'in':[(0,0)], 'out':[(0,0)], 'closed':False}
            sx, sy = cx, cy
        return curr

    while i < len(tokens):
        tok = tokens[i]
        if isinstance(tok, str):
            cmd = tok; i+=1
        else:
            if last is None: i+=1; continue
            cmd = last

        if cmd == 'M':
            if i+1 >= len(tokens): break
            x,y = tokens[i], tokens[i+1]; i+=2
            if curr and curr['verts']: subpaths.append(curr)
            curr = {'verts':[(x,y)], 'in':[(0,0)], 'out':[(0,0)], 'closed':False}
            cx,cy = x,y; sx,sy = x,y; last='L'; prev_cx2=prev_qx1=None
        elif cmd == 'm':
            if i+1 >= len(tokens): break
            dx,dy = tokens[i], tokens[i+1]; i+=2
            x,y = cx+dx, cy+dy
            if curr and curr['verts']: subpaths.append(curr)
            curr = {'verts':[(x,y)], 'in':[(0,0)], 'out':[(0,0)], 'closed':False}
            cx,cy = x,y; sx,sy = x,y; last='l'; prev_cx2=prev_qx1=None
        elif cmd == 'L':
            if i+1 >= len(tokens): break
            x,y = tokens[i], tokens[i+1]; i+=2
            ensure(); curr['verts'].append((x,y)); curr['in'].append((0,0)); curr['out'].append((0,0)); cx,cy=x,y; last='L'; prev_cx2=prev_qx1=None
        elif cmd == 'l':
            if i+1 >= len(tokens): break
            dx,dy = tokens[i], tokens[i+1]; i+=2
            x,y = cx+dx, cy+dy
            ensure(); curr['verts'].append((x,y)); curr['in'].append((0,0)); curr['out'].append((0,0)); cx,cy=x,y; last='l'; prev_cx2=prev_qx1=None
        elif cmd == 'H':
            if i>=len(tokens): break
            x=tokens[i]; i+=1; ensure(); curr['verts'].append((x,cy)); curr['in'].append((0,0)); curr['out'].append((0,0)); cx=x; last='H'; prev_cx2=prev_qx1=None
        elif cmd == 'h':
            if i>=len(tokens): break
            dx=tokens[i]; i+=1; x=cx+dx; ensure(); curr['verts'].append((x,cy)); curr['in'].append((0,0)); curr['out'].append((0,0)); cx=x; last='h'; prev_cx2=prev_qx1=None
        elif cmd == 'V':
            if i>=len(tokens): break
            y=tokens[i]; i+=1; ensure(); curr['verts'].append((cx,y)); curr['in'].append((0,0)); curr['out'].append((0,0)); cy=y; last='V'; prev_cx2=prev_qx1=None
        elif cmd == 'v':
            if i>=len(tokens): break
            dy=tokens[i]; i+=1; y=cy+dy; ensure(); curr['verts'].append((cx,y)); curr['in'].append((0,0)); curr['out'].append((0,0)); cy=y; last='v'; prev_cx2=prev_qx1=None
        elif cmd == 'C':
            if i+5>=len(tokens): break
            x1,y1,x2,y2,x,y = tokens[i:i+6]; i+=6; ensure()
            px,py = curr['verts'][-1]; curr['out'][-1]=(x1-px,y1-py)
            curr['verts'].append((x,y)); curr['in'].append((x2-x,y2-y)); curr['out'].append((0,0)); cx,cy=x,y; prev_cx2,prev_cy2=x2,y2; prev_qx1=None; last='C'
        elif cmd == 'c':
            if i+5>=len(tokens): break
            dx1,dy1,dx2,dy2,dx,dy = tokens[i:i+6]; i+=6
            x1,y1 = cx+dx1, cy+dy1; x2,y2 = cx+dx2, cy+dy2; x,y = cx+dx, cy+dy; ensure()
            px,py = curr['verts'][-1]; curr['out'][-1]=(x1-px,y1-py)
            curr['verts'].append((x,y)); curr['in'].append((x2-x,y2-y)); curr['out'].append((0,0)); cx,cy=x,y; prev_cx2,prev_cy2=x2,y2; prev_qx1=None; last='c'
        elif cmd == 'S':
            if i+3>=len(tokens): break
            x2,y2,x,y = tokens[i:i+4]; i+=4
            x1 = 2*cx-prev_cx2 if prev_cx2 is not None else cx; y1 = 2*cy-prev_cy2 if prev_cy2 is not None else cy; ensure()
            px,py = curr['verts'][-1]; curr['out'][-1]=(x1-px,y1-py)
            curr['verts'].append((x,y)); curr['in'].append((x2-x,y2-y)); curr['out'].append((0,0)); cx,cy=x,y; prev_cx2,prev_cy2=x2,y2; prev_qx1=None; last='S'
        elif cmd == 's':
            if i+3>=len(tokens): break
            dx2,dy2,dx,dy = tokens[i:i+4]; i+=4; x2,y2=cx+dx2,cy+dy2; x,y=cx+dx,cy+dy
            x1 = 2*cx-prev_cx2 if prev_cx2 is not None else cx; y1 = 2*cy-prev_cy2 if prev_cy2 is not None else cy; ensure()
            px,py = curr['verts'][-1]; curr['out'][-1]=(x1-px,y1-py)
            curr['verts'].append((x,y)); curr['in'].append((x2-x,y2-y)); curr['out'].append((0,0)); cx,cy=x,y; prev_cx2,prev_cy2=x2,y2; prev_qx1=None; last='s'
        elif cmd == 'Q':
            if i+3>=len(tokens): break
            x1,y1,x,y = tokens[i:i+4]; i+=4; ensure()
            x0,y0 = curr['verts'][-1]
            cx1 = x0 + (2/3)*(x1-x0); cy1 = y0 + (2/3)*(y1-y0)
            cx2 = x + (2/3)*(x1-x); cy2 = y + (2/3)*(y1-y)
            curr['out'][-1]=(cx1-x0,cy1-y0); curr['verts'].append((x,y)); curr['in'].append((cx2-x,cy2-y)); curr['out'].append((0,0))
            cx,cy=x,y; prev_qx1,prev_qy1=x1,y1; prev_cx2=None; last='Q'
        elif cmd == 'q':
            if i+3>=len(tokens): break
            dx1,dy1,dx,dy = tokens[i:i+4]; i+=4; x1,y1=cx+dx1,cy+dy1; x,y=cx+dx,cy+dy; ensure()
            x0,y0 = curr['verts'][-1]
            cx1 = x0 + (2/3)*(x1-x0); cy1 = y0 + (2/3)*(y1-y0)
            cx2 = x + (2/3)*(x1-x); cy2 = y + (2/3)*(y1-y)
            curr['out'][-1]=(cx1-x0,cy1-y0); curr['verts'].append((x,y)); curr['in'].append((cx2-x,cy2-y)); curr['out'].append((0,0))
            cx,cy=x,y; prev_qx1,prev_qy1=x1,y1; prev_cx2=None; last='q'
        elif cmd in ('Z','z'):
            if curr: curr['closed']=True; cx,cy=sx,sy; subpaths.append(curr); curr=None
            prev_cx2=prev_qx1=None; last=None
        elif cmd in ('A','a'):
            if i+6>=len(tokens): break
            x = tokens[i+5] if cmd=='A' else cx+tokens[i+5]; y = tokens[i+6] if cmd=='A' else cy+tokens[i+6]; i+=7
            ensure(); curr['verts'].append((x,y)); curr['in'].append((0,0)); curr['out'].append((0,0)); cx,cy=x,y; prev_cx2=prev_qx1=None; last=cmd
        else:
            i+=1
    if curr and curr['verts']: subpaths.append(curr)
    return subpaths

def subpath_to_lottie(sp, mat):
    if not sp['verts']: return None
    tv, ti, to = [], [], []
    for (x,y),(ix,iy),(ox,oy) in zip(sp['verts'], sp['in'], sp['out']):
        tv.append(list(apply_point(mat, x, y)))
        ti.append(list(apply_vector(mat, ix, iy)))
        to.append(list(apply_vector(mat, ox, oy)))
    return {"ty":"sh","ks":{"a":0,"k":{"i":ti,"o":to,"v":tv,"c":sp['closed']}}}

# -------------------- SVG extraction --------------------
def extract_svg(svg_path):
    text = Path(svg_path).read_text(encoding='utf-8', errors='ignore')
    vb = re.search(r'viewBox="([^"]+)"', text)
    w,h = 1920,1080
    if vb:
        try:
            _,_,w,h = [float(v) for v in vb.group(1).split()]; 
        except: pass
    try:
        root = ET.fromstring(text.encode('utf-8'))
    except Exception as e:
        print(f"  XML fallback due to {e}")
        glyphs=[]
        for trans_str,d in re.findall(r'<g transform="([^"]+)">\s*<path d="([^"]+)"', text):
            glyphs.append({'d':d,'matrix':parse_transform(trans_str)})
        for d in re.findall(r'<path[^>]*d="([^"]+)"', text):
            if not any(g['d']==d for g in glyphs):
                glyphs.append({'d':d,'matrix':identity()})
        return w,h,glyphs

    paths=[]
    def walk(elem, cur_mat):
        trans = elem.attrib.get('transform','')
        mat = parse_transform(trans)
        combined = compose(cur_mat, mat) if trans else cur_mat
        tag = elem.tag.split('}')[-1] if '}' in elem.tag else elem.tag
        if tag == 'path':
            d = elem.attrib.get('d','')
            if d: paths.append({'d':d,'matrix':combined})
        for child in elem:
            walk(child, combined)
    walk(root, identity())
    return w,h,paths

# -------------------- Lottie creation --------------------
def round_floats(obj, prec=3):
    if isinstance(obj, float): return round(obj, prec)
    if isinstance(obj, dict): return {k: round_floats(v, prec) for k,v in obj.items()}
    if isinstance(obj, list): return [round_floats(x, prec) for x in obj]
    return obj

def create_lottie_json(w,h,path_groups,color_rgb,out_path,stroke=3,fr=60,op=120,stagger=4,duration=50):
    layers=[]
    for idx, pg in enumerate(path_groups):
        mat = pg['matrix']; d = pg['d']
        subpaths = parse_path(d)
        shapes = [s for s in (subpath_to_lottie(sp, mat) for sp in subpaths) if s]
        if not shapes: continue
        stroke_obj = {"ty":"st","c":{"a":0,"k":[color_rgb[0],color_rgb[1],color_rgb[2],1]},"o":{"a":0,"k":100},"w":{"a":0,"k":stroke},"lc":2,"lj":2,"ml":4,"bm":0,"nm":"Stroke"}
        t0 = idx*stagger; t1 = min(t0+duration, op)
        if t0>=op: t0=op-1
        trim = {"ty":"tm","s":{"a":0,"k":0},"e":{"a":1,"k":[{"t":t0,"s":[0],"o":{"x":[0.42],"y":[0]},"i":{"x":[0.58],"y":[1]}},{"t":t1,"s":[100]}]},"o":{"a":0,"k":0},"m":1,"nm":"Trim"}
        layer = {"ddd":0,"ind":idx+1,"ty":4,"nm":f"path-{idx}","sr":1,"ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[0,0,0]},"a":{"a":0,"k":[0,0,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"shapes":shapes+[stroke_obj,trim],"ip":0,"op":op,"st":0,"bm":0}
        layers.append(layer)
    lottie = {"v":"5.7.4","fr":fr,"ip":0,"op":op,"w":w,"h":h,"nm":Path(out_path).stem,"ddd":0,"assets":[],"layers":layers}
    Path(out_path).parent.mkdir(parents=True, exist_ok=True)
    with open(out_path,'w') as f: json.dump(lottie,f,indent=2)
    print(f"  JSON {Path(out_path).name:30} {len(layers)} layers, {w}x{h}, {op}f, color {color_rgb}")
    return out_path

def create_optimized_json(in_path, out_path, prec=2):
    data = json.loads(Path(in_path).read_text())
    data = round_floats(data, prec)
    with open(out_path,'w') as f: json.dump(data,f,separators=(',',':'))
    print(f"  OPT  {Path(out_path).name:30} {Path(in_path).stat().st_size/1024:.1f}KB → {Path(out_path).stat().st_size/1024:.1f}KB")
    return out_path

def create_dotlottie(json_path, dotlottie_path, anim_id=None):
    json_path = Path(json_path); dotlottie_path = Path(dotlottie_path)
    anim_id = anim_id or json_path.stem
    anim_data = json.loads(json_path.read_text())
    manifest = {
        "version":"1.0",
        "name":anim_id,
        "animations":[{"id":anim_id,"name":anim_id,"file":f"animations/{anim_id}.json","loop":True,"autoplay":True}],
        "author":"PM-Web_V2"
    }
    with zipfile.ZipFile(dotlottie_path,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
        z.writestr("manifest.json", json.dumps(manifest, indent=2))
        z.writestr(f"animations/{anim_id}.json", json.dumps(anim_data))
    print(f"  LOTTIE {Path(dotlottie_path).name:30} {json_path.stat().st_size/1024:.1f}KB → {dotlottie_path.stat().st_size/1024:.1f}KB ({dotlottie_path.stat().st_size/json_path.stat().st_size*100:.1f}%)")
    return dotlottie_path

def parse_color(c):
    c=c.lower().strip()
    if c=='black': return [0,0,0]
    if c=='white': return [1,1,1]
    if c.startswith('#'): c=c[1:]
    if len(c)==3: return [int(c[0]*2,16)/255, int(c[1]*2,16)/255, int(c[2]*2,16)/255]
    if len(c)==6: return [int(c[0:2],16)/255, int(c[2:4],16)/255, int(c[4:6],16)/255]
    return [0,0,0]

# -------------------- Preview HTML --------------------
def create_root_preview(lottie_files, output_path):
    """
    Creates preview.html in root showcasing JSON (lottie-web) + .lottie (dotlottie-web)
    Uses CDN: https://cdn.jsdelivr.net/npm/@lottiefiles/dotlottie-web/+esm
    """
    showcase = lottie_files[:8]

    cards_html = ""
    dotlottie_inits = ""
    lottie_web_inits = ""

    for jf in showcase:
        rel_path = f"public/lottie/{jf.name}"
        is_lottie = jf.suffix == '.lottie'
        safe_id = jf.stem.replace('.','-').replace(' ','-')

        if is_lottie:
            canvas_id = f"canvas-{safe_id}"
            cards_html += f'''
        <div class="card">
            <div class="badge dot">.LOTTIE • {jf.stat().st_size/1024:.1f}KB</div>
            <canvas id="{canvas_id}" class="dotlottie-canvas"></canvas>
            <div class="info">
                <div class="name">{jf.name}</div>
                <div class="meta">dotLottie • ZIP • {rel_path} • canvas + DotLottie</div>
            </div>
        </div>'''
            dotlottie_inits += f'''
        new DotLottie({{
            canvas: document.getElementById('{canvas_id}'),
            src: '{rel_path}',
            loop: true,
            autoplay: true,
            backgroundColor: 'transparent'
        }});'''
        else:
            div_id = f"anim-{safe_id}"
            cards_html += f'''
        <div class="card">
            <div class="badge json">JSON • {jf.stat().st_size/1024:.1f}KB</div>
            <div id="{div_id}" class="lottie-container"></div>
            <div class="info">
                <div class="name">{jf.name}</div>
                <div class="meta">Lottie JSON • {rel_path} • lottie-web</div>
            </div>
        </div>'''
            lottie_web_inits += f'''
        lottie.loadAnimation({{
            container: document.getElementById('{div_id}'),
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: '{rel_path}',
            rendererSettings: {{preserveAspectRatio:'xMidYMid meet'}}
        }});'''

    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Lottie Showcase - SVG → JSON → .lottie (dotlottie-web)</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js"></script>
<style>
*{{margin:0;padding:0;box-sizing:border-box}}
body{{font-family: ui-monospace, SFMono-Regular, Menlo, monospace; background:#0a0a0a; color:#ededed;}}
header{{max-width:1400px;margin:0 auto;padding:48px 24px 24px}}
h1{{font-size:36px;letter-spacing:-0.03em;line-height:1.1}}
h1 span{{color:#666}}
p{{color:#888;margin-top:12px;max-width:700px;line-height:1.6;font-size:14px}}
code{{background:#1a1a1a;padding:2px 6px;border-radius:4px;font-size:12px}}
.stats{{display:flex;gap:12px;margin-top:20px;flex-wrap:wrap}}
.stat{{background:#1a1a1a;border:1px solid #222;border-radius:999px;padding:6px 12px;font-size:12px}}
.stat b{{color:#00DDB3}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:20px;max-width:1400px;margin:32px auto;padding:0 24px 48px}}
.card{{background:#111;border:1px solid #222;border-radius:16px;overflow:hidden;position:relative;aspect-ratio:16/10;display:flex;flex-direction:column}}
.lottie-container{{width:100%;flex:1;background:transparent}}
.dotlottie-canvas{{width:100%;flex:1;background:transparent;display:block}}
.badge{{position:absolute;top:12px;left:12px;z-index:2;padding:4px 8px;border-radius:999px;font-size:10px;font-weight:bold;letter-spacing:0.05em}}
.badge.json{{background:white;color:black}}
.badge.dot{{background:#00DDB3;color:black}}
.info{{padding:14px 16px;border-top:1px solid #222;background:#0f0f0f}}
.name{{font-size:13px;font-weight:600}}
.meta{{font-size:11px;color:#666;margin-top:4px;word-break:break-all}}
footer{{max-width:1400px;margin:0 auto;padding:0 24px 48px;color:#444;font-size:12px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px}}
a{{color:#888;text-decoration:underline}}
</style>
</head>
<body>
<header>
<h1>SVG → Lottie JSON → .lottie<br><span>dotlottie-web CDN • path reveal • transparent</span></h1>
<p>Generated from <code>public/svg/</code> → <code>public/lottie/</code> using <code>convert.py</code>. 
<br>JSON uses <code>lottie-web</code>. .lottie uses <code>dotlottie-web</code> via ESM CDN: <code>https://cdn.jsdelivr.net/npm/@lottiefiles/dotlottie-web/+esm</code></p>
<div class="stats">
<span class="stat"><b>{len([f for f in showcase if f.suffix=='.json'])} JSON</b> + <b>{len([f for f in showcase if f.suffix=='.lottie'])} .lottie</b> showcased</span>
<span class="stat">Inputs: <b>public/svg/*.svg</b></span>
<span class="stat">Outputs: <b>public/lottie/</b></span>
<span class="stat">Script: <b>convert.py</b> at root</span>
<span class="stat">CDN: <b>dotlottie-web +esm</b></span>
</div>
</header>

<div class="grid">
{cards_html}
</div>

<footer>
<span>Build: <code>python3 convert.py</code> — JSON via lottie-web, .lottie via dotlottie-web</span>
<span><a href="public/lottie/">public/lottie/</a> • <a href="public/svg/">public/svg/</a> • <a href="https://docs.lottiefiles.com/en/runtimes/distributions/js/v0.x/getting-started/installation#load-from-a-cdn" target="_blank">dotLottie docs</a></span>
</footer>

<script type="module">
  import {{ DotLottie }} from "https://cdn.jsdelivr.net/npm/@lottiefiles/dotlottie-web/+esm";
  {dotlottie_inits}
</script>

<script>
  {lottie_web_inits}
</script>
</body>
</html>
'''
    Path(output_path).write_text(html, encoding='utf-8')
    print(f"\n✓ Preview HTML: {output_path} ({Path(output_path).stat().st_size/1024:.1f}KB) with {len(showcase)} animations (dotlottie-web +esm)")

def create_lottie_preview_html(lottie_dir):
    """Create public/lottie/preview.html showcasing both JSON (lottie-web) and .lottie (dotlottie-web)"""
    json_files = sorted(Path(lottie_dir).glob("*.json"))
    json_files = [f for f in json_files if not f.name.endswith(('.opt.json','.min.json')) and f.name!='manifest.json']
    lottie_files = sorted(Path(lottie_dir).glob("*.lottie"))
    lottie_files = [f for f in lottie_files if not f.name.endswith('.opt.lottie') and f.name!='collection.lottie']
    
    # Mix: 2 JSON + 2 .lottie
    showcase_json = json_files[:2]
    showcase_lottie = lottie_files[:2]
    showcase = showcase_json + showcase_lottie

    cards = ""
    lottie_web_loaders = ""
    dotlottie_inits = ""

    for jf in showcase:
        if jf.suffix == '.json':
            div_id = f"anim-{jf.stem.replace('.','-')}"
            cards += f'''
    <div class="card"><div id="{div_id}" class="preview"></div><div class="info"><span class="tag">{jf.name}</span><span class="tag">{jf.stat().st_size/1024:.1f}KB</span><span class="tag">JSON</span></div></div>'''
            lottie_web_loaders += f'''
    lottie.loadAnimation({{container: document.getElementById('{div_id}'), renderer:'svg', loop:true, autoplay:true, path:'{jf.name}', rendererSettings:{{preserveAspectRatio:'xMidYMid meet'}}}});'''
        else:
            canvas_id = f"canvas-{jf.stem.replace('.','-')}"
            cards += f'''
    <div class="card dark"><canvas id="{canvas_id}" class="preview"></canvas><div class="info"><span class="tag">{jf.name}</span><span class="tag">{jf.stat().st_size/1024:.1f}KB</span><span class="tag" style="background:#00DDB3;color:black">.LOTTIE</span></div></div>'''
            dotlottie_inits += f'''
        new DotLottie({{canvas: document.getElementById('{canvas_id}'), src: '{jf.name}', loop:true, autoplay:true}});'''

    html = f'''<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Lottie Preview - JSON + .lottie (dotlottie-web)</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js"></script>
<style>
*{{margin:0;padding:0;box-sizing:border-box}}body{{font-family:ui-monospace,monospace;background:#fafafa;color:#111}}
h1{{max-width:1200px;margin:40px auto 0;padding:0 24px;font-size:24px}}
p{{max-width:1200px;margin:8px auto 0;padding:0 24px;color:#666;font-size:13px}}
.grid{{display:grid;grid-template-columns:1fr 1fr;gap:24px;max-width:1200px;margin:24px auto;padding:0 24px}}
.card{{background:white;border:1px solid #e5e5e5;border-radius:16px;overflow:hidden;position:relative}}
.card.dark{{background:black;border-color:#222}}
.preview{{aspect-ratio:1920/1080;width:100%;display:block}}
.info{{padding:12px 16px;border-top:1px solid #eee;display:flex;gap:8px;flex-wrap:wrap}}
.card.dark .info{{border-top-color:#222;background:#0a0a0a}}
.tag{{font-size:11px;padding:4px 8px;border-radius:999px;background:#111;color:white}}
.card.dark .tag{{background:#222;color:#ccc}}
@media(max-width:800px){{.grid{{grid-template-columns:1fr}}}}
</style>
</head><body>
<h1>Lottie Preview - JSON + .lottie</h1>
<p>JSON uses lottie-web, .lottie uses dotlottie-web via <code>https://cdn.jsdelivr.net/npm/@lottiefiles/dotlottie-web/+esm</code></p>
<div class="grid">{cards}</div>

<script type="module">
  import {{ DotLottie }} from "https://cdn.jsdelivr.net/npm/@lottiefiles/dotlottie-web/+esm";
  {dotlottie_inits}
</script>
<script>
  {lottie_web_loaders}
</script>
</body></html>'''
    Path(lottie_dir, "preview.html").write_text(html)
    print(f"✓ Lottie preview: {lottie_dir}/preview.html (JSON + .lottie with dotlottie-web)")

# -------------------- Main --------------------
def main():
    parser = argparse.ArgumentParser(description="SVG → JSON → .lottie + preview.html (all-in-one)")
    parser.add_argument("--stroke", type=float, default=3, help="Stroke width")
    parser.add_argument("--fr", type=int, default=60, help="Framerate")
    parser.add_argument("--op", type=int, default=120, help="Total frames (default 120, pm2 uses 150)")
    parser.add_argument("--stagger", type=int, default=4, help="Stagger between paths")
    parser.add_argument("--duration", type=int, default=50, help="Duration per path")
    parser.add_argument("--color", default="both", help="black, white, both, or hex")
    parser.add_argument("--no-white", action="store_true", help="Skip white variants")
    parser.add_argument("--no-black", action="store_true", help="Skip black variants")
    parser.add_argument("--clean", action="store_true", help="Remove old generated files in public/lottie/ before build")
    args = parser.parse_args()

    # Find SVG dir
    svg_dir = None
    for d in SVG_DIRS:
        if d.exists():
            svg_dir = d
            break
    if not svg_dir:
        print("No SVG dir found, checked:", SVG_DIRS)
        return

    svg_files = sorted(svg_dir.glob("*.svg"))
    if not svg_files:
        print(f"No SVGs in {svg_dir}")
        return

    print(f"Found {len(svg_files)} SVGs in {svg_dir}: {[f.name for f in svg_files]}")

    LOTTIE_DIR.mkdir(parents=True, exist_ok=True)

    if args.clean:
        print(f"Cleaning {LOTTIE_DIR}...")
        for f in LOTTIE_DIR.glob("*.json"):
            if f.name != "manifest.json":
                f.unlink()
        for f in LOTTIE_DIR.glob("*.lottie"):
            f.unlink()

    # Determine colors
    colors = []
    if args.color == "both":
        if not args.no_black: colors.append(("black", [0,0,0]))
        if not args.no_white: colors.append(("white", [1,1,1]))
    else:
        from pathlib import Path as P
        # parse hex
        cstr = args.color.lower()
        if cstr == "black": rgb=[0,0,0]
        elif cstr == "white": rgb=[1,1,1]
        else:
            # hex
            if cstr.startswith('#'): cstr=cstr[1:]
            if len(cstr)==6:
                rgb=[int(cstr[0:2],16)/255, int(cstr[2:4],16)/255, int(cstr[4:6],16)/255]
            else:
                rgb=[0,0,0]
        colors.append((args.color, rgb))

    # Special handling for pm2.svg which needs longer duration (complex cursive)
    # We'll detect by file size or name
    all_generated_jsons = []
    all_generated_lotties = []

    for svg_file in svg_files:
        print(f"\nProcessing {svg_file.name}...")
        w,h,paths = extract_svg(svg_file)
        print(f"  {len(paths)} paths, viewBox {w}x{h}")

        # Adjust timing for complex files (pm2)
        op = args.op
        duration = args.duration
        stagger = args.stagger
        if "pm2" in svg_file.name.lower() or len(paths)>20 or svg_file.stat().st_size > 30000:
            op = 150
            duration = 60
            stagger = 5
            print(f"  Complex SVG detected, using op={op}, duration={duration}, stagger={stagger}")

        for cname, crgb in colors:
            base_name = f"{svg_file.stem}-{cname}"
            json_path = LOTTIE_DIR / f"{base_name}.json"
            create_lottie_json(w,h,paths,crgb,json_path,stroke=args.stroke,fr=args.fr,op=op,stagger=stagger,duration=duration)
            all_generated_jsons.append(json_path)

            # Optimized JSON
            opt_path = LOTTIE_DIR / f"{base_name}.opt.json"
            create_optimized_json(json_path, opt_path, prec=2)
            all_generated_jsons.append(opt_path)

            # .lottie from original
            lottie_path = LOTTIE_DIR / f"{base_name}.lottie"
            create_dotlottie(json_path, lottie_path, anim_id=base_name)
            all_generated_lotties.append(lottie_path)

            # .lottie from optimized
            opt_lottie_path = LOTTIE_DIR / f"{base_name}.opt.lottie"
            create_dotlottie(opt_path, opt_lottie_path, anim_id=f"{base_name}-opt")
            all_generated_lotties.append(opt_lottie_path)

    # Bundle collections
    print(f"\n--- Bundles ---")
    # Original JSONs only (not opt)
    orig_jsons = [f for f in all_generated_jsons if not f.name.endswith('.opt.json')]
    if orig_jsons:
        bundle_path = LOTTIE_DIR / "collection.lottie"
        # Create bundle
        anims = [{"id":p.stem,"name":p.stem,"file":f"animations/{p.stem}.json","loop":True,"autoplay":True} for p in orig_jsons]
        manifest = {"version":"1.0","name":"collection","animations":anims}
        with zipfile.ZipFile(bundle_path,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
            z.writestr("manifest.json", json.dumps(manifest, indent=2))
            for p in orig_jsons:
                z.writestr(f"animations/{p.stem}.json", json.dumps(json.loads(p.read_text())))
        print(f"  Bundle {bundle_path.name} {sum(p.stat().st_size for p in orig_jsons)/1024:.1f}KB → {bundle_path.stat().st_size/1024:.1f}KB")
        all_generated_lotties.append(bundle_path)

    # Preview HTMLs
    print(f"\n--- Preview HTMLs ---")
    # Root preview showcasing mix of JSON + .lottie
    mixed = []
    # Pick 2 JSON + 2 lottie for showcase
    jsons_for_preview = [f for f in all_generated_jsons if not f.name.endswith('.opt.json')][:2]
    lotties_for_preview = [f for f in all_generated_lotties if not f.name.endswith('.opt.lottie') and f.name!='collection.lottie'][:2]
    mixed = jsons_for_preview + lotties_for_preview
    # Also add collection if exists
    create_root_preview(mixed, ROOT_PREVIEW)
    create_lottie_preview_html(LOTTIE_DIR)

    print(f"\nDone! Generated {len(all_generated_jsons)} JSONs + {len(all_generated_lotties)} .lottie files in {LOTTIE_DIR}")
    print(f"Root preview: {ROOT_PREVIEW}")
    print(f"Lottie preview: {LOTTIE_PREVIEW}")
    print(f"\nRun: python3 -m http.server 8000")
    print(f"Then open: http://localhost:8000/preview.html")
    print(f"And: http://localhost:8000/public/lottie/preview.html")

if __name__ == "__main__":
    main()
