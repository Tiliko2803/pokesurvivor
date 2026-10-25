"""Pack the generated 5x5 Mega Heracross/Gardevoir sheets.
Usage: python tools/prepare_hera_gardevoir.py DEX SOURCE.png
Only crops, removes encoder fringes and anchors supplied pixel-art poses.
"""
from pathlib import Path
import sys,json
from PIL import Image
import numpy as np
from scipy import ndimage

ROOT=Path(__file__).resolve().parents[1]
W,H,AX,AY=176,176,88,164
def prepare(dex,source):
    im=Image.open(source).convert('RGBA')
    im.putalpha(im.getchannel('A').point(lambda a: 0 if a<=16 else a))
    poses=[];meta=[]
    # The Heracross generator used uneven row spacing; use inspected dividers.
    ys=[0,244,476,715,949,1247] if dex==214 else [round(i*im.height/5) for i in range(6)]
    for row in range(5):
        for col in range(5):
            box=(round(col*im.width/5),ys[row],round((col+1)*im.width/5),ys[row+1])
            tile=im.crop(box);alpha=np.array(tile.getchannel('A'))
            alpha[alpha<96]=0
            rgb=np.array(tile)[:,:,:3].astype(int)
            fringe=((rgb[:,:,1]-rgb[:,:,0]>80)&(rgb[:,:,1]-rgb[:,:,2]>80))|((rgb[:,:,2]-rgb[:,:,0]>80)&(rgb[:,:,2]-rgb[:,:,1]>80))
            alpha[fringe]=0
            labels,n=ndimage.label(alpha>16,structure=np.ones((3,3)))
            sizes=np.bincount(labels.ravel());sizes[0]=0
            keep=sizes>=max(8,sizes.max()*.03);keep[0]=False
            alpha[~keep[labels]]=0;tile.putalpha(Image.fromarray(alpha))
            bounds=tile.getchannel('A').point(lambda a:255 if a>96 else 0).getbbox()
            if not bounds:raise ValueError(f'Empty pose {row},{col}')
            poses.append(tile.crop(bounds));meta.append(dict(row=row,col=col,sourceBox=box,bounds=bounds))
    scale=min(160/max(p.width for p in poses),150/max(p.height for p in poses))
    atlas=Image.new('RGBA',(W*5,H*5))
    for pose,m in zip(poses,meta):
        size=(round(pose.width*scale),round(pose.height*scale))
        atlas.paste(pose.resize(size,Image.Resampling.NEAREST),(m['col']*W+AX-size[0]//2,m['row']*H+AY-size[1]))
        m['size']=size
    out=ROOT/f'assets/pokemon/{dex}/mega';out.mkdir(parents=True,exist_ok=True)
    atlas.save(out/'poses.webp',lossless=True,exact=True,method=6)
    im.save(out/'poses-source.webp',lossless=True,exact=True,method=6)
    (out/'atlas.json').write_text(json.dumps(dict(cell=[W,H],anchor=[AX,AY],rows=['south','southwest','west','northwest','north'],columns=['idle','walk-left','walk-right','windup','release'],frames=meta),indent=2)+'\n')
    print(dex,im.size,atlas.size)
if __name__=='__main__':prepare(int(sys.argv[1]),sys.argv[2])
