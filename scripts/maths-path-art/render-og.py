"""Renders the Otterly Maths Path social preview (1200x630) with Blender.

Run: blender --background --python scripts/maths-path-art/render-og.py -- <output.png>
Ringo is the existing raster mascot on a lit plane; the lettered blocks and the title are real 3D objects.
"""
import math
import sys

import bpy

OUT = sys.argv[sys.argv.index('--') + 1]
RINGO = sys.argv[sys.argv.index('--') + 2]
FONT = 'C:/Windows/Fonts/segoeuib.ttf'

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 96
scene.cycles.use_denoising = True
scene.render.resolution_x, scene.render.resolution_y = 1200, 630
scene.render.image_settings.file_format = 'PNG'
scene.view_settings.view_transform = 'Standard'

world = bpy.data.worlds.new('w')
world.use_nodes = True
world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.05, 0.06, 0.14, 1)
world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.8
scene.world = world


def mat(color, rough=0.35, emit=0.0):
    m = bpy.data.materials.new('m')
    m.use_nodes = True
    s = m.node_tree.nodes['Principled BSDF']
    s.inputs['Base Color'].default_value = color
    s.inputs['Roughness'].default_value = rough
    if emit:
        s.inputs['Emission Color'].default_value = color
        s.inputs['Emission Strength'].default_value = emit
    return m


def text(body, size, loc, color, extrude=0.06, align='LEFT', rot=(0, 0, 0)):
    bpy.ops.object.text_add(location=loc, rotation=rot)
    o = bpy.context.object
    o.data.body = body
    o.data.font = bpy.data.fonts.load(FONT)
    o.data.size = size
    o.data.extrude = extrude
    o.data.bevel_depth = 0.012
    o.data.align_x = align
    o.data.align_y = 'CENTER'
    o.data.materials.append(mat(color, 0.3))
    return o


# Backdrop: a big gradient-lit wall
bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0, -0.25))
wall = bpy.context.object
wall.data.materials.append(mat((0.03, 0.04, 0.12, 1), 0.9))

# Ringo as an image-textured plane (alpha cut-out)
bpy.ops.mesh.primitive_plane_add(size=1, location=(-3.55, -0.1, 0.2))
ringo = bpy.context.object
ringo.scale = (4.7, 4.7, 1)
m = bpy.data.materials.new('ringo')
m.use_nodes = True
nt = m.node_tree
nt.nodes.clear()
tex = nt.nodes.new('ShaderNodeTexImage')
tex.image = bpy.data.images.load(RINGO)
tex.interpolation = 'Cubic'
emit = nt.nodes.new('ShaderNodeEmission')
trans = nt.nodes.new('ShaderNodeBsdfTransparent')
mix = nt.nodes.new('ShaderNodeMixShader')
out = nt.nodes.new('ShaderNodeOutputMaterial')
nt.links.new(tex.outputs['Color'], emit.inputs['Color'])
emit.inputs['Strength'].default_value = 1.0
nt.links.new(tex.outputs['Alpha'], mix.inputs['Fac'])
nt.links.new(trans.outputs[0], mix.inputs[1])
nt.links.new(emit.outputs[0], mix.inputs[2])
nt.links.new(mix.outputs[0], out.inputs['Surface'])
ringo.data.materials.append(m)

# Title and subtitle
text('Maths Path', 1.75, (-0.55, 0.75, 0.2), (1.0, 0.62, 0.15, 1), extrude=0.12)
text('PP1 to Class 5', 0.82, (-0.5, -0.45, 0.2), (0.95, 0.95, 1.0, 1), extrude=0.06)
text('Olympiad-style lessons, practice and worksheets', 0.4, (-0.5, -1.3, 0.2), (0.7, 0.78, 1.0, 1), extrude=0.03)
text('otterlygames.com', 0.3, (-0.5, -2.4, 0.2), (0.55, 0.62, 0.9, 1), extrude=0.02)

# Lettered blocks with beveled edges
blocks = [('2', (3.9, 2.0, 0.6), (0.2, 0.5, 0.95, 1), 12), ('+', (5.1, 2.45, 0.9), (0.25, 0.75, 0.4, 1), -9),
          ('7', (5.3, -2.2, 0.7), (0.9, 0.25, 0.4, 1), 8), ('x', (4.0, -2.55, 0.5), (0.6, 0.4, 0.95, 1), -14)]
for label, loc, color, tilt in blocks:
    bpy.ops.mesh.primitive_cube_add(size=0.9, location=loc, rotation=(math.radians(18), math.radians(-22), math.radians(tilt)))
    cube = bpy.context.object
    b = cube.modifiers.new('b', 'BEVEL')
    b.width = 0.08
    b.segments = 4
    cube.data.materials.append(mat(color, 0.25))
    t = text(label, 0.7, (0, 0, 0), (1, 1, 1, 1), extrude=0.03, align='CENTER')
    t.parent = cube
    t.location = (0, 0, 0.47)

# Lights and camera
bpy.ops.object.light_add(type='AREA', location=(0, 0.5, 10))
key = bpy.context.object
key.data.energy = 700
key.data.size = 8
bpy.ops.object.light_add(type='POINT', location=(6, -2, 4))
rim = bpy.context.object
rim.data.energy = 600
rim.data.use_shadow = False
rim.data.color = (0.5, 0.6, 1.0)
bpy.ops.object.camera_add(location=(0, 0, 12), rotation=(0, 0, 0))
cam = bpy.context.object
cam.data.type = 'ORTHO'
cam.data.ortho_scale = 12
scene.camera = cam

scene.render.filepath = OUT
bpy.ops.render.render(write_still=True)
