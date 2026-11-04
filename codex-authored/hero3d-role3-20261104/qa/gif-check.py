from pathlib import Path
from PIL import Image,ImageChops
import json
p=Path(__file__).parent;file=p/'role3-attack-in-game.gif';im=Image.open(file)
assert im.size==(1600,1000) and im.n_frames==84
im.seek(0);a=im.convert('RGB');im.seek(32);b=im.convert('RGB')
assert ImageChops.difference(a.crop((400,150,1000,900)),b.crop((400,150,1000,900))).getbbox(),'Game actor frozen'
assert ImageChops.difference(a.crop((1010,200,1580,780)),b.crop((1010,200,1580,780))).getbbox(),'Hand closeup frozen'
b.save(p/'gif-readback.png')
r={'frames':im.n_frames,'size':list(im.size),'bytes':file.stat().st_size,'actorAndInsetAnimated':True}
(p/'gif-report.json').write_text(json.dumps(r,indent=2));print(r)
