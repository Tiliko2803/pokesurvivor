"""Pack corrected generated Mega Baxcalibur art, separating each connected pose.
Usage: python dev/dragon-megas/tools/pack_baxcalibur_v3.py SOURCE.png OUTPUT.png
The game atlas stays 880x880, with 176px cells and anchor (88,164).
"""
from pathlib import Path
from PIL import Image, ImageOps
from scipy import ndimage
import numpy as np
import json,sys,hashlib
root=Path(__file__).resolve().parents[3]
source=Path(sys.argv[1]);image=Image.open(source).convert('RGBA')
alpha=np.array(image.getchannel('A'));labels,count=ndimage.label(alpha>80)
sizes=np.bincount(labels.ravel());found=[]
for label,sl in enumerate(ndimage.find_objects(labels),1):
    if sl and sizes[label]>500:
        box=(sl[1].start,sl[0].start,sl[1].stop,sl[0].stop)
        found.append((label,box))
assert len(found)==25, f'Expected 25 separate poses, got {len(found)}'
# Five generated rows have varying margins; sort actual poses, never equal-cell cuts.
found.sort(key=lambda item:item[1][1]);rows=[sorted(found[i:i+5],key=lambda item:item[1][0]) for i in range(0,25,5)]
poses=[];manifest=[]
for row,items in enumerate(rows):
 for col,(label,box) in enumerate(items):
    x0,y0,x1,y1=box
    # Keep original antialiased edge alpha within a 2px halo of this pose only.
    mask=ndimage.binary_dilation(labels[y0:y1,x0:x1]==label,iterations=2)
    tile=image.crop(box);a=np.array(tile.getchannel('A'));a[~mask]=0;tile.putalpha(Image.fromarray(a))
    # The regenerated sheet already follows the intended directional rows.
    flip=False
    if flip:tile=ImageOps.mirror(tile)
    poses.append(tile);manifest.append({'row':row,'col':col,'sourceBounds':box,'mirrorSource':flip})
scale=min(156/max(p.width for p in poses),148/max(p.height for p in poses))
atlas=Image.new('RGBA',(880,880))
for item,tile in zip(manifest,poses):
    tile=tile.resize((round(tile.width*scale),round(tile.height*scale)),Image.Resampling.NEAREST)
    atlas.paste(tile,(item['col']*176+88-tile.width//2,item['row']*176+164-tile.height))
    item['packedSize']=tile.size
out=root/'dev/assets/pokemon/998/mega';out.mkdir(parents=True,exist_ok=True)
atlas.save(out/'poses.webp',lossless=True,exact=True,method=6)
export=Path(sys.argv[2]);export.parent.mkdir(parents=True,exist_ok=True);atlas.save(export)
(out/'atlas.json').write_text(json.dumps({'version':3,'cell':[176,176],'anchor':[88,164],
 'rows':['south','southwest','west','northwest','north'],'columns':['idle','walk-left','walk-right','windup','release'],
 'design':'Dorsal blade in head-spine-tail plane: edge-on front/rear, broad side profile; short abdominal hilt',
 'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'frames':manifest},indent=2)+'\n')
# Every cell must contain art with padding and complete, unclipped alpha bounds.
for row in range(5):
 for col in range(5):
    bounds=atlas.crop((col*176,row*176,(col+1)*176,(row+1)*176)).getchannel('A').getbbox()
    assert bounds and bounds[0]>=10 and bounds[1]>=10 and bounds[2]<=166 and bounds[3]<=165,bounds
print('PASS: 25 isolated poses, padded cells, consistent scale and foot anchors; export:',export)
