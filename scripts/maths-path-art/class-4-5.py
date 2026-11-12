"""Renders the Class 4 and Class 5 Maths Path chapter illustrations with Blender (real lit 3D renders).

Run: blender --background --python scripts/maths-path-art/class-4-5.py -- <png folder>
Then: python scripts/maths-path-art/to-webp.py <png folder>/class-4 images/maths-path/class-4   (and class-5)
"""
import math
import os
import sys

import bpy
from mathutils import Vector

OUT = sys.argv[sys.argv.index('--') + 1]


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 48
    scene.cycles.use_denoising = True
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    world = bpy.data.worlds.new('w')
    world.use_nodes = True
    bg = world.node_tree.nodes['Background']
    bg.inputs['Color'].default_value = (0.9, 0.9, 1.0, 1)
    bg.inputs['Strength'].default_value = 0.7
    scene.world = world
    return scene


def mat(color, roughness=0.4, metallic=0.0):
    m = bpy.data.materials.new('m')
    m.use_nodes = True
    s = m.node_tree.nodes['Principled BSDF']
    s.inputs['Base Color'].default_value = color
    s.inputs['Roughness'].default_value = roughness
    s.inputs['Metallic'].default_value = metallic
    return m


def finish(obj, color, bevel=0.03, roughness=0.4, metallic=0.0):
    obj.data.materials.clear()
    obj.data.materials.append(mat(color, roughness, metallic))
    if bevel:
        mod = obj.modifiers.new('b', 'BEVEL')
        mod.width = bevel
        mod.segments = 3
    for p in obj.data.polygons:
        p.use_smooth = True
    return obj


def box(loc, scale, color, bevel=0.03, rot=(0, 0, 0), **kw):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.object
    o.scale = scale
    o.rotation_euler = rot
    return finish(o, color, min(bevel, min(scale) * 0.4), **kw)


def cyl(loc, radius, depth, color, bevel=0.02, rot=(0, 0, 0), **kw):
    bpy.ops.mesh.primitive_cylinder_add(radius=radius, depth=depth, location=loc, vertices=96)
    o = bpy.context.object
    o.rotation_euler = rot
    return finish(o, color, bevel, **kw)


def ball(loc, radius, color, **kw):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=radius, location=loc, segments=48, ring_count=24)
    return finish(bpy.context.object, color, 0, **kw)


def text(body, loc, size, color, rot=(math.pi / 2, 0, 0), extrude=0.04):
    bpy.ops.object.text_add(location=loc, rotation=rot)
    o = bpy.context.object
    o.data.body = body
    o.data.align_x = 'CENTER'
    o.data.align_y = 'CENTER'
    o.data.size = size
    o.data.extrude = extrude
    o.data.materials.append(mat(color, 0.45))
    return o


def wedge(a0, a1, radius, height, color, z=0.0, lift=0.0):
    steps = 24
    verts, faces = [], []
    for k in range(steps + 1):
        a = a0 + (a1 - a0) * k / steps
        verts.append((radius * math.cos(a), radius * math.sin(a), 0))
        verts.append((radius * math.cos(a), radius * math.sin(a), height))
    verts += [(0, 0, 0), (0, 0, height)]
    c0, c1 = len(verts) - 2, len(verts) - 1
    for k in range(steps):
        b = 2 * k
        faces.append((b, b + 2, b + 3, b + 1))
        faces.append((c0, b + 2, b))
        faces.append((c1, b + 1, b + 3))
    faces.append((c0, 0, 1, c1))
    faces.append((c0, c1, 2 * steps + 1, 2 * steps))
    mesh = bpy.data.meshes.new('wedge')
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    o = bpy.data.objects.new('wedge', mesh)
    bpy.context.collection.objects.link(o)
    bpy.context.view_layer.objects.active = o
    o.location = (0, 0, z + lift)
    return finish(o, color, 0)


def aim(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat('-Z', 'Y').to_euler()


def stage(scene, cam=(4.6, -6.2, 4.4), target=(0, 0, 0.6), size=14, lens=50):
    for loc, energy, sz in (((3, -4, 7), 900, 6), ((-5, -3, 4), 280, 6)):
        bpy.ops.object.light_add(type='AREA', location=loc)
        light = bpy.context.object
        light.data.energy = energy
        light.data.size = sz
        aim(light, (0, 0, 0))
    bpy.ops.mesh.primitive_plane_add(size=size, location=(0, 0, 0))
    bpy.context.object.is_shadow_catcher = True
    bpy.ops.object.camera_add(location=cam)
    camera = bpy.context.object
    camera.data.lens = lens
    aim(camera, target)
    scene.camera = camera


def render(scene, folder, name):
    os.makedirs(os.path.join(OUT, folder), exist_ok=True)
    scene.render.resolution_x = 640
    scene.render.resolution_y = 640
    scene.render.filepath = os.path.join(OUT, folder, name + '.png')
    bpy.ops.render.render(write_still=True)


ORANGE, VIOLET, PINK, GOLD, BLUE, GREEN, RED, TEAL, WHITE, SLATE = (
    (0.98, 0.45, 0.12, 1), (0.55, 0.36, 0.96, 1), (0.93, 0.28, 0.6, 1), (0.98, 0.75, 0.15, 1), (0.23, 0.51, 0.96, 1),
    (0.2, 0.7, 0.4, 1), (0.9, 0.2, 0.2, 1), (0.1, 0.65, 0.7, 1), (0.97, 0.97, 0.97, 1), (0.2, 0.24, 0.32, 1))
CREAM, WOOD = (0.96, 0.9, 0.7, 1), (0.8, 0.6, 0.35, 1)


def number_blocks(digits, folder, name, step=1.25, size=1.05, cam_scale=1.0):
    scene = reset()
    palette = [ORANGE, VIOLET, BLUE, GREEN, PINK, GOLD, TEAL, RED]
    x0 = -step * (len(digits) - 1) / 2
    for i, d in enumerate(digits):
        x = x0 + i * step
        box((x, 0, size / 2), (size, size, size), palette[i % len(palette)], bevel=0.08)
        text(d, (x, -size / 2 - 0.01, size / 2), size * 0.8, WHITE)
    stage(scene, cam=(0.8 * cam_scale, -7.5 * cam_scale, 4.0 * cam_scale), target=(0, 0, 0.5))
    render(scene, folder, name)


def c4_numbers():
    number_blocks(['4', '0', '3', '2', '7'], 'class-4', 'numbers', step=1.2, size=1.0, cam_scale=1.05)


def c4_operations():
    scene = reset()
    palette = [ORANGE, BLUE, GREEN]
    for r in range(3):
        for c in range(4):
            ball((-1.6 + c * 1.07, -1.1 + r * 1.07, 0.5), 0.46, palette[r], roughness=0.25)
    stage(scene, cam=(3.4, -7.5, 6.0), target=(0, 0, 0.3), size=12)
    render(scene, 'class-4', 'operations')


def pie(parts, shaded, folder, name, colors=(ORANGE, CREAM)):
    scene = reset()
    cyl((0, 0, 0.05), 2.35, 0.1, WOOD, bevel=0.02)
    gap = math.radians(2.0)
    for k in range(parts):
        a0 = 2 * math.pi * k / parts + gap
        a1 = 2 * math.pi * (k + 1) / parts - gap
        wedge(a0, a1, 2.2, 0.35 if k < shaded else 0.3, colors[0] if k < shaded else colors[1], z=0.1, lift=0.08 if k < shaded else 0)
    stage(scene, cam=(0.0, -6.0, 6.2), target=(0, 0, 0), size=12, lens=45)
    render(scene, folder, name)


def c4_fractions():
    pie(8, 3, 'class-4', 'fractions')


def l_tiles(cells, colors, folder, name, cam=(3.5, -7, 6.5)):
    scene = reset()
    xs = [c[0] for c in cells]
    ys = [c[1] for c in cells]
    cx, cy = (max(xs) + min(xs)) / 2, (max(ys) + min(ys)) / 2
    for i, (x, y) in enumerate(cells):
        box((x - cx, y - cy, 0.12), (0.94, 0.94, 0.24), colors[(x + y) % len(colors)], bevel=0.04)
    stage(scene, cam=cam, target=(0, 0, 0), size=12)
    render(scene, folder, name)


def c4_geometry():
    cells = [(x, y) for x in range(5) for y in range(2)] + [(x, y) for x in range(2) for y in range(2, 5)]
    l_tiles(cells, [ORANGE, GOLD], 'class-4', 'geometry')


def c4_measurement():
    scene = reset()
    box((0, -1.2, 0.07), (5.2, 0.7, 0.14), GOLD, bevel=0.03, roughness=0.3)
    for k in range(21):
        h = 0.34 if k % 5 == 0 else 0.2
        box((-2.5 + k * 0.25, -1.2 - 0.35 + h / 2 * 0.0 + 0.0, 0.16), (0.03, h, 0.03), SLATE, bevel=0)
    cyl((-1.3, 1.0, 0.9), 0.8, 1.8, (0.8, 0.92, 1.0, 1), roughness=0.05)
    cyl((-1.3, 1.0, 0.55), 0.78, 1.1, (0.2, 0.6, 0.95, 1), roughness=0.05)
    box((1.6, 1.0, 0.45), (1.1, 0.8, 0.9), SLATE, bevel=0.08, metallic=0.6, roughness=0.3)
    text('1 kg', (1.6, 0.59, 0.45), 0.32, WHITE)
    stage(scene, cam=(2.0, -7.5, 4.6), target=(0, 0, 0.5), size=14)
    render(scene, 'class-4', 'measurement')


def clock_scene(folder, name, hour_angle, minute_angle, face=WHITE, rim=BLUE):
    scene = reset()
    cyl((0, 0, 0.12), 2.2, 0.24, rim, bevel=0.06, rot=(math.pi / 2, 0, 0))
    bpy.context.object.location = (0, 0, 2.3)
    cyl((0, -0.16, 2.3), 1.95, 0.08, face, rot=(math.pi / 2, 0, 0))
    for k in range(12):
        a = k * math.pi / 6
        box((1.62 * math.sin(a), -0.24, 2.3 + 1.62 * math.cos(a)), (0.1, 0.05, 0.3 if k % 3 == 0 else 0.18), SLATE, bevel=0, rot=(0, -a, 0))
    for length, ang, w, col in ((1.0, hour_angle, 0.16, SLATE), (1.5, minute_angle, 0.1, RED)):
        box((length / 2 * math.sin(ang), -0.3, 2.3 + length / 2 * math.cos(ang)), (w, 0.04, length), col, bevel=0, rot=(0, -ang, 0))
    ball((0, -0.34, 2.3), 0.12, GOLD)
    box((0, 0, 0.1), (3.0, 1.6, 0.2), SLATE, bevel=0.05)
    stage(scene, cam=(0.0, -8.5, 3.6), target=(0, 0, 2.0), size=14)
    render(scene, folder, name)


def c4_time():
    clock_scene('class-4', 'time', math.radians(75), math.radians(180))


def coin_stack(loc, n, color, radius=0.7):
    for k in range(n):
        cyl((loc[0], loc[1], 0.08 + k * 0.17), radius, 0.15, color, bevel=0.03, metallic=0.85, roughness=0.28)


def c4_money():
    scene = reset()
    coin_stack((-1.7, 0, 0), 5, GOLD)
    coin_stack((-0.3, 0.2, 0), 3, (0.78, 0.8, 0.84, 1), radius=0.62)
    coin_stack((1.1, -0.1, 0), 7, (0.9, 0.55, 0.2, 1), radius=0.66)
    box((0.2, -1.8, 0.03), (2.6, 1.3, 0.06), GREEN, bevel=0.02, roughness=0.6, rot=(0, 0, math.radians(-8)))
    text('Rs 50', (0.2, -1.8, 0.1), 0.4, WHITE, rot=(0, 0, math.radians(-8)), extrude=0.01)
    stage(scene, cam=(1.5, -8.0, 4.8), target=(0, -0.3, 0.4), size=14)
    render(scene, 'class-4', 'money')


def bars(heights, colors, folder, name):
    scene = reset()
    box((0, 0, 0.1), (len(heights) * 1.25 + 0.4, 1.8, 0.2), SLATE, bevel=0.05)
    x0 = -(len(heights) - 1) * 1.1 / 2
    for i, h in enumerate(heights):
        box((x0 + i * 1.1, 0, 0.2 + h / 2), (0.85, 0.85, h), colors[i % len(colors)], bevel=0.05)
    stage(scene, cam=(3.0, -8.2, 4.8), target=(0, 0, 1.4), size=14)
    render(scene, folder, name)


def c4_data():
    bars([1.2, 2.4, 1.8, 3.0], [ORANGE, BLUE, GREEN, VIOLET], 'class-4', 'data')


def c4_reasoning():
    scene = reset()
    for i, (letter, color) in enumerate((('A', ORANGE), ('B', VIOLET), ('C', GREEN))):
        x = -1.7 + i * 1.7
        box((x, 0, 0.7), (1.35, 1.35, 1.4), color, bevel=0.1)
        text(letter, (x, -0.69, 0.7), 1.0, WHITE)
    box((0, 0.1, 2.0), (1.35, 1.35, 1.35), GOLD, bevel=0.1, rot=(0, 0, math.radians(18)))
    text('?', (0.0, -0.62, 2.0), 1.0, SLATE, rot=(math.pi / 2, 0, math.radians(18)))
    stage(scene, cam=(1.5, -8.2, 4.8), target=(0, 0, 1.0), size=14)
    render(scene, 'class-4', 'reasoning')


def c5_numbers():
    number_blocks(['3', '5', '0', '2', '7', '1', '8', '4'], 'class-5', 'numbers', step=1.0, size=0.88, cam_scale=1.25)


def c5_operations():
    scene = reset()
    palette = [ORANGE, BLUE, GREEN]
    for g, (cols, rows, x) in enumerate(((2, 3, -2.2), (3, 2, 0.2), (2, 2, 2.4))):
        for i in range(cols):
            for j in range(rows):
                box((x + i * 0.95, -0.5 + j * 0.0, 0.45 + j * 0.9), (0.85, 0.85, 0.85), palette[g], bevel=0.06)
    stage(scene, cam=(2.4, -9.0, 5.0), target=(0, 0, 1.0), size=16)
    render(scene, 'class-5', 'operations')


def c5_fractions():
    scene = reset()
    for r in range(2):
        for c in range(6):
            on = (r * 6 + c) < 7
            box((-2.5 + c * 1.0, -0.6 + r * 1.0, 0.2), (0.92, 0.92, 0.4), ORANGE if on else CREAM, bevel=0.06, roughness=0.5)
    stage(scene, cam=(2.5, -6.4, 6.4), target=(0, 0, 0), size=14)
    render(scene, 'class-5', 'fractions')


def c5_decimals():
    scene = reset()
    for r in range(10):
        for c in range(10):
            on = (c < 3) or (c == 3 and r < 7)
            box((-2.25 + c * 0.5, -2.25 + r * 0.5, 0.06), (0.46, 0.46, 0.12), TEAL if on else CREAM, bevel=0.02, roughness=0.5)
    stage(scene, cam=(2.2, -6.0, 6.2), target=(0, 0, 0), size=14, lens=45)
    render(scene, 'class-5', 'decimals')


def c5_geometry():
    scene = reset()
    box((0, 0, 0.05), (4.0, 3.0, 0.1), CREAM, bevel=0.02)
    arm = 2.2
    for ang, col in ((0, BLUE), (math.radians(55), ORANGE)):
        box((arm / 2 * math.cos(ang) - 1.5, arm / 2 * math.sin(ang) - 1.0, 0.2), (arm, 0.12, 0.14), col, bevel=0.02, rot=(0, 0, ang))
    ball((-1.5, -1.0, 0.2), 0.14, SLATE)
    major = 1.0
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=0.03, location=(-1.5, -1.0, 0.18), major_segments=96, minor_segments=8)
    t = bpy.context.object
    finish(t, RED, 0)
    stage(scene, cam=(1.0, -5.5, 6.0), target=(0, 0, 0), size=12, lens=40)
    render(scene, 'class-5', 'geometry')


def c5_measurement():
    scene = reset()
    cyl((0, 0, 0.2), 1.1, 0.4, SLATE, bevel=0.05)
    cyl((0, 0, 1.3), 0.12, 2.2, SLATE, bevel=0.02)
    tilt = math.radians(-8)
    box((0, 0, 2.4), (4.6, 0.2, 0.14), GOLD, bevel=0.03, rot=(0, tilt, 0), metallic=0.6, roughness=0.3)
    for side in (-1, 1):
        px = side * 2.2 * math.cos(tilt)
        pz = 2.4 + side * 2.2 * math.sin(-tilt) * -1
        cyl((px, 0, pz - 0.9), 0.85, 0.08, BLUE, bevel=0.02, metallic=0.5, roughness=0.3)
        for k, off in enumerate((-0.45, 0.0, 0.45)):
            box((px, off * 0.8, pz - 0.7 + 0.05), (0.01, 0.01, 0.01), WHITE, bevel=0)
    for k in range(3):
        box((-2.2 * math.cos(tilt) + (k - 1) * 0.5, 0, 1.6 + 0.0), (0.4, 0.4, 0.4), ORANGE, bevel=0.04)
    box((2.2 * math.cos(tilt), 0, 1.8), (0.9, 0.9, 0.9), VIOLET, bevel=0.05)
    stage(scene, cam=(1.5, -8.4, 4.0), target=(0, 0, 1.5), size=14)
    render(scene, 'class-5', 'measurement')


def c5_time():
    scene = reset()
    box((0, 0, 0.12), (5.0, 3.6, 0.24), BLUE, bevel=0.08)
    box((0, -1.55, 0.3), (5.0, 0.5, 0.2), RED, bevel=0.04)
    for r in range(4):
        for c in range(7):
            box((-2.1 + c * 0.7, -0.75 + r * 0.7 + 0.45, 0.32), (0.58, 0.58, 0.08), GOLD if (r, c) == (1, 3) else WHITE, bevel=0.02, roughness=0.5)
    stage(scene, cam=(1.5, -7.0, 7.0), target=(0, 0, 0), size=14, lens=45)
    render(scene, 'class-5', 'time')


def c5_money():
    scene = reset()
    body = ball((0, 0, 1.3), 1.25, PINK, roughness=0.3)
    body.scale = (1.15, 0.9, 0.95)
    ball((1.35, 0, 1.2), 0.5, PINK, roughness=0.3).scale = (0.8, 0.8, 0.7)
    for sx in (-0.5, 0.5):
        box((sx, 0.0, 0.3), (0.35, 0.35, 0.5), PINK, bevel=0.1)
    for sy in (-0.3, 0.3):
        box((-0.1, sy * 2, 0.3), (0.35, 0.35, 0.5), PINK, bevel=0.1)
    for sy in (-0.45, 0.45):
        box((0.9, sy, 2.1), (0.3, 0.3, 0.35), PINK, bevel=0.06, rot=(0, 0.3, 0))
    ball((1.7, -0.22, 1.3), 0.06, SLATE)
    ball((1.7, 0.22, 1.3), 0.06, SLATE)
    box((-0.2, 0, 2.2), (0.9, 0.12, 0.05), SLATE, bevel=0)
    cyl((-0.2, -2.0, 0.9), 0.55, 0.12, GOLD, rot=(math.pi / 2, 0, 0), metallic=0.85, roughness=0.28)
    coin_stack((-2.4, -1.4, 0), 4, GOLD, radius=0.5)
    stage(scene, cam=(1.0, -8.5, 4.2), target=(0, -0.3, 1.1), size=14)
    render(scene, 'class-5', 'money')


def c5_data():
    scene = reset()
    start = 0.0
    colors = [ORANGE, BLUE, GREEN, VIOLET]
    shares = [0.4, 0.25, 0.2, 0.15]
    gap = math.radians(1.5)
    for share, col in zip(shares, colors):
        a1 = start + 2 * math.pi * share
        wedge(start + gap, a1 - gap, 2.2, 0.5, col, z=0.0, lift=0.0)
        start = a1
    stage(scene, cam=(0.0, -5.8, 6.4), target=(0, 0, 0), size=12, lens=45)
    render(scene, 'class-5', 'data')


def c5_reasoning():
    scene = reset()
    box((0, 0, 1.2), (0.12, 3.6, 2.4), (0.75, 0.88, 1.0, 1), bevel=0.02, metallic=0.9, roughness=0.05)
    for sx, flip in ((-1.5, 1), (1.5, -1)):
        box((sx, 0, 0.7), (1.3, 1.3, 1.4), ORANGE, bevel=0.1)
        t = text('R', (sx, -0.67, 0.7), 1.0, WHITE)
        if flip < 0:
            t.location = (sx, -0.67, 0.7)
            t.scale = (-1, 1, 1)
    stage(scene, cam=(0.0, -8.5, 4.4), target=(0, 0, 1.0), size=14)
    render(scene, 'class-5', 'reasoning')


for fn in (c4_numbers, c4_operations, c4_fractions, c4_geometry, c4_measurement, c4_time, c4_money, c4_data, c4_reasoning,
           c5_numbers, c5_operations, c5_fractions, c5_decimals, c5_geometry, c5_measurement, c5_time, c5_money, c5_data, c5_reasoning):
    fn()
