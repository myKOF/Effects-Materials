"""Validate the R8 skinned GLB and compose honest fixed-scale motion comparisons."""
import argparse
import csv
import hashlib
import json
import math
import re
import struct
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont

p=argparse.ArgumentParser()
p.add_argument('--asset',default='assets/characters/knight3d/makehuman-r8')
p.add_argument('--preview',required=True)
p.add_argument('--battle-height',type=int,default=600)
a=p.parse_args()
asset=Path(a.asset);root=Path(a.preview);ref=Path('images/sprites/knight')
m=json.loads((asset/'manifest.json').read_text())
v=json.loads((root/'validation.json').read_text())
projection=json.loads((root/'sprite-projection.json').read_text())
definition=json.loads((ref/'knight.json').read_text())
names=['idle','walk','attack1','attack2','cast','die']
labels={'idle':'待機','walk':'跑動','attack1':'攻擊 1・橫掃','attack2':'攻擊 2・轉身落斬','cast':'施法／特殊斬擊','die':'死亡'}

# Read the delivered binary, not just the authoring manifest.
binary=(asset/'knight_animated.glb').read_bytes()
assert binary[:4]==b'glTF' and struct.unpack_from('<I',binary,8)[0]==len(binary)
size=struct.unpack_from('<I',binary,12)[0]
g=json.loads(binary[20:20+size]);buf=binary[28+size:]
assert len(g['meshes'])==len(g['materials'])==len(g['skins'])==1
assert len(g['meshes'][0]['primitives'])==1
assert len(g['skins'][0]['joints'])==56
assert set(x['name'] for x in g['animations'])==set(names) and len(g['animations'])==6
assert len(g['images'])==2 and all('bufferView' in x for x in g['images'])
assert not any('uri' in x for x in g.get('buffers',[]))
types={5120:'i1',5121:'u1',5122:'<i2',5123:'<u2',5125:'<u4',5126:'<f4'}
counts={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}
def accessor(index):
    ac=g['accessors'][index];view=g['bufferViews'][ac['bufferView']]
    dtype=np.dtype(types[ac['componentType']]);width=counts[ac['type']]
    offset=view.get('byteOffset',0)+ac.get('byteOffset',0)
    return np.ndarray((ac['count'],width),dtype=dtype,buffer=buf,offset=offset,
                      strides=(view.get('byteStride',width*dtype.itemsize),dtype.itemsize)).copy()
primitive=g['meshes'][0]['primitives'][0];attrs=primitive['attributes']
positions=accessor(attrs['POSITION']);indices=accessor(primitive['indices'])
weights=accessor(attrs['WEIGHTS_0']);joints=accessor(attrs['JOINTS_0'])
if g['accessors'][attrs['WEIGHTS_0']].get('normalized'):weights=weights.astype(float)/np.iinfo(weights.dtype).max
assert np.isfinite(positions).all() and indices.max()<len(positions)
assert len(indices)//3==m['triangles']<=12000
assert joints.max()<56 and np.max(abs(weights.sum(axis=1)-1))<1e-4
assert 'WEIGHTS_1' not in attrs
assert v['runtimeGlbReimport']['result']=='PASS' and v['runtimeGlbReimport']['allFrames']
durations={}
for anim in g['animations']:
    times=[accessor(s['input']).reshape(-1) for s in anim['samplers']]
    for s,times0 in zip(anim['samplers'],times):
        assert np.isfinite(accessor(s['output'])).all() and np.all(np.diff(times0)>0)
    duration=max(t[-1] for t in times)-min(t[0] for t in times)
    assert abs(duration-m['clips'][anim['name']]['duration'])<1e-5
    durations[anim['name']]=float(duration)
for name in names:
    c=v['clips'][name]
    assert c['minimumZ']>=-.012,(name,'Floor penetration',c['minimumZ'])
    assert c['targetMiss']['ankle']<.002,(name,'Unreachable planted ankle',c['targetMiss'])
    assert c['targetMiss']['wrist']<.025,(name,'Unreachable wrist',c['targetMiss'])
    if name in ['idle','attack1','attack2','cast']:
        assert c['offHand']['minimumForearmDot']>.85 and c['offHand']['minimumForwardDot']>.75
        assert c['offHand']['minimumFistZ']>=0
    if name in ['attack1','attack2','cast']:
        assert c['wholeBody']['pelvisTravelMeters']>.10
        assert c['wholeBody']['chestRotationRadians']>.7
        assert c['wholeBody']['footTravelMeters']>.25
for filename,sha in m['sourceFilesSha256'].items():
    assert hashlib.sha256((asset.parent/'makehuman-r7'/filename).read_bytes()).hexdigest()==sha

renderer=Path('js/battle-renderer.js').read_text(encoding='utf-8')
distance=float(re.search(r'var BATTLE_CAMERA_DISTANCE_PERCENT = ([\d.]+)',renderer)[1])
for row in csv.reader(Path('config/CSV/game_parameters.csv').read_text(encoding='utf-8-sig').splitlines()):
    if len(row)>6 and row[3]=='戰鬥鏡頭距離':distance=float(row[6])
perspective=float(re.search(r'var PERSPECTIVE_TOP_SCALE = ([\d.]+)',renderer)[1])
scale=definition['scale']*100/distance
fontpath='C:/Windows/Fonts/msjh.ttc';font=ImageFont.truetype(fontpath,18);small=ImageFont.truetype(fontpath,13)
source={};model={}
for name in names:
    tr=definition['anims'][name]['trim'];sheet=Image.open(ref/(name+'.png')).convert('RGBA')
    source[name]=[];model[name]=[]
    for i,frame in enumerate(m['clips'][name]['renderedFrames']):
        cell=Image.new('RGBA',(128,128))
        cell.paste(sheet.crop((i*tr['w'],tr['h'],(i+1)*tr['w'],2*tr['h'])),(tr['x'],tr['y']))
        source[name].append(cell)
        im=Image.open(root/name/f'{frame:03d}.png').convert('RGBA')
        bb=im.getchannel('A').getbbox();assert bb and bb[0]>0 and bb[1]>0 and bb[2]<480 and bb[3]<480,(name,frame,'Cropped render')
        shadow=Image.new('RGBA',im.size);sd=ImageDraw.Draw(shadow)
        for foot in v['clips'][name]['previewContacts'][str(frame)]:
            if not foot['contact']:continue
            ends=[tuple(q) for q in foot['ends']]
            sd.line(ends,fill=(0,0,0,110),width=9)
            for x,y in ends:sd.ellipse((x-4,y-2,x+4,y+2),fill=(0,0,0,100))
        model[name].append(Image.alpha_composite(shadow,im))
opaque=source['idle'][0].getchannel('A').point(lambda x:255 if x>245 else 0).getbbox()
original_height=opaque[3]-opaque[1]
model_scale=original_height*scale/projection['standingBodyHeightPixels']
ref_anchor=(128*definition['anchorX'],128*definition['anchorY'])
model_anchor=[projection['anchorPixels'][0],projection['headTopPixels']+projection['standingBodyHeightPixels']-(opaque[3]-ref_anchor[1])*scale/model_scale]

def project(im,k,origin,cell,anchor,warp=False):
    out=im.transform(cell,Image.Transform.AFFINE,(1/k,0,origin[0]-anchor[0]/k,0,1/k,origin[1]-anchor[1]/k),resample=Image.Resampling.BICUBIC)
    if warp:
        beta=(1/perspective-1)/(a.battle_height/2);ax,ay=anchor;den=1-beta*ay
        inv=(1/den,ax*beta/den,-ax*beta*ay/den,0,(1+ay*beta)/den,-beta*ay**2/den,0,beta/den)
        out=out.transform(cell,Image.Transform.PERSPECTIVE,inv,resample=Image.Resampling.BICUBIC)
    return out

game_original={n:[project(im,scale,ref_anchor,(160,160),(80,117),True) for im in source[n]] for n in names}
game_model={n:[project(im,model_scale,model_anchor,(160,160),(80,117),True) for im in model[n]] for n in names}
large_original={n:[project(im,160/original_height,ref_anchor,(430,450),(215,350)) for im in source[n]] for n in names}
large_model={n:[project(im,160/projection['standingBodyHeightPixels'],model_anchor,(430,450),(215,350)) for im in model[n]] for n in names}

def gif_save(frames,path):
    # Shared palette prevents animated edge shimmer on the tiny silver figure.
    sampler=Image.new('RGB',(frames[0].width*6,frames[0].height))
    for i in range(6):sampler.paste(frames[min(len(frames)-1,i*len(frames)//6)],(i*frames[0].width,0))
    pal=sampler.quantize(colors=256)
    frames=[im.quantize(palette=pal,dither=Image.Dither.NONE) for im in frames]
    frames[0].save(path,save_all=True,append_images=frames[1:],duration=40,loop=0,disposal=2,optimize=False)
    with Image.open(path) as check:
        duration=0
        for j in range(check.n_frames):check.seek(j);duration+=check.info['duration']
        assert duration==6000

boards=[];indices_at_time={n:[] for n in names}
for frame in range(150):
    t=frame*.04;board=Image.new('RGB',(640,688),(20,29,30));d=ImageDraw.Draw(board)
    d.text((14,9),'MakeHuman＋Blender R8・六組原圖／新版動作',font=font,fill=(231,236,236))
    d.text((14,36),'100% 檢視｜遊戲一般視窗尺寸估計｜同向 SE・固定比例',font=small,fill=(175,193,193))
    d.text((14,56),'原圖保留盾／刀光供比較；新版無盾／刀光，未接入正式遊戲',font=small,fill=(151,172,173))
    for i,name in enumerate(names):
        clip=m['clips'][name];hold=0 if clip['loop'] else (.75 if name=='die' else .3)
        local=min(t%(clip['duration']+hold),clip['duration']-.000001)
        idx=min(14,int(local*definition['anims'][name]['fps']))
        indices_at_time[name].append(idx)
        x=i%2*320;y=86+i//2*200
        d.rounded_rectangle((x+3,y+2,x+317,y+196),radius=6,fill=(27,38,38),outline=(55,72,72))
        d.text((x+12,y+7),labels[name],font=small,fill=(222,231,229))
        d.text((x+73,y+27),'原圖',font=small,fill=(164,183,182));d.text((x+225,y+27),'新版',font=small,fill=(178,201,215))
        d.line((x+160,y+43,x+160,y+187),fill=(46,62,62))
        for col,im in enumerate([game_original[name][idx],game_model[name][idx]]):
            board.paste(im,(x+col*160,y+34),im)
    boards.append(board)
gif_save(boards,root/'knight_makehuman_r8_six_game_compare.gif')
boards[0].save(root/'knight_makehuman_r8_six_game_compare.png')
for name in names:
    enlarged=[]
    for idx in indices_at_time[name]:
        pair=Image.new('RGB',(860,520),(27,38,38));pd=ImageDraw.Draw(pair)
        pd.text((15,8),labels[name]+'・造型及全身動作放大',font=font,fill=(222,231,229))
        pd.text((180,42),'原圖 SE',font=small,fill=(164,183,182));pd.text((610,42),'R8 新版 SE',font=small,fill=(178,201,215))
        pd.line((430,60,430,510),fill=(55,72,72))
        for col,im in enumerate([large_original[name][idx],large_model[name][idx]]):pair.paste(im,(col*430,60),im)
        enlarged.append(pair)
    gif_save(enlarged,root/(name+'_compare.gif'))
# Five phases in every row expose anticipation, contact and recovery as well as
# the moving preview. Every pose uses the same calibration, never a fitted crop.
sheet=Image.new('RGB',(2200,6*270),(20,29,30));sd=ImageDraw.Draw(sheet)
for row,name in enumerate(names):
    for col,idx in enumerate([0,3,6,9,14]):
        x=col*440;y=row*270
        sd.text((x+8,y+4),name+' '+str(idx+1)+'/15・原／新',font=small,fill=(210,225,225))
        for half,im in enumerate([source[name][idx],model[name][idx]]):
            k=80/original_height if half==0 else 80/projection['standingBodyHeightPixels']
            origin=ref_anchor if half==0 else model_anchor
            im=project(im,k,origin,(220,230),(110,175))
            sheet.paste(im,(x+half*220,y+24),im)
sheet.save(root/'knight_makehuman_r8_keyposes.png')
report={'result':'PASS','revision':8,'triangles':m['triangles'],'glbBytes':len(binary),'mesh':1,'primitive':1,'material':1,'skin':1,'joints':56,'maxWeightsPerVertex':4,'animations':durations,
 'originalPixelsNotRedrawn':True,'sourceAndModelMirrored':False,'direction':'SE','fixedScaleAndAnchorAcrossSixActions':True,
 'cameraDistancePercent':distance,'effectiveSourceScale':scale,'battlePanelHeightCssPx':a.battle_height,'perspectiveTopScale':perspective,
 'referenceIdleHeightBeforePerspectivePx':original_height*scale,'gameSizeEstimate':True,'sourceR7Unchanged':True,
 'limits':'Visual review candidate; ordinary panel centre estimated at CSS/browser zoom 100%; no game replacement or live GPU FPS validation.'}
(root/'motion-package-validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2))
