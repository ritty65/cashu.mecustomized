#!/usr/bin/env python3
"""
Safer Fundstr icon swapper

- Operates on PNG + ICO only. Skips ALL SVGs and explicitly ignores
  'x-logo.svg' and 'nostr-icon.svg' anywhere.
- Classifies files: web-icon, root-icon, android, ios-appicon, extension,
  adaptive-assets, splash, screenshot, misc.
- Default includes: web-icon, root-icon, android, ios-appicon, extension, adaptive-assets.
  Excludes (by default): splash, screenshot, misc.
- Round detection: only when filename contains tokenized '-round'/'_round'/'.round',
  or matches known round files (ic_launcher_round), or contains 'maskable' token.
- Full backup + restore.

Usage:
  # dry run (defaults)
  python3 fundstr_icon_swapper.py --root . --master assets/fundstr-master-1024.png --dry-run --verbose

  # apply (with backup)
  python3 fundstr_icon_swapper.py --root . --master assets/fundstr-master-1024.png --backup --verbose

  # include splashes too
  python3 fundstr_icon_swapper.py --root . --master assets/fundstr-master-1024.png --backup --include splash --verbose

  # restore last backup
  python3 fundstr_icon_swapper.py --root . --restore latest --verbose
"""

import argparse, re, sys, os, time, json, shutil
from pathlib import Path
from typing import Tuple, List, Dict, Optional
from PIL import Image, ImageDraw, ImageColor

# ---------- constants ----------

EXCLUDE_DIRS = {
    ".git", "node_modules", "dist", "build", ".next", ".output", ".vercel",
    "android/build", "ios/build", "ios/Pods", ".quasar"
}

# Skip ALL SVGs; and, explicitly, these basenames anywhere
EXCLUDE_BASENAMES = {"x-logo.svg", "nostr-icon.svg"}

ALLOWED_EXTS = {".png", ".ico"}  # svg intentionally excluded

# Category detection
RE_PUBLIC = re.compile(r"/public(/|$)")
RE_ANDROID = re.compile(r"/android/app/src/main/res/mipmap")
RE_ANDROID_DRAWABLE = re.compile(r"/android/app/src/main/res/drawable")
RE_IOS_APPICON = re.compile(r"AppIcon\.appiconset")
RE_IOS_SPLASH = re.compile(r"/ios/.*/Splash\.imageset/")
RE_EXTENSION = re.compile(r"/extension(/|$)")
RE_SCREENSHOTS = re.compile(r"/public/screenshots/")

# Filenames that look like web icons
RE_WEB_ICON_NAME = re.compile(
    r"^(apple-icon-\d+x\d+|favicon-(16x16|32x32|96x96|128x128)|icon-\d+x\d+|ms-icon-144x144|favicon\.ico)$",
    re.IGNORECASE
)

# Round detection: token-based only
RE_ROUND_TOKEN = re.compile(r"(^|[-_.])round($|[-_.])", re.IGNORECASE)
RE_MASKABLE_TOKEN = re.compile(r"(^|[-_.])maskable($|[-_.])", re.IGNORECASE)

# Parse sizes from filenames (icon-192x192.png, etc.)
RE_SIZE = re.compile(r"(?P<w>\d{2,4})x(?P<h>\d{2,4})", re.IGNORECASE)

DEFAULT_INCLUDE = {"web-icon", "root-icon", "android", "ios-appicon", "extension", "adaptive-assets"}
DEFAULT_EXCLUDE = {"splash", "screenshot", "misc"}

# ---------- helpers ----------

def is_excluded_dir(p: Path) -> bool:
    s = str(p).replace("\\", "/")
    return any(f"/{d}/" in s or s.endswith("/"+d) or s == d for d in EXCLUDE_DIRS)

def guess_size_from_name(name: str) -> Optional[Tuple[int,int]]:
    m = RE_SIZE.search(name)
    return (int(m.group("w")), int(m.group("h"))) if m else None

def load_image_size(path: Path) -> Optional[Tuple[int,int]]:
    try:
        with Image.open(path) as im:
            return im.size
    except Exception:
        return None

def circle_mask(size: Tuple[int,int]) -> Image.Image:
    w, h = size
    m = Image.new("L", (w, h), 0)
    ImageDraw.Draw(m).ellipse([0,0,w-1,h-1], fill=255)
    return m

def pad_box(size: Tuple[int,int], padding: float) -> Tuple[int,int]:
    w, h = size
    padding = max(0.0, min(0.45, float(padding)))
    return max(1,int(w*(1-2*padding))), max(1,int(h*(1-2*padding)))

def resize_into_canvas(master: Image.Image, target: Tuple[int,int],
                       padding: float = 0.08, round_crop: bool = False,
                       bg=(0,0,0,0)) -> Image.Image:
    W,H = target
    W_in,H_in = pad_box((W,H), padding)
    im = master.copy().convert("RGBA")
    mw,mh = im.size
    scale = min(W_in/mw, H_in/mh)
    new = (max(1,int(mw*scale)), max(1,int(mh*scale)))
    im = im.resize(new, Image.LANCZOS)
    canvas = Image.new("RGBA", (W,H), bg)
    x = (W-new[0])//2
    y = (H-new[1])//2
    if round_crop:
        tmp = Image.new("RGBA", (W,H), (0,0,0,0))
        tmp.paste(im, (x,y), im)
        tmp.putalpha(circle_mask((W,H)))
        canvas.alpha_composite(tmp)
    else:
        canvas.paste(im, (x,y), im)
    return canvas

def parse_color(s: str) -> Tuple[int,int,int]:
    try:
        return ImageColor.getrgb(s)
    except Exception:
        return (0,0,0)

# ---------- discovery & classification ----------

def classify(path: Path, root: Path) -> str:
    s = str(path).replace("\\","/")
    name = path.name.lower()

    if RE_SCREENSHOTS.search(s):
        return "screenshot"
    if RE_IOS_SPLASH.search(s) or ("apple-launch-" in name):
        return "splash"
    if RE_ANDROID_DRAWABLE.search(s) and name == "splash.png":
        return "splash"
    if path.suffix.lower() == ".ico" or RE_WEB_ICON_NAME.match(name):
        if RE_PUBLIC.search(s):
            return "web-icon"

    # adaptive icon source assets developers often keep in /assets
    if s.endswith("/assets/icon-foreground.png") or s.endswith("/assets/icon-background.png") or s.endswith("/assets/icon-only.png"):
        return "adaptive-assets"

    if path.name in {"icon.png", "icon-round.png"} and path.parent == root:
        return "root-icon"

    if RE_ANDROID.search(s):
        return "android"
    if RE_IOS_APPICON.search(s):
        return "ios-appicon"
    if RE_EXTENSION.search(s):
        return "extension"

    # generic fallback
    if RE_PUBLIC.search(s) or "icon" in name or "favicon" in name:
        return "web-icon"

    return "misc"

def should_consider(path: Path) -> bool:
    if path.is_dir(): return False
    ext = path.suffix.lower()
    if ext not in ALLOWED_EXTS: return False
    if path.name in EXCLUDE_BASENAMES: return False  # explicit skips
    if ext == ".svg": return False
    return True

def discover_targets(root: Path) -> List[Dict]:
    out = []
    for p in root.rglob("*"):
        if p.is_dir():
            if is_excluded_dir(p): continue
            continue
        if is_excluded_dir(p.parent): continue
        if not should_consider(p): continue

        size = load_image_size(p)
        if not size: continue
        tsize = guess_size_from_name(p.name) or size
        cat = classify(p, root)

        # round detection: tokenized 'round' or 'maskable', or known file
        nm = p.name.lower()
        round_it = bool(RE_ROUND_TOKEN.search(nm)) or bool(RE_MASKABLE_TOKEN.search(nm)) \
                   or nm in {"icon-round.png", "ic_launcher_round.png"}

        out.append({
            "path": p, "size": size, "target_size": tsize,
            "category": cat, "round": round_it,
            "kind": "ico" if p.suffix.lower()==".ico" else "png"
        })
    return out

# ---------- backup & restore ----------

def new_backup_dir(root: Path) -> Path:
    b = root / ".icon_swap_backups" / time.strftime("%Y%m%d-%H%M%S")
    b.mkdir(parents=True, exist_ok=True)
    return b

def list_backups(root: Path) -> List[Path]:
    d = root / ".icon_swap_backups"
    return sorted([p for p in d.iterdir() if p.is_dir()]) if d.exists() else []

def restore_backup(root: Path, which: str, verbose=False):
    backups = list_backups(root)
    if not backups:
        print("No backups found."); return
    bdir = backups[-1] if which == "latest" else (root/".icon_swap_backups"/which)
    if not bdir.exists():
        print(f"Backup not found: {bdir}"); return
    manifest = bdir / "manifest.json"
    if manifest.exists():
        items = json.loads(manifest.read_text())
        for rel in items:
            src = bdir / rel
            dst = root / rel
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst)
            if verbose: print(f"[restore] {dst}")
        print(f"Restored {len(items)} files from {bdir.name}")
    else:
        for src in bdir.rglob("*"):
            if src.is_dir(): continue
            rel = src.relative_to(bdir)
            dst = root / rel
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst)
            if verbose: print(f"[restore] {dst}")
        print(f"Restored from {bdir.name} (no manifest)")

# ---------- main apply ----------

def run_apply(root: Path, master_path: Path, include: List[str], exclude: List[str],
              padding: float, round_strategy: str, backup: bool, dry_run: bool, verbose: bool):
    try:
        master = Image.open(master_path).convert("RGBA")
    except Exception as e:
        print(f"[!] Cannot open master: {e}"); sys.exit(1)

    targets = discover_targets(root)

    # filter by category
    inc = set(include or [])
    exc = set(exclude or [])
    plan = []
    for t in targets:
        cat = t["category"]
        if inc and cat not in inc:  # include list provided
            continue
        if cat in exc:
            continue

        W,H = t["target_size"]
        # decide round
        round_crop = (round_strategy == "always") or (t["round"] and round_strategy == "auto")
        plan.append({
            "path": t["path"], "kind": t["kind"], "orig": t["size"],
            "target": (W,H), "round": round_crop, "cat": cat
        })

    # print plan
    print(f"\nPlanned replacements ({len(plan)} files):")
    for it in plan:
        print(f" - {it['path']} [{it['cat']}/{it['kind']}] {it['orig']} -> {it['target']} round={it['round']}")

    if dry_run:
        print("\n(dry-run) Nothing written."); return

    # backup
    backup_dir = None
    changed = []
    if backup:
        backup_dir = new_backup_dir(root)

    # write
    for it in plan:
        p: Path = it["path"]
        if backup:
            rel = p.relative_to(root)
            dst = backup_dir / rel
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(p, dst)
            changed.append(str(rel))
        try:
            if it["kind"] == "png":
                img = resize_into_canvas(master, it["target"], padding=padding, round_crop=it["round"], bg=(0,0,0,0))
                img.save(p)
            else:  # .ico
                # Write a multi-size ICO (Windows expects several)
                base = resize_into_canvas(master, (256,256), padding=padding, round_crop=it["round"], bg=(0,0,0,0))
                base.save(p, sizes=[(16,16),(32,32),(48,48),(64,64),(96,96),(128,128),(256,256)])
            if verbose: print(f"[ok] wrote {p}")
        except Exception as e:
            print(f"[!] Failed {p}: {e}")

    if backup:
        (backup_dir/"manifest.json").write_text(json.dumps(changed, indent=2))
        print(f"\nBackup saved: {backup_dir} ({len(changed)} files)")

    print("\nDone. Rebuild your app and hard-reload once to see the new icons.")

# ---------- CLI ----------

def main():
    ap = argparse.ArgumentParser(description="Safely replace icons with Fundstr branding.")
    ap.add_argument("--root", required=True, help="Repo root (e.g., .)")
    ap.add_argument("--master", help="Path to your 1024x1024 transparent PNG (required unless --restore)")
    ap.add_argument("--include", nargs="*", default=list(DEFAULT_INCLUDE),
                    help=f"Categories to include (default: {sorted(DEFAULT_INCLUDE)})")
    ap.add_argument("--exclude", nargs="*", default=list(DEFAULT_EXCLUDE),
                    help=f"Categories to exclude (default: {sorted(DEFAULT_EXCLUDE)})")
    ap.add_argument("--padding", type=float, default=0.08, help="Padding fraction 0..0.45 (default 0.08)")
    ap.add_argument("--round-strategy", choices=["auto","always","never"], default="auto",
                    help="Circular crop strategy (default: auto)")
    ap.add_argument("--backup", action="store_true", help="Backup originals to .icon_swap_backups/<timestamp>/")
    ap.add_argument("--dry-run", action="store_true", help="Plan only; do not write")
    ap.add_argument("--verbose", "-v", action="store_true")
    ap.add_argument("--restore", help="Restore a backup by name or 'latest'")

    args = ap.parse_args()
    root = Path(args.root).resolve()

    if args.restore:
        restore_backup(root, args.restore, verbose=args.verbose); return

    if not args.master:
        ap.error("--master is required unless --restore is used")

    master = Path(args.master).resolve()
    if not master.exists():
        print(f"[!] Master not found: {master}"); sys.exit(1)

    run_apply(root, master, args.include, args.exclude, args.padding,
              args.round_strategy, args.backup, args.dry_run, args.verbose)

if __name__ == "__main__":
    main()
