"""R8: animate the delivered R7 MakeHuman knight, preserving its authored shape.

Run with Blender. Original sprites inform the poses; no image is used as a mesh
or texture. Outputs are separate from all earlier static/animation candidates.
"""
import argparse
import hashlib
import json
import math
import sys
from pathlib import Path

sys.dont_write_bytecode = True
import bpy
from mathutils import Vector, Matrix, Euler, Quaternion
from bpy_extras.object_utils import world_to_camera_view

p = argparse.ArgumentParser()
p.add_argument('--source', default='assets/characters/knight3d/makehuman-r7')
p.add_argument('--output', required=True)
p.add_argument('--preview', required=True)
p.add_argument('--render', choices=['none', 'keys', 'all'], default='all')
p.add_argument('--render-clips',nargs='+',choices=['idle','walk','attack1','attack2','cast','die'],help='Rerender selected clips; still rebuild and validate every saved action')
a = p.parse_args(sys.argv[sys.argv.index('--') + 1:])
SOURCE, OUT, PREVIEW = [Path(x).resolve() for x in [a.source, a.output, a.preview]]
assert OUT != SOURCE and OUT.name == 'makehuman-r8', 'Use the distinct R8 folder'
OUT.mkdir(parents=True, exist_ok=True)
PREVIEW.mkdir(parents=True, exist_ok=True)
source_hashes = {f.name: hashlib.sha256(f.read_bytes()).hexdigest() for f in SOURCE.iterdir() if f.is_file()}
bpy.ops.wm.open_mainfile(filepath=str(SOURCE / 'knight_makehuman.blend'))
scene = bpy.context.scene
rig = bpy.data.objects['MakeHuman_Knight_Rig']
parts = [o for o in scene.objects if o.type == 'MESH' and not o.hide_render]
assert len(rig.data.bones) == 53 and not bpy.data.actions
K = rig.data.bones['upperarm_l'].head_local.z / 1.2608943
base_local = {b.name: b.matrix_basis.copy() for b in rig.pose.bones}
base = {b.name: b.matrix.copy() for b in rig.pose.bones}
deform = {b.name: base[b.name] @ b.matrix_local.inverted() for b in rig.data.bones}
P0 = base['pelvis'].translation.copy()
feet0 = {s: base['foot_' + s].translation.copy() for s in ['r', 'l']}
wrists0 = {s: base['hand_' + s].translation.copy() for s in ['r', 'l']}
blade0 = Vector((.76, .07, .64)).normalized()
handforward0 = (rig.pose.bones['hand_r'].tail - rig.pose.bones['hand_r'].head).normalized()
grip0 = wrists0['r'] + handforward0 * .055 * K
rest_grip = deform['hand_r'].inverted() @ grip0

# Independent rigid weapon and hinged tassets retain exactly the R7 guard shape.
# Their rest matrices match the existing bindings before any motion is baked.
bpy.context.view_layer.objects.active = rig
bpy.ops.object.mode_set(mode='EDIT')
eb = rig.data.edit_bones.new('weapon_r')
eb.head = rest_grip
eb.tail = rest_grip + Vector((0, 0, .15 * K))
eb.parent = rig.data.edit_bones['hand_r']
for side, sign in [('l', 1), ('r', -1)]:
    eb = rig.data.edit_bones.new('tasset_' + side)
    eb.head = (sign * .092 * K, -.134 * K, .945 * K)
    eb.tail = eb.head + Vector((0, 0, -.16 * K))
    eb.parent = rig.data.edit_bones['pelvis']
bpy.ops.object.mode_set(mode='OBJECT')
for obj in parts:
    if obj.name.startswith('Sword |'):
        group = obj.vertex_groups.get('hand_r')
        if group: group.name = 'weapon_r'
    if obj.name.startswith('R7 tasset |'):
        group = obj.vertex_groups.get('pelvis')
        if group: group.name = 'tasset_' + obj.name[-1]

def curve(t, keys):
    """C1 Hermite with authored holds; no pause at every in-between pose."""
    isvec = isinstance(keys[0][1], (tuple, list, Vector))
    val = lambda i: Vector(keys[i][1]) if isvec else keys[i][1]
    if t <= keys[0][0]: return val(0)
    if t >= keys[-1][0]: return val(-1)
    for i in range(len(keys) - 1):
        ta, tb = keys[i][0], keys[i + 1][0]
        if t > tb: continue
        v0, v1 = val(i), val(i + 1)
        m0 = (v1 - val(i - 1)) / (tb - keys[i - 1][0]) if i else v0 * 0
        m1 = (val(i + 2) - v0) / (keys[i + 2][0] - ta) if i + 2 < len(keys) else v1 * 0
        near = lambda x, y: (x-y).length < 1e-8 if isvec else abs(x-y) < 1e-8
        if near(v0, v1): return v0
        if i and near(val(i - 1), v0): m0 = v0 * 0
        if i + 2 < len(keys) and near(v1, val(i + 2)): m1 = v1 * 0
        u = (t - ta) / (tb - ta)
        return (2*u**3-3*u*u+1)*v0 + (u**3-2*u*u+u)*(tb-ta)*m0 + (-2*u**3+3*u*u)*v1 + (u**3-u*u)*(tb-ta)*m1

def rot(x=0, y=0, z=0):
    return Euler((x, y, z), 'XYZ').to_matrix()

def absolute(name, origin, rotation):
    bone = rig.data.bones[name]
    rig.pose.bones[name].matrix = Matrix.Translation(origin) @ rotation.to_4x4() @ bone.matrix_local.to_3x3().to_4x4()
    bpy.context.view_layer.update()

def aim(name, origin, direction, front=None, twist=0):
    bone = rig.data.bones[name]
    src = (bone.tail_local-bone.head_local).normalized()
    dst = direction.normalized()
    q = src.rotation_difference(dst)
    if front is not None:
        f0 = Vector((0, -1, 0)); f0 = q @ (f0-src*f0.dot(src)).normalized()
        f1 = Vector(front); f1 = (f1-dst*f1.dot(dst)).normalized()
        q = Quaternion(dst, math.atan2(dst.dot(f0.cross(f1)), f0.dot(f1))) @ q
    if twist: q = Quaternion(dst, twist) @ q
    absolute(name, origin, q.to_matrix())

def ik(start, target, upper, lower, pole):
    la, lb = [rig.data.bones[n].length for n in [upper, lower]]
    v = target-start; distance = v.length; axis = v.normalized()
    length = max(abs(la-lb)+.001*K, min(la+lb-.004*K, distance))
    end = start+axis*length
    along = (la*la-lb*lb+length*length)/(2*length)
    bend = pole-start; bend = (bend-axis*bend.dot(axis)).normalized()
    return start+axis*along+bend*math.sqrt(max(0, la*la-along*along)), end, abs(distance-length)

def step_turn(t, keys):
    """Keep each foot planted between actual alternating circular steps."""
    angle = curve(t, keys)
    lift = 0
    for (ta, va), (tb, vb) in zip(keys, keys[1:]):
        if ta <= t <= tb and abs(va-vb) > .01:
            lift = .16 * math.sin(math.pi*(t-ta)/(tb-ta))**1.5
    return angle, lift

def pose(clip, t):
    for b in rig.pose.bones:
        b.matrix_basis = base_local.get(b.name, Matrix.Identity(4))
        b.rotation_mode = 'QUATERNION'
    bpy.context.view_layer.update()
    shift = Vector((0, 0, 0)); yaw = 0; lean = 0; coil = 0; roll = 0
    f = {s: feet0[s].copy() for s in ['l', 'r']}
    fy = {'r': math.radians(-60), 'l': math.radians(8)}
    wrist_local = (wrists0['r']-P0)/K
    blade = blade0.copy()
    left_offset = Vector((0, 0, 0))
    drop = 0
    if clip == 'idle':
        shift.z = .006*math.sin(t*math.tau)
        lean = .012*math.sin(t*math.tau)
    elif clip == 'walk':
        q = math.tau*t
        shift = Vector((.018*math.sin(q), -.015, .070+.027*math.cos(2*q)))
        lean = .27; coil = -.14*math.cos(q); yaw = .10*math.cos(q)
        for side, sgn, off in [('r', -1, 0), ('l', 1, math.pi)]:
            v = q+off
            f[side] = Vector((sgn*.115, -.04+.38*math.cos(v), .067+.25*max(0, math.sin(v))**1.2))*K
            fy[side] = sgn*.07
        wrist_local = Vector((-.23, -.16+.17*math.cos(q), .25+.025*math.sin(q)))
        left_offset = Vector((-.04, -.22*math.cos(q), .025*math.sin(q)))
        blade = Vector((.16, -.62, .77))
    elif clip == 'attack1':
        shift = curve(t, [(0,(0,0,0)),(.21,(-.025,.035,.025)),(.39,(.065,-.075,-.055)),(.53,(.12,-.13,-.09)),(.70,(.09,-.11,-.065)),(1,(0,0,0))])
        yaw = curve(t, [(0,0),(.24,-.50),(.34,-.34),(.53,.62),(.70,.70),(1,0)])
        coil = curve(t, [(0,0),(.24,-.38),(.36,-.29),(.53,.35),(.70,.33),(1,0)])
        lean = curve(t, [(0,0),(.24,-.06),(.50,.32),(.70,.26),(1,0)])
        wrist_local = curve(t, [(0,tuple(wrist_local)),(.22,(-.30,-.08,.62)),(.32,(-.31,-.23,.63)),(.46,(-.14,-.48,.23)),(.60,(.10,-.37,.18)),(.74,(.18,-.22,.17)),(1,tuple(wrist_local))])
        blade = curve(t, [(0,tuple(blade0)),(.10,(.06,0,1)),(.22,(.78,.05,.64)),(.28,(.90,.10,.30)),(.37,(-.65,-.30,-.70)),(.47,(-.50,-.75,-.30)),(.60,(.65,-.70,-.25)),(.74,(.80,.30,.30)),(1,tuple(blade0))])
        f['l'] += curve(t, [(0,(0,0,0)),(.12,(0,0,0)),(.24,(.07,-.09,.14)),(.36,(.15,-.20,0)),(.72,(.15,-.20,0)),(.86,(.06,-.08,.09)),(1,(0,0,0))])*K
        fy['r'] += curve(t, [(0,0),(.23,-.12),(.58,.52),(.74,.52),(1,0)])
        fy['l'] += curve(t, [(0,0),(.23,-.13),(.58,.42),(.74,.42),(1,0)])
        left_offset = curve(t, [(0,(0,0,0)),(.25,(-.035,-.03,.04)),(.53,(.01,.015,-.005)),(1,(0,0,0))])
    elif clip in ['attack2', 'cast']:
        if clip == 'attack2':
            yaw = curve(t, [(0,0),(.13,-.18),(.27,-1.35),(.43,-2.85),(.60,-4.45),(.80,-math.tau),(1,-math.tau)])
            shift = curve(t, [(0,(0,0,0)),(.23,(-.025,.015,.085)),(.45,(.025,0,.07)),(.66,(-.04,-.075,-.075)),(.83,(-.025,-.02,-.025)),(1,(0,0,0))])
            lean = curve(t, [(0,0),(.25,-.12),(.42,-.02),(.65,.34),(.8,.17),(1,0)])
            wrist_local = curve(t, [(0,tuple(wrist_local)),(.22,(-.22,-.13,.67)),(.38,(-.13,-.08,.78)),(.50,(-.15,-.25,.62)),(.65,(-.28,-.52,.17)),(.80,(-.29,-.31,.13)),(1,tuple(wrist_local))])
            blade = curve(t, [(0,tuple(blade0)),(.24,(.02,.28,.97)),(.40,(.03,.04,1)),(.54,(-.25,-.86,.44)),(.67,(-.50,-.79,-.26)),(.83,(.38,-.38,.83)),(1,tuple(blade0))])
        else:
            yaw = curve(t, [(0,0),(.16,-.50),(.31,-2.0),(.46,-3.10),(.61,-4.30),(.82,-math.tau),(1,-math.tau)])
            shift = curve(t, [(0,(0,0,0)),(.24,(-.02,.015,.095)),(.40,(-.02,0,.10)),(.63,(-.045,-.09,-.10)),(.90,(-.035,-.07,-.09)),(1,(0,0,0))])
            lean = curve(t, [(0,0),(.28,-.15),(.43,-.12),(.64,.36),(.90,.34),(1,0)])
            wrist_local = curve(t, [(0,tuple(wrist_local)),(.23,(-.19,-.16,.61)),(.39,(-.16,-.11,.71)),(.47,(-.17,-.12,.69)),(.64,(-.27,-.47,.19)),(.91,(-.28,-.41,.14)),(1,tuple(wrist_local))])
            blade = curve(t, [(0,tuple(blade0)),(.25,(-.04,.11,.99)),(.39,(.02,.02,1)),(.47,(.02,.02,1)),(.64,(-.19,-.96,-.20)),(.91,(.12,-.93,-.34)),(1,tuple(blade0))])
            left_offset = Vector((.02, -.015, .05*math.sin(math.pi*t)))
        coil = .10*math.sin(math.tau*t)
        for side, keys in [
            ('r',[(0,0),(.08,0),(.23,-1.55),(.38,-1.55),(.59,-4.45),(.72,-4.45),(.89,-math.tau),(1,-math.tau)]),
            ('l',[(0,0),(.18,0),(.39,-2.8),(.55,-2.8),(.78,-5.94),(.91,-math.tau),(1,-math.tau)])]:
            angle, lift = step_turn(t, keys)
            f[side] = rot(z=angle) @ feet0[side]
            f[side].z += lift*K
            fy[side] += angle
    elif clip == 'die':
        # Source: stagger, knees fold, then collapse forward; final pose held.
        drop = curve(t, [(0,0),(.38,0),(.59,.15),(.77,.75),(.90,1),(1,1)])
        kneel=curve(t,[(0,0),(.12,.035),(.30,.16),(.50,.23),(.63,.23),(.90,0),(1,0)])
        shift = Vector((-.015*math.sin(math.pi*t), -.16*drop-.18*kneel*(1-drop), -.49*drop-kneel*(1-drop)))
        lean = 1.56*drop+.8*kneel*(1-drop)-.04*math.sin(math.pi*t)
        yaw = .08*drop
        wrist_local = curve(t, [(0,tuple(wrist_local)),(.24,(-.30,-.31,.24)),(.56,(-.32,-.25,.18)),(.90,(-.34,-.04,.02)),(1,(-.34,-.04,.02))])
        blade = curve(t, [(0,tuple(blade0)),(.27,(-.55,-.72,.28)),(.62,(-.74,-.65,.08)),(.90,(-.76,-.65,.015)),(1,(-.76,-.65,.015))])
        for side, sign in [('r',-1),('l',1)]:
            end = Vector((sign*.22, .51 if side=='r' else .43, .067))*K
            f[side] = feet0[side].lerp(end,drop)
            fy[side] = fy[side]*(1-drop) + sign*.10*drop

    hipR = rot(x=lean if clip=='die' else lean*.33, y=roll, z=yaw)
    chestDelta = rot(x=lean, y=roll, z=yaw+coil)
    pelvis = P0+shift*K
    # The planted shoes are constraints. Lower the pelvis to a reachable squat
    # before solving legs, rather than lifting a planted foot to hide overreach.
    for side in ['l','r']:
        offset=hipR @ (base['thigh_'+side].translation-P0)
        horizontal=Vector((pelvis.x+offset.x-f[side].x,pelvis.y+offset.y-f[side].y,0)).length
        reach=sum(rig.data.bones[n+'_'+side].length for n in ['thigh','calf'])-.010*K
        assert horizontal<reach,(clip,t,'Footprint wider than leg reach')
        pelvis.z=min(pelvis.z,f[side].z+math.sqrt(reach*reach-horizontal*horizontal)-offset.z)
    absolute('pelvis', pelvis, hipR @ deform['pelvis'].to_3x3())
    for name, fraction in [('spine_01',.45), ('spine_02',.75), ('spine_03',1)]:
        origin = rig.pose.bones[name].head.copy()
        absolute(name, origin, rot(x=lean*fraction, y=roll, z=yaw+coil*fraction) @ deform[name].to_3x3())
    for name, factor in [('neck_01',.58),('head',.53)]:
        absolute(name,rig.pose.bones[name].head.copy(),rot(x=lean*factor if clip!='die' else lean, z=yaw+coil*.4) @ deform[name].to_3x3())

    target_miss = {'wrist':0.0, 'ankle':0.0}
    for side, sign in [('r',-1),('l',1)]:
        thigh, calf = 'thigh_'+side, 'calf_'+side
        hip = rig.pose.bones[thigh].head.copy()
        footfront = rot(z=fy[side]) @ Vector((0,-1,0))
        pole=hip+footfront*.55*K+Vector((sign*.12,0,-.35))*K
        knee_front=footfront
        if clip=='die':
            pole=pole.lerp(hip+Vector((sign*.12,.20,.85))*K,drop)
            knee_front=(footfront*(1-drop)+Vector((0,0,-1))*drop).normalized()
        knee, ankle, miss = ik(hip,f[side],thigh,calf,pole)
        target_miss['ankle'] = max(target_miss['ankle'],miss)
        aim(thigh,hip,knee-hip,knee_front); aim(calf,knee,ankle-knee,knee_front)
        absolute('foot_'+side,ankle,rot(z=fy[side]))
        # Hinged plates inherit the hip with limited thigh following, no rubber.
        td = rig.pose.bones[thigh].matrix @ rig.data.bones[thigh].matrix_local.inverted()
        relative = hipR.inverted() @ td.to_3x3() @ deform[thigh].to_3x3().inverted()
        hinge = Matrix.Identity(3).to_quaternion().slerp(relative.to_quaternion(),.55).to_matrix()
        bone=rig.data.bones['tasset_'+side]
        hinge_origin=rig.pose.bones['pelvis'].matrix @ rig.data.bones['pelvis'].matrix_local.inverted() @ bone.head_local
        absolute(bone.name,hinge_origin,hipR @ hinge @ deform['pelvis'].to_3x3())

    chest = rig.pose.bones['spine_03'].head.copy()
    chest0 = base['spine_03'].translation
    left = chest + chestDelta @ (wrists0['l']-chest0 + left_offset*K)
    right = pelvis + rot(z=yaw) @ wrist_local*K
    if clip=='die':
        right = rig.pose.bones['upperarm_r'].head + curve(t, [(0,tuple((wrists0['r']-base['upperarm_r'].translation)/K)),(.55,(-.29,-.19,-.30)),(.90,(-.29,-.35,-.02)),(1,(-.29,-.35,-.02))])*K
        left = rig.pose.bones['upperarm_l'].head + curve(t, [(0,tuple((wrists0['l']-base['upperarm_l'].translation)/K)),(.55,(.25,-.20,-.27)),(.90,(.27,-.24,-.02)),(1,(.27,-.24,-.02))])*K
    for side, sign, goal in [('r',-1,right),('l',1,left)]:
        upper, lower, hand = 'upperarm_'+side,'lowerarm_'+side,'hand_'+side
        shoulder=rig.pose.bones[upper].head.copy()
        pole=shoulder+rot(z=yaw+coil) @ Vector((sign*.28,.15,-.43))*K
        if clip=='die':pole=pole.lerp(shoulder+Vector((sign*.60,0,-.05))*K,drop)
        elbow,wrist,miss=ik(shoulder,goal,upper,lower,pole)
        target_miss['wrist']=max(target_miss['wrist'],miss)
        aim(upper,shoulder,elbow-shoulder);aim(lower,elbow,wrist-elbow)
        handdir=(wrist-elbow).normalized()
        if side=='l' and clip not in ['walk','die']:
            forward=rot(z=yaw+coil) @ Vector((0,-1,0))
            handdir=(forward*.72+handdir*.28).normalized();handdir.z=max(.02,handdir.z)
        aim(hand,wrist,handdir,twist=math.radians(sign*32))

    # Sword stays centered in the curled fingers while its blade follows the cut.
    h=rig.pose.bones['hand_r']
    grip=h.head+(h.tail-h.head).normalized()*.055*K
    localQ=blade0.rotation_difference(blade.normalized())
    weaponR=rot(z=yaw) @ localQ.to_matrix() @ deform['hand_r'].to_3x3()
    absolute('weapon_r',grip,weaponR)
    bpy.context.view_layer.update()
    return target_miss

# Bake quaternion channels on the human skeleton. Cyclic clips include an exact
# duplicate endpoint; the actual preview samples exclude that duplicate frame.
definition=json.loads(Path('images/sprites/knight/knight.json').read_text())
actions={};clips={};metrics={}
scene.render.fps=30
for name in ['idle','walk','attack1','attack2','cast','die']:
    duration=definition['anims'][name]['frames']/definition['anims'][name]['fps']
    frames=round(duration*30)+1
    rig.animation_data_create();rig.animation_data.action=None
    action=bpy.data.actions.new(name);action.use_fake_user=True
    rig.animation_data.action=action
    misses={'wrist':0,'ankle':0}
    previous_quaternions={}
    for frame in range(1,frames+1):
        scene.frame_set(frame)
        err=pose(name,(frame-1)/(frames-1))
        for key in misses:misses[key]=max(misses[key],err[key])
        for bone in rig.pose.bones:
            if bone.name in previous_quaternions and bone.rotation_quaternion.dot(previous_quaternions[bone.name])<0:
                bone.rotation_quaternion.negate()
            previous_quaternions[bone.name]=bone.rotation_quaternion.copy()
            for prop in ['location','rotation_quaternion','scale']:
                bone.keyframe_insert(data_path=prop,frame=frame,group=bone.name)
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for fc in bag.fcurves:
                    for key in fc.keyframe_points:key.interpolation='LINEAR'
    actions[name]=action
    rendered=[1+round(i*duration*30/15) for i in range(15)]
    clips[name]={'frames':frames,'fps':30,'duration':duration,'loop':name in ['idle','walk'],'renderedFrames':rendered,'sourceFrames':15,'sourceFps':definition['anims'][name]['fps']}
    metrics[name]={'targetMiss':misses}
    print('ACTION_BAKED',name,frames,misses,flush=True)

# Normalize the authoring weights to the same four-influence budget exported
# to glTF, so preview deformation and delivered runtime deformation agree.
for obj in parts:
    if any(sum(g.weight>1e-6 for g in v.groups)>4 for v in obj.data.vertices):
        bpy.ops.object.select_all(action='DESELECT');obj.select_set(True)
        bpy.context.view_layer.objects.active=obj
        bpy.ops.object.vertex_group_limit_total(limit=4)
        bpy.ops.object.vertex_group_normalize_all(lock_active=False)
assert all(sum(g.weight>1e-6 for g in vert.groups)<=4 for obj in parts for vert in obj.data.vertices),'Authoring/runtime weight budget differs'

# One skinned runtime mesh, while the authoring file retains separate plates and
# the hidden full MakeHuman anatomy. Every copy preserves existing vertex groups.
rig.animation_data.action=actions['idle'];scene.frame_set(1)
bpy.ops.object.select_all(action='DESELECT')
copies=[]
for o in parts:
    cp=o.copy();cp.data=o.data.copy();scene.collection.objects.link(cp);cp.select_set(True);copies.append(cp)
bpy.context.view_layer.objects.active=copies[0]
bpy.ops.object.join();runtime=copies[0];runtime.name='SilverKnight_MakeHuman_R8_Runtime'
assert len(runtime.data.materials)==1
triangles=sum(len(f.vertices)-2 for f in runtime.data.polygons)
assert triangles<=12000

for track in list(rig.animation_data.nla_tracks):rig.animation_data.nla_tracks.remove(track)
for name,action in actions.items():
    track=rig.animation_data.nla_tracks.new();track.name=name
    strip=track.strips.new(name,1,action);strip.action_frame_start=1;strip.action_frame_end=clips[name]['frames'];track.mute=True
rig.animation_data.action=None
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);runtime.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.export_scene.gltf(filepath=str(OUT/'knight_animated.glb'),export_format='GLB',use_selection=True,
    export_animations=True,export_animation_mode='ACTIONS',export_force_sampling=True,
    export_frame_range=False,export_skins=True,export_yup=True,export_apply=False,
    export_anim_slide_to_zero=True)
runtime.hide_render=True;runtime.hide_set(True)
rig.animation_data.action=actions['idle'];scene.frame_set(1)
scene.frame_start=1;scene.frame_end=clips['idle']['frames']
rig['review_stage']='R8 six MakeHuman full-body actions; separate from frozen R7 static candidate'
scene.camera.location=Vector((-3,-7.5,6.7))*K
scene.camera.rotation_euler=(Vector((0,-.02,.77))*K-scene.camera.location).to_track_quat('-Z','Y').to_euler()
scene.camera.data.ortho_scale=3.35*K
scene.render.resolution_x=scene.render.resolution_y=480;scene.render.resolution_percentage=100
scene.cycles.samples=16;scene.cycles.use_denoising=True
try:
    prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='CUDA';prefs.get_devices()
    for device in prefs.devices:device.use=device.type=='CUDA'
    scene.cycles.device='GPU' if any(d.use for d in prefs.devices) else 'CPU'
except Exception:scene.cycles.device='CPU'
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'knight_animated.blend'))

manifest={'revision':8,'stage':'six-action preview candidate','sourceRevision':7,'sourceFilesSha256':source_hashes,
    'toolchain':'MakeHuman + official MPFB + Blender','blender':bpy.app.version_string,
    'bones':len(rig.data.bones),'triangles':triangles,'runtime':{'meshes':1,'materials':1,'textures':2,'paletteMapSize':[40,4]},
    'clips':clips,'previewPrefix':'knight_makehuman_r8','front':'-Y','up':'Z',
    'sourceAndModelMirrored':False,'referenceDirection':'SE','shield':False,'bladeTrails':False,
    'limits':'Candidate for visual review; not installed into the game, no live GPU FPS measurement.'}
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(PREVIEW/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')

# Reopen the delivered Blend: inspect/render saved Actions, not solver state.
bpy.ops.wm.open_mainfile(filepath=str(OUT/'knight_animated.blend'))
rig=bpy.data.objects['MakeHuman_Knight_Rig'];scene=bpy.context.scene
visible=[o for o in scene.objects if o.type=='MESH' and not o.hide_render]
projection={};report={'result':'PASS','bones':len(rig.data.bones),'triangles':triangles,'clips':metrics}
for name,clip in clips.items():
    rig.animation_data.action=bpy.data.actions[name]
    samples=[];floor={};contacts={};bounds={};wrist=[];world_bounds={};chest_angles=[];bone_endpoints=[];torso_floor=[]
    folder=PREVIEW/name;folder.mkdir(exist_ok=True)
    for frame in range(1,clip['frames']+1):
        scene.frame_set(frame);bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get()
        points=[];worldpoints=[];low=100;torso_low=100
        for o in visible:
            ev=o.evaluated_get(deps)
            for v in ev.data.vertices:
                pt=ev.matrix_world@v.co;low=min(low,pt.z);worldpoints.append(pt)
                if o.name.startswith(('R7 cuirass','R7 plackart','R7 sallet')):torso_low=min(torso_low,pt.z)
                points.append(world_to_camera_view(scene,scene.camera,pt))
        floor[frame]=low
        torso_floor.append(torso_low)
        world_bounds[frame]=[min(p[i] for p in worldpoints) for i in range(3)]+[max(p[i] for p in worldpoints) for i in range(3)]
        bounds[frame]=[min(q.x for q in points)*480,min(1-q.y for q in points)*480,max(q.x for q in points)*480,max(1-q.y for q in points)*480]
        for b in rig.pose.bones:assert all(math.isfinite(x) for row in b.matrix for x in row),(name,frame,b.name)
        lf=rig.pose.bones['hand_l'];fa=rig.pose.bones['lowerarm_l']
        fist=(lf.tail-lf.head).normalized();forearm=(fa.tail-fa.head).normalized()
        chestR=rig.pose.bones['spine_03'].matrix.to_3x3()@rig.data.bones['spine_03'].matrix_local.to_3x3().inverted()
        front=chestR@Vector((0,-1,0))
        chest_angles.append(math.atan2(front.x,-front.y))
        if frame in [1,clip['frames']]:bone_endpoints.append({b.name:b.matrix.copy() for b in rig.pose.bones})
        wrist.append({'forearmDot':fist.dot(forearm),'forwardDot':fist.dot(front),'z':fist.z})
        samples.append({'pelvis':rig.pose.bones['pelvis'].matrix.copy(),'chest':rig.pose.bones['spine_03'].matrix.copy(),
                        'feet':[rig.pose.bones['foot_'+s].head.copy() for s in ['l','r']]})
        contacts[frame]=[]
        for side in ['l','r']:
            bone=rig.data.bones['foot_'+side];D=rig.pose.bones[bone.name].matrix@bone.matrix_local.inverted();ends=[];zs=[]
            for y in [.065,-.207]:
                pt=D@Vector((bone.head_local.x,bone.head_local.y+y*K,.012*K));zs.append(pt.z);pt.z=0
                q=world_to_camera_view(scene,scene.camera,pt);ends.append([q.x*480,(1-q.y)*480])
            contacts[frame].append({'ends':ends,'contact':max(zs)<.065*K})
        assert bounds[frame][0]>2 and bounds[frame][1]>2 and bounds[frame][2]<478 and bounds[frame][3]<478,(name,frame,'Clipped',bounds[frame])
        if name=='idle' and frame==1:
            head=next(o for o in visible if o.name.startswith('R7 sallet | open-faced'))
            ev=head.evaluated_get(deps)
            hy=min((1-world_to_camera_view(scene,scene.camera,ev.matrix_world@v.co).y)*480 for v in ev.data.vertices)
            bottom=max(pt['ends'][1][1] for pt in contacts[frame])
            anchor=world_to_camera_view(scene,scene.camera,Vector((0,0,0)))
            projection={'anchorPixels':[anchor.x*480,(1-anchor.y)*480],'standingBodyHeightPixels':bottom-hy,'headTopPixels':hy,'resolution':480,'method':'Fixed camera, scale and world-origin across every action; SE, no mirroring'}
        if a.render!='none' and (not a.render_clips or name in a.render_clips) and frame in (clip['renderedFrames'] if a.render=='all' else [1,clip['renderedFrames'][7],clip['renderedFrames'][-1]]):
            scene.render.filepath=str(folder/f'{frame:03d}.png');bpy.ops.render.render(write_still=True)
            print('MOTION_PREVIEW',name,frame,flush=True)
    first=samples[0]
    whole={'pelvisTravelMeters':max((s['pelvis'].translation-first['pelvis'].translation).length for s in samples),
           'pelvisRotationRadians':max(s['pelvis'].to_quaternion().rotation_difference(first['pelvis'].to_quaternion()).angle for s in samples),
           'chestRotationRadians':max(s['chest'].to_quaternion().rotation_difference(first['chest'].to_quaternion()).angle for s in samples),
           'footTravelMeters':max((s['feet'][i]-first['feet'][i]).length for s in samples for i in range(2))}
    whole['signedChestTurnRadians']=sum(math.atan2(math.sin(b-a),math.cos(b-a)) for a,b in zip(chest_angles,chest_angles[1:]))
    endpoint_error=max(abs(bone_endpoints[0][b][i][j]-bone_endpoints[1][b][i][j]) for b in bone_endpoints[0] for i in range(4) for j in range(4))
    if clip['loop']:assert endpoint_error<1e-4,(name,'Loop seam',endpoint_error)
    assert min(floor.values())>=-.012,(name,'Geometry crosses floor',min(floor.values()))
    if name in ['attack2','cast']:assert abs(whole['signedChestTurnRadians'])>5.9,(name,'Incomplete full-body turn')
    report['clips'][name].update(minimumZ=min(floor.values()),perFrameFloor=floor,worldBounds=world_bounds,wholeBody=whole,previewContacts=contacts,bounds=bounds,
        loopEndpointMatrixError=endpoint_error if clip['loop'] else None,finalTorsoMinimumZ=torso_floor[-1],
        offHand={'minimumForearmDot':min(v['forearmDot'] for v in wrist),'minimumForwardDot':min(v['forwardDot'] for v in wrist),'minimumFistZ':min(v['z'] for v in wrist)})
    print('MOTION_VALIDATED',name,json.dumps({**whole,'minZ':min(floor.values())}),flush=True)
(PREVIEW/'sprite-projection.json').write_text(json.dumps(projection,indent=2))

# Reimport the runtime binary and compare every saved pose to the authoring
# geometry. This catches mismatched weights, armature transforms or lost clips.
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.render.fps=30
bpy.ops.import_scene.gltf(filepath=str(OUT/'knight_animated.glb'))
runtime_rig=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
runtime_meshes=[o for o in bpy.context.scene.objects if o.type=='MESH' and
    any(mod.type=='ARMATURE' and mod.object==runtime_rig for mod in o.modifiers)]
assert len(runtime_meshes)==1 and len(runtime_rig.data.bones)==56
assert {act.name for act in bpy.data.actions}==set(clips)
runtime_metrics={}
for name,clip in clips.items():
    runtime_rig.animation_data.action=bpy.data.actions[name]
    errors=[];floors=[]
    for frame in range(1,clip['frames']+1):
        # glTF starts at t=0; the authoring Actions start at Blender frame 1.
        bpy.context.scene.frame_set(frame-1);bpy.context.view_layer.update();dep=bpy.context.evaluated_depsgraph_get()
        ev=runtime_meshes[0].evaluated_get(dep);points=[ev.matrix_world@v.co for v in ev.data.vertices]
        box=[min(p[i] for p in points) for i in range(3)]+[max(p[i] for p in points) for i in range(3)]
        error=max(abs(x-y) for x,y in zip(box,report['clips'][name]['worldBounds'][frame]))
        errors.append(error);floors.append(box[2])
    assert max(errors)<.003,(name,'GLB deformation differs from delivered Blend',max(errors))
    assert min(floors)>=-.012,(name,'Runtime crosses floor')
    runtime_metrics[name]={'maxAuthoringBoundsDifference':max(errors),'minimumZ':min(floors)}
report['runtimeGlbReimport']={'result':'PASS','allFrames':True,'clips':runtime_metrics}
(PREVIEW/'validation.json').write_text(json.dumps(report,indent=2))
assert all(hashlib.sha256((SOURCE/n).read_bytes()).hexdigest()==h for n,h in source_hashes.items()),'R7 changed'
print('MAKEHUMAN_MOTION_READY',triangles,flush=True)
