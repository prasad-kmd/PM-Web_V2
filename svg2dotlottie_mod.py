#!/usr/bin/env python3
"""
SVG → dotLottie with Fill + Color Pulse + Reverse
Duplicate of svg_to_dotlottie.py but with new sequence:
  1. Forward stroke reveal (trim 0→100)
  2. Fill closed contours (fill opacity 0→100)
  3. Pulse fill color (e.g., black→gray→black)
  4. Reverse (stroke + fill hide)

Inputs: public/svg/ or public/SVG/
Outputs: only .lottie to public/lottie/ (no JSON, no HTML, no bundle)

Usage:
  python3 svg_to_dotlottie_fill_pulse.py pm.svg
  python3 svg_to_dotlottie.py pm.svg --color both --boomerang --reverse-delay 20 --pulse --pulse-count 3

Params:
  --color black|white|#hex|both
  --stroke 3
  --fr 60
  --stagger 4
  --duration 50 (forward)
  --fill-duration 15 (fill fade in)
  --pulse --no-pulse (default pulse on)
  --pulse-duration 40 (total pulse time)
  --pulse-count 2 (number of pulses)
  --pulse-intensity 0.4 (how much color lightens for black, darkens for white, 0-1)
  --reverse-delay 30 (hold at filled state before reverse)
  --reverse-duration 50 (reverse time)
  --delay 0 (initial delay)
  --loop-delay 20
  --loop / --no-loop, --autoplay, --speed
  --mode forward|boomerang (boomerang includes reverse, forward stops after pulse)
"""

import re, json, math, argparse, zipfile
from pathlib import Path
import xml.etree.ElementTree as ET

SVG_DIRS = [Path("public/svg"), Path("public/SVG"), Path("public/Svg")]
LOTTIE_DIR = Path("public/lottie")

def identity(): return (1,0,0,1,0,0)
def compose(m2,m1):
    a2,b2,c2,d2,e2,f2=m2; a1,b1,c1,d1,e1,f1=m1
    return (a2*a1+c2*b1, b2*a1+d2*b1, a2*c1+c2*d1, b2*c1+d2*d1, a2*e1+c2*f1+e2, b2*e1+d2*f1+f2)
def apply_point(m,x,y): a,b,c,d,e,f=m; return (a*x+c*y+e, b*x+d*y+f)
def apply_vector(m,vx,vy): a,b,c,d,e,f=m; return (a*vx+c*vy, b*vx+d*vy)
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
    return {"ty":"sh","ks":{"a":0,"k":{"i":ti,"o":to,"v":tv,"c":sp['closed']}}}, sp['closed']

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

def pulse_color_keyframes(base_rgb, intensity, pulse_count, t_start, t_end):
    """
    Create color pulse: base -> pulse_color -> base -> pulse_color -> base ...
    For black base [0,0,0], pulse to [intensity, intensity, intensity]
    For white base [1,1,1], pulse to [1-intensity, 1-intensity, 1-intensity]
    """
    # Determine pulse color
    if sum(base_rgb)/3 < 0.5:  # dark base (black)
        pulse_rgb = [min(1, c + intensity) for c in base_rgb]
    else:  # light base (white)
        pulse_rgb = [max(0, c - intensity) for c in base_rgb]

    # Create keyframes
    total_frames = t_end - t_start
    if total_frames <= 0 or pulse_count <=0:
        return [{"t": t_start, "s": base_rgb}]

    segment = total_frames / (pulse_count * 2)  # each pulse is 2 segments (base->pulse, pulse->base)
    kfs = []
    t = t_start
    # Start at base
    kfs.append({"t": int(t), "s": base_rgb, "o": {"x": [0.42], "y": [0]}, "i": {"x": [0.58], "y": [1]}})
    
    for p in range(pulse_count):
        # Go to pulse color
        t += segment
        kfs.append({"t": int(t), "s": pulse_rgb, "o": {"x": [0.42], "y": [0]}, "i": {"x": [0.58], "y": [1]}})
        # Back to base
        t += segment
        kfs.append({"t": int(t), "s": base_rgb, "o": {"x": [0.42], "y": [0]}, "i": {"x": [0.58], "y": [1]}})
    
    # Ensure last is base
    if kfs[-1]["s"] != base_rgb:
        kfs.append({"t": int(t_end), "s": base_rgb})
    
    return kfs

def build_fill_opacity_keyframes(t_forward_done, t_fill_end, t_pulse_end, t_reverse_start, t_reverse_end, pulse_count, args):
    """
    Fill opacity: 0 until forward done, 0→100 during fill, pulse opacity during pulse, hold, then 0 during reverse
    """
    kfs = []
    # Before forward done: 0
    kfs.append({"t": 0, "s": [0]})
    kfs.append({"t": int(t_forward_done), "s": [0], "o": {"x": [0.42], "y": [0]}, "i": {"x": [0.58], "y": [1]}})
    # Fill in
    kfs.append({"t": int(t_fill_end), "s": [100], "o": {"x": [0.42], "y": [0]}, "i": {"x": [0.58], "y": [1]}})

    if args.pulse and pulse_count>0 and t_pulse_end > t_fill_end:
        # Pulse opacity: 100 → 70 → 100 → 70 → 100
        total = t_pulse_end - t_fill_end
        seg = total / (pulse_count * 2) if pulse_count>0 else total
        t = t_fill_end
        current_op = 100
        for p in range(pulse_count):
            t += seg
            # Dip to 60
            kfs.append({"t": int(t), "s": [60], "o": {"x": [0.42], "y": [0]}, "i": {"x": [0.58], "y": [1]}})
            t += seg
            kfs.append({"t": int(t), "s": [100], "o": {"x": [0.42], "y": [0]}, "i": {"x": [0.58], "y": [1]}})

    # Hold until reverse start
    if t_reverse_start > t_fill_end:
        # Ensure we have a keyframe at reverse start with 100
        if not any(kf["t"] == int(t_reverse_start) for kf in kfs):
            kfs.append({"t": int(t_reverse_start), "s": [100], "o": {"x": [0.42], "y": [0]}, "i": {"x": [0.58], "y": [1]}})

    # Reverse: fade out fill
    if args.mode in ('boomerang','reverse') or args.boomerang:
        kfs.append({"t": int(t_reverse_end), "s": [0]})

    # Sort by t
    kfs = sorted(kfs, key=lambda x: x["t"])
    return kfs

def build_trim_keyframes(t0, t_forward_done, t_reverse_start, t_reverse_end, args):
    """Trim e: 0→100 forward, hold, then 100→0 reverse"""
    if args.mode == 'reverse':
        return [
            {"t": int(t0), "s": [100], "o": {"x": [0.42], "y": [0]}, "i": {"x": [0.58], "y": [1]}},
            {"t": int(t_forward_done), "s": [0]}
        ]
    if args.mode == 'boomerang' or args.boomerang:
        return [
            {"t": int(t0), "s": [0], "o": {"x": [0.42], "y": [0]}, "i": {"x": [0.58], "y": [1]}},
            {"t": int(t_forward_done), "s": [100], "o": {"x": [0.42], "y": [0]}, "i": {"x": [0.58], "y": [1]}},
            {"t": int(t_reverse_start), "s": [100], "o": {"x": [0.42], "y": [0]}, "i": {"x": [0.58], "y": [1]}},
            {"t": int(t_reverse_end), "s": [0]}
        ]
    # forward only
    return [
        {"t": int(t0), "s": [0], "o": {"x": [0.42], "y": [0]}, "i": {"x": [0.58], "y": [1]}},
        {"t": int(t_forward_done), "s": [100]}
    ]

def create_lottie_with_fill_pulse(w,h,paths,color_rgb,args):
    layers=[]
    max_t=0
    is_boomerang = args.boomerang or args.mode == 'boomerang'

    for idx, pg in enumerate(paths):
        mat=pg['matrix']; d=pg['d']
        subpaths=parse_path(d)
        # Convert to lottie shapes with closed flag
        stroke_shapes=[]; fill_shapes=[]
        for sp in subpaths:
            res = subpath_to_lottie(sp, mat)
            if not res: continue
            shape, is_closed = res
            stroke_shapes.append(shape)
            if is_closed:
                fill_shapes.append(shape)

        if not stroke_shapes: continue

        # Timeline per glyph
        t0 = args.delay + idx * args.stagger
        t_forward_done = t0 + args.duration
        t_fill_end = t_forward_done + args.fill_duration
        t_pulse_end = t_fill_end + (args.pulse_duration if args.pulse else 0)
        t_reverse_start = t_pulse_end + args.reverse_delay
        t_reverse_end = t_reverse_start + (args.reverse_duration or args.duration)

        max_t = max(max_t, t_reverse_end if is_boomerang or args.mode=='reverse' else t_pulse_end)

        # Trim for stroke
        trim_kf = build_trim_keyframes(t0, t_forward_done, t_reverse_start, t_reverse_end, args)
        trim = {"ty":"tm","s":{"a":0,"k":0},"e":{"a":1,"k":trim_kf},"o":{"a":0,"k":0},"m":1,"nm":"Trim"}

        stroke = {"ty":"st","c":{"a":0,"k":[color_rgb[0],color_rgb[1],color_rgb[2],1]},"o":{"a":0,"k":100},"w":{"a":0,"k":args.stroke},"lc":2,"lj":2,"ml":4,"bm":0,"nm":"Stroke"}

        # Stroke group
        stroke_group = {"ty":"gr","it": stroke_shapes + [stroke, trim], "nm":"stroke-group"}

        shapes_for_layer = [stroke_group]

        # Fill group (only if closed contours exist)
        if fill_shapes and args.fill:
            # Fill opacity keyframes
            fill_op_kf = build_fill_opacity_keyframes(t_forward_done, t_fill_end, t_pulse_end, t_reverse_start, t_reverse_end, args.pulse_count, args)
            fill_op = {"a":1,"k":fill_op_kf}

            # Fill color keyframes for pulse
            if args.pulse:
                fill_color_kf = pulse_color_keyframes(color_rgb, args.pulse_intensity, args.pulse_count, t_fill_end, t_pulse_end)
                fill_color = {"a":1,"k":fill_color_kf}
            else:
                fill_color = {"a":0,"k":[color_rgb[0],color_rgb[1],color_rgb[2],1]}

            fill = {"ty":"fl","c":fill_color,"o":fill_op,"r":1,"bm":0,"nm":"Fill"}

            # For fill, we need to duplicate shapes but without stroke, just fill
            # Use same closed shapes
            fill_group = {"ty":"gr","it": fill_shapes + [fill], "nm":"fill-group"}
            shapes_for_layer.append(fill_group)

        layer = {
            "ddd":0,"ind":idx+1,"ty":4,"nm":f"glyph-{idx}","sr":1,
            "ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[0,0,0]},"a":{"a":0,"k":[0,0,0]},"s":{"a":0,"k":[100,100,100]}},
            "ao":0,"shapes":shapes_for_layer,
            "ip":0,"op": max(args.op, int(max_t)+20) if args.op else int(max_t)+20,
            "st":0,"bm":0
        }
        layers.append(layer)

    final_op = max(args.op, int(max_t)+20) if args.op else int(max_t)+20
    if is_boomerang:
        final_op = int(max_t) + args.loop_delay

    lottie = {"v":"5.7.4","fr":args.fr,"ip":0,"op":final_op,"w":w,"h":h,"nm":"fill-pulse","ddd":0,"assets":[],"layers":layers}
    return lottie, final_op

def create_dotlottie(lottie_data, out_path, args, anim_id):
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
        "description": f"Forward→Fill→Pulse→Reverse • {anim_id} • fill={args.fill} pulse={args.pulse} boomerang={args.boomerang}"
    }
    out_path=Path(out_path); out_path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(out_path,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
        z.writestr("manifest.json", json.dumps(manifest, indent=2))
        z.writestr(f"animations/{anim_id}.json", json.dumps(lottie_data))
    print(f"  → {out_path.name:40} {out_path.stat().st_size/1024:6.1f}KB | fill={args.fill} pulse={args.pulse} boomerang={args.boomerang} loop={args.loop}")

def find_svg(name):
    p=Path(name)
    if p.exists() and p.suffix=='.svg': return p
    stem=Path(name).stem
    for d in SVG_DIRS:
        if not d.exists(): continue
        if (d/name).exists(): return d/name
        if (d/f"{name}.svg").exists(): return d/f"{name}.svg"
        if (d/f"{stem}.svg").exists(): return d/f"{stem}.svg"
        for f in d.glob("*.svg"):
            if f.stem.lower()==stem.lower() or f.name.lower()==name.lower():
                return f
    return None

def main():
    parser=argparse.ArgumentParser(description="SVG → .lottie with Fill + Pulse + Reverse (only .lottie output)")
    parser.add_argument("files", nargs='+', help="SVG files (pm.svg, pm, or all)")
    parser.add_argument("--color", default="black", help="black|white|#hex|both")
    parser.add_argument("--stroke", type=float, default=3)
    parser.add_argument("--fr", type=int, default=60)
    parser.add_argument("--op", type=int, default=0, help="0=auto")
    parser.add_argument("--stagger", type=int, default=4)
    parser.add_argument("--duration", type=int, default=50, help="forward duration")
    parser.add_argument("--fill", action=argparse.BooleanOptionalAction, default=True, help="Fill closed contours after forward")
    parser.add_argument("--fill-duration", type=int, default=15, help="Fill fade-in duration")
    parser.add_argument("--pulse", action=argparse.BooleanOptionalAction, default=True, help="Pulse color after fill")
    parser.add_argument("--pulse-duration", type=int, default=40, help="Total pulse duration")
    parser.add_argument("--pulse-count", type=int, default=2, help="Number of pulses")
    parser.add_argument("--pulse-intensity", type=float, default=0.4, help="Color pulse intensity 0-1")
    parser.add_argument("--boomerang", "--ping-pong", action="store_true", help="Forward→Fill→Pulse→Reverse")
    parser.add_argument("--mode", choices=["forward","reverse","boomerang"], default="boomerang", help="Default boomerang for this script (forward→fill→pulse→reverse)")
    parser.add_argument("--reverse-delay", type=int, default=30, help="Hold at filled+pulsed state before reverse")
    parser.add_argument("--reverse-duration", type=int, default=0, help="Reverse duration, 0=same as duration")
    parser.add_argument("--delay", type=int, default=0)
    parser.add_argument("--loop-delay", type=int, default=20)
    parser.add_argument("--loop", action=argparse.BooleanOptionalAction, default=True)
    parser.add_argument("--autoplay", action=argparse.BooleanOptionalAction, default=True)
    parser.add_argument("--speed", type=float, default=1.0)
    parser.add_argument("--output-name", help="Custom output name")
    args=parser.parse_args()

    if args.boomerang: args.mode='boomerang'
    # For this script, default is boomerang (forward→fill→pulse→reverse) as requested
    if args.mode=='forward' and not args.boomerang:
        # User explicitly wants forward only? Keep but note fill+ pulse still happens, then stops
        pass

    svg_dir=None
    for d in SVG_DIRS:
        if d.exists(): svg_dir=d; break
    if not svg_dir:
        print(f"SVG dir not found {SVG_DIRS}"); return

    input_files=[]
    if len(args.files)==1 and args.files[0].lower()=='all':
        input_files=sorted(svg_dir.glob("*.svg"))
    else:
        for n in args.files:
            f=find_svg(n)
            if f: input_files.append(f)
            else: print(f"⚠ Not found: {n}")

    if not input_files:
        print("No SVGs"); return

    LOTTIE_DIR.mkdir(parents=True, exist_ok=True)

    colors=[]
    if args.color=='both':
        colors=[('black',[0,0,0]),('white',[1,1,1])]
    else:
        colors=[(args.color, parse_color(args.color))]

    if args.op==0: args.op=120

    print(f"\nSettings: color={args.color} fill={args.fill} pulse={args.pulse} mode={args.mode} boomerang={args.boomerang} reverse-delay={args.reverse_delay} loop={args.loop} speed={args.speed}\n")

    for svg_path in input_files:
        print(f"Processing {svg_path.name}...")
        w,h,paths=extract_svg(svg_path)
        print(f"  {len(paths)} paths, {w}x{h}")

        if "pm2" in svg_path.name.lower() or svg_path.stat().st_size>30000:
            if args.op==120: args.op=180
            if args.duration==50: args.duration=60
            if args.stagger==4: args.stagger=5

        for cname, crgb in colors:
            base = args.output_name or f"{svg_path.stem}-{cname}-fill-pulse" if len(colors)>1 or args.color in ('black','white','both') else f"{svg_path.stem}-fill-pulse"
            if args.color=='both':
                base = f"{svg_path.stem}-{cname}-fill-pulse"
            elif args.color not in ('black','white','both'):
                base = args.output_name or f"{svg_path.stem}-fill-pulse"

            dotlottie_path = LOTTIE_DIR / f"{base}.lottie"
            lottie_data, final_op = create_lottie_with_fill_pulse(w,h,paths,crgb,args)
            lottie_data['nm']=base
            create_dotlottie(lottie_data, dotlottie_path, args, anim_id=base)

    print(f"\n✓ Done! .lottie with fill+pulse+reverse saved to {LOTTIE_DIR}/")

if __name__=="__main__":
    main()
