"""Slice the user's 167333.png sheet without redrawing or generating poses.

Usage: python tools/prepare_mega_blaziken.py /path/to/167333.png
Requires Pillow and NumPy. Output is a lossless, foot-aligned gameplay atlas.
"""
from pathlib import Path
import sys
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'dev/assets/pokemon/257/mega'
W, H, AX, AY = 192, 160, 96, 142
X = [0, 142, 272, 403, 520, 640, 765, 890, 1050, 1164, 1278, 1402]
Y = [0, 134, 265, 400, 543, 686, 822, 961, 1122]


def prepare(source):
    image = Image.open(source).convert('RGBA')
    if image.size != (1402, 1122):
        raise ValueError(f'Expected the approved 1402x1122 source, got {image.size}')
    atlas = Image.new('RGBA', (W * 11, H * 8))
    for row in range(8):
        for col in range(11):
            pixels = np.array(image.crop((X[col], Y[row], X[col+1], Y[row+1])))
            # Discard near-invisible fringe pixels, not the character's flames.
            pixels[pixels[:, :, 3] < 64] = 0
            opaque = pixels[:, :, 3] >= 128
            dark = opaque & (pixels[:, :, 0] < 155) & (pixels[:, :, 1] < 110) & (pixels[:, :, 2] < 110)
            dark[:len(dark)//2] = False
            lines = np.where(dark.sum(axis=1) >= 3)[0]
            if not len(lines):
                raise ValueError(f'No foot anchor in row {row}, col {col}')
            foot_y = int(lines[-1]) + 1
            foot_xs = np.where(dark[max(0, foot_y-12):foot_y])[1]
            foot_x = int(np.median(foot_xs))
            sprite = Image.fromarray(pixels)
            # Preserve one scale for every frame; only translate to the anchor.
            tile = Image.new('RGBA', (W, H))
            tile.paste(sprite, (AX-foot_x, AY-foot_y))
            box = tile.getbbox()
            if not box or box[0] == 0 or box[1] == 0 or box[2] == W or box[3] == H:
                raise ValueError(f'Clipped frame: row {row}, col {col}, {box}')
            atlas.paste(tile, (col*W, row*H))
    OUT.mkdir(parents=True, exist_ok=True)
    target = OUT / 'mega-blaziken.webp'
    atlas.save(target, lossless=True, method=6)
    print(f'{target.relative_to(ROOT)}: {atlas.width}x{atlas.height}, {target.stat().st_size} bytes')


if __name__ == '__main__':
    prepare(sys.argv[1])
