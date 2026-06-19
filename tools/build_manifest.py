# build_manifest.py
# Usage:
#   python tools/build_manifest.py
#
# What it does:
#   1) Scans assets/see-our-work/ and creates assets/see-our-work/manifest.json
#   2) Scans assets/galleries/** and creates assets/galleries/manifest.json
#
# Why:
#   Static hosts can't list folders from the browser. These manifests let the site
#   render galleries/albums without hardcoding filenames (original camera/WhatsApp
#   filenames are supported).
#
from __future__ import annotations
import os, json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

IMG_EXTS = {'.jpg','.jpeg','.png','.webp','.gif','.avif','.svg','.bmp','.tif','.tiff','.jfif','.pjpeg','.pjp','.heic','.heif'}
VIDEO_EXTS = {'.mp4','.m4v','.mov','.webm','.mkv','.avi','.wmv','.flv','.mpg','.mpeg','.mpe','.3gp','.3g2','.ogv','.ogg','.mts','.m2ts'}

def build_see_our_work():
    folder = ROOT / "assets" / "see-our-work"
    out = folder / "manifest.json"
    files = []
    if folder.exists():
        for fn in os.listdir(folder):
            if fn.lower() == "manifest.json":
                continue
            if (folder / fn).is_file() and Path(fn).suffix.lower() in IMG_EXTS:
                files.append(fn)
    files.sort(key=lambda s: s.lower())

    # Cinematic highlight videos (recommended folder)
    cine_folder = ROOT / "assets" / "cinematic-highlights"
    cine_folder.mkdir(parents=True, exist_ok=True)
    cine_videos = []
    if cine_folder.exists():
        for fn in os.listdir(cine_folder):
            if fn.lower() == "manifest.json":
                continue
            p = cine_folder / fn
            if p.is_file() and Path(fn).suffix.lower() in VIDEO_EXTS:
                cine_videos.append(fn)
    cine_videos.sort(key=lambda s: s.lower())
    # Write cinematic highlights manifest (always)
    (cine_folder / "manifest.json").write_text(json.dumps({"files": cine_videos}, indent=2), encoding="utf-8")

    # Fallback: if no dedicated videos, also pick up any videos dropped into see-our-work
    sow_videos = []
    if folder.exists():
        for fn in os.listdir(folder):
            if fn.lower() == "manifest.json":
                continue
            p = folder / fn
            if p.is_file() and Path(fn).suffix.lower() in VIDEO_EXTS:
                sow_videos.append(fn)
    sow_videos.sort(key=lambda s: s.lower())

    manifest = {
        "featured": files[0] if files else "",
        "highlights": files[:8],
        "grid": files[:24],
        # Home page prefers assets/cinematic-highlights/manifest.json, but keeps this as a fallback.
        "highlightsVideos": cine_videos or sow_videos,
    }
    out.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print("Wrote:", out, "Found images:", len(files), "Found highlight videos:", len(manifest["highlightsVideos"]))



def find_cover(album_dir: Path) -> Path | None:
    """Find a cover file named 'cover.<ext>' in a case-insensitive way."""
    for fn in os.listdir(album_dir):
        p = album_dir / fn
        if not p.is_file():
            continue
        if p.stem.lower() != 'cover':
            continue
        if p.suffix.lower() in IMG_EXTS:
            return p
    return None

def title_from_slug(slug: str) -> str:
    parts = [p for p in slug.replace("_","-").split("-") if p]
    if "and" in parts and len(parts) >= 3:
        parts2 = [p for p in parts if p != "and"]
        return " & ".join(w.capitalize() for w in parts2)
    if len(parts) == 2 and all(p.isalpha() for p in parts):
        return f"{parts[0].capitalize()} & {parts[1].capitalize()}"
    return " ".join(p.capitalize() for p in parts) if parts else slug

CATEGORY_LABELS = {
    "portraits": "Portraits",
    "videos": "Videos",
    "decor-detail": "Decor & Details",
    "decor-details": "Decor & Details",
}

def build_galleries():
    galleries_dir = ROOT / "assets" / "galleries"
    out_file = galleries_dir / "manifest.json"
    data = {"categories": {}}

    if not galleries_dir.exists():
        out_file.write_text(json.dumps(data, indent=2), encoding="utf-8")
        print("Wrote:", out_file, "(empty; missing folder)")
        return

    def rel(p: Path) -> str:
        return str(p.relative_to(ROOT)).replace("\\", "/")

    for cat_dir in sorted([d for d in galleries_dir.iterdir() if d.is_dir()], key=lambda p: p.name.lower()):
        albums = {}
        videos = []
        loose_files = []

        # Videos category is flat (no album folders)
        if cat_dir.name.lower() == "videos":
            vids = [p for p in cat_dir.iterdir() if p.is_file() and p.suffix.lower() in VIDEO_EXTS]
            vids = sorted(vids, key=lambda p: p.name.lower())
            videos = [p.name for p in vids]
        else:
            # Album folders (two-level)
            for album_dir in sorted([d for d in cat_dir.iterdir() if d.is_dir()], key=lambda p: p.name.lower()):
                title_file = album_dir / "title.txt"
                title = title_file.read_text(encoding="utf-8").strip() if title_file.exists() else title_from_slug(album_dir.name)
                cover = find_cover(album_dir)

                imgs = [p for p in album_dir.iterdir() if p.is_file() and p.suffix.lower() in IMG_EXTS]
                imgs = sorted(imgs, key=lambda p: p.name.lower())

                if cover is None and imgs:
                    cover = imgs[0]

                images = []
                for p in imgs:
                    if cover is not None and p.resolve() == cover.resolve():
                        continue
                    if p.name.lower().startswith("cover."):
                        continue
                    images.append(p)

                if cover is None and not images:
                    continue

                albums[album_dir.name] = {
                    "title": title,
                    "cover": rel(cover) if cover else "",
                    "images": [rel(p) for p in images],
                }

            # Loose images directly inside the category folder (no albums)
            loose_imgs = [p for p in cat_dir.iterdir() if p.is_file() and p.suffix.lower() in IMG_EXTS]
            loose_imgs = sorted(loose_imgs, key=lambda p: p.name.lower())
            loose_files = [p.name for p in loose_imgs]

        label = CATEGORY_LABELS.get(cat_dir.name)
        if not label:
            label = " ".join(w.capitalize() for w in cat_dir.name.replace("_","-").split("-") if w)

        data["categories"][cat_dir.name] = {
            "label": label or cat_dir.name,
            "base": rel(cat_dir),
            "albums": albums,
            "files": loose_files,
            "videos": videos,
        }

    out_file.write_text(json.dumps(data, indent=2), encoding="utf-8")
    print("Wrote:", out_file)

def main():
    build_see_our_work()
    build_galleries()

if __name__ == "__main__":
    main()
