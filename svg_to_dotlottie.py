#!/usr/bin/env python3
"""
SVG → dotLottie (.lottie) only converter
- Inputs always in public/svg/ (or public/SVG/)
- Outputs only .lottie files to public/lottie/
- No JSON, no HTML, no collection

Features:
  - Select files via args: python3 svg_to_dotlottie.py pm.svg pm2.svg
    (accepts: pm, pm.svg, public/svg/pm.svg, public/SVG/pm.svg)
  - Forward then reverse (boomerang/ping-pong) with delay
  - Loop, autoplay, speed, reverse delay, etc.

Usage:
  python3 svg_to_dotlottie.py pm.svg
  python3 svg_to_dotlottie.py pm pm2 --color both --boomerang --reverse-delay 20 --loop
  python3 svg_to_dotlottie.py logo.svg --color "#FF5500" --stroke 2.5 --loop --speed 1.2
  python3 svg_to_dotlottie.py all --color black  (converts all SVGs in public/svg/)

Params:
  --color black|white|#RRGGBB|both (default black)
  --stroke 3 (stroke width)
  --fr 60 (fps)
  --op auto (auto-calculated) or 120
  --stagger 4 (frames between paths)
  --duration 50 (frames per path reveal)
  --loop / --no-loop (dotLottie loop, default True)
  --autoplay / --no-autoplay (default True)
  --speed 1.0 (playback speed for dotLottie manifest)
  --boomerang / --ping-pong (forward then reverse)
  --reverse-delay 30 (frames to hold at 100% before reversing)
  --reverse-duration 50 (frames for reverse, default same as duration)
  --delay 0 (initial delay frames before first reveal)
  --mode forward|reverse|boomerang (alternative to --boomerang flag)

Examples:
  # Simple black .lottie
  python3 svg_to_dotlottie.py pm.svg

  # Black+white with boomerang and 30f hold at peak
  python3 svg_to_dotlottie.py pm.svg --color both --boomerang --reverse-delay 30 --loop

  # Custom color, no loop, with initial delay
  python3 svg_to_dotlottie.py pm2.svg --color "#00DDB3" --no-loop --delay 15 --stroke 4
"""

import re
import json
import math
import argparse
import zipfile
from pathlib import Path
import xml.etree.ElementTree as ET

SVG_CANDIDATES = [Path("public/svg"), Path("public/SVG"), Path("public/Svg")]
LOTTIE_DIR = Path("public/lottie")

def identity(): return (1,0,0,1,0,0)
def compose(m2,m1):
    a2,b2,c2,d2,e2,f2=m2; a1,b1,c1,d1,e1,f1=m1
    return (a2*a1+c2*b1, b2*a1+d2*b1, a2*c1+c2*d1, b2*c1+d2*d1, a2*e1+c2*f1+e2, b2*e1+d2*f1+f2)
def apply_point(m,x,y):
    a,b,c,d,e,f=m; return (a*x+c*y+e, b*x+d*y+f)
def apply_vector(m,vx,vy):
    a,b,c,d,e,f=m; return (a*vx+c*vy, b*vx+d*vy)
def parse_transform(tstr):
    if not tstr: return identity()
    cur=identity()
    for func, args_str in re.findall(r'(\w+)\s*\(([^)]+)\)', tstr):
        args=[float(v) for v in re.split(r'[,\s]+', args_str.strip()) if v!='']
        mat=identity()
        if func=='matrix' and len(args)==6: mat=tuple(args)
        elif func=='translate': mat=(1,0,0,1,args[0] if len(args)>=1 else 0, args[1] if len(args)>=2 else 0)
        elif func=='scale': sx=args[0] if len(args)>=1 else 1; sy=args[1] if len(args)>=2 else sx; mat=(sx,0,0,sy,0,0)
        elif func=='rotate':
            ang=args[0] if len(args)>=1 else 0; rad=math.radians(ang); ca,sa=math.cos(rad),math.sin(rad)
            if len(args)>=3:
                cx,cy=args[1],args[2]; t1=(1,0,0,1,cx,cy); r=(ca,sa,-sa,ca,0,0); t2=(1,0,0,1,-cx,-cy)
                mat=compose(t1, compose(r,t2))
            else: mat=(ca,sa,-sa,ca,0,0)
        elif func=='skewX': mat=(1,0,math.tan(math.radians(args[0] if args else 0)),1,0,0)
        elif func=='skewY': mat=(1,math.tan(math.radians(args[0] if args else 0)),0,1,0,0)
        cur=compose(cur, mat)
    return cur

def tokenize(d):
    raw=re.findall(r'[A-Za-z]|[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?', d)
    toks=[]
    for t in raw:
        if re.match(r'^[A-Za-z]$', t): toks.append(t)
        else:
            try:
                if t not in ('-','+','.','-.','+.'): toks.append(float(t))
            except: pass
    return toks

def parse_path(d):
    tokens=tokenize(d); subpaths=[]; curr=None; cx=cy=sx=sy=0.0; last=None; prev_cx2=prev_cy2=prev_qx1=prev_qy1=None; i=0
    def ensure():
        nonlocal curr,sx,sy
        if curr is None:
            curr={'verts':[(cx,cy)],'in':[(0,0)],'out':[(0,0)],'closed':False}; sx,sy=cx,cy
        return curr
    while i < len(tokens):
        tok=tokens[i]
        if isinstance(tok,str): cmd=tok; i+=1
        else:
            if last is None: i+=1; continue
            cmd=last
        if cmd=='M':
            if i+1>=len(tokens): break
            x,y=tokens[i],tokens[i+1]; i+=2
            if curr and curr['verts']: subpaths.append(curr)
            curr={'verts':[(x,y)],'in':[(0,0)],'out':[(0,0)],'closed':False}; cx,cy=x,y; sx,sy=x,y; last='L'; prev_cx2=prev_qx1=None
        elif cmd=='m':
            if i+1>=len(tokens): break
            dx,dy=tokens[i],tokens[i+1]; i+=2; x,y=cx+dx,cy+dy
            if curr and curr['verts']: subpaths.append(curr)
            curr={'verts':[(x,y)],'in':[(0,0)],'out':[(0,0)],'closed':False}; cx,cy=x,y; sx,sy=x,y; last='l'; prev_cx2=prev_qx1=None
        elif cmd=='L':
            if i+1>=len(tokens): break
            x,y=tokens[i],tokens[i+1]; i+=2; ensure(); curr['verts'].append((x,y)); curr['in'].append((0,0)); curr['out'].append((0,0)); cx,cy=x,y; last='L'; prev_cx2=prev_qx1=None
        elif cmd=='l':
            if i+1>=len(tokens): break
            dx,dy=tokens[i],tokens[i+1]; i+=2; x,y=cx+dx,cy+dy; ensure(); curr['verts'].append((x,y)); curr['in'].append((0,0)); curr['out'].append((0,0)); cx,cy=x,y; last='l'; prev_cx2=prev_qx1=None
        elif cmd=='H':
            if i>=len(tokens): break
            x=tokens[i]; i+=1; ensure(); curr['verts'].append((x,cy)); curr['in'].append((0,0)); curr['out'].append((0,0)); cx=x; last='H'; prev_cx2=prev_qx1=None
        elif cmd=='h':
            if i>=len(tokens): break
            dx=tokens[i]; i+=1; x=cx+dx; ensure(); curr['verts'].append((x,cy)); curr['in'].append((0,0)); curr['out'].append((0,0)); cx=x; last='h'; prev_cx2=prev_qx1=None
        elif cmd=='V':
            if i>=len(tokens): break
            y=tokens[i]; i+=1; ensure(); curr['verts'].append((cx,y)); curr['in'].append((0,0)); curr['out'].append((0,0)); cy=y; last='V'; prev_cx2=prev_qx1=None
        elif cmd=='v':
            if i>=len(tokens): break
            dy=tokens[i]; i+=1; y=cy+dy; ensure(); curr['verts'].append((cx,y)); curr['in'].append((0,0)); curr['out'].append((0,0)); cy=y; last='v'; prev_cx2=prev_qx1=None
        elif cmd=='C':
            if i+5>=len(tokens): break
            x1,y1,x2,y2,x,y=tokens[i:i+6]; i+=6; ensure(); px,py=curr['verts'][-1]; curr['out'][-1]=(x1-px,y1-py); curr['verts'].append((x,y)); curr['in'].append((x2-x,y2-y)); curr['out'].append((0,0)); cx,cy=x,y; prev_cx2,prev_cy2=x2,y2; prev_qx1=None; last='C'
        elif cmd=='c':
            if i+5>=len(tokens): break
            dx1,dy1,dx2,dy2,dx,dy=tokens[i:i+6]; i+=6; x1,y1=cx+dx1,cy+dy1; x2,y2=cx+dx2,cy+dy2; x,y=cx+dx,cy+dy; ensure(); px,py=curr['verts'][-1]; curr['out'][-1]=(x1-px,y1-py); curr['verts'].append((x,y)); curr['in'].append((x2-x,y2-y)); curr['out'].append((0,0)); cx,cy=x,y; prev_cx2,prev_cy2=x2,y2; prev_qx1=None; last='c'
        elif cmd=='S':
            if i+3>=len(tokens): break
            x2,y2,x,y=tokens[i:i+4]; i+=4; x1=2*cx-prev_cx2 if prev_cx2 is not None else cx; y1=2*cy-prev_cy2 if prev_cy2 is not None else cy; ensure(); px,py=curr['verts'][-1]; curr['out'][-1]=(x1-px,y1-py); curr['verts'].append((x,y)); curr['in'].append((x2-x,y2-y)); curr['out'].append((0,0)); cx,cy=x,y; prev_cx2,prev_cy2=x2,y2; prev_qx1=None; last='S'
        elif cmd=='s':
            if i+3>=len(tokens): break
            dx2,dy2,dx,dy=tokens[i:i+4]; i+=4; x2,y2=cx+dx2,cy+dy2; x,y=cx+dx,cy+dy; x1=2*cx-prev_cx2 if prev_cx2 is not None else cx; y1=2*cy-prev_cy2 if prev_cy2 is not None else cy; ensure(); px,py=curr['verts'][-1]; curr['out'][-1]=(x1-px,y1-py); curr['verts'].append((x,y)); curr['in'].append((x2-x,y2-y)); curr['out'].append((0,0)); cx,cy=x,y; prev_cx2,prev_cy2=x2,y2; prev_qx1=None; last='s'
        elif cmd=='Q':
            if i+3>=len(tokens): break
            x1,y1,x,y=tokens[i:i+4]; i+=4; ensure(); x0,y0=curr['verts'][-1]; cx1=x0+(2/3)*(x1-x0); cy1=y0+(2/3)*(y1-y0); cx2=x+(2/3)*(x1-x); cy2=y+(2/3)*(y1-y); curr['out'][-1]=(cx1-x0,cy1-y0); curr['verts'].append((x,y)); curr['in'].append((cx2-x,cy2-y)); curr['out'].append((0,0)); cx,cy=x,y; prev_qx1,prev_qy1=x1,y1; prev_cx2=None; last='Q'
        elif cmd=='q':
            if i+3>=len(tokens): break
            dx1,dy1,dx,dy=tokens[i:i+4]; i+=4; x1,y1=cx+dx1,cy+dy1; x,y=cx+dx,cy+dy; ensure(); x0,y0=curr['verts'][-1]; cx1=x0+(2/3)*(x1-x0); cy1=y0+(2/3)*(y1-y0); cx2=x+(2/3)*(x1-x); cy2=y+(2/3)*(y1-y); curr['out'][-1]=(cx1-x0,cy1-y0); curr['verts'].append((x,y)); curr['in'].append((cx2-x,cy2-y)); curr['out'].append((0,0)); cx,cy=x,y; prev_qx1,prev_qy1=x1,y1; prev_cx2=None; last='q'
        elif cmd in ('Z','z'):
            if curr: curr['closed']=True; cx,cy=sx,sy; subpaths.append(curr); curr=None
            prev_cx2=prev_qx1=None; last=None
        elif cmd in ('A','a'):
            if i+6>=len(tokens): break
            x=tokens[i+5] if cmd=='A' else cx+tokens[i+5]; y=tokens[i+6] if cmd=='A' else cy+tokens[i+6]; i+=7
            ensure(); curr['verts'].append((x,y)); curr['in'].append((0,0)); curr['out'].append((0,0)); cx,cy=x,y; prev_cx2=prev_qx1=None; last=cmd
        else: i+=1
    if curr and curr['verts']: subpaths.append(curr)
    return subpaths

def subpath_to_lottie(sp, mat):
    if not sp['verts']: return None
    tv,ti,to=[],[],[]
    for (x,y),(ix,iy),(ox,oy) in zip(sp['verts'], sp['in'], sp['out']):
        tv.append(list(apply_point(mat,x,y))); ti.append(list(apply_vector(mat,ix,iy))); to.append(list(apply_vector(mat,ox,oy)))
    return {"ty":"sh","ks":{"a":0,"k":{"i":ti,"o":to,"v":tv,"c":sp['closed']}}}

def extract_svg(svg_path):
    text=Path(svg_path).read_text(encoding='utf-8', errors='ignore')
    vb=re.search(r'viewBox="([^"]+)"', text); w,h=1920,1080
    if vb:
        try: _,_,w,h=[float(v) for v in vb.group(1).split()]
        except: pass
    try: root=ET.fromstring(text.encode('utf-8'))
    except:
        glyphs=[]
        for trans_str,d in re.findall(r'<g transform="([^"]+)">\s*<path d="([^"]+)"', text):
            glyphs.append({'d':d,'matrix':parse_transform(trans_str)})
        for d in re.findall(r'<path[^>]*d="([^"]+)"', text):
            if not any(g['d']==d for g in glyphs): glyphs.append({'d':d,'matrix':identity()})
        return w,h,glyphs
    paths=[]
    def walk(elem, cur_mat):
        trans=elem.attrib.get('transform',''); mat=parse_transform(trans)
        combined=compose(cur_mat, mat) if trans else cur_mat
        tag=elem.tag.split('}')[-1] if '}' in elem.tag else elem.tag
        if tag=='path':
            d=elem.attrib.get('d','')
            if d: paths.append({'d':d,'matrix':combined})
        for child in elem: walk(child, combined)
    walk(root, identity())
    return w,h,paths

def parse_color(c):
    c=c.lower().strip()
    if c=='black': return [0,0,0]
    if c=='white': return [1,1,1]
    if c.startswith('#'): c=c[1:]
    if len(c)==3: return [int(c[0]*2,16)/255, int(c[1]*2,16)/255, int(c[2]*2,16)/255]
    if len(c)==6: return [int(c[0:2],16)/255, int(c[2:4],16)/255, int(c[4:6],16)/255]
    return [0,0,0]

def build_trim_keyframes(idx, args, is_boomerang, total_op_estimate):
    """
    Build trim-path e keyframes with support for:
    - initial delay
    - forward reveal
    - hold at peak (reverse-delay)
    - reverse reveal
    - loop handling via manifest, not keyframes
    """
    delay = args.delay
    stagger = args.stagger
    duration = args.duration
    rev_delay = args.reverse_delay
    rev_duration = args.reverse_duration or duration

    # Start time for this path, including global delay + stagger
    t0 = delay + idx * stagger
    t1 = t0 + duration  # forward complete

    if args.mode == 'reverse':
        # Only reverse: start visible then hide
        kf = [
            {"t": t0, "s": [100], "o": {"x": [0.42], "y": [0]}, "i": {"x": [0.58], "y": [1]}},
            {"t": t1, "s": [0]}
        ]
        return kf, t1

    if is_boomerang or args.mode == 'boomerang':
        # Forward -> hold -> reverse
        t_hold_start = t1
        t_hold_end = t1 + rev_delay
        t2 = t_hold_end + rev_duration  # reverse complete

        kf = [
            {"t": t0, "s": [0], "o": {"x": [0.42], "y": [0]}, "i": {"x": [0.58], "y": [1]}},
            {"t": t1, "s": [100], "o": {"x": [0.42], "y": [0]}, "i": {"x": [0.58], "y": [1]}},
            {"t": t_hold_end, "s": [100], "o": {"x": [0.42], "y": [0]}, "i": {"x": [0.58], "y": [1]}},
            {"t": t2, "s": [0]}
        ]
        return kf, t2

    # Default forward only
    kf = [
        {"t": t0, "s": [0], "o": {"x": [0.42], "y": [0]}, "i": {"x": [0.58], "y": [1]}},
        {"t": t1, "s": [100]}
    ]
    return kf, t1

def create_lottie_data(w,h,paths,color_rgb,args, is_boomerang):
    layers=[]
    max_t = 0
    for idx, pg in enumerate(paths):
        mat=pg['matrix']; d=pg['d']
        subpaths=parse_path(d)
        shapes=[s for s in (subpath_to_lottie(sp, mat) for sp in subpaths) if s]
        if not shapes: continue

        stroke={"ty":"st","c":{"a":0,"k":[color_rgb[0],color_rgb[1],color_rgb[2],1]},"o":{"a":0,"k":100},"w":{"a":0,"k":args.stroke},"lc":2,"lj":2,"ml":4,"bm":0,"nm":"Stroke"}

        kf, end_t = build_trim_keyframes(idx, args, is_boomerang, args.op)
        max_t = max(max_t, end_t)

        trim={"ty":"tm","s":{"a":0,"k":0},"e":{"a":1,"k":kf},"o":{"a":0,"k":0},"m":1,"nm":"Trim"}

        layer={"ddd":0,"ind":idx+1,"ty":4,"nm":f"path-{idx}","sr":1,"ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[0,0,0]},"a":{"a":0,"k":[0,0,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"shapes":shapes+[stroke,trim],"ip":0,"op":max(args.op, int(max_t)+10),"st":0,"bm":0}
        layers.append(layer)

    # Determine final OP: max of args.op and max_t + buffer
    final_op = max(args.op, int(max_t) + 20)
    # If boomerang and loop, we want op to be exactly max_t + loop_delay maybe
    if is_boomerang:
        final_op = int(max_t) + args.loop_delay

    lottie={"v":"5.7.4","fr":args.fr,"ip":0,"op":final_op,"w":w,"h":h,"nm":"anim","ddd":0,"assets":[],"layers":layers}
    return lottie, final_op

def create_dotlottie_from_data(lottie_data, output_path, args, anim_id):
    """Create .lottie ZIP from lottie_data dict (no intermediate JSON file)"""
    manifest={
        "version":"1.0",
        "name":anim_id,
        "animations":[{
            "id":anim_id,
            "name":anim_id,
            "file":f"animations/{anim_id}.json",
            "loop": args.loop,
            "autoplay": args.autoplay,
            "speed": args.speed
        }],
        "author":"PM-Web_V2",
        "description": f"SVG path reveal • {anim_id} • boomerang={args.boomerang or args.mode=='boomerang'} • reverse-delay={args.reverse_delay}f"
    }
    # Optional: add custom interactivity or state? For now keep simple

    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output_path, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        z.writestr("manifest.json", json.dumps(manifest, indent=2))
        z.writestr(f"animations/{anim_id}.json", json.dumps(lottie_data))
    
    size = output_path.stat().st_size
    print(f"  → {output_path.name:35} {size/1024:6.1f}KB | loop={args.loop} autoplay={args.autoplay} speed={args.speed} boomerang={args.boomerang or args.mode=='boomerang'} reverse-delay={args.reverse_delay}f")

def find_svg_file(name):
    """Find SVG file in public/svg/ or public/SVG/ given name like pm, pm.svg, public/svg/pm.svg"""
    # If it's already a path and exists
    p = Path(name)
    if p.exists() and p.suffix == '.svg':
        return p
    
    # Strip directory and extension to get stem
    stem = Path(name).stem
    # If user passed "all", handle outside
    
    for svg_dir in SVG_CANDIDATES:
        if not svg_dir.exists():
            continue
        # Try exact name
        if (svg_dir / name).exists():
            return svg_dir / name
        # Try with .svg
        if (svg_dir / f"{name}.svg").exists():
            return svg_dir / f"{name}.svg"
        # Try stem
        if (svg_dir / f"{stem}.svg").exists():
            return svg_dir / f"{stem}.svg"
        # Case-insensitive search
        for f in svg_dir.glob("*.svg"):
            if f.stem.lower() == stem.lower() or f.name.lower() == name.lower():
                return f
    return None

def main():
    parser = argparse.ArgumentParser(description="SVG (public/svg/) → .lottie only (public/lottie/) with boomerang, loop, delays")
    parser.add_argument("files", nargs='+', help="SVG files to convert (e.g., pm.svg, pm, public/svg/pm.svg, or 'all' for all in public/svg/)")
    parser.add_argument("--color", default="black", help="black, white, #RRGGBB, or both (default black)")
    parser.add_argument("--stroke", type=float, default=3, help="Stroke width (default 3)")
    parser.add_argument("--fr", type=int, default=60, help="Framerate (default 60)")
    parser.add_argument("--op", type=int, default=0, help="Total frames, 0=auto (default auto)")
    parser.add_argument("--stagger", type=int, default=4, help="Frames between each path (default 4)")
    parser.add_argument("--duration", type=int, default=50, help="Frames for forward reveal per path (default 50)")
    parser.add_argument("--loop", action=argparse.BooleanOptionalAction, default=True, help="Loop animation (dotLottie manifest) --loop / --no-loop")
    parser.add_argument("--autoplay", action=argparse.BooleanOptionalAction, default=True, help="Autoplay --autoplay / --no-autoplay")
    parser.add_argument("--speed", type=float, default=1.0, help="Playback speed (default 1.0)")
    parser.add_argument("--boomerang", "--ping-pong", action="store_true", help="Forward then reverse (boomerang)")
    parser.add_argument("--mode", choices=["forward","reverse","boomerang"], default="forward", help="Animation mode (default forward, boomerang = forward+reverse)")
    parser.add_argument("--reverse-delay", type=int, default=30, help="Frames to hold at 100%% before reverse (default 30)")
    parser.add_argument("--reverse-duration", type=int, default=0, help="Frames for reverse, 0=same as --duration (default 0)")
    parser.add_argument("--delay", type=int, default=0, help="Initial delay frames before first path (default 0)")
    parser.add_argument("--loop-delay", type=int, default=20, help="Extra frames after animation before loop restarts (default 20)")
    parser.add_argument("--output-name", help="Custom output name (without extension), e.g., my-logo")
    args = parser.parse_args()

    # Handle boomerang flag overriding mode
    is_boomerang = args.boomerang or args.mode == 'boomerang'
    if args.boomerang:
        args.mode = 'boomerang'

    # Find SVG dir
    svg_dir = None
    for d in SVG_CANDIDATES:
        if d.exists():
            svg_dir = d
            break
    if not svg_dir:
        print(f"SVG dir not found, checked {SVG_CANDIDATES}")
        return

    # Resolve input files
    input_files = []
    if len(args.files)==1 and args.files[0].lower() == 'all':
        input_files = sorted(svg_dir.glob("*.svg"))
        print(f"Converting ALL ({len(input_files)}) SVGs in {svg_dir}")
    else:
        for name in args.files:
            found = find_svg_file(name)
            if found:
                input_files.append(found)
            else:
                print(f"⚠ Not found: {name} (looked in {SVG_CANDIDATES})")

    if not input_files:
        print("No valid SVG files found.")
        return

    LOTTIE_DIR.mkdir(parents=True, exist_ok=True)

    # Determine colors
    colors = []
    if args.color == 'both':
        colors = [('black',[0,0,0]), ('white',[1,1,1])]
    else:
        colors = [(args.color, parse_color(args.color))]

    # Auto OP if not specified
    if args.op == 0:
        # Estimate: delay + (n-1)*stagger + duration + (reverse_delay+reverse_duration if boomerang) + loop_delay
        # We'll calculate per file later, so set 0 and auto-calc in create_lottie_data
        args.op = 120  # temporary, will be overridden by max_t logic

    print(f"\nSettings: color={args.color} stroke={args.stroke} fr={args.fr} stagger={args.stagger} duration={args.duration} mode={args.mode} boomerang={is_boomerang} reverse-delay={args.reverse_delay} loop={args.loop} autoplay={args.autoplay} speed={args.speed}\n")

    for svg_path in input_files:
        print(f"Processing {svg_path.name}...")
        w,h,paths = extract_svg(svg_path)
        print(f"  {len(paths)} paths, {w}x{h}")

        # Adjust timing for complex SVGs
        if "pm2" in svg_path.name.lower() or svg_path.stat().st_size > 30000:
            if args.op == 120:  # only if default
                args.op = 150
            if args.duration == 50:
                args.duration = 60
            if args.stagger == 4:
                args.stagger = 5

        for cname, crgb in colors:
            # Output name
            if args.output_name:
                base = args.output_name
                if len(colors)>1:
                    base = f"{base}-{cname}"
            else:
                base = f"{svg_path.stem}-{cname}" if len(colors)>1 or args.color in ('black','white') else svg_path.stem
                # If user only asked for one color and it's black, keep original behavior: pm-black.lottie etc.
                # For simplicity, if color is both, we already have -black/-white, if single color, use stem + -color if color is black/white, else just stem
                if args.color not in ('black','white','both') and len(colors)==1:
                    base = svg_path.stem
                elif args.color == 'black' and len(colors)==1:
                    # Keep pm-black.lottie style for consistency
                    base = f"{svg_path.stem}-black"

            # If color is both, base already includes color
            # If color is single non-black/white hex, base is stem

            # For hex colors, avoid filename issues, use stem only
            if args.color not in ('black','white','both'):
                base = args.output_name or svg_path.stem

            dotlottie_path = LOTTIE_DIR / f"{base}.lottie"

            # Build Lottie data in memory (no JSON file saved)
            lottie_data, final_op = create_lottie_data(w,h,paths,crgb,args,is_boomerang)
            lottie_data['nm'] = base  # set name

            # Create .lottie directly
            create_dotlottie_from_data(lottie_data, dotlottie_path, args, anim_id=base)

    print(f"\n✓ Done! .lottie files saved to {LOTTIE_DIR}/")
    print(f"  Use: <dotlottie-wc> or DotLottie from https://cdn.jsdelivr.net/npm/@lottiefiles/dotlottie-web/+esm")
    print(f"  Example: python3 svg_to_dotlottie.py pm.svg --color both --boomerang --reverse-delay 30 --loop --speed 1.0")

if __name__ == "__main__":
    main()
