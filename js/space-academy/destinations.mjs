export const ART_ROOT = '/games/clockmaster/art/universe/';
export const PARTS = [
  { id: 'engine', name: 'Engine', purpose: 'Pushes the rocket forward.', x: 50, y: 82 },
  { id: 'body', name: 'Fuel body', purpose: 'Holds the rocket together and carries its fuel.', x: 50, y: 56 },
  { id: 'cockpit', name: 'Crew capsule', purpose: 'A protected place for the explorers.', x: 50, y: 35 },
  { id: 'nose', name: 'Nose cone', purpose: 'The pointed top of our rocket.', x: 50, y: 14 },
  { id: 'left-fin', name: 'Left fin', purpose: 'One of the stabilising fins near the base.', x: 26, y: 68 },
  { id: 'right-fin', name: 'Right fin', purpose: 'The matching fin on the other side.', x: 74, y: 68 },
];
export const PAINTS = [
  { id: 'coral', name: 'Solar coral', color: '#fc9879' },
  { id: 'mint', name: 'Comet mint', color: '#77ddcc' },
  { id: 'violet', name: 'Nebula violet', color: '#b8a2f5' },
];
const worlds = [
  ['earth', 'Earth orbit', 'Our home planet', 'Earth has liquid-water oceans and an atmosphere. This adventure begins above our home planet.'],
  ['moon', 'The Moon', 'Our nearest natural neighbour', 'The Moon orbits Earth. Its surface has many impact craters, and it shines by reflecting sunlight.'],
  ['iss', 'International Space Station', 'A laboratory in orbit', 'The ISS is a human-built laboratory that orbits Earth. It is a spacecraft, not a natural moon.'],
  ['sun', 'The Sun', 'Our local star', 'The Sun is a star. We observe it from a safe imaginary distance; a rocket cannot land on its hot surface.'],
  ['mercury', 'Mercury', 'The innermost planet', 'Mercury is the planet closest to the Sun. Its rocky surface is covered with many craters.'],
  ['venus', 'Venus', 'A world under thick clouds', 'Venus has a thick atmosphere and a very hot surface. Its bright appearance comes partly from its clouds.'],
  ['mars', 'Mars', 'The red planet', 'Iron minerals give much of the Martian surface its rusty colour. Robotic rovers have explored parts of Mars.'],
  ['asteroid_belt', 'Asteroid belt', 'Small worlds between planets', 'Many rocky objects orbit between Mars and Jupiter. They are far apart, not packed into a crowded wall.'],
  ['jupiter', 'Jupiter', 'A gas giant', 'Jupiter is the largest planet in our solar system. We fly past it; it has no solid surface like Earth to land on.'],
  ['saturn', 'Saturn', 'A planet with icy rings', 'Saturn is a gas giant. Its rings contain many pieces of ice and rock, not one solid flat disc.'],
  ['enceladus', 'Enceladus', 'An icy moon of Saturn', 'Enceladus has a bright icy surface. Scientists have observed plumes coming from its south-polar region.'],
  ['uranus', 'Uranus', 'A tilted ice giant', 'Uranus rotates with a very large tilt. Its atmosphere contains methane, which contributes to its blue-green colour.'],
  ['neptune', 'Neptune', 'The outermost major planet', 'Neptune is an ice giant far from the Sun. Its atmosphere has powerful winds and moving clouds.'],
  ['pluto', 'Pluto', 'A dwarf planet', 'Pluto is classified as a dwarf planet. It is one of many icy objects beyond Neptune.'],
  ['oort_cloud', 'Oort cloud', 'A proposed distant reservoir', 'The Oort cloud is a proposed, very distant collection of icy objects. It has not been directly imaged as a whole.'],
  ['alpha_centauri', 'Alpha Centauri', 'A neighbouring star system', 'Alpha Centauri is a system of three stars. Real journeys between stars are far longer than our make-believe flights.'],
  ['betelgeuse', 'Betelgeuse', 'A red supergiant', 'Betelgeuse is a red supergiant star in the direction of Orion. Stars can differ greatly in size, colour and temperature.'],
  ['sirius', 'Sirius', 'A bright point in our sky', 'Sirius appears very bright from Earth. How bright a star looks depends on its distance as well as its own light.'],
  ['pillars_of_creation', 'Pillars of Creation', 'Clouds in the Eagle Nebula', 'These pillars are clouds of gas and dust in a star-forming region. Our picture is an artistic interpretation, not a telescope photograph.'],
  ['orion_nebula', 'Orion Nebula', 'A stellar nursery', 'The Orion Nebula is a cloud of gas and dust where stars are forming. A nebula is not a single solid object.'],
  ['butterfly_nebula', 'Butterfly Nebula', 'Gas shaped around a star', 'The Butterfly Nebula contains gas expelled by an ageing star. Its name describes its appearance, not a living butterfly.'],
  ['ring_nebula', 'Ring Nebula', 'A shell of glowing gas', 'The Ring Nebula is a planetary nebula. Despite the name, a planetary nebula is not made from planets.'],
  ['crab_nebula', 'Crab Nebula', 'A supernova remnant', 'The Crab Nebula is expanding material left by an exploded star. A pulsar is found near its centre.'],
  ['pulsar', 'A pulsar', 'A rotating neutron star', 'A pulsar is a rotating neutron star whose beams can sweep past an observer. Our art is slow and stylised, not a flashing scientific simulation.'],
  ['milky_way', 'Milky Way', 'Our home galaxy', 'Our solar system belongs to the Milky Way, a galaxy containing many billions of stars. We cannot photograph our entire galaxy from outside it.'],
  ['andromeda', 'Andromeda Galaxy', 'A neighbouring large galaxy', 'Andromeda is a large galaxy beyond the Milky Way. Galaxies contain stars, gas, dust and other matter.'],
  ['sombrero', 'Sombrero Galaxy', 'A bright centre and dust lane', 'The Sombrero Galaxy has a bright central bulge and a prominent dust lane. Its name comes from its appearance.'],
  ['whirlpool', 'Whirlpool Galaxy', 'A spiral galaxy', 'The Whirlpool Galaxy has distinct spiral arms and interacts with a smaller neighbouring galaxy.'],
  ['quasar', 'A quasar', 'A very bright galactic centre', 'A quasar is a very luminous active galactic centre, powered by material falling towards a supermassive black hole.'],
  ['black_hole', 'A black hole', 'Gravity with an event horizon', 'A black hole has a boundary beyond which light cannot escape. We observe it safely in fiction; it is not a tunnel for our rocket.'],
];
export const DESTINATIONS = worlds.map(([id, name, subtitle, fact], index) => ({
  id, name, subtitle, fact, index,
  source: id === 'iss' ? 'https://www.nasa.gov/international-space-station/'
    : index < 15 ? 'https://science.nasa.gov/solar-system/' : 'https://science.nasa.gov/universe/',
}));
