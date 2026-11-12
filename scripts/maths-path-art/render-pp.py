"""Renders the Otterly Maths Path PP1/PP2 toy objects, flat shape tiles and scenes with Blender.

Run: blender --background --python scripts/maths-path-art/render-pp.py -- <output folder>
Then, for each of <output>/pp1 and <output>/pp2:
  python scripts/maths-path-art/to-webp.py <output>/pp1 images/maths-path/pp1
The renders are real raster art: lit, shaded 3D models, not drawn vectors.
"""
import math
import os
import random
import sys

import bmesh
import bpy
from mathutils import Vector

OUT = sys.argv[sys.argv.index('--') + 1]
ONLY = set(sys.argv[sys.argv.index('--') + 2:])

RED = (0.9, 0.2, 0.2, 1)
BLUE = (0.2, 0.5, 0.95, 1)
GREEN = (0.25, 0.7, 0.35, 1)
ORANGE = (0.98, 0.55, 0.12, 1)
PURPLE = (0.6, 0.38, 0.92, 1)
PINK = (0.95, 0.35, 0.6, 1)
YELLOW = (1.0, 0.8, 0.1, 1)
WHITE = (0.96, 0.96, 0.96, 1)
BROWN = (0.45, 0.28, 0.12, 1)


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 32
    scene.cycles.use_denoising = True
    scene.render.film_transparent = True
    scene.view_settings.view_transform = 'Standard'
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    world = bpy.data.worlds.new('w')
    world.use_nodes = True
    bg = world.node_tree.nodes['Background']
    bg.inputs['Color'].default_value = (0.9, 0.9, 1.0, 1)
    bg.inputs['Strength'].default_value = 0.6
    scene.world = world
    return scene


def material(name, color, roughness=0.4, metallic=0.0, alpha=1.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    shader = m.node_tree.nodes['Principled BSDF']
    shader.inputs['Base Color'].default_value = color
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Metallic'].default_value = metallic
    shader.inputs['Alpha'].default_value = alpha
    return m


def paint(obj, color, roughness=0.4, alpha=1.0):
    obj.data.materials.clear()
    obj.data.materials.append(material('m', color, roughness, 0.0, alpha))
    return obj


def bevel(obj, width=0.05):
    mod = obj.modifiers.new('bevel', 'BEVEL')
    mod.width = width
    mod.segments = 4
    return obj


def smooth(obj):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.shade_smooth()
    obj.select_set(False)
    return obj


def sphere(radius, loc, color, scale=(1, 1, 1), rough=0.35):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=radius, location=loc, segments=48, ring_count=24)
    obj = bpy.context.object
    obj.scale = scale
    paint(obj, color, rough)
    return smooth(obj)


def cube(size, loc, color, scale=(1, 1, 1), rot=0.0, width=0.05):
    bpy.ops.mesh.primitive_cube_add(size=size, location=loc)
    obj = bpy.context.object
    obj.scale = scale
    obj.rotation_euler = (0, 0, math.radians(rot))
    paint(obj, color, 0.4)
    bevel(obj, width)
    return smooth(obj)


def cylinder(radius, depth, loc, color, rot=(0, 0, 0), verts=64, rough=0.4, alpha=1.0, width=0.0):
    bpy.ops.mesh.primitive_cylinder_add(radius=radius, depth=depth, location=loc, vertices=verts)
    obj = bpy.context.object
    obj.rotation_euler = rot
    paint(obj, color, rough, alpha)
    if width:
        bevel(obj, width)
    return smooth(obj)


def cone(r1, r2, depth, loc, color, rot=(0, 0, 0), verts=48):
    bpy.ops.mesh.primitive_cone_add(radius1=r1, radius2=r2, depth=depth, location=loc, vertices=verts)
    obj = bpy.context.object
    obj.rotation_euler = rot
    paint(obj, color, 0.4)
    return smooth(obj)


def flat_poly(points, thickness, color, plane='XY', z=0.0):
    """Extruded flat outline. XY: lies on the floor. XZ: stands up facing the camera."""
    mesh = bpy.data.meshes.new('poly')
    obj = bpy.data.objects.new('poly', mesh)
    bpy.context.collection.objects.link(obj)
    bm = bmesh.new()
    verts = [bm.verts.new((x, 0, y) if plane == 'XZ' else (x, y, 0)) for x, y in points]
    bm.faces.new(verts)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    solid = obj.modifiers.new('solid', 'SOLIDIFY')
    solid.thickness = thickness
    solid.offset = 1 if plane == 'XY' else -1
    bevel(obj, 0.04)
    obj.location.z = z
    paint(obj, color, 0.35)
    return obj


def lights_and_camera(scene, location, target=(0, 0, 0), size=14, lens=55):
    bpy.ops.object.light_add(type='AREA', location=(3, -4, 6))
    key = bpy.context.object
    key.data.energy = 700
    key.data.size = 5
    aim(key, (0, 0, 0))
    bpy.ops.object.light_add(type='AREA', location=(-5, -2, 3))
    fill = bpy.context.object
    fill.data.energy = 220
    fill.data.size = 6
    aim(fill, (0, 0, 0))
    bpy.ops.mesh.primitive_plane_add(size=size, location=(0, 0, 0))
    bpy.context.object.is_shadow_catcher = True
    bpy.ops.object.camera_add(location=location)
    cam = bpy.context.object
    cam.data.lens = lens
    aim(cam, target)
    scene.camera = cam


def aim(obj, target):
    direction = Vector(target) - obj.location
    obj.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()


def snap(group, name, build, cam=(4.6, -5.4, 3.6), target=(0, 0, 0.9), width=384, height=384, lens=55):
    if ONLY and name not in ONLY:
        return
    scene = reset()
    build()
    lights_and_camera(scene, cam, target, lens=lens)
    folder = os.path.join(OUT, group)
    os.makedirs(folder, exist_ok=True)
    scene.render.resolution_x = width
    scene.render.resolution_y = height
    scene.render.filepath = os.path.join(folder, name + '.png')
    bpy.ops.render.render(write_still=True)


# ---- objects ----

def apple():
    sphere(1.0, (0, 0, 0.95), RED, (1.05, 1.05, 0.92), 0.3)
    cylinder(0.07, 0.4, (0, 0, 1.78), BROWN, rot=(math.radians(8), 0, 0))
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.3, location=(0.3, 0, 1.72), segments=32, ring_count=16)
    leaf = bpy.context.object
    leaf.scale = (1.0, 0.45, 0.2)
    leaf.rotation_euler = (0, math.radians(-20), 0)
    paint(leaf, GREEN, 0.4)


def ball():
    sphere(1.0, (0, 0, 1.0), BLUE, rough=0.25)
    bpy.ops.mesh.primitive_torus_add(major_radius=1.0, minor_radius=0.1, location=(0, 0, 1.0), major_segments=96, minor_segments=16)
    stripe = bpy.context.object
    stripe.rotation_euler = (math.radians(70), 0, math.radians(20))
    paint(stripe, YELLOW, 0.3)
    smooth(stripe)


def fish():
    sphere(1.0, (0, 0, 1.0), ORANGE, (1.5, 0.65, 0.85), 0.3)
    cone(0.75, 0.0, 1.0, (-1.75, 0, 1.0), ORANGE, rot=(0, math.radians(90), 0))
    cone(0.5, 0.0, 0.7, (-0.2, 0, 1.75), (0.9, 0.35, 0.05, 1), rot=(0, math.radians(-20), 0))
    sphere(0.2, (0.95, -0.5, 1.3), WHITE)
    sphere(0.1, (1.05, -0.62, 1.3), (0.05, 0.05, 0.08, 1))


def balloon():
    sphere(1.0, (0, 0, 2.0), RED, (1.0, 1.0, 1.2), 0.15)
    cone(0.22, 0.0, 0.35, (0, 0, 0.73), RED, rot=(math.pi, 0, 0))
    cylinder(0.02, 0.8, (0, 0, 0.35), (0.3, 0.3, 0.3, 1), verts=12)


def rock():
    bpy.ops.mesh.primitive_ico_sphere_add(radius=1.0, subdivisions=3, location=(0, 0, 0.8))
    obj = bpy.context.object
    obj.scale = (1.5, 1.2, 0.85)
    rng = random.Random(7)
    for v in obj.data.vertices:
        v.co *= 1 + rng.uniform(-0.12, 0.12)
    paint(obj, (0.45, 0.45, 0.5, 1), 0.85)
    smooth(obj)


def sun():
    sphere(1.0, (0, 0, 2.0), (1.0, 0.8, 0.1, 1), rough=0.3)
    for i in range(10):
        t = math.radians(i * 36)
        cone(0.2, 0.0, 0.75, (1.75 * math.sin(t), 0, 2.0 + 1.75 * math.cos(t)), (1.0, 0.6, 0.1, 1), rot=(0, t, 0))


def moon():
    body = sphere(1.0, (0, 0, 2.0), (1.0, 0.72, 0.15, 1), rough=0.5)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.9, location=(0.65, 0, 2.15), segments=48, ring_count=24)
    cutter = bpy.context.object
    cutter.hide_render = True
    mod = body.modifiers.new('cut', 'BOOLEAN')
    mod.operation = 'DIFFERENCE'
    mod.object = cutter


def jar(level):
    cylinder(0.85, 0.08, (0, 0, 0.04), (0.8, 0.9, 1.0, 1), rough=0.1, alpha=0.5)
    cylinder(0.85, 2.0, (0, 0, 1.0), (0.85, 0.93, 1.0, 1), rough=0.05, alpha=0.18, verts=96)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.85, minor_radius=0.05, location=(0, 0, 2.0), major_segments=96, minor_segments=12)
    paint(bpy.context.object, (0.85, 0.93, 1.0, 1), 0.1, 0.7)
    if level:
        height = 1.9 * level
        cylinder(0.8, height, (0, 0, 0.1 + height / 2), (0.15, 0.55, 1.0, 1), rough=0.1, alpha=0.9, verts=96)


def tower(count):
    colors = [RED, ORANGE, YELLOW, GREEN, BLUE]
    for i in range(count):
        cube(0.9, (0, 0, 0.45 + i * 0.9), colors[i % 5], rot=(i % 2) * 8, width=0.04)


def book(thick, color):
    cube(1, (0, 0, thick / 2), color, (2.4, 1.7, thick), 12, 0.03)
    cube(1, (0.0, -0.04, thick / 2), WHITE, (2.3, 1.72, thick * 0.74), 12, 0.02)
    cube(1, (-1.18, 0.0, thick / 2), color, (0.1, 1.72, thick), 12, 0.02)


def pencil(length):
    half = length / 2
    cylinder(0.17, length, (0, 0, 0.15), YELLOW, rot=(0, math.pi / 2, 0), verts=6, width=0.01)
    cone(0.17, 0.0, 0.5, (-half - 0.25, 0, 0.15), (0.9, 0.7, 0.45, 1), rot=(0, math.radians(-90), 0), verts=6)
    cone(0.05, 0.0, 0.14, (-half - 0.43, 0, 0.15), (0.1, 0.1, 0.1, 1), rot=(0, math.radians(-90), 0), verts=12)
    cylinder(0.18, 0.22, (half + 0.11, 0, 0.15), PINK, rot=(0, math.pi / 2, 0), verts=24)


def blocks_row(count):
    for i in range(count):
        cube(0.9, ((i - (count - 1) / 2) * 1.0, 0, 0.45), [RED, BLUE][i % 2], width=0.04)


def bowl(offset=0.0):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1.6, location=(offset, 0, 1.6), segments=64, ring_count=32)
    obj = bpy.context.object
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z > -0.9], context='VERTS')
    bm.to_mesh(obj.data)
    bm.free()
    solid = obj.modifiers.new('solid', 'SOLIDIFY')
    solid.thickness = 0.09
    solid.offset = -1
    paint(obj, (0.3, 0.7, 0.75, 1), 0.3)
    smooth(obj)
    obj.data.materials[0].use_backface_culling = False


def scene_in_bowl():
    bowl()
    sphere(0.6, (0, 0, 0.75), RED, rough=0.25)


def scene_out_bowl():
    bowl(-1.2)
    sphere(0.6, (2.1, 0, 0.6), RED, rough=0.25)


def scene_on_box():
    cube(1.8, (0, 0, 0.9), BLUE)
    sphere(0.7, (0, 0, 2.5), RED, rough=0.25)


def scene_under_table():
    cube(1, (0, 0, 2.1), ORANGE, (3.4, 2.0, 0.2), width=0.03)
    for x, y in [(-1.5, -0.8), (1.5, -0.8), (-1.5, 0.8), (1.5, 0.8)]:
        cube(1, (x, y, 1.0), ORANGE, (0.2, 0.2, 2.0), width=0.02)
    sphere(0.6, (0, -0.1, 0.6), RED, rough=0.25)


def house():
    flat_poly([(-1.5, 0), (1.5, 0), (1.5, 3), (-1.5, 3)], 0.3, BLUE, 'XZ')
    flat_poly([(-2.0, 3), (2.0, 3), (0, 4.9)], 0.3, GREEN, 'XZ')
    flat_poly([(-0.45, 0), (0.45, 0), (0.45, 1.6), (-0.45, 1.6)], 0.2, ORANGE, 'XZ', 0)
    for obj in bpy.context.scene.objects:
        if obj.name.startswith('poly') and obj.modifiers and obj.modifiers[0].thickness == 0.2:
            obj.location.y = -0.3
    bpy.ops.mesh.primitive_cylinder_add(radius=0.45, depth=0.2, location=(-0.95, -0.3, 2.1), vertices=64, rotation=(math.pi / 2, 0, 0))
    paint(bpy.context.object, YELLOW, 0.3)
    smooth(bpy.context.object)


# ---- flat shape tiles (lying on the floor, seen from above) ----

def tile_circle():
    cylinder(1.5, 0.3, (0, 0, 0.15), RED, verts=96, width=0.05)


def tile_square():
    cube(1, (0, 0, 0.15), BLUE, (2.7, 2.7, 0.3), width=0.05)


def tile_rectangle():
    cube(1, (0, 0, 0.15), ORANGE, (3.5, 1.9, 0.3), width=0.05)


def tile_triangle():
    s = 3.4
    h = s * math.sqrt(3) / 2
    flat_poly([(-s / 2, -h / 3), (s / 2, -h / 3), (0, 2 * h / 3)], 0.3, GREEN)


def tile_oval():
    cylinder(1.0, 0.3, (0, 0, 0.15), PURPLE, verts=96, width=0.05).scale = (1.9, 1.25, 1)


def tile_heart():
    pts = []
    for i in range(60):
        t = 2 * math.pi * i / 60
        pts.append((0.1 * 16 * math.sin(t) ** 3, 0.1 * (13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t))))
    flat_poly(pts[::-1], 0.3, PINK)


def tile_star():
    pts = []
    for i in range(10):
        r = 1.8 if i % 2 == 0 else 0.78
        a = math.pi / 2 + i * math.pi / 5
        pts.append((r * math.cos(a), r * math.sin(a)))
    flat_poly(pts, 0.3, YELLOW)


TOP = dict(cam=(0, -1.6, 7.2), target=(0, 0, 0))
FRONT = dict(cam=(0, -9, 3.2), target=(0, 0, 1.8))

snap('pp1', 'shape-circle', tile_circle, **TOP)
snap('pp1', 'shape-square', tile_square, **TOP)
snap('pp1', 'shape-rectangle', tile_rectangle, **TOP)
snap('pp1', 'shape-triangle', tile_triangle, **TOP)
snap('pp1', 'shape-oval', tile_oval, **TOP)
snap('pp1', 'shape-heart', tile_heart, **TOP)
snap('pp1', 'shape-star', tile_star, **TOP)
snap('pp1', 'apple', apple)
snap('pp1', 'ball', ball)
snap('pp1', 'fish', fish, cam=(0, -7, 3.0), target=(0, 0, 1.0))
snap('pp1', 'balloon', balloon, cam=(0, -8, 3.0), target=(0, 0, 1.6))
snap('pp1', 'rock', rock, cam=(2, -5.5, 3.2), target=(0, 0, 0.7))
snap('pp1', 'block-red', lambda: cube(1.7, (0, 0, 0.85), RED, rot=30), cam=(4.6, -5.4, 3.6))
snap('pp1', 'block-blue', lambda: cube(1.7, (0, 0, 0.85), BLUE, rot=30), cam=(4.6, -5.4, 3.6))
snap('pp1', 'tower-tall', lambda: tower(5), cam=(3, -8, 4.5), target=(0, 0, 2.0))
snap('pp1', 'tower-short', lambda: tower(2), cam=(3, -8, 3.0), target=(0, 0, 0.9))
snap('pp1', 'book-thick', lambda: book(0.9, GREEN), cam=(1.5, -5.5, 3.0), target=(0, 0, 0.45))
snap('pp1', 'book-thin', lambda: book(0.22, RED), cam=(1.5, -5.5, 3.0), target=(0, 0, 0.1))
snap('pp1', 'jar-empty', lambda: jar(0), cam=(0, -8, 3.0), target=(0, 0, 1.0))
snap('pp1', 'jar-half', lambda: jar(0.5), cam=(0, -8, 3.0), target=(0, 0, 1.0))
snap('pp1', 'jar-full', lambda: jar(0.95), cam=(0, -8, 3.0), target=(0, 0, 1.0))
snap('pp1', 'bowl-in', scene_in_bowl, cam=(0, -6.5, 4.5), target=(0, 0, 0.6))
snap('pp1', 'bowl-out', scene_out_bowl, cam=(0, -8, 4.5), target=(0.4, 0, 0.6), width=480, height=384)
snap('pp1', 'on-box', scene_on_box, cam=(0, -8, 3.5), target=(0, 0, 1.6))
snap('pp1', 'under-table', scene_under_table, cam=(0, -9, 2.6), target=(0, 0, 1.1), width=480, height=384)
snap('pp2', 'pencil-long', lambda: pencil(4.4), cam=(0, -4.5, 6.2), target=(0, 0, 0.1), width=576, height=288)
snap('pp2', 'pencil-short', lambda: pencil(2.2), cam=(0, -4.5, 6.2), target=(0, 0, 0.1), width=576, height=288)
snap('pp2', 'blocks-row-5', lambda: blocks_row(5), cam=(0, -6.5, 5.0), target=(0, 0, 0.3), width=576, height=288)
snap('pp2', 'house', house, cam=(0, -11, 3.6), target=(0, 0, 2.4))
snap('pp2', 'sun', sun, cam=(0, -9, 2.0), target=(0, 0, 2.0))
snap('pp2', 'moon', moon, cam=(0, -9, 2.0), target=(0, 0, 2.0))
