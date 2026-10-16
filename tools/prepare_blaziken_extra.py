"""Pack the alpha-extracted 167351.png supplement into aligned gameplay cells.

Input: the imagegen background-extraction result, 1402x1122 RGBA.
Keeps the established sheet for idle/melee and adds casting + real rear walk.
"""
from pathlib import Path
import sys
import numpy as np
from PIL import Image, ImageOps
from scipy.ndimage import label

ROOT=Path(__file__).resolve().parents[1]
W,H,AX,AY=224,160,112,142
X=[0,132,248,363,475,586,697,850,972,1098,1290,1402]
Y=[0,147,281,427,567,711,849,989,1122]


def tile(im,row,col,mirror=False):
    right=X[col+1]
    # Frame 10 includes a travelling fireball. Extract the body/extended hands;
    # projectiles of all types remain rendered by the existing combat system.
    if col==9:right=1209
    a=np.array(im.crop((X[col],Y[row],right,Y[row+1])))
    a[a[:,:,3]<96]=0  # remove low-alpha background residue from extraction
    regions,n=label(a[:,:,3]>=96,structure=np.ones((3,3)))
    sizes=np.bincount(regions.ravel());sizes[0]=0
    a[sizes[regions]<40]=0  # detached crumbs from neighbouring sprite cells
    opaque=a[:,:,3]>=160
    dark=opaque&(a[:,:,0]<155)&(a[:,:,1]<110)&(a[:,:,2]<110)
    dark[:len(dark)//2]=False
    lines=np.where(dark.sum(axis=1)>=3)[0]
    if not len(lines):raise ValueError(f'No anchor: {row}/{col}')
    fy=int(lines[-1])+1
    fx=int(np.median(np.where(dark[max(0,fy-12):fy])[1]))
    sprite=Image.fromarray(a)
    if mirror:
        sprite=ImageOps.mirror(sprite)
        fx=sprite.width-1-fx
    out=Image.new('RGBA',(W,H))
    out.paste(sprite,(AX-fx,AY-fy))
    bbox=out.getbbox()
    if not bbox or bbox[0]==0 or bbox[1]==0 or bbox[2]==W or bbox[3]==H:
        raise ValueError(f'Clipped frame: {row}/{col}, {bbox}')
    return out


def prepare(source):
    im=Image.open(source).convert('RGBA')
    if im.size!=(1402,1122):raise ValueError(f'Unexpected source size: {im.size}')
    atlas=Image.new('RGBA',(W*4,H*9))
    # Rear casting views in the source are approximate. Mirror left casts so
    # an aimed attack to the left never thrusts the hands toward the right.
    rows=[0,1,2,3,3,3,2,1]
    for direction,row in enumerate(rows):
        for frame,col in enumerate([7,8,9,7]):
            atlas.paste(tile(im,row,col,direction>=5),(frame*W,direction*H))
    # The supplement's fourth row is the genuinely rear-facing walk.
    for frame,col in enumerate([2,3,4,5]):
        atlas.paste(tile(im,3,col),(frame*W,H*8))
    out=ROOT/'dev/assets/pokemon/257/mega/mega-blaziken-extra.webp'
    atlas.save(out,lossless=True,method=6)
    print(f'{out.relative_to(ROOT)}: {atlas.size}, {out.stat().st_size} bytes')


if __name__=='__main__':prepare(sys.argv[1])
