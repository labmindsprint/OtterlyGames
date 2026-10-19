// Class 3 - Wing Fighter: an original X-wing-style strike fighter. Four wings open in an X, red cannons on every wingtip.
const INK = '#2b2b2b';
const HULL = 'var(--paint,#fffdf8)';
const G = '<g fill="none" stroke="#2b2b2b" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">';
const mirX = svg => `<g transform="translate(300 0) scale(-1 1)">${svg}</g>`;
const thin = d => `<path d="${d}" stroke-width="2" opacity=".55"/>`;
const rivet = (x, y) => `<circle cx="${x}" cy="${y}" r="1.6" fill="${INK}" stroke="none"/>`;
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const pts = list => list.map(p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L');

// One wing blade. A = leading root, B = leading tip, C = trailing tip, D = trailing root.
const blade = (A, B, C, D) => {
  const stripe = (t0, t1, fill) => `<path d="M${pts([lerp(A, B, t0), lerp(A, B, t1), lerp(D, C, t1), lerp(D, C, t0)])}Z" fill="${fill}"/>`;
  const line = t => `<path d="M${pts([lerp(A, B, t), lerp(D, C, t)])}" stroke-width="2.5"/>`;
  const mid = (t, w) => lerp(lerp(A, B, t), lerp(D, C, t), w);
  const slot0 = mid(0.22, 0.28), slot1 = mid(0.5, 0.28);
  return `<path d="M${pts([A, B, C, D])}Z" fill="${HULL}"/>` +
    stripe(0.78, 1, '#d9534f') + stripe(0.66, 0.72, '#4a8fe0') + stripe(0.48, 0.6, '#2f3650') + line(0.78) + line(0.72) + line(0.66) +
    `<path d="M${pts([mid(0.5, 0.3), mid(0.58, 0.3)])} M${pts([mid(0.5, 0.5), mid(0.58, 0.5)])} M${pts([mid(0.5, 0.7), mid(0.58, 0.7)])}" stroke="#fffdf8" stroke-width="2.500"/>` +
    `<path d="M${pts([lerp(A, B, 0.04), lerp(A, B, 0.6)])}" stroke="#d9534f" stroke-width="4"/>` +
    `<path d="M${pts([mid(0.12, 0.55), mid(0.6, 0.55)])}" stroke-width="2" opacity=".55"/>` +
    `<path d="M${pts([slot0, slot1])}" stroke="none"/>` +
    thin(`M${pts([mid(0.34, 0.8), mid(0.6, 0.8)])} M${pts([mid(0.3, 0.9), mid(0.58, 0.9)])}`) +
    rivet(...mid(0.18, 0.9)) + rivet(...mid(0.3, 0.1));
};

const upperLeft = () => blade([136, 204], [34, 124], [48, 176], [136, 262]);
const lowerLeft = () => blade([136, 296], [34, 376], [48, 324], [136, 238]);

const cannon = (x, yBase, yTop) => `
<path d="M${x - 8} ${yBase} H${x + 8} V${yBase - 14} H${x - 8}Z" fill="#2f3650"/>
<path d="M${x - 4.5} ${yBase - 14} H${x + 4.5} V${yTop + 10} H${x - 4.5}Z" fill="#d9d6cf"/>
<path d="M${x - 3.5} ${yTop + 10} H${x + 3.5} L${x + 5} ${yTop} H${x - 5}Z" fill="#d9534f"/>
<circle cx="${x}" cy="${yTop - 3}" r="6.5" fill="#fbdcda" stroke="#d9534f" stroke-width="2"/>
<circle cx="${x}" cy="${yTop - 3}" r="2.6" fill="#fffdf8" stroke="none"/>
<path d="M${x - 1.8} ${yBase - 18} V${yTop + 14}" stroke="#fffdf8" stroke-width="1.6" opacity=".8"/>`;

const pod = () => `
<path d="M101 262 Q115 256 129 262 V334 H101Z" fill="${HULL}"/>
<path d="M101 262 Q115 256 129 262 V274 Q115 280 101 274Z" fill="#2f3650"/>
<ellipse cx="115" cy="263" rx="12" ry="3.5" fill="#8a8780" stroke-width="2"/>
<path d="M101 292 Q115 298 129 292 V300 Q115 306 101 300Z" fill="#4a8fe0"/>
<path d="M101 312 Q115 318 129 312" stroke-width="2" opacity=".6"/>
${thin('M107 280 V290 M111 280 V290')}
<path d="M103 334 H127 L132 348 H98Z" fill="#8a8780"/>
<ellipse cx="115" cy="348" rx="17" ry="5" fill="#fde9a8"/>
<ellipse cx="115" cy="348" rx="9" ry="2.6" fill="#fffdf8" stroke-width="2"/>
<path d="M129 276 H137 M129 322 H137" stroke-width="4" stroke="#8a8780"/>`;

const jet = (cx, y, w, h) => {
  const outer = `M${cx - w} ${y} C${cx - w} ${y + h * .55} ${cx - 3} ${y + h * .7} ${cx} ${y + h} C${cx + 3} ${y + h * .7} ${cx + w} ${y + h * .55} ${cx + w} ${y}Z`;
  const mid = `M${cx - w * .62} ${y} C${cx - w * .6} ${y + h * .45} ${cx - 2} ${y + h * .55} ${cx} ${y + h * .72} C${cx + 2} ${y + h * .55} ${cx + w * .6} ${y + h * .45} ${cx + w * .62} ${y}Z`;
  const core = `M${cx - w * .3} ${y} C${cx - w * .3} ${y + h * .3} ${cx} ${y + h * .38} ${cx} ${y + h * .45} C${cx} ${y + h * .38} ${cx + w * .3} ${y + h * .3} ${cx + w * .3} ${y}Z`;
  return `<path d="${outer}" fill="#f5b82e"/><path d="${mid}" fill="#fde9a8" stroke-width="2"/><path d="${core}" fill="#fffdf8" stroke="none"/>`;
};

export default {
  id: 'class-3',
  name: 'Wing Fighter',
  viewBox: '0 0 300 420',
  base: '',
  parts: [
    {
      id: 'fuselage',
      svg: `${G}
<path d="M134 100 H166 L171 190 L174 250 L177 332 H123 L126 250 L129 190Z" fill="${HULL}"/>
<path d="M126 320 H174 V332 H126Z" fill="#2f3650"/>
<path d="M129 190 H171" stroke-width="2.5"/>
<path d="M128 206 H172 V214 H128Z" fill="#d9534f"/>
<path d="M126 262 H174" stroke-width="2.5"/>
<path d="M126 308 H174" stroke-width="2.5"/>
<path d="M142 222 V258 M158 222 V258" stroke="#4a8fe0" stroke-width="4"/>
<path d="M150 266 V306" stroke="#d9534f" stroke-width="3" stroke-dasharray="6 5"/>
${thin('M137 112 L136 184 M163 112 L164 184')}
${rivet(133, 220)}${rivet(167, 220)}${rivet(131, 285)}${rivet(169, 285)}
<path d="M134 270 h6 M160 270 h6" stroke-width="2" opacity=".7"/>
</g>`,
      from: { dx: 0, dy: 160 },
      joints: [{ x: 134, y: 104 }, { x: 166, y: 104 }, { x: 126, y: 250 }, { x: 174, y: 250 }]
    },
    {
      id: 'upper-wings',
      svg: `${G}${upperLeft()}${mirX(upperLeft())}</g>`,
      from: { dx: 0, dy: -150 },
      joints: [{ x: 134, y: 220 }, { x: 166, y: 220 }, { x: 70, y: 168 }, { x: 230, y: 168 }]
    },
    {
      id: 'lower-wings',
      svg: `${G}${lowerLeft()}${mirX(lowerLeft())}</g>`,
      from: { dx: 0, dy: 150 },
      joints: [{ x: 134, y: 280 }, { x: 166, y: 280 }, { x: 70, y: 332 }, { x: 230, y: 332 }]
    },
    {
      id: 'cockpit',
      svg: `${G}
<path d="M129 194 C128 150 138 116 150 108 C162 116 172 150 171 194Z" fill="#d3e6fb"/>
<path d="M129 194 C128 150 138 116 150 108 C162 116 172 150 171 194" stroke-width="3.5"/>
<path d="M150 110 V128" stroke-width="2.5"/>
<path d="M136 126 Q140 118 146 114" stroke="#fffdf8" stroke-width="3.5" opacity=".95"/>
<path d="M139 176 Q150 168 161 176 V194 H139Z" fill="#4a8fe0"/>
<circle cx="140.500" cy="156.500" r="4.600" fill="#b9855a"/>
<circle cx="159.500" cy="156.500" r="4.600" fill="#b9855a"/>
<circle cx="140.500" cy="156.500" r="1.800" fill="#efe6d2" stroke="none"/>
<circle cx="159.500" cy="156.500" r="1.800" fill="#efe6d2" stroke="none"/>
<ellipse cx="150" cy="166" rx="13.500" ry="12" fill="#b9855a"/>
<ellipse cx="150" cy="171" rx="8" ry="5.800" fill="#efe6d2" stroke-width="2"/>
<path d="M137 160 Q150 153 163 160" stroke="#4a8fe0" stroke-width="4.500"/>
<circle cx="144" cy="165" r="1.800" fill="${INK}" stroke="none"/>
<circle cx="156" cy="165" r="1.800" fill="${INK}" stroke="none"/>
<ellipse cx="150" cy="169" rx="2.600" ry="1.900" fill="${INK}" stroke="none"/>
<path d="M150 171 V173 M146.500 174 Q150 177 153.500 174" stroke-width="1.800"/>
<path d="M141 170 L133 168 M141 173 L133 175 M159 170 L167 168 M159 173 L167 175" stroke-width="1.400" opacity=".7"/>
<path d="M126 194 H174 V202 H126Z" fill="#2f3650"/>
${rivet(133, 198)}${rivet(167, 198)}
</g>`,
      from: { dx: 0, dy: -120 },
      joints: [{ x: 129, y: 194 }, { x: 171, y: 194 }, { x: 150, y: 202 }]
    },
    {
      id: 'nose',
      svg: `${G}
<path d="M150 18 C152 52 160 80 167 110 H133 C140 80 148 52 150 18Z" fill="${HULL}"/>
<path d="M150 18 C150.500 30 152 40 154 48 H146 C148 40 149.500 30 150 18Z" fill="#d9534f"/>
<path d="M142 66 H158" stroke-width="2.500"/>
<path d="M139 84 H161 L163 94 H137Z" fill="#d9534f"/>
<path d="M136 98 H164" stroke="#4a8fe0" stroke-width="5"/>
<path d="M150 56 V84" stroke-width="2" opacity=".5"/>
<path d="M144 70 Q142 84 138 98" stroke-width="2" opacity=".5"/>
<circle cx="150" cy="60" r="2.200" fill="#f5b82e" stroke-width="2"/>
</g>`,
      from: { dx: 0, dy: -150 },
      joints: [{ x: 135, y: 108 }, { x: 150, y: 108 }, { x: 165, y: 108 }]
    },
    {
      id: 'lasers',
      svg: `${G}${cannon(40, 152, 82)}${cannon(260, 152, 82)}${cannon(40, 350, 290)}${cannon(260, 350, 290)}</g>`,
      from: { dx: 0, dy: -150 },
      joints: [{ x: 40, y: 148 }, { x: 260, y: 148 }, { x: 40, y: 340 }, { x: 260, y: 340 }]
    },
    {
      id: 'engines',
      svg: `${G}${pod()}${mirX(pod())}</g>`,
      from: { dx: 0, dy: 160 },
      joints: [{ x: 129, y: 280 }, { x: 171, y: 280 }, { x: 129, y: 322 }, { x: 171, y: 322 }]
    }
  ],
  stickerSlots: [
    { x: 150, y: 235, s: 26 },
    { x: 150, y: 288, s: 26 },
    { x: 96, y: 190, s: 24 },
    { x: 204, y: 190, s: 24 }
  ],
  flame: `${G}${jet(115, 351, 15, 54)}${jet(185, 351, 15, 54)}</g>`
};
