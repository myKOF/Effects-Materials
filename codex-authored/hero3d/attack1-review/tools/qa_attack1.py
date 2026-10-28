"""Check the exported rigid-panel chop, grip contacts and anatomical limits.

Blender --background --python qa_attack1.py -- original.glb candidate.glb report.json
"""
import bpy
import json
import math
import sys
from pathlib import Path
import numpy as np
from mathutils import Vector

source,candidate,report_file=sys.argv[sys.argv.index('--')+1:][:3]


def load(path):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=path)
    bpy.context.scene.render.fps=24
    arm=next(o for o in bpy.data.objects if o.type=='ARMATURE')
    meshes=[o for o in bpy.data.objects if o.type=='MESH' and o.vertex_groups]
    return arm,meshes


def action(arm,a):
    arm.animation_data.action=a
    if hasattr(a,'slots') and len(a.slots):arm.animation_data.action_slot=a.slots[0]


def sample(arm,names):
    return {n:list((arm.matrix_world@arm.pose.bones[n].matrix).translation)+
              list((arm.matrix_world@arm.pose.bones[n].matrix).to_quaternion()) for n in names}


arm,meshes=load(source)
original_names=[b.name for b in arm.pose.bones]
baseline={}
for a in bpy.data.actions:
    if a.name=='Attack1':continue
    action(arm,a)
    frames=[]
    for f in range(int(a.frame_range[1])+1):
        bpy.context.scene.frame_set(f)
        frames.append(sample(arm,original_names))
    baseline[a.name]=frames
arm,meshes=load(candidate)
assert len(meshes)==20,len(meshes)
report={'revision':6,'panels':{},'retainedJointCurves':{},'samples':[]}
for name,frames in baseline.items():
    action(arm,bpy.data.actions[name])
    max_pos,max_q=0.,0.
    for f,ref in enumerate(frames):
        bpy.context.scene.frame_set(f)
        actual=sample(arm,original_names)
        for n,p in actual.items():
            max_pos=max(max_pos,(Vector(p[:3])-Vector(ref[n][:3])).length)
            dot=min(1.,abs(sum(a*b for a,b in zip(p[3:],ref[n][3:]))))
            max_q=max(max_q,1-dot)
    assert max_pos<1e-5 and max_q<1e-5,(name,max_pos,max_q)
    report['retainedJointCurves'][name]={'frames':len(frames),'maxPositionErrorM':max_pos,'maxQuaternionDotError':max_q}

rest={}
for o in meshes:
    groups={g.index:g.name for g in o.vertex_groups}
    influences=set()
    for v in o.data.vertices:
        weights=[g for g in v.groups if g.weight>.00001]
        assert len(weights)==1 and abs(weights[0].weight-1)<1e-6,(o.name,v.index)
        influences.add(groups[weights[0].group])
    assert len(influences)==1,(o.name,influences)
    bone=next(iter(influences))
    coords=np.array([(o.matrix_world@v.co)[:] for v in o.data.vertices])
    edges=np.array([e.vertices[:] for e in o.data.edges])
    lengths=np.linalg.norm(coords[edges[:,1]]-coords[edges[:,0]],axis=1)
    rest[o.name]={'edges':edges,'lengths':lengths,'maxErrorM':0.}
    report['panels'][o.name]={'bone':bone,'vertices':len(coords),'triangles':sum(len(p.vertices)-2 for p in o.data.polygons),
                             'influencesPerVertex':1,'maxEdgeLengthErrorM':0.}
    if o.name in {side+piece for side in ('Left','Right') for piece in ('Arm','ForeArm','Pauldron')}:
        # Validate the complete authored shell, not an arbitrary subset of faces.
        # glTF duplicates vertices at hard normals/material boundaries. Weld only
        # coincident rest positions for the topology audit, preserving hard shading.
        canonical={};vertex_map=[]
        for point in coords:
            key=tuple(round(float(v),6) for v in point)
            if key not in canonical:canonical[key]=len(canonical)
            vertex_map.append(canonical[key])
        usage={}
        adjacency={i:set() for i in range(len(canonical))}
        for p in o.data.polygons:
            for a,b in zip(list(p.vertices),list(p.vertices)[1:]+list(p.vertices)[:1]):
                a,b=vertex_map[a],vertex_map[b]
                edge=tuple(sorted((a,b)));usage[edge]=usage.get(edge,0)+1
                adjacency[a].add(b);adjacency[b].add(a)
        visited={0};queue=[0]
        while queue:
            i=queue.pop()
            for j in adjacency[i]-visited:visited.add(j);queue.append(j)
        assert len(visited)==len(canonical) and all(c==2 for c in usage.values()),o.name
        assert len(canonical)-len(usage)+len(o.data.polygons)==2,o.name
        representatives={}
        for i,c in enumerate(vertex_map):representatives.setdefault(c,i)
        indices=np.array(list(representatives.values()))
        first,second=np.triu_indices(len(indices),1)
        first,second=indices[first],indices[second]
        rest[o.name]['pairs']=(first,second)
        rest[o.name]['pairDistances']=np.linalg.norm(coords[first]-coords[second],axis=1)
        report['panels'][o.name]['closedConnectedShell']=True
        report['panels'][o.name]['allVertexPairsChecked']=len(first)
        report['panels'][o.name]['maxWholeShellPairDistanceErrorM']=0.
action(arm,bpy.data.actions['Attack1'])
left_palm=Vector((1.5,7.5,-1.))
right_link=arm.data.bones['Sword'].matrix_local.inverted()@arm.data.bones['RightHand'].matrix_local
max_wrist={'Left':0.,'Right':0.}
max_grip,max_limb,max_scale,max_translation=0.,0.,0.,0.
grip_at=0.
min_sword,min_foot=10.,10.
first_pose=last_pose=None
for sample_index in range(457):
    f=sample_index/8
    bpy.context.scene.frame_set(int(f),subframe=f%1)
    deps=bpy.context.evaluated_depsgraph_get()
    part_min={}
    for o in meshes:
        ev=o.evaluated_get(deps)
        me=ev.to_mesh()
        points=np.array([(ev.matrix_world@v.co)[:] for v in me.vertices])
        ev.to_mesh_clear()
        assert np.isfinite(points).all()
        part_min[o.name]=float(points[:,2].min())
        r=rest[o.name]
        lengths=np.linalg.norm(points[r['edges'][:,1]]-points[r['edges'][:,0]],axis=1)
        error=float(np.abs(lengths-r['lengths']).max())
        r['maxErrorM']=max(r['maxErrorM'],error)
        report['panels'][o.name]['maxEdgeLengthErrorM']=r['maxErrorM']
        if 'pairs' in r:
            a,b=r['pairs']
            pair_error=float(np.abs(np.linalg.norm(points[a]-points[b],axis=1)-r['pairDistances']).max())
            panel=report['panels'][o.name]
            panel['maxWholeShellPairDistanceErrorM']=max(panel['maxWholeShellPairDistanceErrorM'],pair_error)
    sword=arm.matrix_world@arm.pose.bones['Sword'].matrix
    right=arm.matrix_world@arm.pose.bones['RightHand'].matrix
    left=arm.matrix_world@arm.pose.bones['LeftHand'].matrix
    grip_error=max((left@left_palm-sword@Vector((0.,-11.,0.))).length,
                   (right.translation-(sword@right_link).translation).length)
    if grip_error>max_grip:max_grip,grip_at=grip_error,f
    for side in ('Left','Right'):
        lower=arm.pose.bones[side+'ForeArm']
        hand=arm.pose.bones[side+'Hand']
        neutral=lower.matrix.to_3x3()@lower.bone.matrix_local.to_3x3().inverted()@hand.bone.matrix_local.to_3x3()
        deviation=math.degrees(neutral.to_quaternion().rotation_difference(hand.matrix.to_quaternion()).angle)
        max_wrist[side]=max(max_wrist[side],min(deviation,360-deviation))
        for p,c in [('Arm','ForeArm'),('ForeArm','Hand'),('UpLeg','Leg'),('Leg','Foot')]:
            actual=(arm.pose.bones[side+p].head-arm.pose.bones[side+c].head).length
            expected=(arm.data.bones[side+p].head_local-arm.data.bones[side+c].head_local).length
            max_limb=max(max_limb,abs(actual-expected)/100)
    for pb in arm.pose.bones:
        max_scale=max(max_scale,max(abs(s-1) for s in pb.scale))
        if pb.name!='Hips':max_translation=max(max_translation,pb.location.length/100)
    min_sword=min(min_sword,part_min['Sword'])
    min_foot=min(min_foot,part_min['LeftFoot'],part_min['RightFoot'])
    if f.is_integer():
        axis=(sword.to_3x3()@Vector((0,1,0))).normalized()
        arm_reach={}
        for side in ('Left','Right'):
            a=arm.pose.bones[side+'Arm'].head
            e=arm.pose.bones[side+'ForeArm'].head
            w=arm.pose.bones[side+'Hand'].head
            l1,l2=(e-a).length,(w-e).length
            d=(w-a).length
            bend=180-math.degrees(math.acos(max(-1,min(1,(l1*l1+l2*l2-d*d)/(2*l1*l2)))))
            arm_reach[side]={'reachRatio':d/(l1+l2),'elbowBendDeg':bend}
        report['samples'].append({'frame':f,'gripErrorM':grip_error,'swordMinZ':part_min['Sword'],
                                  'footMinZ':min(part_min['LeftFoot'],part_min['RightFoot']),
                                  'hipZ':(arm.matrix_world@arm.pose.bones['Hips'].matrix).translation.z,
                                  'swordDownAngleDeg':math.degrees(math.atan2(-axis.z,math.hypot(axis.x,axis.y))),
                                  'arms':arm_reach})
    if sample_index==0:first_pose=sample(arm,original_names)
    if sample_index==456:last_pose=sample(arm,original_names)
loop_position=max((Vector(first_pose[n][:3])-Vector(last_pose[n][:3])).length for n in original_names)
report.update(maxWristDeviationDeg=max_wrist,maxGripErrorM=max_grip,maxLimbLengthErrorM=max_limb,
              maxGripAtSourceFrame=grip_at,
              maxBoneScaleError=max_scale,maxNonRootJointTranslationM=max_translation,
              minSwordZ=min_sword,minFootZ=min_foot,loopPositionErrorM=loop_position,
              contact=report['samples'][26],samplesChecked=457,
              totalTriangles=sum(p['triangles'] for p in report['panels'].values()))
Path(report_file).write_text(json.dumps(report,indent=2),encoding='utf-8')
print('ATTACK1_R6_QA',json.dumps({k:v for k,v in report.items() if k not in ('samples','panels')}),flush=True)
assert max(p['maxEdgeLengthErrorM'] for p in report['panels'].values())<.00001
assert max(max_wrist.values())<65
assert max_grip<.004 and max_limb<.0001
assert max_scale<.00001 and max_translation<.0001
assert min_foot>-.005 and min_sword>-.005
assert abs(report['contact']['swordMinZ'])<.003
assert report['contact']['hipZ']<.62
assert 20<report['contact']['swordDownAngleDeg']<32
assert min(a['reachRatio'] for a in report['contact']['arms'].values())>.96
assert report['contact']['arms']['Right']['reachRatio']>.99
assert loop_position<.0001
assert report['totalTriangles']<6000
for side in ('Left','Right'):
    for piece in ('Arm','ForeArm','Pauldron'):
        assert report['panels'][side+piece]['closedConnectedShell']
        assert report['panels'][side+piece]['maxWholeShellPairDistanceErrorM']<.00001
print('ATTACK1_R6_QA_PASS',flush=True)
