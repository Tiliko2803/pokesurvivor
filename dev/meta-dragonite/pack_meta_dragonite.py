"""Pack generated Mega Metagross and Dragonite sheets into the shared 5x5 atlas.
Usage: python tools/pack_meta_dragonite.py metagross.png dragonite.png
"""
from PIL import Image
from scipy import ndimage
from pathlib import Path
import numpy as np,json,sys,hashlib
root=Path(__file__).resolve().parents[1]
for dex,path in zip([376,149],sys.argv[1:]):
 source=Path(path);im=Image.open(source).convert('RGBA');a=np.array(im.getchannel('A'));labels,n=ndimage.label(a>128);sizes=np.bincount(labels.ravel());components=[]
 for k,sl in enumerate(ndimage.find_objects(labels),1):
  if sl and sizes[k]>1200:components.append((k,(sl[1].start,sl[0].start,sl[1].stop,sl[0].stop)))
 assert len(components)==25,(dex,len(components))
 components.sort(key=lambda t:t[1][1]);rows=[sorted(components[i:i+5],key=lambda t:t[1][0]) for i in range(0,25,5)]
 poses=[];manifest=[]
 for row,items in enumerate(rows):
  for col,(k,box) in enumerate(items):
   # Dragonite's rear-left release turned to the front. Use the valid rear-left idle.
   source_col=0 if dex==149 and row==3 and col==4 else col
   k,box=items[source_col];x0,y0,x1,y1=box;tile=im.crop(box);alpha=np.array(tile.getchannel('A'))
   mask=ndimage.binary_dilation(labels[y0:y1,x0:x1]==k,iterations=1)
   if dex==149:
    # Remove generated alpha speckles and thin bridges into neighboring poses.
    opened=ndimage.binary_opening((alpha>220)&mask,iterations=2)
    parts,count=ndimage.label(opened);part_sizes=np.bincount(parts.ravel());part_sizes[0]=0
    clean=ndimage.binary_dilation(parts==int(part_sizes.argmax()),iterations=2)
    mask&=clean
   alpha[~mask]=0;tile.putalpha(Image.fromarray(alpha))
   bounds=tile.getchannel('A').getbbox();assert bounds;tile=tile.crop(bounds)
   poses.append(tile);manifest.append({'row':row,'col':col,'sourceColumn':source_col,'sourceBounds':box})
 scale=min(156/max(p.width for p in poses),148/max(p.height for p in poses));atlas=Image.new('RGBA',(880,880))
 for entry,tile in zip(manifest,poses):
  tile=tile.resize((round(tile.width*scale),round(tile.height*scale)),Image.Resampling.NEAREST);atlas.paste(tile,(entry['col']*176+88-tile.width//2,entry['row']*176+164-tile.height));entry['size']=tile.size
 out=root/f'assets/pokemon/{dex}/mega';out.mkdir(parents=True,exist_ok=True);atlas.save(out/'poses.webp',lossless=True,exact=True,method=6)
 im.save(out/'poses-source.webp',lossless=True,exact=True,method=6)
 (out/'atlas.json').write_text(json.dumps({'cell':[176,176],'anchor':[88,164],'rows':['south','southwest','west','northwest','north'],'columns':['idle','walk-left','walk-right','windup','release'],'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'frames':manifest},indent=2)+'\n')
 export=root.parent/'output'/f'Mega-{("Metagross" if dex==376 else "Dragonite")}-hoja-sprites.png';atlas.save(export)
 for row in range(5):
  for col in range(5):
   b=atlas.crop((col*176,row*176,(col+1)*176,(row+1)*176)).getchannel('A').getbbox();assert b and b[0]>=10 and b[1]>=10 and b[2]<=166 and b[3]<=165
 print('PASS',dex,'25 poses, no clipping, normalized foot anchors',export)
