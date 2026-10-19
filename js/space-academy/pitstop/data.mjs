// Pit Stop data: one ship, one sky and one chapter-to-part map per class.
// A class's grade id equals its class id and matches curriculum.mjs. Part order is build order.
// Every class has as many sky objects as parts: finishing part k unlocks the flight to sky object k.

const part = (id, label, topic, chapters) => ({ id, label, topic, chapters });

export const CLASSES = [
  {
    id: 'pp1', label: 'PP1', shipName: 'Bubble Pod', skyName: 'Home Sky',
    story: 'Build a bubble pod and visit the sky you can see from home.',
    parts: [
      part('body', 'Body', 'Counting', ['counting']),
      part('window', 'Window', 'Shapes', ['shapes']),
      part('legs', 'Legs', 'Where is it?', ['position']),
      part('side-fins', 'Side fins', 'Sorting', ['sorting']),
      part('antenna', 'Antenna', 'Patterns', ['patterns']),
      part('engine', 'Engine', 'More or fewer', ['comparing']),
    ],
    sky: ['sun', 'moon', 'earth', 'comet', 'star', 'milky-way', 'venus', 'meteor-shower', 'saturn', 'nebula'],
  },
  {
    id: 'pp2', label: 'PP2', shipName: 'Paper Jet', skyName: 'Rocky Planets',
    story: 'Fold a paper jet and zoom past the rocky planets.',
    parts: [
      part('cockpit', 'Cockpit', 'Numbers', ['numbers']),
      part('left-wing', 'Left wing', 'Add and take', ['operations']),
      part('right-wing', 'Right wing', 'Patterns', ['patterns']),
      part('nose', 'Nose', 'Shapes', ['shapes']),
      part('tail', 'Tail', 'Long and short', ['measurement']),
      part('engine', 'Engine', 'Picture detective', ['reasoning']),
    ],
    sky: ['mercury', 'venus', 'mars', 'phobos', 'satellite', 'deimos', 'jupiter', 'saturn', 'uranus', 'neptune'],
  },
  {
    id: 'class-1', label: 'Class 1', shipName: 'Classic Rocket', skyName: 'Asteroid Belt',
    story: 'Launch a classic rocket into the busy asteroid belt.',
    parts: [
      part('upper-body', 'Upper body', 'Numbers', ['numbers']),
      part('lower-body', 'Lower body', 'Add and take', ['operations']),
      part('window', 'Window', 'Patterns and clues', ['patterns', 'reasoning']),
      part('nose', 'Nose', 'Shapes', ['geometry']),
      part('fins', 'Fins', 'Measure and time', ['measurement', 'time']),
      part('engine', 'Engine', 'Money', ['money']),
    ],
    sky: ['ceres', 'vesta', 'ice-comet', 'twin-rocks', 'gold-rock', 'meteor-shower', 'comet', 'kuiper-rock', 'pluto', 'eris'],
  },
  {
    id: 'class-2', label: 'Class 2', shipName: 'Twin Shuttle', skyName: 'Giant Planets',
    story: 'Fly a twin-booster shuttle out to the giant planets.',
    parts: [
      part('cockpit', 'Cockpit', 'Numbers', ['numbers']),
      part('left-booster', 'Left booster', 'Add and take', ['operations']),
      part('right-booster', 'Right booster', 'Codes and patterns', ['patterns']),
      part('nose', 'Nose', 'Geometry', ['geometry']),
      part('wings', 'Wings', 'Measure and time', ['measurement', 'time']),
      part('engine', 'Engine', 'Money and data', ['money', 'data']),
    ],
    sky: ['jupiter', 'saturn', 'io', 'europa', 'titan', 'ganymede', 'uranus', 'neptune', 'triton', 'charon'],
  },
  {
    id: 'class-3', label: 'Class 3', shipName: 'Wing Fighter', skyName: 'Ice Edge',
    story: 'Pilot a wing fighter to the icy edge of the solar system.',
    parts: [
      part('fuselage', 'Fuselage', 'Numbers', ['numbers']),
      part('upper-wings', 'Upper wings', 'Add, take, times', ['operations']),
      part('lower-wings', 'Lower wings', 'Fractions', ['fractions']),
      part('cockpit', 'Cockpit', 'Logic', ['reasoning']),
      part('nose', 'Nose', 'Shapes and mirrors', ['geometry']),
      part('lasers', 'Lasers', 'Measure and time', ['measurement', 'time']),
      part('engines', 'Engines', 'Money and data', ['money', 'data']),
    ],
    sky: ['uranus', 'neptune', 'pluto', 'triton', 'kuiper-rock', 'charon', 'eris', 'comet', 'nebula', 'pulsar'],
  },
  {
    id: 'class-4', label: 'Class 4', shipName: 'Hex Interceptor', skyName: 'Deep Space',
    story: 'Command a hex interceptor into deep space.',
    parts: [
      part('pod', 'Pod', 'Numbers', ['numbers']),
      part('left-panel', 'Left panel', 'Operations', ['operations']),
      part('right-panel', 'Right panel', 'Fractions', ['fractions']),
      part('window', 'Window', 'Logic', ['reasoning']),
      part('struts', 'Struts', 'Perimeter and symmetry', ['geometry']),
      part('guns', 'Guns', 'Measure and time', ['measurement', 'time']),
      part('engine', 'Engine', 'Money and data', ['money', 'data']),
    ],
    sky: ['nebula', 'pulsar', 'black-hole', 'neutron-star', 'cluster', 'supernova', 'red-giant', 'galaxy', 'exoplanet', 'wormhole'],
  },
  {
    id: 'class-5', label: 'Class 5', shipName: 'Wedge Flagship', skyName: 'Far Galaxies',
    story: 'Take the wedge flagship beyond our galaxy.',
    parts: [
      part('bow', 'Bow', 'Numbers', ['numbers']),
      part('armour', 'Armour plates', 'Operations', ['operations']),
      part('turrets', 'Turrets', 'Fractions and decimals', ['fractions', 'decimals']),
      part('bridge', 'Bridge tower', 'Area and angles', ['geometry']),
      part('dish', 'Dish', 'Logic', ['reasoning']),
      part('hangar', 'Hangar', 'Measure and time', ['measurement', 'time']),
      part('engine-row', 'Engine row', 'Money and data', ['money', 'data']),
    ],
    sky: ['galaxy', 'exoplanet', 'twin-suns', 'wormhole', 'quasar', 'supercluster', 'cosmic-web', 'black-hole', 'neutron-star', 'supernova'],
  },
];

export const CLASS_IDS = CLASSES.map(item => item.id);
export const classById = id => CLASSES.find(item => item.id === id) ?? null;
export const ALL_SKY_IDS = [...new Set(CLASSES.flatMap(item => item.sky))];

// Printable reward track for one finished practice paper (35 questions, one reward per correct answer).
export const PAPER_QUESTIONS = 35;
export const PAINTS = [
  { id: 'cream', name: 'Cream', color: '#fffdf8' },
  { id: 'coral', name: 'Coral', color: '#ff8a65' },
  { id: 'sun', name: 'Sunshine', color: '#ffd166' },
  { id: 'mint', name: 'Mint', color: '#7fd9b8' },
  { id: 'sky', name: 'Sky blue', color: '#74b9ff' },
  { id: 'grape', name: 'Grape', color: '#a78bfa' },
  { id: 'rose', name: 'Rose', color: '#ff7eb6' },
  { id: 'lime', name: 'Lime', color: '#b5e655' },
];
export const STICKERS = [
  'star', 'heart', 'bolt', 'moon', 'rocket', 'planet', 'smile', 'flame', 'crown', 'flag',
  'comet', 'ring', 'otter', 'gem', 'leaf', 'cloud', 'cat', 'fish', 'wave', 'sun',
  'check', 'dot', 'zig', 'spiral', 'eye', 'bee',
];
// Reward n of 35: a mix so the first prints are colours and the paper ends on stickers.
export const PAPER_REWARDS = [
  ...PAINTS.slice(1).map(item => ({ kind: 'paint', id: item.id })),
  ...STICKERS.map(id => ({ kind: 'sticker', id })),
].slice(0, PAPER_QUESTIONS);

export const LEVEL_NAMES = ['Cadet', 'Pilot', 'Captain', 'Commander'];
