"""Pack two image-generated 4 x 5 pose sheets into foot-anchored game atlases.

Usage: python tools/prepare_mega_parasect.py walk.png actions.png
This only crops, scales and packs supplied poses; it does not synthesize poses.
"""
from pathlib import Path
import json
import sys
from PIL import Image

OUT = Path(__file__).resolve().parents[1] / 'assets/pokemon/47/mega'
W, H, AX, AY = 192, 176, 96, 164

def prepare(key, source):
    image = Image.open(source).convert('RGBA')
    # Remove nearly invisible encoder fringes; preserve the spectral veil alpha.
    image.putalpha(image.getchannel('A').point(lambda a: 0 if a <= 16 else a))
    atlas = Image.new('RGBA', (W * 4, H * 5))
    frames = []
    # All poses use a single scale to preserve their relative proportions.
    scale = 0.50 * 1280 / image.width
    for row in range(5):
        for col in range(4):
            box = (round(col*image.width/4), round(row*image.height/5),
                   round((col+1)*image.width/4), round((row+1)*image.height/5))
            tile = image.crop(box)
            bounds = tile.getchannel('A').point(lambda a: 255 if a > 96 else 0).getbbox()
            if not bounds:
                raise ValueError(f'{key}: empty pose {row},{col}')
            pose = tile.crop(bounds)
            size = (round(pose.width*scale), round(pose.height*scale))
            if size[0] > W-8 or size[1] > H-8:
                raise ValueError(f'{key}: oversized pose {row},{col}: {size}')
            pose = pose.resize(size, Image.Resampling.NEAREST)
            atlas.paste(pose, (col*W+AX-size[0]//2, row*H+AY-size[1]))
            frames.append({'row':row,'col':col,'sourceBox':box,'bounds':bounds,'size':size})
    OUT.mkdir(parents=True, exist_ok=True)
    atlas.save(OUT/f'{key}.webp',lossless=True,exact=True,method=6)
    image.save(OUT/f'{key}-source.webp',lossless=True,exact=True,method=6)
    print(key, atlas.size, (OUT/f'{key}.webp').stat().st_size)
    return frames

if __name__ == '__main__':
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    sheets = {k:prepare(k,p) for k,p in zip(['walk','actions'],sys.argv[1:])}
    (OUT/'atlas.json').write_text(json.dumps({'cell':[W,H],'anchor':[AX,AY],
        'rows':['south','southwest','west','northwest','north'],'sheets':sheets},indent=2)+'\n')
