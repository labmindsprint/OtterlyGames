import { GRADES, getGrade } from './curriculum.mjs';
import { DESTINATIONS, PARTS } from './destinations.mjs';

export const CAMPAIGN_VERSION = 1;

const schoolSystems = (grade) => ({
  engine: ['operations'],
  body: ['geometry'],
  cockpit: ['numbers'],
  nose: ['measurement', 'time'],
  'left-fin': grade === 'class-5' ? ['fractions', 'decimals', 'money']
    : ['class-3', 'class-4'].includes(grade) ? ['fractions', 'money'] : ['money'],
  'right-fin': grade === 'class-1' ? ['patterns', 'reasoning']
    : grade === 'class-2' ? ['patterns', 'data'] : ['data', 'reasoning'],
});

const specifications = [
  {
    grade: 'pp1', id: 'moon-camp', title: 'Moon Camp', region: 'Earth and its neighbourhood',
    description: 'Collect picture parts, build your first little explorer and follow three nearby signals.',
    activity: 'Count and collect the right picture parts.', accent: '#d1a64f',
    destinations: ['earth', 'moon', 'iss'],
    systems: {
      engine: ['counting'], body: ['shapes'], cockpit: ['patterns'],
      nose: ['comparing'], 'left-fin': ['sorting'], 'right-fin': ['position'],
    },
  },
  {
    grade: 'pp2', id: 'planet-hopper', title: 'Planet Hopper', region: 'The inner solar system',
    description: 'Follow a picture blueprint, assemble a lander and observe the inner solar system.',
    activity: 'Choose and place components to complete a pattern blueprint.', accent: '#c37856',
    destinations: ['sun', 'mercury', 'venus'],
    systems: {
      engine: ['operations'], body: ['shapes'], cockpit: ['numbers'],
      nose: ['measurement'], 'left-fin': ['patterns'], 'right-fin': ['reasoning'],
    },
  },
  {
    grade: 'class-1', id: 'mars-rover-rescue', title: 'Mars Rover Rescue', region: 'Mars and beyond',
    description: 'Repair your rover, collect supplies on a grid and travel in its orbital carrier.',
    activity: 'Drive around obstacles, collect repair crates and reach the exit.', accent: '#bd6a55',
    destinations: ['mars', 'asteroid_belt', 'jupiter'],
    systems: schoolSystems('class-1'),
  },
  {
    grade: 'class-2', id: 'outer-planet-voyager', title: 'Outer Planet Voyager', region: 'The outer solar system',
    description: 'Equip a robotic probe and balance supplies, fuel and capacity for a series of flybys.',
    activity: 'Load a probe while meeting supply, fuel and capacity conditions.', accent: '#628ba4',
    destinations: ['saturn', 'enceladus', 'uranus', 'neptune', 'pluto'],
    systems: schoolSystems('class-2'),
  },
  {
    grade: 'class-3', id: 'star-navigator', title: 'Star Navigator', region: 'Beyond our solar system',
    description: 'Build an explorer and plot fuel-limited routes through checkpoint beacons.',
    activity: 'Plot a connected route through the checkpoint within the fuel allowance.', accent: '#4e927f',
    destinations: ['oort_cloud', 'alpha_centauri', 'betelgeuse', 'sirius'],
    systems: schoolSystems('class-3'),
  },
  {
    grade: 'class-4', id: 'nebula-research-station', title: 'Nebula Research Station', region: 'Nebulae and stellar remnants',
    description: 'Assemble a research station, connect its modules and survey clouds and remnants of stars.',
    activity: 'Place and rotate station modules without overlap, connected to the core.', accent: '#8971a5',
    destinations: ['pillars_of_creation', 'orion_nebula', 'butterfly_nebula', 'ring_nebula', 'crab_nebula', 'pulsar'],
    systems: schoolSystems('class-4'),
  },
  {
    grade: 'class-5', id: 'galaxy-command', title: 'Galaxy Command', region: 'Galaxies and deep space',
    description: 'Equip a modular flagship and dispatch probes under linked mission and resource constraints.',
    activity: 'Assign probes to sectors while meeting budget, energy and science requirements.', accent: '#536eab',
    destinations: ['milky_way', 'andromeda', 'sombrero', 'whirlpool', 'quasar', 'black_hole'],
    systems: schoolSystems('class-5'),
  },
];

function defineCampaign(specification) {
  const grade = getGrade(specification.grade);
  const systems = PARTS.map(part => Object.freeze({
    id: part.id,
    chapters: Object.freeze([...specification.systems[part.id]]),
  }));
  const assigned = systems.flatMap(system => system.chapters);
  if (assigned.length !== grade.chapters.length || new Set(assigned).size !== assigned.length ||
      grade.chapters.some(chapter => !assigned.includes(chapter.id))) {
    throw new Error(`Campaign chapter objectives are incomplete for ${grade.id}.`);
  }
  const stages = specification.destinations.map((destination, index, destinations) => {
    if (!DESTINATIONS.some(world => world.id === destination)) throw new Error(`Unknown campaign destination: ${destination}`);
    const count = 3 + Math.ceil(index * 3 / (destinations.length - 1));
    return Object.freeze({
      index, destination,
      parts: Object.freeze(PARTS.slice(0, count).map(part => part.id)),
    });
  });
  return Object.freeze({
    ...specification, version: CAMPAIGN_VERSION,
    systems: Object.freeze(systems),
    destinations: Object.freeze([...specification.destinations]),
    stages: Object.freeze(stages),
    questionTarget: grade.missionSize,
  });
}

export const CAMPAIGNS = Object.freeze(Object.fromEntries(
  specifications.map(specification => [specification.grade, defineCampaign(specification)]),
));

const route = Object.values(CAMPAIGNS).flatMap(campaign => campaign.destinations);
if (Object.keys(CAMPAIGNS).length !== GRADES.length || route.length !== DESTINATIONS.length ||
    new Set(route).size !== route.length || DESTINATIONS.some(world => !route.includes(world.id))) {
  throw new Error('Campaign routes must cover every universe object once, across all seven grades.');
}

export function getCampaign(gradeId) {
  const campaign = CAMPAIGNS[gradeId];
  if (!campaign) throw new Error(`Unknown campaign grade: ${gradeId}`);
  return campaign;
}

export function chapterSystem(gradeId, chapterId) {
  const system = getCampaign(gradeId).systems.find(system => system.chapters.includes(chapterId));
  if (!system) throw new Error(`Unknown campaign chapter: ${gradeId}/${chapterId}`);
  return system;
}

export function activitySeed(gradeId, stageIndex) {
  const campaign = getCampaign(gradeId);
  if (!Number.isSafeInteger(stageIndex) || !campaign.stages[stageIndex]) throw new Error('The expedition stage is invalid.');
  return `${campaign.id}-v${CAMPAIGN_VERSION}-${stageIndex}`;
}
