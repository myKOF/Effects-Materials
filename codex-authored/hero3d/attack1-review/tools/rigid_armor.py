"""Partition the welded Sunbrand review mesh into rigid articulated panels.

Retained source faces keep their rest positions and UVs. Fused arm armor is replaced
by complete authored shells; each shell has exactly one rigid influence.
Cloth is conservatively kept length-preserving in this motion review as well.
"""
from collections import Counter, defaultdict
import bpy
import math
from mathutils import Vector


def partition(body, arm):
    source = body.data
    names = {g.index:g.name for g in body.vertex_groups}
    points = [body.matrix_world@v.co for v in source.vertices]
    weights = [{names[g.group]:g.weight for g in v.groups} for v in source.vertices]
    groups = defaultdict(list)

    def label(poly):
        p = sum((points[i] for i in poly.vertices),Vector())/len(poly.vertices)
        x,y,z = p
        votes = Counter()
        for i in poly.vertices:
            votes.update(weights[i])
        dominant = votes.most_common(1)[0][0]
        if votes['Sword'] > len(poly.vertices)*.5:
            return 'Sword'
        if y > (.105 if z<1.10 else .125) and z < 1.42 and abs(x)<.445:
            return 'Cape'
        if .51 < z < 1.045 and y < -.145 and abs(x) < .125:
            return 'Tabard'
        if dominant in ('Head','headfront','head_end','neck') or z>1.49 and abs(x)<.13:
            return 'Head'
        if dominant.startswith('Spine') or (dominant.endswith('Shoulder') and abs(x)<.145) or (abs(x)<.185 and z>1.13):
            return 'Chest'
        if dominant == 'Hips' or 1.025<z<1.13 and abs(x)<.27:
            return 'Pelvis'
        side = 'Left' if x>0 else 'Right'
        if dominant.startswith(('Left','Right')):
            side = 'Left' if dominant.startswith('Left') else 'Right'
        if dominant.endswith(('Shoulder','Arm','ForeArm','Hand')):
            if abs(x)<.16 and z<1.42:
                return 'Chest'
            if z>1.385 and abs(x)<.31:
                return side+'Pauldron'
            if dominant.endswith('Shoulder'):
                return side+'Pauldron'
            elbow=arm.matrix_world@arm.data.bones[side+'ForeArm'].head_local
            wrist=arm.matrix_world@arm.data.bones[side+'Hand'].head_local
            projection=(p-elbow).dot(wrist-elbow)/(wrist-elbow).length_squared
            return side+('Hand' if projection>.97 else 'ForeArm' if projection>0 else 'Arm')
        if z<.135:
            return side+'Foot'
        if dominant.endswith(('Foot','ToeBase')):
            return side+'Foot'
        if z>.545:
            return side+'UpLeg'
        if dominant.endswith('Leg'):
            return side+'Leg'
        return 'Pelvis'

    removed_bracer_faces=[]
    for poly in source.polygons:
        panel=label(poly)
        if panel in ('LeftArm','RightArm','LeftPauldron','RightPauldron'):
            removed_bracer_faces.append(poly.index)
            continue
        p=sum((points[i] for i in poly.vertices),Vector())/len(poly.vertices)
        side='Left' if p.x>0 else 'Right'
        if panel not in ('Sword','Cape','Tabard') and abs(p.x)>.255:
            elbow=arm.matrix_world@arm.data.bones[side+'ForeArm'].head_local
            wrist=arm.matrix_world@arm.data.bones[side+'Hand'].head_local
            t=(p-elbow).dot(wrist-elbow)/(wrist-elbow).length_squared
            radial=(p-(elbow+(wrist-elbow)*t)).length
            if -.38<t<.99 and radial<.18:
                removed_bracer_faces.append(poly.index)
                continue
        if panel.endswith('ForeArm'):
            # Do not leave a fragment of the old fused bracer on an upper-arm chart.
            removed_bracer_faces.append(poly.index)
            continue
        groups[panel].append(poly)
    mapping = {'Chest':'Spine02','Pelvis':'Hips','Cape':'Spine02','Tabard':'Hips',
               'LeftPauldron':'LeftShoulderPlate','RightPauldron':'RightShoulderPlate'}
    parts=[]
    for panel, polygons in sorted(groups.items()):
        bone = mapping.get(panel,panel)
        indices = sorted({i for p in polygons for i in p.vertices})
        remap = {old:new for new,old in enumerate(indices)}
        data = bpy.data.meshes.new(panel+' rigid surface')
        data.from_pydata([source.vertices[i].co[:] for i in indices],[],[[remap[i] for i in p.vertices] for p in polygons])
        for material in source.materials:
            data.materials.append(material)
        uv = data.uv_layers.new(name='UVMap')
        corner_normals=[]
        for dest,original in zip(data.polygons,polygons):
            dest.use_smooth = original.use_smooth
            dest.material_index = original.material_index
            for new_loop,old_loop in zip(dest.loop_indices,original.loop_indices):
                uv.data[new_loop].uv = source.uv_layers.active.data[old_loop].uv
                corner_normals.append(source.corner_normals[old_loop].vector[:])
        data.normals_split_custom_set(corner_normals)
        # Close the cut panel mouths with dark metal. UV seam duplicates are welded
        # only within a panel; the visible textured shell is left in its rest shape.
        import bmesh
        cap_material=bpy.data.materials.get('Armor inner joints')
        if cap_material is None:
            cap_material=bpy.data.materials.new('Armor inner joints')
            cap_material.diffuse_color=(.055,.060,.070,1.)
            cap_material.use_nodes=True
            bsdf=cap_material.node_tree.nodes.get('Principled BSDF')
            bsdf.inputs['Base Color'].default_value=(.035,.04,.05,1.)
            bsdf.inputs['Metallic'].default_value=.6
            bsdf.inputs['Roughness'].default_value=.75
        data.materials.append(cap_material)
        bm=bmesh.new();bm.from_mesh(data)
        bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00001)
        if panel not in ('Cape','Tabard','Sword'):
            cap_faces=bmesh.ops.holes_fill(bm,edges=[e for e in bm.edges if e.is_boundary],sides=0).get('faces',[])
            for face in cap_faces:face.material_index=len(data.materials)-1
            bmesh.ops.triangulate(bm,faces=cap_faces)
        bm.to_mesh(data);bm.free()
        obj = bpy.data.objects.new(panel,data)
        bpy.context.collection.objects.link(obj)
        obj.parent = body.parent
        obj.matrix_parent_inverse = body.matrix_parent_inverse.copy()
        obj.matrix_world = body.matrix_world.copy()
        group = obj.vertex_groups.new(name=bone)
        group.add(list(range(len(data.vertices))),1.,'REPLACE')
        modifier=obj.modifiers.new('Rigid attachment: one joint per complete panel','ARMATURE')
        modifier.object=arm
        obj['panel']=panel
        obj['rigid']=True
        obj['cloth']=panel in ('Cape','Tabard')
        obj['source_vertex_ids']=indices
        parts.append(obj)
    # The old fused bracer is replaced by a complete authored metal shell. Its
    # elbow cup, tapered body and wrist rim are one closed connected manifold,
    # all bound to one forearm bone. No triangle selection can split this shell.
    gold=bpy.data.materials.new('Bracer | solid gold steel')
    silver=bpy.data.materials.new('Bracer | silver edging')
    for mat,color in [(gold,(.33,.245,.13,1.)),(silver,(.46,.49,.51,1.))]:
        mat.diffuse_color=color;mat.use_nodes=True
        bsdf=mat.node_tree.nodes.get('Principled BSDF')
        bsdf.inputs['Base Color'].default_value=color
        bsdf.inputs['Metallic'].default_value=.85
        bsdf.inputs['Roughness'].default_value=.42
    for side in ('Left','Right'):
        elbow=arm.data.bones[side+'ForeArm'].head_local
        wrist=arm.data.bones[side+'Hand'].head_local
        axis=(wrist-elbow).normalized();length=(wrist-elbow).length
        front=Vector((0,-1,0));front-=axis*front.dot(axis);front.normalize()
        lateral=axis.cross(front).normalized()
        profile=[(-.25,.24),(-.20,.72),(-.14,1.08),(-.10,1.08),(-.06,1.),(.65,.84),(.84,.84),(.89,.88),(.94,.88)]
        n=12;coords=[];faces=[];material_indices=[]
        for along,radius in profile:
            center=elbow+axis*(along*length)
            for i in range(n):
                a=2*math.pi*i/n
                # A broad rigid front ridge is modeled in the rest shell itself.
                ridge=1.10 if abs(math.sin(a))<.05 and math.cos(a)>0 else 1.
                coords.append(center+front*(math.cos(a)*6.3*radius*ridge)+lateral*(math.sin(a)*7.1*radius))
        for j in range(len(profile)-1):
            for i in range(n):
                a=j*n+i;b=j*n+(i+1)%n;c=(j+1)*n+(i+1)%n;d=(j+1)*n+i
                faces.extend([(a,b,c),(a,c,d)])
                material_indices.extend([1 if j in (2,6,7) else 0]*2)
        for j,reverse in [(0,True),(len(profile)-1,False)]:
            center=sum(coords[j*n:(j+1)*n],Vector())/n
            index=len(coords);coords.append(center)
            for i in range(n):
                tri=(index,j*n+(i+1)%n,j*n+i) if reverse else (index,j*n+i,j*n+(i+1)%n)
                faces.append(tri);material_indices.append(0)
        data=bpy.data.meshes.new(side+' complete vambrace')
        data.from_pydata(coords,[],faces);data.materials.append(gold);data.materials.append(silver)
        for p,mat in zip(data.polygons,material_indices):p.material_index=mat
        obj=bpy.data.objects.new(side+'ForeArm',data);bpy.context.collection.objects.link(obj)
        obj.parent=arm;obj.matrix_world=arm.matrix_world.copy()
        vg=obj.vertex_groups.new(name=side+'ForeArm');vg.add(list(range(len(coords))),1.,'REPLACE')
        mod=obj.modifiers.new('Complete rigid shell attachment','ARMATURE');mod.object=arm
        obj['panel']=side+'ForeArm';obj['rigid']=True;obj['cloth']=False
        obj['complete_authored_shell']=True
        parts.append(obj)
    def attach_shell(name,bone,coords,faces,material_indices):
        data=bpy.data.meshes.new(name+' complete shell')
        data.from_pydata(coords,[],faces);data.materials.append(gold);data.materials.append(silver)
        for p,mi in zip(data.polygons,material_indices):p.material_index=mi
        obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj)
        obj.parent=arm;obj.matrix_world=arm.matrix_world.copy()
        vg=obj.vertex_groups.new(name=bone);vg.add(list(range(len(coords))),1.,'REPLACE')
        mod=obj.modifiers.new('Complete rigid shell attachment','ARMATURE');mod.object=arm
        obj['panel']=name;obj['rigid']=True;obj['cloth']=False;obj['complete_authored_shell']=True
        parts.append(obj)
    for side in ('Left','Right'):
        shoulder=arm.data.bones[side+'Arm'].head_local
        elbow=arm.data.bones[side+'ForeArm'].head_local
        direction=(elbow-shoulder).normalized();length=(elbow-shoulder).length
        front=Vector((0,-1,0));front-=direction*front.dot(direction);front.normalize()
        lateral=direction.cross(front).normalized()
        n=12;coords=[];faces=[];mats=[]
        profile=[(.06,.90),(.12,1.),(.16,1.),(.65,.86),(.71,.91),(.76,.91)]
        for along,radius in profile:
            center=shoulder+direction*(along*length)
            for i in range(n):
                a=2*math.pi*i/n
                coords.append(center+front*(math.cos(a)*6.3*radius)+lateral*(math.sin(a)*6.8*radius))
        for j in range(len(profile)-1):
            for i in range(n):
                a=j*n+i;b=j*n+(i+1)%n;c=(j+1)*n+(i+1)%n;d=(j+1)*n+i
                faces.extend([(a,b,c),(a,c,d)]);mats.extend([1 if j in (0,4) else 0]*2)
        for j,reverse in [(0,True),(len(profile)-1,False)]:
            index=len(coords);coords.append(sum(coords[j*n:(j+1)*n],Vector())/n)
            for i in range(n):
                faces.append((index,j*n+(i+1)%n,j*n+i) if reverse else (index,j*n+i,j*n+(i+1)%n));mats.append(0)
        attach_shell(side+'Arm',side+'Arm',coords,faces,mats)
        # One complete shoulder dome, including its lower rim. The previous
        # horizontal threshold incorrectly split the same dome across two bones.
        sign=1 if side=='Left' else -1
        center=shoulder+Vector((-sign*5,-1,0))
        coords=[center+Vector((sign*18,0,0))];faces=[];mats=[]
        latitudes=5
        for j in range(1,latitudes+1):
            phi=math.pi*.5*j/latitudes
            for i in range(n):
                theta=2*math.pi*i/n
                coords.append(center+Vector((sign*18*math.cos(phi),12.0*math.sin(phi)*math.cos(theta),14.0*math.sin(phi)*math.sin(theta))))
        bottom=len(coords);coords.append(center)
        for i in range(n):faces.append((0,1+i,1+(i+1)%n));mats.append(0)
        for j in range(latitudes-1):
            for i in range(n):
                a=1+j*n+i;b=1+j*n+(i+1)%n;c=b+n;d=a+n
                faces.extend([(a,d,c),(a,c,b)]);mats.extend([1 if j==latitudes-2 else 0]*2)
        last=1+(latitudes-1)*n
        for i in range(n):faces.append((bottom,last+(i+1)%n,last+i));mats.append(0)
        if sign<0:faces=[tuple(reversed(f)) for f in faces]
        attach_shell(side+'Pauldron',side+'ShoulderPlate',coords,faces,mats)
        for polygon in parts[-1].data.polygons:polygon.use_smooth=True
    report={o.name:{'bone':o.vertex_groups[0].name,'vertices':len(o.data.vertices),'triangles':len(o.data.polygons),
                    'cloth':bool(o['cloth'])} for o in parts}
    report['sourceTriangles']=len(source.polygons)
    report['removedFusedBracerFaces']=removed_bracer_faces
    report['completeAuthoredShells']=[side+piece for side in ('Left','Right') for piece in ('Arm','ForeArm','Pauldron')]
    bpy.data.objects.remove(body,do_unlink=True)
    return parts,report
