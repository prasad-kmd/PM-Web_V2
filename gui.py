#!/usr/bin/env python3
"""
Desktop GUI for svg2dotlottie_mod.py
- Lists SVGs in public/svg/
- Controls for all animation params (fill, pulse, boomerang, loop, etc.)
- Converts to .lottie only in public/lottie/
- Shows log and preview file sizes

Run: python3 gui.py
Requires: Python 3.10+ with tkinter (built-in)
"""

import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from pathlib import Path
import subprocess
import threading
import sys

SVG_DIRS = [Path("public/svg"), Path("public/SVG")]
LOTTIE_DIR = Path("public/lottie")

class LottieGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("SVG → dotLottie Converter - PM Web V2")
        self.root.geometry("900x750")
        self.root.configure(bg="#0a0a0a")

        # Style
        style = ttk.Style()
        style.theme_use('clam')
        style.configure('TFrame', background='#0a0a0a')
        style.configure('TLabel', background='#0a0a0a', foreground='#ededed', font=('SF Mono', 10))
        style.configure('TButton', font=('SF Mono', 10, 'bold'))
        style.configure('TCheckbutton', background='#0a0a0a', foreground='#ededed')
        style.configure('TRadiobutton', background='#0a0a0a', foreground='#ededed')

        # Main container
        main = ttk.Frame(root, padding=20)
        main.pack(fill=tk.BOTH, expand=True)

        # Title
        title = tk.Label(main, text="SVG → .lottie Studio", font=('SF Mono', 18, 'bold'), bg='#0a0a0a', fg='white')
        title.pack(anchor='w', pady=(0,5))
        subtitle = tk.Label(main, text="Forward → Fill → Pulse → Reverse • public/svg/ → public/lottie/", font=('SF Mono', 10), bg='#0a0a0a', fg='#888')
        subtitle.pack(anchor='w', pady=(0,20))

        # Top: SVG list + controls side by side
        top_frame = ttk.Frame(main)
        top_frame.pack(fill=tk.BOTH, expand=True)

        # Left: SVG list
        left_frame = ttk.Frame(top_frame)
        left_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0,10))

        tk.Label(left_frame, text="SVG Files (public/svg/)", bg='#0a0a0a', fg='#aaa', font=('SF Mono', 11, 'bold')).pack(anchor='w')

        # Listbox with scrollbar
        list_frame = tk.Frame(left_frame, bg='#111', bd=1, relief='solid')
        list_frame.pack(fill=tk.BOTH, expand=True, pady=8)

        self.svg_listbox = tk.Listbox(list_frame, selectmode=tk.MULTIPLE, bg='#111', fg='white', 
                                      selectbackground='#00DDB3', selectforeground='black',
                                      font=('SF Mono', 11), bd=0, highlightthickness=0, activestyle='none')
        self.svg_listbox.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=1, pady=1)

        scrollbar = ttk.Scrollbar(list_frame, orient=tk.VERTICAL, command=self.svg_listbox.yview)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.svg_listbox.config(yscrollcommand=scrollbar.set)

        # Buttons for list
        btn_frame = ttk.Frame(left_frame)
        btn_frame.pack(fill=tk.X, pady=5)
        ttk.Button(btn_frame, text="Select All", command=self.select_all).pack(side=tk.LEFT, padx=2)
        ttk.Button(btn_frame, text="Clear", command=self.clear_selection).pack(side=tk.LEFT, padx=2)
        ttk.Button(btn_frame, text="Refresh", command=self.load_svgs).pack(side=tk.LEFT, padx=2)

        # Right: Controls
        right_frame = ttk.Frame(top_frame)
        right_frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=(10,0))

        # Scrollable controls
        canvas = tk.Canvas(right_frame, bg='#0a0a0a', highlightthickness=0)
        canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scroll = ttk.Scrollbar(right_frame, orient=tk.VERTICAL, command=canvas.yview)
        scroll.pack(side=tk.RIGHT, fill=tk.Y)
        canvas.configure(yscrollcommand=scroll.set)

        controls_frame = tk.Frame(canvas, bg='#0a0a0a')
        canvas.create_window((0,0), window=controls_frame, anchor='nw')

        def on_configure(event):
            canvas.configure(scrollregion=canvas.bbox('all'))
        controls_frame.bind('<Configure>', on_configure)

        # Controls
        self.vars = {}

        # Color
        self.add_section(controls_frame, "Color & Stroke")
        self.vars['color'] = tk.StringVar(value='both')
        self.add_radio(controls_frame, "Color:", ['black','white','both','#00DDB3'], 'color')
        self.vars['stroke'] = tk.DoubleVar(value=3)
        self.add_slider(controls_frame, "Stroke Width", 'stroke', 1, 10, 0.5)

        # Timing
        self.add_section(controls_frame, "Timing")
        self.vars['stagger'] = tk.IntVar(value=4)
        self.add_slider(controls_frame, "Stagger (frames between paths)", 'stagger', 1, 20, 1)
        self.vars['duration'] = tk.IntVar(value=50)
        self.add_slider(controls_frame, "Forward Duration", 'duration', 10, 120, 5)
        self.vars['delay'] = tk.IntVar(value=0)
        self.add_slider(controls_frame, "Initial Delay", 'delay', 0, 60, 5)
        self.vars['fr'] = tk.IntVar(value=60)
        self.add_slider(controls_frame, "Framerate", 'fr', 24, 120, 12)

        # Fill
        self.add_section(controls_frame, "Fill (closed contours)")
        self.vars['fill'] = tk.BooleanVar(value=True)
        self.add_check(controls_frame, "Enable Fill", 'fill')
        self.vars['fill_duration'] = tk.IntVar(value=15)
        self.add_slider(controls_frame, "Fill Duration", 'fill_duration', 5, 60, 5)

        # Pulse
        self.add_section(controls_frame, "Pulse Color")
        self.vars['pulse'] = tk.BooleanVar(value=True)
        self.add_check(controls_frame, "Enable Pulse", 'pulse')
        self.vars['pulse_count'] = tk.IntVar(value=2)
        self.add_slider(controls_frame, "Pulse Count", 'pulse_count', 1, 6, 1)
        self.vars['pulse_duration'] = tk.IntVar(value=40)
        self.add_slider(controls_frame, "Pulse Duration (total)", 'pulse_duration', 10, 120, 10)
        self.vars['pulse_intensity'] = tk.DoubleVar(value=0.4)
        self.add_slider(controls_frame, "Pulse Intensity", 'pulse_intensity', 0.1, 1.0, 0.1)

        # Reverse / Boomerang
        self.add_section(controls_frame, "Reverse / Boomerang")
        self.vars['boomerang'] = tk.BooleanVar(value=True)
        self.add_check(controls_frame, "Boomerang (Forward → Fill → Pulse → Reverse)", 'boomerang')
        self.vars['reverse_delay'] = tk.IntVar(value=30)
        self.add_slider(controls_frame, "Reverse Delay (hold before reverse)", 'reverse_delay', 0, 120, 10)
        self.vars['reverse_duration'] = tk.IntVar(value=0)
        self.add_slider(controls_frame, "Reverse Duration (0=same as forward)", 'reverse_duration', 0, 120, 10)
        self.vars['loop_delay'] = tk.IntVar(value=20)
        self.add_slider(controls_frame, "Loop Delay", 'loop_delay', 0, 60, 5)

        # Playback
        self.add_section(controls_frame, "Playback")
        self.vars['loop'] = tk.BooleanVar(value=True)
        self.add_check(controls_frame, "Loop", 'loop')
        self.vars['autoplay'] = tk.BooleanVar(value=True)
        self.add_check(controls_frame, "Autoplay", 'autoplay')
        self.vars['speed'] = tk.DoubleVar(value=1.0)
        self.add_slider(controls_frame, "Speed", 'speed', 0.2, 3.0, 0.2)

        # Bottom: Convert button + log
        bottom = ttk.Frame(main)
        bottom.pack(fill=tk.BOTH, pady=(15,0))

        self.convert_btn = tk.Button(bottom, text="▶ CONVERT SELECTED TO .LOTTIE", 
                                     bg='#00DDB3', fg='black', font=('SF Mono', 12, 'bold'),
                                     bd=0, padx=20, pady=12, command=self.convert)
        self.convert_btn.pack(fill=tk.X, pady=(0,10))

        # Log area
        log_frame = tk.Frame(bottom, bg='#111', bd=1, relief='solid')
        log_frame.pack(fill=tk.BOTH, expand=True)

        self.log_text = tk.Text(log_frame, bg='#111', fg='#00DDB3', font=('SF Mono', 10),
                                bd=0, highlightthickness=0, height=12)
        self.log_text.pack(fill=tk.BOTH, expand=True, padx=8, pady=8)

        # Load SVGs
        self.load_svgs()

    def add_section(self, parent, title):
        lbl = tk.Label(parent, text=title, bg='#0a0a0a', fg='#00DDB3', font=('SF Mono', 11, 'bold'))
        lbl.pack(anchor='w', pady=(15,5))

    def add_radio(self, parent, label, options, var_name):
        frame = tk.Frame(parent, bg='#0a0a0a')
        frame.pack(fill=tk.X, pady=2)
        tk.Label(frame, text=label, bg='#0a0a0a', fg='#888', font=('SF Mono', 10), width=12, anchor='w').pack(side=tk.LEFT)
        var = self.vars[var_name]
        for opt in options:
            rb = tk.Radiobutton(frame, text=opt, variable=var, value=opt,
                                bg='#0a0a0a', fg='white', selectcolor='#111',
                                activebackground='#0a0a0a', font=('SF Mono', 10))
            rb.pack(side=tk.LEFT, padx=5)

    def add_slider(self, parent, label, var_name, frm, to, resolution):
        frame = tk.Frame(parent, bg='#0a0a0a')
        frame.pack(fill=tk.X, pady=3)
        var = self.vars[var_name]
        tk.Label(frame, text=label, bg='#0a0a0a', fg='#aaa', font=('SF Mono', 9), width=32, anchor='w').pack(side=tk.LEFT)
        # For DoubleVar vs IntVar, Scale needs different handling
        scale = tk.Scale(frame, variable=var, from_=frm, to=to, resolution=resolution,
                         orient=tk.HORIZONTAL, bg='#0a0a0a', fg='#ededed',
                         highlightthickness=0, troughcolor='#222', activebackground='#00DDB3',
                         font=('SF Mono', 9), length=180)
        scale.pack(side=tk.LEFT, fill=tk.X, expand=True)
        # Value label
        val_lbl = tk.Label(frame, textvariable=var, bg='#0a0a0a', fg='#00DDB3', font=('SF Mono', 9), width=6)
        val_lbl.pack(side=tk.LEFT)

    def add_check(self, parent, label, var_name):
        frame = tk.Frame(parent, bg='#0a0a0a')
        frame.pack(fill=tk.X, pady=2)
        var = self.vars[var_name]
        cb = tk.Checkbutton(frame, text=label, variable=var,
                            bg='#0a0a0a', fg='white', selectcolor='#111',
                            activebackground='#0a0a0a', font=('SF Mono', 10))
        cb.pack(anchor='w')

    def load_svgs(self):
        self.svg_listbox.delete(0, tk.END)
        svg_dir = None
        for d in SVG_DIRS:
            if d.exists():
                svg_dir = d
                break
        if not svg_dir:
            self.log("No SVG dir found")
            return
        files = sorted(svg_dir.glob("*.svg"))
        for f in files:
            self.svg_listbox.insert(tk.END, f.name)
        self.log(f"Loaded {len(files)} SVGs from {svg_dir}")

    def select_all(self):
        self.svg_listbox.select_set(0, tk.END)

    def clear_selection(self):
        self.svg_listbox.selection_clear(0, tk.END)

    def log(self, msg):
        self.log_text.insert(tk.END, msg + "\n")
        self.log_text.see(tk.END)
        self.root.update()

    def convert(self):
        selected = [self.svg_listbox.get(i) for i in self.svg_listbox.curselection()]
        if not selected:
            messagebox.showwarning("No selection", "Please select at least one SVG file")
            return

        # Build command
        cmd = [sys.executable, "svg2dotlottie_mod.py"] + selected
        cmd += ["--color", self.vars['color'].get()]
        cmd += ["--stroke", str(self.vars['stroke'].get())]
        cmd += ["--fr", str(self.vars['fr'].get())]
        cmd += ["--stagger", str(self.vars['stagger'].get())]
        cmd += ["--duration", str(self.vars['duration'].get())]
        cmd += ["--delay", str(self.vars['delay'].get())]
        cmd += ["--fill-duration", str(self.vars['fill_duration'].get())]
        cmd += ["--pulse-duration", str(self.vars['pulse_duration'].get())]
        cmd += ["--pulse-count", str(self.vars['pulse_count'].get())]
        cmd += ["--pulse-intensity", str(self.vars['pulse_intensity'].get())]
        cmd += ["--reverse-delay", str(self.vars['reverse_delay'].get())]
        cmd += ["--reverse-duration", str(self.vars['reverse_duration'].get())]
        cmd += ["--loop-delay", str(self.vars['loop_delay'].get())]
        cmd += ["--speed", str(self.vars['speed'].get())]

        if self.vars['fill'].get():
            cmd.append("--fill")
        else:
            cmd.append("--no-fill")

        if self.vars['pulse'].get():
            cmd.append("--pulse")
        else:
            cmd.append("--no-pulse")

        if self.vars['boomerang'].get():
            cmd.append("--boomerang")
        else:
            cmd += ["--mode", "forward"]

        if self.vars['loop'].get():
            cmd.append("--loop")
        else:
            cmd.append("--no-loop")

        if self.vars['autoplay'].get():
            cmd.append("--autoplay")
        else:
            cmd.append("--no-autoplay")

        self.log(f"\n▶ Running: {' '.join(cmd)}\n")
        self.convert_btn.config(state=tk.DISABLED, text="Converting...")

        def run():
            try:
                result = subprocess.run(cmd, capture_output=True, text=True, cwd=Path.cwd())
                self.root.after(0, lambda: self.log(result.stdout))
                if result.stderr:
                    self.root.after(0, lambda: self.log("ERR: " + result.stderr))
                
                # List output files
                lottie_files = sorted(LOTTIE_DIR.glob("*.lottie"))
                self.root.after(0, lambda: self.log(f"\n✓ Done! {len(lottie_files)} .lottie files in {LOTTIE_DIR}/"))
                for f in lottie_files[-8:]:
                    self.root.after(0, lambda ff=f: self.log(f"  {ff.name} {ff.stat().st_size/1024:.1f}KB"))

                self.root.after(0, lambda: messagebox.showinfo("Done", f"Converted {len(selected)} SVG(s) to .lottie in {LOTTIE_DIR}/"))
            except Exception as e:
                self.root.after(0, lambda: self.log(f"Error: {e}"))
            finally:
                self.root.after(0, lambda: self.convert_btn.config(state=tk.NORMAL, text="▶ CONVERT SELECTED TO .LOTTIE"))

        threading.Thread(target=run, daemon=True).start()

if __name__ == "__main__":
    root = tk.Tk()
    app = LottieGUI(root)
    root.mainloop()
