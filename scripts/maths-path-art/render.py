"""Renders the Otterly Maths Path 3D objects (solids, coins, notes) with Blender.

Run: blender --background --python scripts/maths-path-art/render.py -- <output folder>
Then: python scripts/maths-path-art/to-webp.py <output folder> images/maths-path
The renders are real raster art: lit, shaded 3D models, not drawn vectors.
"""
import math
import os
import sys

import bpy
from mathutils import Vector

OUT = sys.argv[sys.argv.index('--') + 1]
os.makedirs(OUT, exist_ok=True)


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 64
    scene.cycles.use_denoising = True
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    world = bpy.data.worlds.new('w')
    world.use_nodes = True
    bg = world.node_tree.nodes['Background']
    bg.inputs['Color'].default_value = (0.9, 0.9, 1.0, 1)
    bg.inputs['Strength'].default_value = 0.6
    scene.world = world
    return scene


def material(name, color, roughness=0.4, metallic=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    shader = m.node_tree.nodes['Principled BSDF']
    shader.inputs['Base Color'].default_value = color
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Metallic'].default_value = metallic
    return m


def paint(obj, mat):
    obj.data.materials.clear()
    obj.data.materials.append(mat)


def bevel(obj, width=0.06):
    mod = obj.modifiers.new('bevel', 'BEVEL')
    mod.width = width
    mod.segments = 4
    bpy.ops.object.shade_smooth()


def aim(obj, target):
    direction = Vector(target) - obj.location
    obj.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()


def lights_and_camera(scene, location, target=(0, 0, 0), floor=True, size=6):
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
    if floor:
        bpy.ops.mesh.primitive_plane_add(size=size, location=(0, 0, 0))
        bpy.context.object.is_shadow_catcher = True
    bpy.ops.object.camera_add(location=location)
    cam = bpy.context.object
    cam.data.lens = 55
    aim(cam, target)
    scene.camera = cam


def render(scene, name, width, height):
    scene.render.resolution_x = width
    scene.render.resolution_y = height
    scene.render.filepath = os.path.join(OUT, name + '.png')
    bpy.ops.render.render(write_still=True)


def solid(name, build, color):
    scene = reset()
    obj = build()
    paint(obj, material(name, color, 0.35))
    bevel(obj)
    lights_and_camera(scene, (4.6, -5.4, 3.6), target=(0, 0, 0.9))
    render(scene, name, 640, 640)


def cube():
    bpy.ops.mesh.primitive_cube_add(size=1.7, location=(0, 0, 0.85))
    obj = bpy.context.object
    obj.rotation_euler = (0, 0, math.radians(30))
    return obj


def cuboid():
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0.55))
    obj = bpy.context.object
    obj.scale = (2.6, 1.4, 1.1)
    obj.rotation_euler = (0, 0, math.radians(25))
    return obj


def sphere():
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1.0, location=(0, 0, 1.0), segments=64, ring_count=32)
    return bpy.context.object


def cone():
    bpy.ops.mesh.primitive_cone_add(radius1=1.0, radius2=0, depth=2.0, location=(0, 0, 1.0), vertices=96)
    return bpy.context.object


def cylinder():
    bpy.ops.mesh.primitive_cylinder_add(radius=0.9, depth=1.9, location=(0, 0, 0.95), vertices=96)
    return bpy.context.object


def coin(value, color):
    scene = reset()
    bpy.ops.mesh.primitive_cylinder_add(radius=1.0, depth=0.14, location=(0, 0, 0.07), vertices=128)
    disc = bpy.context.object
    paint(disc, material('coin%s' % value, color, 0.28, 0.85))
    bevel(disc, 0.05)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.86, minor_radius=0.03, location=(0, 0, 0.14),
                                      major_segments=128, minor_segments=12)
    paint(bpy.context.object, material('rim', color, 0.25, 0.9))
    bpy.ops.object.text_add(location=(0, 0, 0.14))
    text = bpy.context.object
    text.data.body = str(value)
    text.data.align_x = 'CENTER'
    text.data.align_y = 'CENTER'
    text.data.size = 0.95 if value < 10 else 0.78
    text.data.extrude = 0.03
    paint(text, material('num', color, 0.3, 0.9))
    lights_and_camera(scene, (0.0, -3.2, 4.4), target=(0, 0, 0.1), size=5)
    render(scene, 'coin-%s' % value, 512, 512)


def note(value, color, accent):
    scene = reset()
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0.03))
    paper = bpy.context.object
    paper.scale = (3.4, 1.7, 0.05)
    paint(paper, material('note%s' % value, color, 0.6))
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0.06))
    inset = bpy.context.object
    inset.scale = (3.1, 1.4, 0.02)
    paint(inset, material('inset', accent, 0.6))
    bpy.ops.object.text_add(location=(0, -0.05, 0.075))
    text = bpy.context.object
    text.data.body = str(value)
    text.data.align_x = 'CENTER'
    text.data.align_y = 'CENTER'
    text.data.size = 1.15
    text.data.extrude = 0.01
    paint(text, material('white', (1, 1, 1, 1), 0.5))
    bpy.ops.object.text_add(location=(-1.35, 0.5, 0.075))
    rs = bpy.context.object
    rs.data.body = 'Rs'
    rs.data.size = 0.36
    rs.data.extrude = 0.01
    paint(rs, material('white2', (1, 1, 1, 1), 0.5))
    lights_and_camera(scene, (0.5, -3.4, 7.0), target=(0, 0, 0), size=8)
    render(scene, 'note-%s' % value, 640, 400)


solid('solid-cube', cube, (0.98, 0.45, 0.12, 1))
solid('solid-cuboid', cuboid, (0.55, 0.36, 0.96, 1))
solid('solid-sphere', sphere, (0.93, 0.28, 0.6, 1))
solid('solid-cone', cone, (0.98, 0.75, 0.15, 1))
solid('solid-cylinder', cylinder, (0.23, 0.51, 0.96, 1))
coin(1, (0.78, 0.8, 0.84, 1))
coin(2, (0.85, 0.65, 0.3, 1))
coin(5, (0.95, 0.78, 0.2, 1))
coin(10, (0.9, 0.55, 0.2, 1))
note(10, (0.35, 0.55, 0.25, 1), (0.25, 0.45, 0.2, 1))
note(20, (0.85, 0.5, 0.2, 1), (0.75, 0.4, 0.15, 1))
note(50, (0.3, 0.5, 0.8, 1), (0.2, 0.4, 0.7, 1))
