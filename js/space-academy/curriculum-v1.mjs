// Frozen with questions-v1.mjs: saved missions must regenerate byte-for-byte.
export const CONTENT_VERSION = 1;
export const LEVELS = [
  { id: 1, name: 'Explore', description: 'Build an idea with pictures and straightforward questions.' },
  { id: 2, name: 'Reason', description: 'Connect ideas, find missing information and explain a method.' },
  { id: 3, name: 'Stretch', description: 'Try multi-step problems and less familiar applications.' },
];

export const SKILLS = {
  count: ['Counting objects', 'Touch or point to each object once; the last number tells how many.'],
  compare: ['Comparing quantities', 'Compare the values, not the size or spacing of their pictures.'],
  repeat: ['Repeating patterns', 'Find the smallest repeating group and continue that group.'],
  odd: ['Sorting by a rule', 'Check which object does not share the named property.'],
  position: ['Position and order', 'Use the given left-to-right order, then count or locate a neighbour.'],
  shape: ['Shapes and their properties', 'Count straight sides and corners carefully. A curved edge is not a straight side.'],
  sequence: ['Number patterns', 'Look for the same change between neighbouring numbers.'],
  addition: ['Addition and missing amounts', 'Combine the amounts, or work backwards from the total.'],
  subtraction: ['Subtraction and change', 'Start with the original amount and take away what was used.'],
  place: ['Place value', 'A digit has a different value in each position. Count the places from the right.'],
  expand: ['Building numbers', 'Combine the place-value parts, including any zero places.'],
  groups: ['Equal groups and multi-step problems', 'Find the total in equal groups before applying the next change.'],
  sharing: ['Equal sharing', 'Divide into equal groups. Check by multiplying your answer by the number of groups.'],
  measure: ['Measurement and conversions', 'Use the same unit before adding or comparing measurements.'],
  time: ['Clocks and elapsed time', 'Separate hours and minutes. There are 60 minutes in one hour.'],
  money: ['Money and change', 'Find the total cost first, then subtract it from the amount paid.'],
  chart: ['Reading data', 'Read the labels and the key before comparing or combining values.'],
  'fraction-read': ['Reading fractions', 'The denominator counts all equal parts; the numerator counts the shaded parts.'],
  'fraction-of': ['Fractions of a group', 'Find one equal share first, then take the required number of shares.'],
  'fraction-compare': ['Comparing fractions', 'Compare fractions of the same whole. A common denominator can help.'],
  decimals: ['Decimals and place value', 'Line up decimal places. One hundredth is one of 100 equal parts.'],
  perimeter: ['Perimeter', 'Add the lengths around the outside. Do not confuse perimeter with area.'],
  area: ['Area of rectangles', 'Count equal square units, or multiply the length by the width.'],
  angles: ['Angles', 'A right angle is 90 degrees; a straight angle is 180 degrees.'],
  symmetry: ['Reflection and symmetry', 'A mirror reverses left and right, but not top and bottom.'],
  coding: ['Coding and decoding', 'Apply the stated code consistently to each letter.'],
  ranking: ['Ranking and order', 'Include the person being counted when converting a rank from one end to the other.'],
  directions: ['Direction sense', 'Track north/south and east/west movements separately.'],
  mystery: ['Working backwards', 'Undo the last operation first, then undo the earlier operation.'],
  combinations: ['Possible combinations', 'Match each choice in the first group with every allowed choice in the second.'],
};

const chapter = (id, title, description, skills, section = 'maths') => ({
  id, title, description, skills, section,
});
const numbers = (digits) => chapter('numbers', 'Number detectives', `Build, compare and investigate ${digits}-digit numbers.`, ['place', 'expand', 'compare']);
const operations = () => chapter('operations', 'Mission mathematics', 'Use equal groups, sharing and more than one step to solve a problem.', ['groups', 'sharing', 'mystery']);
const fractions = () => chapter('fractions', 'Fraction lab', 'See equal parts, find a fraction of a group and compare the same whole.', ['fraction-read', 'fraction-of', 'fraction-compare']);
const measurement = () => chapter('measurement', 'Measure the mission', 'Compare lengths and convert measurements before using them.', ['measure', 'compare'], 'everyday');
const clocks = () => chapter('time', 'Time travellers', 'Read clocks and work out when a journey ends.', ['time', 'sequence'], 'everyday');
const shop = () => chapter('money', 'Space supplies', 'Work out costs, budgets and change.', ['money', 'addition'], 'everyday');
const data = () => chapter('data', 'Mission data', 'Read a chart, use its key and compare or combine results.', ['chart', 'compare']);
const logic = (older = false) => chapter('reasoning', 'Logic launchpad', 'Use clues, codes and careful ordering rather than guessing.', older ? ['coding', 'directions', 'ranking', 'combinations'] : ['coding', 'ranking', 'symmetry'], 'reasoning');

export const GRADES = [
  {
    id: 'pp1', label: 'PP1', year: -1, missionSize: 5,
    description: 'Picture-led counting, sorting and early reasoning. Read together; there is no timer.',
    reference: null,
    chapters: [
      chapter('counting', 'Little star counters', 'Count small collections, one object at a time.', ['count']),
      chapter('patterns', 'Pattern planets', 'Continue a repeating picture pattern.', ['repeat'], 'reasoning'),
      chapter('shapes', 'Shape station', 'Explore circles, triangles, squares and rectangles.', ['shape']),
      chapter('sorting', 'Sorting satellites', 'Find the picture that does not follow a stated rule.', ['odd'], 'reasoning'),
      chapter('position', 'Where is the rover?', 'Explore before, after and left-to-right order.', ['position'], 'reasoning'),
      chapter('comparing', 'More or fewer?', 'Compare two small groups without a stopwatch.', ['compare', 'count']),
    ],
  },
  {
    id: 'pp2', label: 'PP2', year: 0, missionSize: 5,
    description: 'Explore numbers to 20, picture problems and playful reasoning at your own pace.',
    reference: null,
    chapters: [
      chapter('numbers', 'Number neighbours', 'Count, compare and find a missing neighbour.', ['count', 'sequence', 'compare']),
      chapter('operations', 'Add a little, take a little', 'Use pictures to combine groups and find what remains.', ['addition', 'subtraction']),
      chapter('patterns', 'Pattern workshop', 'Continue repeating groups and simple number patterns.', ['repeat', 'sequence'], 'reasoning'),
      chapter('shapes', 'Shape explorers', 'Notice sides, corners and where shapes sit.', ['shape', 'position']),
      chapter('measurement', 'Long and short', 'Compare lengths using the same little measuring blocks.', ['measure', 'compare'], 'everyday'),
      chapter('reasoning', 'Picture detectives', 'Sort by a rule and use position clues.', ['odd', 'position', 'repeat'], 'reasoning'),
    ],
  },
  {
    id: 'class-1', label: 'Class 1', year: 1, missionSize: 8,
    description: 'Two-digit numbers, everyday maths and original visual-reasoning challenges.',
    chapters: [
      numbers(2),
      chapter('operations', 'Add, subtract, investigate', 'Find totals, missing amounts and what remains.', ['addition', 'subtraction', 'mystery']),
      chapter('patterns', 'Patterns and clues', 'Continue number and picture rules.', ['sequence', 'repeat'], 'reasoning'),
      chapter('geometry', 'Shapes in space', 'Look closely at straight sides, corners and position.', ['shape', 'position']),
      measurement(), clocks(), shop(),
      chapter('reasoning', 'Picture reasoning', 'Use a sorting rule and careful ordering.', ['odd', 'position', 'ranking'], 'reasoning'),
    ],
  },
  {
    id: 'class-2', label: 'Class 2', year: 2, missionSize: 8,
    description: 'Three-digit numbers, equal groups, measurement, pictographs and reasoning.',
    chapters: [
      numbers(3), operations(),
      chapter('patterns', 'Codes and patterns', 'Use a stated code, number rule or picture sequence.', ['sequence', 'repeat', 'coding'], 'reasoning'),
      chapter('geometry', 'Geometry explorers', 'Investigate shapes and their positions.', ['shape', 'position', 'symmetry']),
      measurement(), clocks(), shop(), data(),
    ],
  },
  {
    id: 'class-3', label: 'Class 3', year: 3, missionSize: 8,
    description: 'Four-digit numbers, fractions, multi-step applications, data and logical reasoning.',
    chapters: [
      numbers(4), operations(), fractions(),
      chapter('geometry', 'Shapes and reflections', 'Investigate shape properties and mirror images.', ['shape', 'symmetry']),
      measurement(), clocks(), shop(), data(), logic(),
    ],
  },
  {
    id: 'class-4', label: 'Class 4', year: 4, missionSize: 8,
    description: 'Larger numbers, fractions, perimeter, conversions and connected reasoning.',
    chapters: [
      numbers(5), operations(), fractions(),
      chapter('geometry', 'Perimeter and symmetry', 'Distinguish the boundary of a shape from its properties.', ['perimeter', 'shape', 'symmetry']),
      measurement(), clocks(), shop(), data(), logic(true),
    ],
  },
  {
    id: 'class-5', label: 'Class 5', year: 5, missionSize: 8,
    description: 'Seven- and eight-digit number sense, fractions, decimals, angles, area and reasoning.',
    chapters: [
      numbers(8), operations(), fractions(),
      chapter('decimals', 'Decimal discoveries', 'Read hundredths, compare decimals and calculate accurately.', ['decimals']),
      chapter('geometry', 'Area, perimeter and angles', 'Choose the right measurement for a shape problem.', ['area', 'perimeter', 'angles']),
      measurement(), clocks(), shop(), data(), logic(true),
    ],
  },
].map(grade => ({
  ...grade,
  reference: grade.year > 0 ? {
    title: `SOF IMO Class ${grade.year} published topic syllabus`,
    url: `https://sofworld.org/imo/class-${grade.year}/imo-syllabus/imo-syllabus-class-${grade.year}`,
  } : null,
}));

export function getGrade(id) {
  const grade = GRADES.find(item => item.id === id);
  if (!grade) throw new RangeError(`Unknown Academy grade: ${id}`);
  return grade;
}

export function getChapter(gradeId, chapterId) {
  const chapter = getGrade(gradeId).chapters.find(item => item.id === chapterId);
  if (!chapter) throw new RangeError(`Unknown Academy chapter: ${gradeId}/${chapterId}`);
  return chapter;
}

export function chapterRoute(gradeId, chapterId) {
  getChapter(gradeId, chapterId);
  return `/learn/olympiad/${gradeId}/${chapterId}.html`;
}

export function gameLink({ grade = 'class-1', chapter, level = 1, mode = 'chapter', seed } = {}) {
  getGrade(grade);
  if (mode === 'chapter') getChapter(grade, chapter ?? getGrade(grade).chapters[0].id);
  if (!LEVELS.some(item => item.id === level)) throw new RangeError('Choose an Academy challenge level from 1 to 3.');
  if (!['chapter', 'mixed', 'paper'].includes(mode)) throw new RangeError('Unknown Academy mission mode.');
  if (mode === 'paper' && getGrade(grade).year < 1) throw new RangeError('Pre-primary missions are not exam papers.');
  const query = new URLSearchParams({ grade, mode, level: String(level) });
  if (mode === 'chapter') query.set('chapter', chapter ?? getGrade(grade).chapters[0].id);
  if (seed !== undefined) {
    if (!/^[A-Za-z0-9_-]{1,40}$/.test(seed)) throw new RangeError('A mission seed needs 1-40 letters, numbers, hyphens or underscores.');
    query.set('seed', seed);
  }
  return `/play/space-academy.html?${query}`;
}
