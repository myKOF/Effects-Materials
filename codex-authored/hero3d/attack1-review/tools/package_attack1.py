"""Package unmodified Blender renders into a large single-view slow-motion GIF.

python package_attack1.py preview-root
"""
import json
import sys
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont

root = Path(sys.argv[1])
font = ImageFont.truetype('C:/Windows/Fonts/msjh.ttc',30)
small = ImageFont.truetype('C:/Windows/Fonts/msjh.ttc',24)
frames = []
info = json.loads((root/'large'/'info.json').read_text(encoding='utf-8'))
for index,f in enumerate(info['frames']):
    board = Image.new('RGB',(1200,1260),(24,29,37))
    draw = ImageDraw.Draw(board)
    draw.text((20,12),'Attack1 · 雙手回旋重劈',font=font,fill=(239,228,197))
    phase = '向右後回旋' if f<15 else '舉劍蓄力' if f<19 else '直劈下壓' if f<26 else '低蹲觸地' if f<34 else '收招回復'
    draw.text((770,18),f'25% 速度  ·  {phase}',font=small,fill=(205,214,225))
    image = Image.open(root/'large'/f'f{index:04}.png').convert('RGB')
    assert image.size == (1200,1200)
    board.paste(image,(0,60))
    frames.append(board)
# GIF timing has 10 ms precision: 40/40/40/50/40/40 ms sums to 250 ms for six 24fps frames.
durations = [50 if f%6==3 else 40 for f in range(len(frames))]
# A shared palette keeps the static stage stable and enables GIF delta rectangles.
# Independent per-frame palettes unnecessarily re-encode the whole floor every frame.
samples = frames[::12]
palette_board = Image.new('RGB',(300*len(samples),315))
for index,frame in enumerate(samples):
    palette_board.paste(frame.resize((300,315),Image.Resampling.LANCZOS),(index*300,0))
palette = palette_board.quantize(colors=256,method=Image.Quantize.MEDIANCUT)
frames = [frame.quantize(palette=palette,dither=Image.Dither.NONE) for frame in frames]
frames[0].save(root/'attack1-preview.gif',save_all=True,append_images=frames[1:],duration=durations,loop=0,optimize=False,disposal=1)
gif = Image.open(root/'attack1-preview.gif')
decoded_duration = 0
for index in range(gif.n_frames):
    gif.seek(index)
    decoded_duration += gif.info['duration']
assert decoded_duration == sum(durations)
assert gif.size == (1200,1260) and gif.n_frames > 190
print(json.dumps({'gif':str(root/'attack1-preview.gif'),'renderedSamples':len(frames),'gifFrames':gif.n_frames,'size':gif.size,'durationMs':decoded_duration},indent=2))
