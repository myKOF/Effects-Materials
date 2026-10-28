"""Render the actual exported Attack1 GLB, with floor and fixed full-motion framing.

Blender --background --python render_attack1.py -- model.glb output-dir [yaw] [size]
Optional --keyframes renders only the review contact sheet frames; --slow renders
96 samples per source second for smooth 25% playback at 24 fps.
"""
import bpy
import json
import math
import sys
from pathlib import Path
from mathutils import Vector

args = sys.argv[sys.argv.index('--')+1:]
model, dest = args[:2]
yaw = float(args[2]) if len(args)>2 else 35.
size = int(args[3]) if len(args)>3 else 640
out = Path(dest)
out.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=model)
arm = next(o for o in bpy.data.objects if o.type=='ARMATURE')
for o in list(bpy.data.objects):
    if o.type=='MESH' and not o.vertex_groups:
        bpy.data.objects.remove(o,do_unlink=True)
scene = bpy.context.scene
scene.render.engine = 'BLENDER_WORKBENCH'
scene.render.resolution_x = scene.render.resolution_y = size
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.fps = 24
sh = scene.display.shading
sh.light = 'STUDIO'
sh.studiolight_rotate_z = .4
sh.color_type = 'TEXTURE'
sh.show_shadows = True
sh.show_cavity = True
sh.cavity_type = 'BOTH'
sh.curvature_ridge_factor = 1.1
sh.curvature_valley_factor = .5
sh.show_object_outline = True
sh.object_outline_color = (.035,.035,.045)
scene.world = bpy.data.worlds.new('Review world')
scene.world.color = (.14,.17,.21)
img = bpy.data.images.new('Floor squares',128,128)
pixels = []
for y in range(128):
    for x in range(128):
        v = .26 if (x//8+y//8)%2 else .32
        pixels.extend((v,v+.02,v+.04,1.))
img.pixels = pixels
mat = bpy.data.materials.new('Floor')
mat.use_nodes = True
tex = mat.node_tree.nodes.new('ShaderNodeTexImage')
tex.image = img
tex.interpolation = 'Closest'
mat.node_tree.links.new(tex.outputs['Color'], mat.node_tree.nodes['Principled BSDF'].inputs['Base Color'])
bpy.ops.mesh.primitive_plane_add(size=8,location=(0,0,-.008))
bpy.context.object.data.materials.append(mat)
camera_data = bpy.data.cameras.new('Review camera')
camera_data.type = 'ORTHO'
camera_data.ortho_scale = 3.45
camera = bpy.data.objects.new('Review camera',camera_data)
scene.collection.objects.link(camera)
scene.camera = camera
target = Vector((0,-.40,1.30))
yaw, elev = math.radians(yaw), math.radians(17)
camera.location = target + Vector((math.sin(yaw)*math.cos(elev),-math.cos(yaw)*math.cos(elev),math.sin(elev)))*8
camera.rotation_euler = (target-camera.location).to_track_quat('-Z','Y').to_euler()
action = bpy.data.actions['Attack1']
arm.animation_data.action = action
if hasattr(action,'slots') and len(action.slots):
    arm.animation_data.action_slot = action.slots[0]
frames = [0,8,14,18,20,22,24,26,33,42,57] if '--keyframes' in args else [i/4 for i in range(229)] if '--slow' in args else range(58)
if '--rest' in args:
    arm.animation_data.action=None
    for pb in arm.pose.bones:pb.matrix_basis.identity()
    frames=[0]
    camera_data.ortho_scale=2.05
    target=Vector((0,0,.90))
    camera.location=target+Vector((math.sin(yaw)*math.cos(elev),-math.cos(yaw)*math.cos(elev),math.sin(elev)))*8
    camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler()
if '--diagnostic' in args:
    import colorsys
    sh.color_type='OBJECT'
    for i,o in enumerate(sorted((o for o in bpy.data.objects if o.type=='MESH' and o.vertex_groups),key=lambda o:o.name)):
        o.color=(*colorsys.hsv_to_rgb((i*.618)%1,.65,.85),1)
for index,f in enumerate(frames):
    scene.frame_set(int(f),subframe=f%1)
    number = index if '--slow' in args else int(f)
    scene.render.filepath = str(out/f'f{number:04}.png')
    bpy.ops.render.render(write_still=True)
(out/'info.json').write_text(json.dumps({'fps':24,'speed':.25 if '--slow' in args else 1.,'frames':list(frames),'source':str(model)}),encoding='utf-8')
print('ATTACK1_RENDERED',out,flush=True)
