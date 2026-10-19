"""Slice image-generated poses into four foot-anchored gameplay atlases.

No poses are drawn or interpolated here. Transparent connected components
avoid cutting a raised hammer at the nominal image-generator cell boundary.
Usage: python tools/prepare_mega_tinkaton.py walk.png attack.png cast.png react.png
"""
from pathlib import Path
import json
import sys
import numpy as np
from PIL import Image
from scipy.ndimage import label, find_objects

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/pokemon/959/mega'
W, H = 256, 224
AX, AY = 128, 204
SCALE = .56


def prepare(key, source):
    image = Image.open(source).convert('RGBA')
    rgba = np.array(image)
    labels, _ = label(rgba[:, :, 3] > 128)
    boxes = []
    for i, region in enumerate(find_objects(labels)):
        if region is None or np.count_nonzero(labels[region] == i+1) < 1500:
            continue
        boxes.append((region[1].start, region[0].start, region[1].stop, region[0].stop))
    if len(boxes) != 20:
        raise ValueError(f'{key}: expected 20 isolated poses, got {len(boxes)}')
    boxes.sort(key=lambda b: b[1])
    atlas = Image.new('RGBA', (W*4, H*5))
    frames = []
    for row in range(5):
        for col, box in enumerate(sorted(boxes[row*4:row*4+4], key=lambda b: b[0])):
            pixels = rgba[box[1]:box[3], box[0]:box[2]].copy()
            # Pixel export uses the same alpha cutoff as the project's other
            # generated sprite packer; invisible RGB never becomes a tile.
            transparent = pixels[:, :, 3] <= 128
            pixels[transparent] = 0
            pixels[~transparent, 3] = 255
            pose = Image.fromarray(pixels)
            # Anchor on the pink feet, never on a hammer resting on the ground.
            red, green, blue = [pixels[:,:,i].astype(float) for i in range(3)]
            feet = (~transparent) & (red > 100) & (red > green*1.3) & (blue > red*.5)
            feet[:round(pose.height*.60)] = False
            yy, xx = np.where(feet)
            if len(xx):
                foot_x = float(np.median(xx[yy >= yy.max()-12]))
            else:
                foot_x = float(np.median(np.where((~transparent)[-14:])[1]))
            # One scale for all poses preserves the heavy hammer's proportions.
            size = (round(pose.width*SCALE), round(pose.height*SCALE))
            pose = pose.resize(size, Image.Resampling.NEAREST)
            tile = Image.new('RGBA', (W, H))
            tile.paste(pose, (round(AX-foot_x*SCALE), AY-pose.height))
            bounds = tile.getbbox()
            if not bounds or min(bounds[:2]) < 2 or bounds[2] > W-2 or bounds[3] > H-2:
                raise ValueError(f'{key}: clipped pose {row},{col}: {bounds}')
            atlas.paste(tile, (col*W, row*H))
            frames.append({'row':row,'col':col,'sourceBox':box,'bounds':bounds})
    OUT.mkdir(parents=True, exist_ok=True)
    image.save(OUT/f'{key}-source.webp', lossless=True, exact=True, method=6)
    atlas.save(OUT/f'{key}.webp', lossless=True, exact=True, method=6)
    print(f'{key}: 20 complete poses, atlas={atlas.size}, bytes={(OUT/f"{key}.webp").stat().st_size}')
    return {'sourceSize':image.size,'frames':frames}


if __name__ == '__main__':
    if len(sys.argv) != 5:
        raise SystemExit(__doc__)
    sheets = {k:prepare(k,p) for k,p in zip(['walk','attack','cast','react'],sys.argv[1:])}
    (OUT/'atlas.json').write_text(json.dumps({'cell':[W,H],'anchor':[AX,AY],'scale':SCALE,
        'rows':['south','southwest','west','northeast','north'],
        'engineRows':[0,1,2,3,4,3,2,1],'mirrors':[False,True,True,False,False,True,False,False],
        'sheets':sheets},indent=2)+'\n')
