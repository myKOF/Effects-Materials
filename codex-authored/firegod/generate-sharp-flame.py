"""Deterministic sharp-edged fire sprite for the Firegod star ring."""
from pathlib import Path
from PIL import Image, ImageDraw

SCALE = 4
SIZE = 256
im = Image.new('RGBA', (SIZE * SCALE, SIZE * SCALE), (0, 0, 0, 0))
draw = ImageDraw.Draw(im)


def polygon(points, color):
    draw.polygon([(round(x * SCALE), round(y * SCALE)) for x, y in points], fill=color)


# Pointed, asymmetric tongues create a readable silhouette at 16-30 screen px.
polygon([(128, 14), (153, 75), (171, 34), (174, 103), (217, 75),
         (193, 132), (241, 130), (199, 162), (209, 195), (163, 192),
         (133, 233), (113, 201), (69, 211), (68, 178), (21, 156),
         (57, 130), (37, 90), (90, 112), (84, 37), (115, 92)], '#9e2407')
polygon([(132, 34), (150, 91), (171, 55), (164, 126), (204, 94),
         (183, 143), (224, 139), (184, 163), (186, 188), (155, 182),
         (131, 218), (109, 185), (78, 193), (80, 166), (43, 151),
         (78, 133), (61, 107), (105, 122), (97, 65), (120, 110)], '#ef4b0a')
polygon([(134, 71), (146, 113), (167, 82), (157, 141), (191, 117),
         (172, 154), (201, 149), (169, 168), (169, 184), (149, 172),
         (131, 201), (115, 172), (92, 177), (100, 155), (71, 149),
         (106, 140), (101, 109), (122, 133)], '#ff9b16')
polygon([(134, 101), (145, 138), (165, 116), (152, 151), (177, 144),
         (153, 162), (148, 178), (132, 190), (116, 167), (103, 164),
         (117, 145), (113, 126), (126, 142)], '#ffd94e')
polygon([(134, 126), (142, 146), (150, 137), (147, 158), (138, 172),
         (122, 160), (125, 145)], '#fff0a0')

# Narrow dark splits separate the flame tongues without a soft blur halo.
polygon([(93, 78), (100, 134), (113, 153), (109, 121)], (80, 17, 4, 130))
polygon([(186, 117), (166, 154), (190, 140)], (103, 23, 4, 120))

out = Path(__file__).with_name('sharp-flame.png')
im.resize((SIZE, SIZE), Image.Resampling.LANCZOS).save(out, optimize=True)
print(out)
