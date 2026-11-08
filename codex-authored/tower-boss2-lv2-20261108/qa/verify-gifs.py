import hashlib,json
from pathlib import Path
from PIL import Image,ImageDraw
root=Path(__file__).parent
preview=root/'preview-final'
manifest=json.loads((preview/'manifest.json').read_text())
report={}
contact=Image.new('RGB',(1280,5*350),(13,18,26))
draw=ImageDraw.Draw(contact)
for row,(name,clip) in enumerate(manifest['clips'].items()):
    file=preview/f'BOSS1_{name}_HD.gif'
    with Image.open(file) as im:
        assert im.size==(1080,1144) and im.info['loop']==0
        assert im.n_frames==clip['frames']
        durations=[]
        for frame in range(im.n_frames):
            im.seek(frame)
            durations.append(im.info['duration'])
        hold=0 if clip['loop'] else (850 if name=='Die' else 300)
        assert durations==[50]*(im.n_frames-1)+[50+hold]
        report[name]={'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),
                      'frames':im.n_frames,'size':im.size,'durationMs':sum(durations),'loop':0}
    for col,fraction in enumerate([0,.33,.67,1]):
        frame=round((clip['frames']-1)*fraction)
        with Image.open(preview/name/f'{frame:04d}.png') as image:
            contact.paste(image.convert('RGB').resize((320,320)),(col*320,row*350+30))
        draw.text((col*320+10,row*350+10),f'{name} frame {frame}',fill='white')
file=preview/'BOSS1_actions_HD.gif'
with Image.open(file) as im:
    assert im.size==(1920,1200) and im.n_frames==173 and im.info['loop']==0
    durations=[]
    for frame in range(im.n_frames):
        im.seek(frame);durations.append(im.info['duration'])
    assert durations==[50]*173
    report['overview']={'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'frames':im.n_frames,'size':im.size,'durationMs':sum(durations)}
with Image.open(root/'portrait-final'/'boss_skeleton_king.png') as im:
    assert im.mode=='RGBA' and im.getchannel('A').getextrema()==(0,255)
    report['portrait']={'mode':im.mode,'size':im.size,'alphaExtrema':[0,255]}
contact.save(root/'motion-contact-sheet.jpg',quality=93)
(root/'gif-verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print('GIF_QA_PASS',json.dumps(report))
