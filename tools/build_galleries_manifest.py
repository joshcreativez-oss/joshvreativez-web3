#!/usr/bin/env python3
"""Build a manifest for two-level galleries.

Why:
  Static hosts (GitHub Pages / shared hosting) can't list folders via JS.
  This script scans assets/galleries/** and writes assets/galleries/manifest.json
  so the website can render albums without hardcoding filenames.

Usage:
  python tools/build_manifest.py
  (or python tools/build_galleries_manifest.py)

Notes:
  - Drop images into: assets/galleries/<category>/<album>/
  - You can keep original camera/WhatsApp filenames (no renaming required).
  - Optional: put a custom title in assets/galleries/<category>/<album>/title.txt
  - Optional: put a cover image named cover.(jpg|jpeg|png|webp)
"""

from __future__ import annotations
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GALLERIES_DIR = ROOT / "assets" / "galleries"
OUT_FILE = GALLERIES_DIR / "manifest.json"

VIDEO_EXTS = {
    '.mp4', '.m4v', '.mov', '.webm', '.mkv', '.avi', '.wmv', '.flv',
    '.mpg', '.mpeg', '.mpe', '.3gp', '.3g2', '.ogv', '.ogg',
    '.mts', '.m2ts',
}

IMG_EXTS = {
    '.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.svg', '.bmp',
    '.tif', '.tiff', '.jfif', '.pjpeg', '.pjp', '.heic', '.heif',
}

# Friendly labels for category folder names
CATEGORY_LABELS = {
    "portraits": "Portraits",
    "videos": "Videos",
    "decor-detail": "Decor & Details",
    "decor-details": "Decor & Details",
}

THEME_WORDS = {
    "coastal","romance","classic","garden","luxe","downtown","stroll","sunset","proposal",
    "golden","hour","field","studio","editorial","elegance","city","love","at","home",
    "story","mara","escape","rose","gold","royal","setup","decor","detail","details"
}

def title_from_slug(slug: str) -> str:
    # Prefer a friendly "Amina & Kevin" for clear couple slugs
    parts = [p for p in slug.replace("_", "-").split("-") if p]
    if "and" in parts and len(parts) >= 3:
        # e.g. faith-and-chama
        parts2 = [p for p in parts if p != "and"]
        return " & ".join(w.capitalize() for w in parts2)
    if len(parts) == 2 and all(p.isalpha() for p in parts) and not any(p.lower() in THEME_WORDS for p in parts):
        return f"{parts[0].capitalize()} & {parts[1].capitalize()}"
    return " ".join(p.capitalize() for p in parts) if parts else slug



def find_cover(album_dir: Path) -> Path | None:
    """Find a cover file named 'cover.<ext>' in a case-insensitive way."""
    for p in album_dir.iterdir():
        if not p.is_file():
            continue
        if p.stem.lower() != 'cover':
            continue
        if p.suffix.lower() in IMG_EXTS:
            return p
    return None


def scan_album(album_dir: Path) -> dict:
    # optional title override
    title_file = album_dir / "title.txt"
    title = title_file.read_text(encoding="utf-8").strip() if title_file.exists() else title_from_slug(album_dir.name)
    # cover preference (case-insensitive: cover.jpg / cover.JPG / cover.jpeg etc.)
    cover = find_cover(album_dir)

    # all image files
    imgs = [p for p in album_dir.iterdir() if p.is_file() and p.suffix.lower() in IMG_EXTS]
    imgs = sorted(imgs, key=lambda p: p.name.lower())

    if cover is None and imgs:
        cover = imgs[0]

    # images list excludes cover file if it is in the folder (to avoid duplicate)
    images = []
    for p in imgs:
        if cover is not None and p.resolve() == cover.resolve():
            continue
        if p.name.lower().startswith("cover."):
            continue
        images.append(p)

    def rel(p: Path) -> str:
        return str(p.relative_to(ROOT)).replace("\\", "/")

    return {
        "title": title,
        "cover": rel(cover) if cover else "",
        "images": [rel(p) for p in images],
    }

def main() -> None:
    data = {"categories": {}}
    if not GALLERIES_DIR.exists():
        raise SystemExit(f"Missing folder: {GALLERIES_DIR}")

    for cat_dir in sorted([d for d in GALLERIES_DIR.iterdir() if d.is_dir()], key=lambda p: p.name.lower()):
        albums = {}
        videos = []
        loose_files = []

        # Videos are stored flat in assets/galleries/videos/ (no album folders)
        if cat_dir.name.lower() == "videos":
            vids = [p for p in cat_dir.iterdir() if p.is_file() and p.suffix.lower() in VIDEO_EXTS]
            vids = sorted(vids, key=lambda p: p.name.lower())
            def rel(p: Path) -> str:
                return str(p.relative_to(ROOT)).replace("\\", "/")
            videos = [rel(p) for p in vids]
        else:
            # Albums (subfolders)
            for album_dir in sorted([d for d in cat_dir.iterdir() if d.is_dir()], key=lambda p: p.name.lower()):
                album = scan_album(album_dir)
                # skip empty albums (no cover and no images)
                if not album["cover"] and not album["images"]:
                    continue
                albums[album_dir.name] = album

            # Loose images directly inside the category folder (no albums)
            loose_imgs = [p for p in cat_dir.iterdir() if p.is_file() and p.suffix.lower() in IMG_EXTS]
            loose_imgs = sorted(loose_imgs, key=lambda p: p.name.lower())
            def rel_name(p: Path) -> str:
                return p.name
            # Store just filenames so the site can resolve with the category base path
            loose_files = [rel_name(p) for p in loose_imgs]# keep category even if empty, but label it nicely
        label = CATEGORY_LABELS.get(cat_dir.name)
        if not label:
            label = " ".join(w.capitalize() for w in cat_dir.name.replace("_","-").split("-") if w)
        data["categories"][cat_dir.name] = {
            "label": label or cat_dir.name,
            "base": str(cat_dir.relative_to(ROOT)).replace("\\", "/"),
            "albums": albums,
            "files": loose_files,
            "videos": videos
        }

    OUT_FILE.write_text(json.dumps(data, indent=2), encoding="utf-8")
    print(f"Wrote {OUT_FILE} with {sum(len(v['albums']) for v in data['categories'].values())} albums.")

if __name__ == "__main__":
    main()