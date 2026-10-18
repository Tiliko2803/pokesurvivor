"""Pack generated poses into a transparent, foot-anchored gameplay atlas.

This performs asset slicing/packing only; all character poses come from the
image generator. Usage: python tools/prepare_mega_tyranitar.py source.png
"""
from pathlib import Path
import json
import sys
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'dev/assets/pokemon/248/mega'
# Checked transparent gutters in the selected 1254px image-generated sheet.
XS = [0, 165, 322, 473, 628, 782, 948, 1098, 1254]
YS = [0, 178, 337, 492, 643, 799, 958, 1110, 1254]
CELL, AX, AY, SCALE = 128, 64, 112, .70


def prepare(source):
    image = Image.open(source).convert('RGBA')
    if image.size != (1254, 1254):
        raise ValueError(f'Unexpected generated sheet size: {image.size}')
    atlas = Image.new('RGBA', (CELL * 8, CELL * 8))
    frames = []
    for row in range(8):
        for col in range(8):
            # Adjacent frames may share a one-pixel transparent gutter.
            region = image.crop((XS[col], YS[row], min(1254, XS[col+1]+1), min(1254, YS[row+1]+1)))
            mask = np.array(region)[:, :, 3] > 80
            yy, xx = np.where(mask)
            if len(xx) < 100:
                raise ValueError(f'Missing sprite in {row},{col}')
            box = (int(xx.min()), int(yy.min()), int(xx.max()+1), int(yy.max()+1))
            if box[0] == 0 or box[1] == 0 or box[2] == region.width or box[3] == region.height:
                raise ValueError(f'Clipped source frame {row},{col}: {box}')
            # Median of the ground-contact band avoids centering on a long
            # outstretched tail, fist, or head spike. No per-frame rescaling.
            foot_y = box[3]
            ground = mask[max(box[1], foot_y-15):foot_y]
            foot_x = float(np.median(np.where(ground)[1]))
            pose = region.crop(box)
            # Pixel-art export: remove nearly invisible generated alpha noise
            # and clear hidden RGB. It must not form colored tile rectangles
            # in decoders that inspect transparent pixels.
            pixels = np.array(pose)
            transparent = pixels[:, :, 3] < 128
            pixels[transparent] = 0
            pixels[~transparent, 3] = 255
            pose = Image.fromarray(pixels)
            size = (round(pose.width*SCALE), round(pose.height*SCALE))
            pose = pose.resize(size, Image.Resampling.NEAREST)
            tile = Image.new('RGBA', (CELL, CELL))
            anchor_x = round((foot_x-box[0])*SCALE)
            tile.paste(pose, (AX-anchor_x, AY-pose.height))
            bounds = tile.getbbox()
            if not bounds or min(bounds[:2]) < 2 or max(bounds[2:]) > CELL-2:
                raise ValueError(f'Clipped atlas frame {row},{col}: {bounds}')
            atlas.paste(tile, (col*CELL, row*CELL))
            frames.append(dict(row=row, col=col, sourceBox=box, anchor=[foot_x,foot_y], bounds=bounds))
    OUT.mkdir(parents=True, exist_ok=True)
    image.save(OUT/'mega-tyranitar-source.webp', lossless=True, exact=True, method=6)
    atlas.save(OUT/'mega-tyranitar.webp', lossless=True, exact=True, method=6)
    (OUT/'atlas.json').write_text(json.dumps(dict(cell=CELL,anchor=[AX,AY],scale=SCALE,
        rows=['south','southwest','west','northwest','north','northeast','east','southeast'],
        columns=['idle','breathe','walk-left','walk-right','claw-windup','claw-strike','charge','roar'],
        frames=frames), indent=2)+'\n')
    print(f'Packed 64 complete poses: {atlas.size}, alpha={atlas.getextrema()[3]}')
    print(f'Gameplay atlas: {(OUT/"mega-tyranitar.webp").stat().st_size} bytes')


if __name__ == '__main__':
    prepare(sys.argv[1])
