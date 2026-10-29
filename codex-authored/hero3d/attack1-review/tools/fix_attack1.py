"""Author a two-handed overhead chop on the existing Sunbrand Knight rig.

Blender --background --python fix_attack1.py -- input.glb output-folder
Only Attack1 joint curves are replaced. Armor is partitioned into rigid panels.
The candidate remains separate from the in-game asset until visual approval.
"""
import bpy
import json
import math
import sys
import numpy as np
from pathlib import Path
from mathutils import Matrix, Vector

src, dst = sys.argv[sys.argv.index('--') + 1:][:2]
out = Path(dst)
out.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
scene = bpy.context.scene
scene.render.fps = 96
arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
body = next(o for o in bpy.data.objects if o.type == 'MESH' and o.vertex_groups)
for o in list(bpy.data.objects):
    if o.type == 'MESH' and not o.vertex_groups:
        bpy.data.objects.remove(o, do_unlink=True)
bpy.context.view_layer.objects.active=arm
arm.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
for side in ('Left','Right'):
    eb=arm.data.edit_bones.new(side+'ShoulderPlate')
    eb.head=arm.data.edit_bones[side+'Arm'].head
    eb.tail=eb.head+Vector((0,0,10))
    eb.parent=arm.data.edit_bones['Spine']
bpy.ops.object.mode_set(mode='OBJECT')
sys.path.insert(0,str(Path(__file__).parent))
from rigid_armor import partition
parts,panels=partition(body,arm)
bones = sorted(arm.data.bones, key=lambda b: len(b.parent_recursive))
rest = {b.name: b.matrix_local.copy() for b in bones}
parents = {b.name: b.parent.name if b.parent else None for b in bones}
local = {n: (rest[p].inverted() @ m if (p := parents[n]) else m.copy()) for n, m in rest.items()}
ad = arm.animation_data
for a in bpy.data.actions:
    a.use_fake_user = True
    # Dense 96 Hz baking preserves the two grip contacts between game frames.
    # Rescale retained action keys as well, so their duration in seconds stays unchanged.
    for layer in a.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for fc in bag.fcurves:
                    for key in fc.keyframe_points:
                        key.co.x *= 4
                        key.handle_left.x *= 4
                        key.handle_right.x *= 4
    if a.use_frame_range:
        a.frame_start *= 4
        a.frame_end *= 4
old = bpy.data.actions['Attack1']
ad.action = old
scene.frame_set(0)
original = {pb.name: pb.matrix.copy() for pb in arm.pose.bones}
ad.action = None
bpy.data.actions.remove(old)
action = bpy.data.actions.new('Attack1')
action.use_fake_user = True
ad.action = action
for pb in arm.pose.bones:
    pb.rotation_mode = 'QUATERNION'


def smooth(t):
    t = max(0., min(1., t))
    return t * t * (3 - 2 * t)


def curve(frame, points):
    for (f0, a), (f1, b) in zip(points, points[1:]):
        if frame <= f1:
            t = smooth((frame - f0) / (f1 - f0))
            return a + (b - a) * t
    return points[-1][1]


def transform(pos, rot):
    return Matrix.Translation(Vector(pos)) @ rot.to_4x4()


def rotate_chain(pose, name, axis, deg):
    rot = Matrix.Rotation(math.radians(deg), 4, axis)
    pivot = pose[name].translation
    delta = Matrix.Translation(pivot) @ rot @ Matrix.Translation(-pivot)
    for b in bones:
        if b.name == name or name in [p.name for p in b.parent_recursive]:
            pose[b.name] = delta @ pose[b.name]


def orient(restmat, olddir, newdir, position):
    q = olddir.normalized().rotation_difference(newdir.normalized())
    return transform(position, q.to_matrix() @ restmat.to_3x3())


def limb(pose, upper, lower, end, target, pole):
    """Analytic two-bone IK, using joint spacing rather than imported display tails."""
    shoulder = pose[upper].translation.copy()
    l1 = (rest[lower].translation - rest[upper].translation).length
    l2 = (rest[end].translation - rest[lower].translation).length
    reach = Vector(target) - shoulder
    distance = reach.length
    if not abs(l1 - l2) + .01 < distance < l1 + l2 - .01:
        raise ValueError(f'Frame {f}: unreachable {upper}: {distance:.3f}, range {abs(l1-l2):.3f}..{l1+l2:.3f}, shoulder {shoulder}, target {target}')
    direction = reach.normalized()
    bend = Vector(pole) - shoulder
    bend -= direction * bend.dot(direction)
    bend.normalize()
    along = (l1*l1 - l2*l2 + distance*distance) / (2*distance)
    elbow = shoulder + direction * along + bend * math.sqrt(max(0., l1*l1 - along*along))
    pose[upper] = orient(rest[upper], rest[lower].translation-rest[upper].translation, elbow-shoulder, shoulder)
    pose[lower] = orient(rest[lower], rest[end].translation-rest[lower].translation, Vector(target)-elbow, elbow)
    return elbow


# Retain the original sword-to-right-glove transform: the fingers were authored on the hilt.
right_link = rest['Sword'].inverted() @ rest['RightHand']
# Calibrate the already curled left glove in its anatomical local frame.
# Its palm closes around this point, distinct from the wrist joint.
left_palm = Vector((1.5, 7.5, -1.0))
left_hilt_offset=-11.
print('RIGHT_LINK', [list(r) for r in right_link], flush=True)
report = {'revision':6,'fps':96,'contactTimeSec':26/24,'panels':panels,'samples':[]}


def arm_ik(pose,side,hand):
    """Pick an elbow on the fixed-length IK circle that keeps the wrist neutral.

    Forearm roll follows the glove, then only the smallest required bend is applied.
    No bone scale or joint translation is used to repair an unreachable pose.
    """
    upper,lower,end=side+'Arm',side+'ForeArm',side+'Hand'
    shoulder=pose[upper].translation.copy()
    wrist=hand.translation
    l1=(rest[lower].translation-rest[upper].translation).length
    l2=(rest[end].translation-rest[lower].translation).length
    reach=wrist-shoulder
    dist=reach.length
    if not abs(l1-l2)+.05<dist<l1+l2-.05:
        raise ValueError(f'Frame {f}: unreachable {upper} {dist:.2f}/{l1+l2:.2f}, S{shoulder}, W{wrist}')
    axis=reach.normalized()
    along=(l1*l1-l2*l2+dist*dist)/(2*dist)
    center=shoulder+axis*along
    radius=math.sqrt(max(0.,l1*l1-along*along))
    neutral=hand.to_3x3()@rest[end].to_3x3().inverted()@rest[lower].to_3x3()
    expected=(neutral@rest[lower].to_3x3().inverted()@(rest[end].translation-rest[lower].translation)).normalized()
    ideal=wrist-expected*l2-center
    bend=ideal-axis*ideal.dot(axis)
    if bend.length<.001:
        bend=Vector((1 if side=='Left' else -1,0,0))
        bend-=axis*bend.dot(axis)
    bend.normalize()
    elbow=center+bend*radius
    sign=1 if side=='Left' else -1
    # Avoid folding an elbow across the ribcage to gain a small wrist improvement.
    if elbow.x*sign<4:
        side_pole=Vector((sign*60,-12,145))-center
        side_pole-=axis*side_pole.dot(axis)
        blend=.45*smooth((4-elbow.x*sign)/8)*(1-strike)
        bend=bend.lerp(side_pole.normalized(),blend).normalized()
        elbow=center+bend*radius
    pose[upper]=orient(rest[upper],rest[lower].translation-rest[upper].translation,elbow-shoulder,shoulder)
    actual=(wrist-elbow).normalized()
    fore_rot=expected.rotation_difference(actual).to_matrix()@neutral
    pose[lower]=transform(elbow,fore_rot)
    pose[end]=hand
    deviation=(fore_rot@rest[lower].to_3x3().inverted()@rest[end].to_3x3()).to_quaternion().rotation_difference(hand.to_quaternion()).angle
    return min(math.degrees(deviation),360-math.degrees(deviation))


def sword_frame(angle,yaw,grip):
    a=math.radians(angle)
    yaw_mat=Matrix.Rotation(math.radians(yaw),3,'Z')
    axis=yaw_mat@Vector((0.,-math.sin(a),math.cos(a)))
    wide=yaw_mat@Vector((0.,math.cos(a),math.sin(a)))
    return transform(grip,Matrix((wide,axis,wide.cross(axis))).transposed())


# Use the actual blade vertices to place the edge at the floor, not a bone tail.
sword_part=next(o for o in parts if o.name=='Sword')
blade_local=[rest['Sword'].inverted()@arm.matrix_world.inverted()@sword_part.matrix_world@v.co for v in sword_part.data.vertices]
final_rotation=sword_frame(117,0,(0,0,0)).to_3x3()
contact_height=-min((final_rotation@p).z for p in blade_local)+.05
mirror=Matrix.Diagonal((1.,1.,-1.))
world_mirror=Matrix.Diagonal((-1.,1.,1.))
left_orientation_link=mirror@right_link.to_3x3()@rest['RightHand'].to_3x3().inverted()@world_mirror@rest['LeftHand'].to_3x3()
last_q = {}
left_roll=-80.
raw_poses=[]
for keyframe in range(229):
    f = keyframe / 4
    raised = curve(f, [(0,0.),(14,1.),(18,1.),(26,0.),(33,0.),(57,0.)])
    strike = curve(f, [(0,0.),(18,0.),(26,1.),(33,1.),(57,0.)])
    # A larger right-foot step lands before the blade; the rear foot stays planted.
    step = curve(f, [(0,0.),(11,0.),(23,1.),(38,1.),(57,0.)])
    lift = curve(f, [(0,0.),(11,0.),(17,1.),(23,0.),(38,0.),(46,1.),(57,0.)])
    wind=curve(f,[(0,0.),(12,1.),(16,1.),(24,0.),(57,0.)])
    hips = Vector((0.,-3.-15*step-12*strike,92+2*raised-8*step-26*strike))
    pose = {n: Matrix.Translation(hips-rest['Hips'].translation) @ m for n,m in rest.items()}
    rotate_chain(pose,'Hips','X',7*strike)
    rotate_chain(pose,'Hips','Z',-8*wind)
    rotate_chain(pose,'Spine02','X',5-13*raised+38*strike)
    rotate_chain(pose,'Spine02','Z',-22*wind)
    rotate_chain(pose,'neck','X',-12*strike)
    rotate_chain(pose,'Head','X',-5*strike)
    # Feet preserve their authored rest orientation; the forward knee tracks the toe.
    for side, ankle in [('Left',Vector((32.,28.,13.50))),
                        ('Right',Vector((-28.-4*step,-30.-42*step,13.11+10*lift)))]:
        limb(pose, side+'UpLeg', side+'Leg', side+'Foot', ankle,
             (ankle.x, ankle.y-75, 50))
        foot_yaw=24 if side=='Left' else -8
        pose[side+'Foot'] = transform(ankle,Matrix.Rotation(math.radians(foot_yaw),3,'Z')@rest[side+'Foot'].to_3x3())
        pose[side+'ToeBase'] = pose[side+'Foot'] @ local[side+'ToeBase']
    # Sword stays in a single vertical plane. Raised blade travels behind the head,
    # then accelerates through the front and settles with its actual tip on the floor.
    angle=curve(f,[(0,72.),(8,-45.),(14,-85.),(18,-25.),(26,117.),(33,117.),(57,72.)])
    yaw=curve(f,[(0,0.),(8,48.),(14,25.),(18,0.),(57,0.)])
    grip=Vector((curve(f,[(0,0.),(8,-26.),(14,-22.),(18,-4.),(26,0.),(33,0.),(57,0.)]),
                 curve(f,[(0,-35.),(8,-5.),(14,2.),(18,-5.),(20,-40.),(22,-70.),(26,-110.),(33,-110.),(57,-35.)]),
                 curve(f,[(0,120.),(8,145.),(14,163.),(18,172.),(20,145.),(22,100.),(24,64.),(26,contact_height),(33,contact_height),(57,120.)])))
    sword=sword_frame(angle,yaw,grip)
    sword_rot=sword.to_3x3()
    hand_r = sword @ right_link
    # Left hand holds the lower hilt, behind the right hand, with the palm facing in.
    left_contact = sword @ Vector((0.,left_hilt_offset,0.))
    # Both glove-to-hilt rotations stay fixed throughout the entire swing.
    left_rot=sword_rot@Matrix.Rotation(math.radians(left_roll),3,'Y')@left_orientation_link
    hand_l=transform(left_contact-left_rot@left_palm,left_rot)
    # Extend the hands as far forward as both real arm lengths permit. Preserve
    # the accepted body pose, blade angle, height and the two fixed grasp frames.
    # A smooth maximum approaches the reach boundary without locking the elbows.
    bounds=[]
    for side,hm in [('Right',hand_r),('Left',hand_l)]:
        s=pose[side+'Arm'].translation
        offset=hm.translation-grip
        length=(rest[side+'ForeArm'].translation-rest[side+'Arm'].translation).length+(rest[side+'Hand'].translation-rest[side+'ForeArm'].translation).length-.4
        dx=hm.translation.x-s.x;dz=hm.translation.z-s.z
        remaining=length*length-dx*dx-dz*dz
        if remaining<=0:raise ValueError(f'Hand height unreachable at {f}: {side}')
        bounds.append(s.y-offset.y-math.sqrt(remaining))
    limit=max(bounds)
    reachable_y=.5*(grip.y+limit+math.sqrt((grip.y-limit)**2+.36))
    shift=Vector((0,reachable_y-grip.y,0))
    grip+=shift;sword.translation+=shift;hand_r.translation+=shift;hand_l.translation+=shift;left_contact+=shift
    wrist_angles={side:arm_ik(pose,side,hm) for side,hm in [('Right',hand_r),('Left',hand_l)]}
    for side in ('Left','Right'):
        # Floating shoulder plate follows part of the upper-arm swing as a rigid object.
        inherited=pose[side+'ShoulderPlate']
        target=pose[side+'Arm'].to_3x3()@rest[side+'Arm'].to_3x3().inverted()@rest[side+'ShoulderPlate'].to_3x3()
        q=inherited.to_quaternion().slerp(target.to_quaternion(),.35)
        pose[side+'ShoulderPlate']=transform(pose[side+'Arm'].translation,q.to_matrix())
    pose['Sword'] = sword
    raw_poses.append({n:m.copy() for n,m in pose.items()})
    for b in bones:
        n, p = b.name, parents[b.name]
        basis = local[n].inverted() @ (pose[p].inverted() if p else Matrix.Identity(4)) @ pose[n]
        assert max(abs(s-1) for s in basis.to_scale())<.00001,(f,n,'scale')
        assert n=='Hips' or basis.translation.length<.001,(f,n,'joint translation',basis.translation)
        pb = arm.pose.bones[n]
        q = basis.to_quaternion()
        if n in last_q and q.dot(last_q[n]) < 0:
            q.negate()
        last_q[n] = q.copy()
        pb.location, pb.rotation_quaternion, pb.scale = basis.translation, q, basis.to_scale()
        for path in ('location','rotation_quaternion','scale'):
            pb.keyframe_insert(path, frame=keyframe, group=n)
    report['samples'].append({'frame':f,'grip':list(grip/100),
                              'leftContact':list(left_contact/100),
                              'leftPalmErrorM':(hand_l@left_palm-left_contact).length/100,'wristAnglesDeg':wrist_angles,'leftGripRollDeg':left_roll})

# The minimum-bend IK circle has an elbow-swivel singularity near the overhead
# transition. Smooth its angular branch before baking, keeping both joint lengths
# and the complete glove-to-hilt transform exact at every authored sample.
for side in ('Left','Right'):
    upper,lower,end=side+'Arm',side+'ForeArm',side+'Hand'
    l1=(rest[lower].translation-rest[upper].translation).length
    l2=(rest[end].translation-rest[lower].translation).length
    circles=[];angles=[]
    for pose in raw_poses:
        s=pose[upper].translation;w=pose[end].translation
        reach=w-s;distance=reach.length;axis=reach.normalized()
        a=(l1*l1-l2*l2+distance*distance)/(2*distance)
        center=s+axis*a;radius=math.sqrt(max(0,l1*l1-a*a))
        u=axis.cross(Vector((0,1,0))).normalized();v=axis.cross(u)
        delta=pose[lower].translation-center
        angles.append(math.atan2(delta.dot(v),delta.dot(u)))
        circles.append((center,radius,u,v))
    angles=np.unwrap(np.array(angles))
    kernel=np.exp(-.5*(np.arange(-8,9)/4.)**2);kernel/=kernel.sum()
    filtered=np.convolve(np.pad(angles,8,mode='edge'),kernel,mode='valid')
    for index,pose in enumerate(raw_poses):
        f=index/4
        amount=smooth(f/2)*smooth((57-f)/2)
        angle=float(angles[index]*(1-amount)+filtered[index]*amount)
        center,radius,u,v=circles[index]
        elbow=center+radius*(u*math.cos(angle)+v*math.sin(angle))
        shoulder=pose[upper].translation;hand=pose[end]
        pose[upper]=orient(rest[upper],rest[lower].translation-rest[upper].translation,elbow-shoulder,shoulder)
        neutral=hand.to_3x3()@rest[end].to_3x3().inverted()@rest[lower].to_3x3()
        expected=(neutral@rest[lower].to_3x3().inverted()@(rest[end].translation-rest[lower].translation)).normalized()
        actual=(hand.translation-elbow).normalized()
        fore_rot=expected.rotation_difference(actual).to_matrix()@neutral
        pose[lower]=transform(elbow,fore_rot)
        deviation=math.degrees((fore_rot@rest[lower].to_3x3().inverted()@rest[end].to_3x3()).to_quaternion().rotation_difference(hand.to_quaternion()).angle)
        report['samples'][index]['wristAnglesDeg'][side]=min(deviation,360-deviation)
        inherited=pose['Spine']@local[side+'ShoulderPlate']
        target=pose[upper].to_3x3()@rest[upper].to_3x3().inverted()@rest[side+'ShoulderPlate'].to_3x3()
        q=inherited.to_quaternion().slerp(target.to_quaternion(),.35)
        pose[side+'ShoulderPlate']=transform(shoulder,q.to_matrix())
last_q={}
for index,pose in enumerate(raw_poses):
    for b in bones:
        n,p=b.name,parents[b.name]
        basis=local[n].inverted()@(pose[p].inverted() if p else Matrix.Identity(4))@pose[n]
        assert max(abs(s-1) for s in basis.to_scale())<.00001,(index,n,'scale')
        assert n=='Hips' or basis.translation.length<.001,(index,n,'translation')
        pb=arm.pose.bones[n];q=basis.to_quaternion()
        if n in last_q and q.dot(last_q[n])<0:q.negate()
        last_q[n]=q.copy()
        pb.location,pb.rotation_quaternion,pb.scale=basis.translation,q,basis.to_scale()
        for path in ('location','rotation_quaternion','scale'):pb.keyframe_insert(path,frame=index,group=n)
action.use_frame_range = True
action.frame_start, action.frame_end = 0, 228
scene.frame_start, scene.frame_end = 0,228
scene.frame_set(104)
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=str(out/'sunbrand-knight-attack1.blend'), compress=True)
ad.action = None
bpy.ops.object.select_all(action='DESELECT')
arm.select_set(True)
for part in parts:part.select_set(True)
bpy.context.view_layer.objects.active = arm
bpy.ops.export_scene.gltf(filepath=str(out/'sunbrand-knight-attack1.glb'), export_format='GLB', use_selection=True,
                          export_animations=True, export_animation_mode='ACTIONS', export_force_sampling=True,
                          export_image_format='AUTO', export_yup=True)
(out/'authoring.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print('ATTACK1_CANDIDATE', str(out), flush=True)
