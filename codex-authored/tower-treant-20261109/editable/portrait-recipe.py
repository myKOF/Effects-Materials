import importlib.util
from pathlib import Path
import bpy
root=Path(__file__).parent/'portrait-config'
source=Path(__file__).parents[1]/'shared'/'render_tower_boss1.py'
spec=importlib.util.spec_from_file_location('boss_renderer',source)
renderer=importlib.util.module_from_spec(spec);spec.loader.exec_module(renderer)
renderer.ROOT=root
renderer.render(root/'preview','tower_boss_2',only=['Walk'],fps=20)
import hashlib,json
from mathutils import Vector
scene=bpy.context.scene
arm=next(o for o in scene.objects if o.type=='ARMATURE')
arm.data.pose_position='POSE'
arm.animation_data.action=bpy.data.actions['Unsteady_Walk']
arm.animation_data.action_slot=arm.animation_data.action.slots[0]
scene.frame_set(0)
body=max((o for o in scene.objects if o.type=='MESH' and o.vertex_groups),key=lambda o:len(o.data.vertices))
points=[body.matrix_world@Vector(p) for p in body.evaluated_get(bpy.context.evaluated_depsgraph_get()).bound_box]
lo=Vector(tuple(min(p[i] for p in points) for i in range(3)));hi=Vector(tuple(max(p[i] for p in points) for i in range(3)))
target=Vector(((lo.x+hi.x)/2,(lo.y+hi.y)/2,lo.z+(hi.z-lo.z)*.71))
camera=scene.camera
camera.location=target+Vector((.20,-4,.12))
camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.ortho_scale=max((hi.x-lo.x)*.86,(hi.z-lo.z)*.66)
scene.render.film_transparent=True;scene.render.image_settings.color_mode='RGBA'
scene.render.filepath=str(root/'portrait'/'boss_treant.png')
(root/'portrait').mkdir(exist_ok=True)
for obj in scene.objects:
    if obj.type=='MESH' and not obj.vertex_groups: obj.hide_render=True
bpy.ops.render.render(write_still=True)
(root/'portrait'/'portrait-source.json').write_text(json.dumps({'model':'images/models/npc3d/treant.glb','sha256':hashlib.sha256((root/'../../exports/treant.glb').read_bytes()).hexdigest(),'clip':'Unsteady_Walk','nativeSize':1080}),encoding='utf-8')
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=str(root/'Treant_preview.blend'))
