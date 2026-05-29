#!/usr/bin/env node
// Nexus Defense — pixel art sprite generator (with walk + fire animations)
// Run: node generate-sprites.js
// Output: assets/tower-*.svg  assets/enemy-*.svg

const fs   = require('fs');
const path = require('path');
const OUT  = path.join(__dirname, 'assets');

// ── SVG builder ─────────────────────────────────────────────────────────────
function toSVG(name, rows, pal) {
  let rects = '';
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y];
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === '.') { x++; continue; }
      let w = 1;
      while (x + w < row.length && row[x + w] === ch) w++;
      rects += `  <rect x="${x}" y="${y}" width="${w}" height="1" fill="${pal[ch]}"/>\n`;
      x += w;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="256" height="256" shape-rendering="crispEdges" style="image-rendering:pixelated">
  <!-- ${name} -->
${rects}</svg>\n`;
}

// ── Row helpers ──────────────────────────────────────────────────────────────
const E16 = '................';
function bobUp(rows, dy)   { return [...rows.slice(dy), ...Array(dy).fill(E16)]; }
function bobDown(rows, dy) { return [...Array(dy).fill(E16), ...rows.slice(0, 16-dy)]; }

// ═══════════════════════════════════════════════════════════════════════════
//  TOWERS  — top-down view, barrel pointing RIGHT (→)
//  In-game: drawn with ctx.rotate(this.angle) — angle=0 points right.
//  Sprite center = (8,8). Base occupies rows 3-12, barrel at rows 6-9.
// ═══════════════════════════════════════════════════════════════════════════

const towerDefs = {

  // ── Laser: sleek ciano barrel, glowing core ──────────────────────────────
  'tower-laser': {
    pal: {
      W: '#ffffff', B: '#00d4ff', b: '#00aadd', M: '#0077bb',
      D: '#004488', E: '#002255', N: '#001133', S: '#55e8ff', K: '#081420'
    },
    rows: [
      '................',
      '................',
      '................',
      '....KKKKKKKK....',  // base top
      '....KKMMMMMK....',  // base
      '....KMBBBMBK....',  // base inner
      '....KMBbBBMKBBBB',  // barrel begins → right edge
      '....KMBWBBMKBbBW',  // barrel row (W=tip glow)
      '....KMBbBBMKBBBB',  // barrel ends
      '....KMBBBMBK....',  // base inner
      '....KKMMMMMK....',  // base
      '....KKKKKKKK....',  // base bottom
      '................',
      '................',
      '................',
      '................',
    ]
  },

  // ── Míssil: chunky launcher, orange warhead ──────────────────────────────
  'tower-missile': {
    pal: {
      W: '#ffffff', O: '#ff8c00', o: '#cc6600', Y: '#ffcc44',
      G: '#666666', g: '#333333', K: '#1a0a00', R: '#ff4400',
      B: '#bbbbbb', b: '#888888'
    },
    rows: [
      '................',
      '................',
      '....KKKKKKKKK...',
      '....KGGgGGGGK...',
      '....KGOOOOOBK...',  // top pod
      '....KGOoooobK...',
      '....KGOooOObKOOR.',  // barrel pod pointing right
      '....KGBBBBBBKoRW',  // barrel tip
      '....KGOooOObKOOR.',
      '....KGOoooobK...',
      '....KGOOOOOBK...',  // bottom pod
      '....KGGgGGGGK...',
      '....KKKKKKKKK...',
      '................',
      '................',
      '................',
    ]
  },

  // ── Tesla: rotating arc generator ──────────────────────────────────────
  'tower-tesla': {
    pal: {
      W: '#ffffff', P: '#cc44ff', p: '#9922cc', v: '#6600aa',
      V: '#440088', Y: '#ffee44', y: '#ccbb00', K: '#0a0010',
      G: '#888888'
    },
    rows: [
      '................',
      '................',
      '....KKKKKKkKK...',
      '....KVVVVVVvK...',
      '....KVppppvvK...',
      '....KVpPPPpvK...',
      '....KVpPWPpvKPPPP',  // orb + arc sparks right
      '....KVpPWPpvKpYpY',  // arc
      '....KVpPWPpvKPPPP',
      '....KVpPPPpvK...',
      '....KVppppvvK...',
      '....KVVVVVVvK...',
      '....KKKKKKkKK...',
      '................',
      '................',
      '................',
    ]
  },

  // ── Cryo: frost emitter ─────────────────────────────────────────────────
  'tower-cryo': {
    pal: {
      W: '#ffffff', C: '#88ddff', c: '#44aacc', B: '#0077aa',
      b: '#004488', K: '#000d1a', S: '#ccf8ff', G: '#aaddee'
    },
    rows: [
      '................',
      '................',
      '....KKKKKKKK....',
      '....KBBbBBbK....',
      '....KBCCCCbK....',
      '....KBCSScbK....',
      '....KBCSScbKCCCC',  // frost barrel
      '....KBCWWcbKcSSW',  // frost tip
      '....KBCSScbKCCCC',
      '....KBCSScbK....',
      '....KBCCCCbK....',
      '....KBBbBBbK....',
      '....KKKKKKKK....',
      '................',
      '................',
      '................',
    ]
  },

  // ── Sniper: long precision rifle ────────────────────────────────────────
  'tower-sniper': {
    pal: {
      W: '#ffffff', N: '#44ff88', n: '#22bb55', G: '#117733',
      g: '#0a4420', K: '#0a100a', B: '#888888', b: '#555555',
      Y: '#ffee44', S: '#ccffdd'
    },
    rows: [
      '................',
      '................',
      '....KKKKKKKK....',
      '....KGGgGGgK....',
      '....KGNNNNgK....',
      '....KGNnNngK....',
      '....KGNnNngKNNNNNNNN',  // long rifle barrel
      '....KGNWNngKnnnnnnnW',  // scope glint + tip
      '....KGNnNngKNNNNNNNN',
      '....KGNNNNgK....',
      '....KGGgGGgK....',
      '....KKKKKKKK....',
      '................',
      '................',
      '................',
      '................',
    ]
  },

  // ── Plasma: containment chamber, pulsing ball ───────────────────────────
  'tower-plasma': {
    pal: {
      W: '#ffffff', F: '#ff5500', f: '#cc3300', O: '#ff8844',
      Y: '#ffcc00', R: '#aa2200', K: '#130010', G: '#666666'
    },
    rows: [
      '................',
      '................',
      '....KKKKKKKKK...',
      '....KRRRRRRfK...',
      '....KRFFFFFfK...',
      '....KRFOOFffK...',
      '....KRFOWOfKFFFO',  // plasma barrel
      '....KRFOYOfKFOFW',  // glowing tip
      '....KRFOWOfKFFFO',
      '....KRFOOFffK...',
      '....KRFFFFFfK...',
      '....KRRRRRRfK...',
      '....KKKKKKKKK...',
      '................',
      '................',
      '................',
    ]
  },

  // ── Morteiro: elevated mortar tube, top-down ────────────────────────────
  'tower-mortar': {
    pal: {
      W: '#ffffff', K: '#aa8844', k: '#886633', Y: '#ccaa55',
      B: '#554422', b: '#332211', D: '#111111', d: '#0a0a0a',
      G: '#888888', O: '#ff8800'
    },
    rows: [
      '................',
      '...DDDDDDDDD....',
      '..DBBBBBBBBbD...',
      '..DBKKKKKKbbD...',
      '..DBKYYYYkbD....',  // mortar barrel opening (top-down: dark circle)
      '..DBKYOYkbD.....',
      '..DBKYYYkbD.....',  // barrel centered
      '..DBKYOYkbD.....',  // off-center aim
      '..DBKYYYkbD.....',
      '..DBKKKKKbbD....',
      '..DBBBBBBBbD....',
      '..DBbbbbbbbD....',
      '...DDDDDDDDD....',
      '................',
      '................',
      '................',
    ]
  },

  // ── Amplificador: diamond crystal emitting rings ─────────────────────────
  'tower-amplifier': {
    pal: {
      W: '#ffffff', A: '#ffee44', a: '#ccbb00', G: '#aa8800',
      g: '#665500', D: '#111108', K: '#0a0800',
      S: '#ffffaa', B: '#888866'
    },
    rows: [
      '................',
      '......AAAA......',
      '.....AAAAAA.....',
      '....AAAAAAAAAA..',
      '...AAAaWWaAAA...',
      '..AAAAaWWWaAAAA.',
      '..AAaWWWWWWaAAAAAAa',  // ring extending right
      '..AAaWWWWWWaAAAAa..',
      '..AAaWWWWWWaAAAA.',
      '..AAAAaWWWaAAAA.',
      '...AAAaWWaAAA...',
      '....AAAAAAAAAA..',
      '.....AAAAAA.....',
      '......AAAA......',
      '................',
      '................',
    ]
  },

  // ── Nódulo: income orb with circuit lines ───────────────────────────────
  'tower-nodule': {
    pal: {
      W: '#ffffff', N: '#44ff88', n: '#22cc55', G: '#118833',
      g: '#0a5522', D: '#050f08', S: '#aaffcc', Y: '#ffff44'
    },
    rows: [
      '................',
      '................',
      '......NNNN......',
      '.....NNnNNN.....',
      '....NNnSSnnN....',
      '....NnSWWSnN....',
      '....NnSWYWSnNNNN',  // gold coin shine + circuit extends right
      '....NnSWYWSnnnng',
      '....NnSWYWSnNNNN',
      '....NnSWWSnN....',
      '....NNnSSnnN....',
      '.....NNnNNN.....',
      '......NNNN......',
      '................',
      '................',
      '................',
    ]
  },

  // ── Anti-Aéreo: dual AA barrel platform ─────────────────────────────────
  'tower-antiair': {
    pal: {
      W: '#ffffff', T: '#00ffcc', t: '#00ccaa', C: '#008877',
      c: '#005544', D: '#001a14', K: '#000d0a',
      G: '#888888', g: '#555555', Y: '#ffee44'
    },
    rows: [
      '................',
      '................',
      '....KKKKKKKK....',
      '....KCCCCCCK....',
      '....KCTTTTcK....',
      '....KCTtttcKTTTT',  // upper barrel
      '....KCTtttcKtttW',  // upper barrel tip
      '....KCccccCK....',
      '....KCccccCK....',
      '....KCTtttcKTTTT',  // lower barrel
      '....KCTtttcKtttW',  // lower barrel tip
      '....KCCCCCcK....',
      '....KKKKKKKK....',
      '................',
      '................',
      '................',
    ]
  },
};

// ── Tower FIRE frames ────────────────────────────────────────────────────────
function makeFire(base, flashRows) {
  const rows = [...base.rows];
  flashRows.forEach(([i, val]) => { rows[i] = val; });
  return { pal: base.pal, rows };
}

const fireDefs = {
  'tower-laser-fire':     makeFire(towerDefs['tower-laser'],     [[7, '....KMBWBBMKBWBb', /* white pulse */ ]]),
  'tower-missile-fire':   { pal: towerDefs['tower-missile'].pal, rows: (() => {
    const r = [...towerDefs['tower-missile'].rows];
    r[6] = '....KGOooOObKOOR.'; r[7] = '....KGBBBBBBKORW'; r[8] = '....KGOooOObKOOR.';
    return r;
  })()},
  'tower-tesla-fire':     { pal: { ...towerDefs['tower-tesla'].pal }, rows: (() => {
    const r = [...towerDefs['tower-tesla'].rows];
    r[5] = 'YY..KVpPPPpvK...'; r[6] = '....KVpPWPpvKPYPY'; r[7] = '....KVpPWPpvKYPYW'; r[8] = '....KVpPWPpvKPYPY';
    r[9] = 'YY..KVpPPPpvK...';
    return r;
  })()},
  'tower-cryo-fire':      { pal: towerDefs['tower-cryo'].pal, rows: (() => {
    const r = [...towerDefs['tower-cryo'].rows];
    r[6] = '....KBCSScbKSSCC'; r[7] = '....KBCWWcbKcSSW'; r[8] = '....KBCSScbKSSCC';
    return r;
  })()},
  'tower-sniper-fire':    { pal: towerDefs['tower-sniper'].pal, rows: (() => {
    const r = [...towerDefs['tower-sniper'].rows];
    r[7] = '....KGNWNngKnnnnnnnW';
    r[6] = 'WNNN KGNnNngKNNNNNNNN';  // recoil flash at barrel entry
    return r;
  })()},
  'tower-plasma-fire':    { pal: towerDefs['tower-plasma'].pal, rows: (() => {
    const r = [...towerDefs['tower-plasma'].rows];
    r[6] = '....KRFOWOfKFYFW'; r[7] = '....KRFOYOfKWYWW'; r[8] = '....KRFOWOfKFYFW';
    return r;
  })()},
  'tower-mortar-fire':    { pal: { ...towerDefs['tower-mortar'].pal, S: '#dddddd', s: '#aaaaaa' }, rows: (() => {
    const r = [...towerDefs['tower-mortar'].rows];
    r[4] = '..DBKYSYkbD.....'; r[5] = '..DBKSOSsbD.....'; r[6] = '..DBKSSWSkbD....'; r[7] = '..DBKSOSsbD.....'; r[8] = '..DBKYSYkbD.....';
    return r;
  })()},
  'tower-amplifier-fire': { pal: towerDefs['tower-amplifier'].pal, rows: (() => {
    const r = [...towerDefs['tower-amplifier'].rows];
    r[0] = 'AAAAAAAAAAAAAAAA'; r[1] = 'AWWWWWWWWWWWWWWA'; r[14] = 'AWWWWWWWWWWWWWWA'; r[15] = 'AAAAAAAAAAAAAAAA';
    r[5] = 'AAAAA aWWWaAAAAA.'; r[6] = 'AAAAAaWWWWWWaAAA';
    return r;
  })()},
  'tower-nodule-fire':    { pal: { ...towerDefs['tower-nodule'].pal, Z: '#ffdd00' }, rows: (() => {
    const r = [...towerDefs['tower-nodule'].rows];
    r[0] = 'ZZZZZZZZZZZZZZZ.'; r[1] = 'ZWWWWWWWWWWWWWWZ';
    r[6] = '....NnSWYWSnNNNN'; r[7] = '....NnSWZWSnZZZZ';
    r[14] = 'ZWWWWWWWWWWWWWWZ'; r[15] = 'ZZZZZZZZZZZZZZZ.';
    return r;
  })()},
  'tower-antiair-fire':   { pal: towerDefs['tower-antiair'].pal, rows: (() => {
    const r = [...towerDefs['tower-antiair'].rows];
    r[5] = '....KCTtttcKTTTT'; r[6] = 'WWWW KCTtttcKtttW'; r[7] = '....KCccccCK....';
    r[9] = '....KCTtttcKTTTT'; r[10] = 'WWWW KCTtttcKtttW';
    return r;
  })()},
};

// ═══════════════════════════════════════════════════════════════════════════
//  ENEMIES  — front-facing pixel art (sprites flip horizontally when moving left)
// ═══════════════════════════════════════════════════════════════════════════

const enemyDefs = {

  // ── Drone: sci-fi quad-rotor ────────────────────────────────────────────
  'enemy-drone': {
    pal: { W: '#ffffff', R: '#ff3355', r: '#cc1133', Y: '#ffcc00', G: '#888888', g: '#555555', B: '#222222' },
    rows: [
      '................',
      '..g.........g...',
      '.gGg.......gGg..',
      '..gRRRRRRRRg....',
      '...RRRRRRRR.....',
      '...RRrYYrRR.....',
      '...RrYWWYrR.....',
      '...RRrYYrRR.....',
      '...RRRRRRRR.....',
      '..gRRRRRRRRg....',
      '.gGg.......gGg..',
      '..g.........g...',
      '................',
      '................',
      '................',
      '................',
    ]
  },

  // ── Soldado: armored humanoid robot ────────────────────────────────────
  'enemy-soldier': {
    pal: { W: '#ffffff', O: '#ff7700', o: '#cc5500', B: '#222222', b: '#111111', H: '#886633', Y: '#ffee44' },
    rows: [
      '................',
      '......HHHH......',
      '.....HBBBBo.....',
      '.....HBWWBB.....',
      '.....HBBBB......',
      '....OOOOOOOO....',
      '....OoOOOooO....',
      '....OoYYYooO....',
      '....OoOOOooO....',
      '....OOOOOOOO....',
      '....OO....OO....',
      '....OO....OO....',
      '....Oo....oO....',
      '....Ob....bO....',
      '....bb....bb....',
      '................',
    ]
  },

  // ── Tanque: heavy hover tank ───────────────────────────────────────────
  'enemy-tank': {
    pal: { W: '#ffffff', P: '#aa00ff', p: '#7700cc', V: '#550099', v: '#330066', Y: '#ffee44', G: '#777777', g: '#444444', D: '#222222' },
    rows: [
      '................',
      '................',
      '.GGGgGGGGGGgGGG.',
      'GGpPPPPPPPPPPpGG',
      'GpPPpWWWWWpPPpPG',
      'GpPPpWVVVpPPPpPG',
      'GpPPpWVYVpPPPpPG',  // turret + cannon barrel
      'GpPPpWVVVpPPPpPG',
      'GpPPpWWWWWpPPpPG',
      'GGpPPPPPPPPPPpGG',
      '.GGGgGGGGGGgGGG.',
      '................',
      '...GgGGGGGGgG...',
      '...GGDDDDDDgG...',
      '................',
      '................',
    ]
  },

  // ── Stealth: cloaked alien shimmer ────────────────────────────────────
  'enemy-stealth': {
    pal: { W: '#ffffff', N: '#00ff88', n: '#00cc55', G: '#008833', g: '#005522', S: '#aaffcc', B: '#111111' },
    rows: [
      '................',
      '......nnnn......',
      '.....nNNNNn.....',
      '....nNSNSNNn....',
      '....nNNNNNNn....',
      '...gnNNNNNNng...',
      '...gnNNNNNNng...',
      '...gnNnBnNNng...',
      '...gnNNNNNNng...',
      '...gnNNNNNNng...',
      '....gnNNNNng....',
      '....GggggggG....',
      '...GGgDDDgGG....',
      '...GgddddddG....',
      '..DDdddddddD....',
      '................',
    ]
  },

  // ── Chefe: titan mech boss ────────────────────────────────────────────
  'enemy-boss': {
    pal: { W: '#ffffff', R: '#ff0044', r: '#cc0033', X: '#880022', x: '#440011', Y: '#ffcc00', O: '#ff6600', G: '#555555', g: '#333333' },
    rows: [
      '...XRRRRRRRRX...',
      '..XRRrRRRrRRX...',
      '..XRrRWRWRrRX...',
      '..XRrRWRWRrRX...',
      '..XRrRrYRrRrX...',
      '..XRrrROORrrX...',
      '.XRRRrrRRrrRRX..',
      '.XRRRrrRRrrRRX..',
      '.XRRrDDDDDrRRX..',
      '.XRRRrrRRrrRRX..',
      '..XXRRRrrRRXX...',
      '..XXRrXXXrRXX...',
      '..XXxRRRRRXXX...',
      '..XXxdDDDdXXX...',
      '..XXxddddddXXX..',
      '...XxddddddX....',
    ]
  },

  // ── Blindado: heavy armored mech ──────────────────────────────────────
  'enemy-armored': {
    pal: { W: '#ffffff', K: '#cc9900', k: '#996600', Y: '#ffee44', B: '#333333', b: '#1a1a1a', G: '#888888', D: '#554400' },
    rows: [
      '....KKKKKKKK....',
      '...KKkYYYYkKK...',
      '...KKkYWWYkKK...',
      '...KKkYWWYkKK...',
      '...KKkYYYYkKK...',
      '..KKKKKKKKkKKK..',
      '..KKKkBBBBkKKK..',
      '..KKKkBkBBkKKK..',
      '..KKKkBBBBkKKK..',
      '..KKKKKKKKkKKK..',
      '..KKKkKKKkkKKK..',
      '...KkKKKKKKkK...',
      '...KkDDDDDDkK...',
      '...KkdddddddK...',
      '..KKkdddddddKK..',
      '...KkdddddddK...',
    ]
  },

  // ── Regenerador: bio-organic healing creature ─────────────────────────
  'enemy-regen': {
    pal: { W: '#ffffff', T: '#00ffaa', t: '#00cc88', C: '#008855', c: '#005533', S: '#aaffee', Y: '#ffff00', G: '#88ffdd' },
    rows: [
      '......GGGG......',
      '.....GTttTG.....',
      '....GTtSSttG....',
      '....GTSWWStG....',
      '....GTSWWSttG...',
      '....GTtSStttG...',
      '.....GTttTG.....',
      '.....CTTTTC.....',
      '.....CTttTC.....',
      '.....CTtYtC.....',
      '.....CTttTC.....',
      '.....CTTTTC.....',
      '....CCttttCC....',
      '....CcddddcC....',
      '...DDdddddddD...',
      '....DdddddddD...',
    ]
  },

  // ── Voador: interceptor aircraft ─────────────────────────────────────
  'enemy-flyer': {
    pal: { W: '#ffffff', F: '#88ccff', f: '#4499cc', B: '#1166aa', b: '#003377', Y: '#ffee44', G: '#666666' },
    rows: [
      'F.............FF',
      'FF...........FFF',
      'FFF.........FFFF',
      'FFff.......ffffF',
      'FFfBBfffffBBfFFF',
      '..fBBfffffBBf...',
      '...fBBBBBBBf....',
      '...fBfWWWfBf....',
      '...fBfWYWfBf....',
      '...fBfWWWfBf....',
      '...fBBBBBBBf....',
      '...fBbbbbbBf....',
      '....fBbbbBf.....',
      '.....fbbbf......',
      '......bbb.......',
      '................',
    ]
  },

  // ── Esquadrão: formation of soldiers ─────────────────────────────────
  'enemy-squad': {
    pal: { W: '#ffffff', O: '#ff9944', o: '#cc6611', H: '#886633', B: '#333333', b: '#1a1a1a', Y: '#ffee44' },
    rows: [
      '..HH.HH.HH......',
      '.BOBB.BOBB......',
      'OOoOO.OOoOO.....',
      'OoYoO.OoYoO.....',
      'OoOoO.OoOoO.....',
      'OOOOO.OOOOO.....',
      '.OO....OO.......',
      '.OO....OO.......',
      '.bb....bb.......',
      '................',
      '...HH.HH........',
      '..BOBB.BOBB.....',
      '.OOoOO.OOoOO....',
      '.OoYoO.OoYoO....',
      '.OOOOO.OOOOO....',
      '.OO.....OO......',
    ]
  },
};

// ── Enemy WALK FRAME 1 ────────────────────────────────────────────────────────
const walkDefs = {
  'enemy-drone-1':   { pal: enemyDefs['enemy-drone'].pal,   rows: bobUp(enemyDefs['enemy-drone'].rows, 2) },
  'enemy-soldier-1': { pal: enemyDefs['enemy-soldier'].pal, rows: (() => {
    const r = [...enemyDefs['enemy-soldier'].rows];
    r[10] = '....oO......Oo..';
    r[11] = '....oO......Oo..';
    r[12] = '....Oo......oO..';
    r[13] = '....Ob......bO..';
    r[14] = '....bb......bb..';
    return r;
  })() },
  'enemy-tank-1':    { pal: enemyDefs['enemy-tank'].pal,    rows: (() => {
    const r = [...enemyDefs['enemy-tank'].rows];
    r[12] = '...gGGGGGGGGgG..';
    r[13] = '...GGgDDDDDGgG..';
    return r;
  })() },
  'enemy-stealth-1': { pal: enemyDefs['enemy-stealth'].pal, rows: enemyDefs['enemy-stealth'].rows.map(row => row === E16 ? E16 : '.' + row.slice(0,15)) },
  'enemy-boss-1':    { pal: enemyDefs['enemy-boss'].pal,    rows: bobDown(enemyDefs['enemy-boss'].rows, 1) },
  'enemy-armored-1': { pal: enemyDefs['enemy-armored'].pal, rows: (() => {
    const r = [...enemyDefs['enemy-armored'].rows];
    r[12] = '...KkDDDDDDkK...';
    r[13] = '...KkdddddddK...';
    r[14] = '..KkKddddddKkK..';
    r[15] = '..KkKddddddKkK..';
    return r;
  })() },
  'enemy-regen-1':   { pal: enemyDefs['enemy-regen'].pal,   rows: bobUp(enemyDefs['enemy-regen'].rows, 2) },
  'enemy-flyer-1':   { pal: enemyDefs['enemy-flyer'].pal,   rows: (() => {
    const r = [...enemyDefs['enemy-flyer'].rows];
    r[0]  = '................';
    r[1]  = 'F...............';
    r[2]  = 'FF...........FF.';
    r[3]  = 'FFF.........FFF.';
    r[4]  = 'FFff.......ffffF';
    return r;
  })() },
  'enemy-squad-1':   { pal: enemyDefs['enemy-squad'].pal,   rows: bobUp(enemyDefs['enemy-squad'].rows, 1) },
};

// ═══════════════════════════════════════════════════════════════════════════
//  Generate all files
// ═══════════════════════════════════════════════════════════════════════════

let count = 0;
const all = { ...towerDefs, ...fireDefs, ...enemyDefs, ...walkDefs };

for (const [name, { pal, rows }] of Object.entries(all)) {
  const svg = toSVG(name, rows, pal);
  fs.writeFileSync(path.join(OUT, `${name}.svg`), svg);
  console.log(`  ✓  ${name}.svg`);
  count++;
}
console.log(`\nDone — ${count} sprites written to assets/`);
