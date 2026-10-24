"""Pack generated Mega sheets into consistent, transparent, foot-anchored atlases.
Usage: python tools/prepare_survivor_megas.py excadrill.png meganium.png
Only crops/scales supplied artwork; poses are never procedurally synthesized.
"""
from pathlib import Path
from PIL import Image
import json
import sys
import numpy as np
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
W, H, AX, AY = 176, 176, 88, 164

def prepare(dex, source):
    image = Image.open(source).convert('RGBA')
    image.putalpha(image.getchannel('A').point(lambda a: 0 if a <= 16 else a))
    # Generated sheets have unequal outer margins; use inspected cell boundaries.
    xs, ys = ([0,285,530,790,1050,1312], [0,240,479,720,959,1199]) if dex == 530 else (
        [0,253,511,771,1033,1261], [0,250,503,735,969,1247])
    expected = (xs[-1], ys[-1])
    if image.size != expected:
        raise ValueError(f'{dex}: expected {expected}, got {image.size}')
    poses, manifest = [], []
    for row in range(5):
        for col in range(5):
            # Two front-row antenna tips touch the generated sheet edge.
            # Reuse intact front walking artwork for neutral/release poses.
            source_col = (1 if col == 0 else 2) if dex == 154 and row == 0 and col in (0,4) else col
            box = (xs[source_col], ys[row], xs[source_col+1], ys[row+1])
            tile = image.crop(box)
            # Remove disconnected crumbs from adjacent cells in the source.
            alpha = np.array(tile.getchannel('A'))
            labels, count = ndimage.label(alpha > 16, structure=np.ones((3,3)))
            sizes = np.bincount(labels.ravel()); sizes[0] = 0
            keep = sizes >= max(8, sizes.max() * .03)
            keep[0] = False
            alpha[~keep[labels]] = 0
            tile.putalpha(Image.fromarray(alpha))
            bounds = tile.getchannel('A').point(lambda a: 255 if a > 96 else 0).getbbox()
            if not bounds:
                raise ValueError(f'{dex}: empty pose {row},{col}')
            poses.append(tile.crop(bounds))
            manifest.append(dict(row=row, col=col, sourceBox=box, bounds=bounds))
    scale = min(160/max(p.width for p in poses), 150/max(p.height for p in poses))
    atlas = Image.new('RGBA', (W*5,H*5))
    for item, pose in zip(manifest, poses):
        size = (round(pose.width*scale), round(pose.height*scale))
        pose = pose.resize(size,Image.Resampling.NEAREST)
        atlas.paste(pose,(item['col']*W+AX-size[0]//2,item['row']*H+AY-size[1]))
        item['size'] = size
    out = ROOT / f'assets/pokemon/{dex}/mega'
    out.mkdir(parents=True,exist_ok=True)
    atlas.save(out/'poses.webp',lossless=True,exact=True,method=6)
    image.save(out/'poses-source.webp',lossless=True,exact=True,method=6)
    (out/'atlas.json').write_text(json.dumps(dict(cell=[W,H],anchor=[AX,AY],
        rows=['south','southwest','west','northwest','north'],
        columns=['idle','walk-left','walk-right','windup','release'],frames=manifest),indent=2)+'\n')
    print(dex,atlas.size,(out/'poses.webp').stat().st_size)

if __name__ == '__main__':
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    for dex,source in zip([530,154],sys.argv[1:]):
        prepare(dex,source)
