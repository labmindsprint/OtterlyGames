// Class 2 - Twin Shuttle: a stylish shuttle flanked by two striped boosters and swept delta wings.
const INK = '#2b2b2b';
const HULL = 'var(--paint,#fffdf8)';
const G = '<g fill="none" stroke="#2b2b2b" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">';
const mir = svg => `<g transform="translate(300 0) scale(-1 1)">${svg}</g>`;
const thin = d => `<path d="${d}" stroke-width="2" opacity=".55"/>`;
const rivet = (x, y) => `<circle cx="${x}" cy="${y}" r="1.6" fill="${INK}" stroke="none"/>`;

const booster = () => `
<path d="M108 168 H124 V180 H108Z M108 262 H124 V274 H108Z" fill="#8a8780"/>
${rivet(116, 174)}${rivet(116, 268)}
<path d="M63 126 Q85 120 107 126 L108 312 Q85 318 62 312Z" fill="${HULL}"/>
<path d="M63 126 C64 104 77 88 85 76 C93 88 106 104 107 126 Q85 120 63 126Z" fill="#d9534f"/>
<path d="M72 112 Q76 98 83 88" stroke="#fbdcda" stroke-width="3" opacity=".9"/>
<path d="M63 150 Q85 156 107 150 V164 Q85 170 63 164Z" fill="#4a8fe0"/>
<path d="M70 158 H76 M82 160 H88 M94 160 H100" stroke="#d3e6fb" stroke-width="2.5"/>
<path d="M63 196 Q85 202 107 196" ${''}stroke-width="2"/>
<path d="M63 280 Q85 286 107 280 V294 Q85 300 63 294Z" fill="#d9534f"/>
${thin('M70 206 V270 M75 208 V268')}
${rivet(69, 193)}${rivet(101, 193)}
<path d="M66 312 L104 312 L110 334 L60 334Z" fill="#8a8780"/>
<path d="M73 316 L70 332 M85 316 V333 M97 316 L100 332" stroke-width="2" opacity=".6"/>
<ellipse cx="85" cy="334" rx="25" ry="6" fill="#fde9a8"/>
<ellipse cx="85" cy="334" rx="12" ry="3" fill="#fffdf8" stroke-width="2"/>`;

const wing = () => `
<path d="M124 262 L64 262 L64 186 L14 322 L36 338 L64 306 V298 L124 298Z" fill="${HULL}"/>
<path d="M64 186 L14 322 L25 331 L64 232Z" fill="#d9534f"/>
<path d="M64 232 L25 331" stroke-width="2.5"/>
<path d="M64 244 L32 334 L40 335 L64 258Z" fill="#4a8fe0" stroke-width="2.5"/>
<path d="M59 200 L49 226 M54 214 L46 236" stroke="#fbdcda" stroke-width="2.5"/>
<path d="M64 262 L30 326 M64 284 L22 330" stroke-width="2" opacity=".5"/>
<path d="M64 262 V298" stroke-width="2.5"/>
<path d="M84 262 V298 M104 262 V298" stroke-width="2" opacity=".5"/>
${rivet(74, 280)}${rivet(94, 280)}${rivet(114, 280)}
<circle cx="25" cy="324" r="3.5" fill="#3aa56b" stroke-width="2"/>
<path d="M36 300 L44 284 M42 308 L52 290" stroke-width="2" opacity=".5"/>`;

const jet = (cx, y, w, h) => {
  const outer = `M${cx - w} ${y} C${cx - w} ${y + h * .55} ${cx - 3} ${y + h * .7} ${cx} ${y + h} C${cx + 3} ${y + h * .7} ${cx + w} ${y + h * .55} ${cx + w} ${y}Z`;
  const mid = `M${cx - w * .62} ${y} C${cx - w * .6} ${y + h * .45} ${cx - 2} ${y + h * .55} ${cx} ${y + h * .72} C${cx + 2} ${y + h * .55} ${cx + w * .6} ${y + h * .45} ${cx + w * .62} ${y}Z`;
  const core = `M${cx - w * .3} ${y} C${cx - w * .3} ${y + h * .3} ${cx} ${y + h * .38} ${cx} ${y + h * .45} C${cx} ${y + h * .38} ${cx + w * .3} ${y + h * .3} ${cx + w * .3} ${y}Z`;
  return `<path d="${outer}" fill="#f5b82e"/><path d="${mid}" fill="#fde9a8" stroke-width="2"/><path d="${core}" fill="#fffdf8" stroke="none"/>`;
};

export default {
  id: 'class-2',
  name: 'Twin Shuttle',
  viewBox: '0 0 300 420',
  base: '',
  parts: [
    {
      id: 'cockpit',
      svg: `${G}
<path d="M130 96 H170 C177 150 181 230 178 318 H122 C119 230 123 150 130 96Z" fill="${HULL}"/>
<path d="M135 112 H165 C168 128 168 150 165 170 H135 C132 150 132 128 135 112Z" fill="#2f3650"/>
<path d="M139 118 H150 C147 132 146 146 146 162 H139Z" fill="#3b4468" stroke="none"/>
<path d="M140 122 L146 118 M140 136 L146 126" stroke="#d3e6fb" stroke-width="3" opacity=".9"/>
<circle cx="157" cy="132" r="1.500" fill="#fffdf8" stroke="none"/><circle cx="154" cy="150" r="1.200" fill="#fffdf8" stroke="none"/><circle cx="160" cy="156" r="1" fill="#fffdf8" stroke="none"/>
<path d="M150 112 V170" stroke-width="2"/>
<path d="M127 182 H173" stroke-width="2.5"/>
<path d="M126 206 H174" stroke-width="2.5"/>
<path d="M124 262 H176" stroke-width="2.5"/>
<path d="M124 300 H176" stroke-width="2.5"/>
<path d="M124 300 H176 V318 H124Z" fill="#8a8780"/>
<path d="M133 184 L150 196 L167 184" stroke="#d9534f" stroke-width="4"/>
<path d="M131 290 H169" stroke-width="2" opacity=".6"/>
${thin('M128 214 V256 M133 214 V256')}
${rivet(132, 190)}${rivet(168, 190)}${rivet(131, 270)}${rivet(169, 270)}
<path d="M127 222 h4 M169 222 h4" stroke="#f5b82e" stroke-width="3"/>
</g>`,
      from: { dx: 0, dy: 150 },
      joints: [{ x: 130, y: 100 }, { x: 170, y: 100 }, { x: 122, y: 200 }, { x: 178, y: 200 }]
    },
    {
      id: 'left-booster',
      svg: `${G}${booster()}</g>`,
      from: { dx: -150, dy: -30 },
      joints: [{ x: 116, y: 174 }, { x: 116, y: 268 }, { x: 108, y: 220 }]
    },
    {
      id: 'right-booster',
      svg: `${G}${mir(booster())}</g>`,
      from: { dx: 150, dy: -30 },
      joints: [{ x: 184, y: 174 }, { x: 184, y: 268 }, { x: 192, y: 220 }]
    },
    {
      id: 'nose',
      svg: `${G}
<path d="M150 26 C159 46 168 74 170 100 H130 C132 74 141 46 150 26Z" fill="${HULL}"/>
<path d="M150 26 C154 34 158 42 161 52 H139 C142 42 146 34 150 26Z" fill="#d9534f"/>
<path d="M147 14 H153 V28 H147Z" fill="#8a8780"/>
<path d="M135 76 Q150 82 165 76" stroke-width="2.5"/>
<path d="M132 88 Q150 94 168 88" stroke="#4a8fe0" stroke-width="5"/>
<path d="M142 58 Q141 70 138 86" stroke-width="2" opacity=".5"/>
<path d="M146 36 Q146 44 144 50" stroke="#fbdcda" stroke-width="3"/>
</g>`,
      from: { dx: 0, dy: -150 },
      joints: [{ x: 132, y: 98 }, { x: 150, y: 98 }, { x: 168, y: 98 }]
    },
    {
      id: 'wings',
      svg: `${G}${wing()}${mir(wing())}</g>`,
      from: { dx: 0, dy: 140 },
      joints: [{ x: 64, y: 280 }, { x: 236, y: 280 }, { x: 122, y: 280 }, { x: 178, y: 280 }]
    },
    {
      id: 'engine',
      svg: `${G}
<path d="M126 318 H174 V332 H126Z" fill="#2f3650"/>
<path d="M132 332 H168 L182 358 H118Z" fill="#d9d6cf"/>
<path d="M141 334 L136 356 M150 334 V357 M159 334 L164 356" stroke-width="2" opacity=".55"/>
<path d="M118 358 H182" stroke-width="3.5"/>
<ellipse cx="150" cy="358" rx="31" ry="7" fill="#fde9a8"/>
<ellipse cx="150" cy="358" rx="17" ry="3.8" fill="#fffdf8" stroke-width="2"/>
<path d="M132 322 H168" stroke="#f5b82e" stroke-width="3"/>
</g>`,
      from: { dx: 0, dy: 160 },
      joints: [{ x: 126, y: 322 }, { x: 174, y: 322 }, { x: 150, y: 332 }]
    }
  ],
  stickerSlots: [
    { x: 150, y: 232, s: 32 },
    { x: 150, y: 281, s: 26 },
    { x: 85, y: 230, s: 28 },
    { x: 215, y: 230, s: 28 }
  ],
  flame: `${G}${jet(150, 362, 24, 62)}${jet(85, 340, 17, 46)}${jet(215, 340, 17, 46)}</g>`
};
