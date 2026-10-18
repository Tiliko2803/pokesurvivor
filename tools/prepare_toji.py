"""Slice the approved Toji sheet into foot-aligned PMD animation sheets.

Usage: python tools/prepare_toji.py /path/to/generated-toji.png
The generated source has seven rows, not eight. Use its first five views;
mirror the right-facing views for left directions, including the rear diagonal.
No interpolation or invented intermediate poses. Requires Pillow, NumPy, SciPy.
"""
from pathlib import Path
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/pokemon/10002'
W, H, AX, AY = 80, 64, 40, 55
X = [0, 145, 285, 425, 570, 710, 865, 990, 1130, 1255, 1402]
Y = [0, 158, 309, 463, 618, 770]
LAYOUTS = {
    'Idle': [0], 'Walk': [1, 2, 3, 2], 'Attack': [9, 4, 5, 9],
    'Shoot': [9, 6, 7, 9], 'Charge': [9, 4, 9],
    'Hurt': [8, 9], 'Faint': [9, 8],
}


def prepare(source):
    image = Image.open(source).convert('RGBA')
    if image.size != (1402, 1122):
        raise ValueError(f'Expected the approved 1402x1122 source, got {image.size}')
    views = []
    for row in range(5):
        poses = []
        for col in range(10):
            pixels = np.array(image.crop((X[col], Y[row], X[col+1], Y[row+1])))
            labels, count = ndimage.label(pixels[:, :, 3] >= 96, np.ones((3, 3)))
            sizes = np.bincount(labels.ravel()); sizes[0] = 0
            if count == 0:
                raise ValueError(f'Empty pose: {row}, {col}')
            # Remove isolated fringe pixels and fragments of adjacent sprites.
            keep = np.zeros(len(sizes), dtype=bool)
            keep[int(sizes.argmax())] = True
            pixels[~keep[labels]] = 0
            height, width = pixels.shape[:2]
            dark = (pixels[:, :, 3] >= 128) & (pixels[:, :, :3].max(axis=2) < 90)
            dark[:height//2] = False
            dark[:, :width//4] = False
            dark[:, width*3//4:] = False
            ys = np.where(dark.sum(axis=1) >= 2)[0]
            if not len(ys):
                raise ValueError(f'No foot anchor: {row}, {col}')
            foot_y = int(ys[-1]) + 1
            foot_x = int(np.median(np.where(dark[max(0, foot_y-7):foot_y])[1]))
            sprite = Image.fromarray(pixels)
            size = (round(width*.32), round(height*.32))
            sprite = sprite.resize(size, Image.Resampling.NEAREST)
            tile = Image.new('RGBA', (W, H))
            tile.paste(sprite, (AX-round(foot_x*.32), AY-round(foot_y*.32)))
            box = tile.getbbox()
            if not box or box[0] == 0 or box[1] == 0 or box[2] == W or box[3] == H:
                raise ValueError(f'Clipped pose: {row}, {col}: {box}')
            poses.append(tile)
        views.append(poses)
    views += [[im.transpose(Image.Transpose.FLIP_LEFT_RIGHT) for im in views[r]] for r in (3, 2, 1)]
    OUT.mkdir(parents=True, exist_ok=True)
    for name, columns in LAYOUTS.items():
        sheet = Image.new('RGBA', (W*len(columns), H*8))
        for row, poses in enumerate(views):
            for col, pose in enumerate(columns):
                sheet.paste(poses[pose], (W*col, H*row))
        sheet.save(OUT / (name + '.png'), optimize=True)
    atlas = Image.new('RGBA', (W*10, H*8))
    for row, poses in enumerate(views):
        for col, pose in enumerate(poses):
            atlas.paste(pose, (W*col, H*row))
    atlas.save(OUT / 'atlas.png', optimize=True)
    print(f'Toji: {W*10}x{H*8} atlas, 8 directions, {len(LAYOUTS)} animation sheets')


if __name__ == '__main__':
    prepare(sys.argv[1])
