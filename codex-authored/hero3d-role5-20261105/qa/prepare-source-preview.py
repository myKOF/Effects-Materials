import json,struct,sys
from pathlib import Path
source,target=map(Path,sys.argv[1:]);raw=source.read_bytes();n=struct.unpack_from('<I',raw,12)[0];j=json.loads(raw[20:20+n]);binary=raw[28+n:]
j.pop('animations',None);j['asset'].setdefault('extras',{}).update(pbrEmbedded=True,capeCollision=False,textureGrade=False)
js=json.dumps(j,separators=(',',':')).encode();js+=b' '*(-len(js)%4)
target.write_bytes(struct.pack('<III',0x46546c67,2,28+len(js)+len(binary))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(binary),0x004e4942)+binary)
