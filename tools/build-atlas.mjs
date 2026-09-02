/**
 * Builds the parent's atlas from the world dump.
 *
 * Everything on the page — every screen, every door, every marker — comes out
 * of SCREENS by way of tools/dump-world.ts, so the atlas cannot drift from the
 * game. Run: npx tsx tools/dump-world.ts > /tmp/world.json && node tools/build-atlas.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'

const world = JSON.parse(readFileSync(process.env.WORLD ?? '/tmp/world.json', 'utf8'))
const OUT = process.env.OUT ?? '/tmp/atlas.html'

const DUNGEONS = ['Sunken Hall', 'Hollow Keep', 'Ember Vault', 'Sunless Spire']
const themeOf = (s) =>
  DUNGEONS.includes(s.region) ? 'dungeon' : s.dark || s.shop ? 'cave' : 'overworld'

const overworld = world.screens.filter((s) => s.at)
const byId = new Map(world.screens.map((s) => [s.id, s]))

// The mountain track is walkable but sits off the main grid — see the note on
// the page. Ordered by following its own exits upward.
const mountain = []
{
  let id = world.screens.find((s) => s.region === 'Mountain' && s.exits.down)?.id
  while (id && !mountain.includes(id)) {
    mountain.push(id)
    const up = byId.get(id)?.exits.up
    id = up && byId.get(up)?.region === 'Mountain' ? up : undefined
  }
}

const minX = Math.min(...overworld.map((s) => s.at.x))
const minY = Math.min(...overworld.map((s) => s.at.y))
const cols = Math.max(...overworld.map((s) => s.at.x)) - minX + 1
const rows = Math.max(...overworld.map((s) => s.at.y)) - minY + 1

/** Everything hard to find, in the order he would meet it. */
const findings = []
for (const s of world.screens) {
  for (const p of s.portals) {
    if (!p.hidden && !p.requires && !p.guardedBy) continue
    findings.push({
      what: p.toName,
      where: s.name,
      tile: `col ${p.col}, row ${p.row}`,
      how: p.hidden === 'bomb'
        ? 'Bomb the cracked rock'
        : p.hidden === 'candle'
          ? 'Burn the bush with the Blue Candle'
          : p.requires
            ? `${p.requires}${p.consumes ? ' — and they tear on the way, so it is one way only' : ''}`
            : `Opens once "${p.guardedBy}" is done`,
      kind: p.hidden ?? (p.requires ? 'item' : 'gate'),
    })
  }
}

const treasures = world.screens.filter((s) => s.treasure)
const pickups = world.screens.filter((s) => s.pickup)
const shops = world.screens.filter((s) => s.shop)
const sealedChests = world.screens.flatMap((s) =>
  s.gates.filter((g) => g.kind === 'chest').map((g) => ({ screen: s, gate: g })),
)

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** A screen as a 16x11 pixel map, plus its markers. */
function tile(s, opts = {}) {
  const marks = []
  for (const p of s.portals) {
    const cls = p.hidden === 'bomb' ? 'm-bomb' : p.hidden === 'candle' ? 'm-candle' : p.requires ? 'm-item' : 'm-door'
    marks.push({ col: p.col, row: p.row, cls, title: `to ${p.toName}` })
  }
  if (s.treasure) marks.push({ col: s.treasure.col, row: s.treasure.row, cls: 'm-chest', title: `${s.treasure.rupees} rupees` })
  if (s.pickup) marks.push({ col: s.pickup.col, row: s.pickup.row, cls: 'm-pickup', title: s.pickup.itemName })
  for (const g of s.gates) {
    marks.push({ col: g.col, row: g.row, cls: g.kind === 'chest' ? 'm-sealed' : 'm-gate', title: g.id })
  }

  const dots = marks
    .map((m) => `<i class="mk ${m.cls}" style="left:${(m.col / 16) * 100}%;top:${(m.row / 11) * 100}%" title="${esc(m.title)}"></i>`)
    .join('')

  return `<figure class="screen${opts.small ? ' small' : ''}">
      <canvas width="16" height="11" data-rows="${esc(s.rows.join('|'))}" data-theme="${themeOf(s)}"></canvas>
      ${dots}
      <figcaption><span class="sname">${esc(s.name)}</span></figcaption>
    </figure>`
}

const gridCells = overworld
  .map((s) => `<div class="cell" style="grid-column:${s.at.x - minX + 1};grid-row:${s.at.y - minY + 1}">${tile(s)}</div>`)
  .join('\n')

const trackCells = mountain
  .map((id, i) => `<div class="cell" style="grid-row:${mountain.length - i}">${tile(byId.get(id))}</div>`)
  .join('\n')

/** Interiors, grouped the way they connect. */
const clusters = []
for (const region of [...new Set(world.screens.filter((s) => !s.at && s.region !== 'Mountain').map((s) => s.region))]) {
  const members = world.screens.filter((s) => !s.at && s.region === region)
  clusters.push({ region, members })
}

const clusterHtml = clusters
  .map(
    (c) => `<section class="cluster">
      <h3>${esc(c.region)}</h3>
      <div class="strip">${c.members.map((s) => tile(s, { small: true })).join('')}</div>
    </section>`,
  )
  .join('\n')

const findingRows = findings
  .map(
    (f) => `<tr>
      <td><span class="pin ${f.kind === 'bomb' ? 'm-bomb' : f.kind === 'candle' ? 'm-candle' : f.kind === 'item' ? 'm-item' : 'm-gate'}"></span>${esc(f.what)}</td>
      <td>${esc(f.where)}</td>
      <td class="mono">${esc(f.tile)}</td>
      <td>${esc(f.how)}</td>
    </tr>`,
  )
  .join('\n')

const html = `<title>Atlas of the Land</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans+Condensed:wght@600;700&family=IBM+Plex+Sans:wght@400;500&family=Silkscreen&display=swap">
<style>
  :root {
    --ground: #eef0e8;
    --panel: #ffffff;
    --ink: #1b1f18;
    --dim: #5c6357;
    --faint: #8b9384;
    --rule: #d5dacd;
    --gold: #a8791a;
    --gold-bright: #e6b422;
    --bomb: #d5433f;
    --candle: #e07b1f;
    --item: #2c6fd4;
    --gate: #7a51c4;
    --chest: #1f8a4c;
    --shadow: 0 1px 0 rgba(27,31,24,.06);
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --ground: #101309;
      --panel: #181c12;
      --ink: #e9ecdf;
      --dim: #9aa38e;
      --faint: #666f5c;
      --rule: #2a2f20;
      --gold: #e6b422;
      --gold-bright: #ffd45e;
      --bomb: #ff6b66;
      --candle: #f2a04a;
      --item: #6aa3f0;
      --gate: #b393f0;
      --chest: #4fd18a;
      --shadow: none;
    }
  }
  :root[data-theme="dark"] {
    --ground: #101309; --panel: #181c12; --ink: #e9ecdf; --dim: #9aa38e;
    --faint: #666f5c; --rule: #2a2f20; --gold: #e6b422; --gold-bright: #ffd45e;
    --bomb: #ff6b66; --candle: #f2a04a; --item: #6aa3f0; --gate: #b393f0;
    --chest: #4fd18a; --shadow: none;
  }

  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--ground); color: var(--ink);
    font-family: 'IBM Plex Sans', system-ui, sans-serif; font-size: 15px; line-height: 1.55;
  }
  .wrap { max-width: 1120px; margin: 0 auto; padding: 32px 24px 72px; }

  header.top { display: flex; flex-wrap: wrap; gap: 20px 32px; align-items: flex-end; justify-content: space-between; border-bottom: 2px solid var(--rule); padding-bottom: 18px; }
  .eyebrow { font-family: 'Silkscreen', monospace; font-size: 10px; letter-spacing: .18em; text-transform: uppercase; color: var(--gold); margin: 0 0 6px; }
  h1 { font-family: 'IBM Plex Sans Condensed', system-ui, sans-serif; font-weight: 700; font-size: clamp(30px, 5vw, 46px); line-height: 1.03; letter-spacing: -.02em; margin: 0; text-wrap: balance; }
  .lede { color: var(--dim); max-width: 46ch; margin: 8px 0 0; }
  .stamp { font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: var(--faint); text-align: right; }

  h2 { font-family: 'IBM Plex Sans Condensed', system-ui, sans-serif; font-weight: 700; font-size: 24px; letter-spacing: -.01em; margin: 48px 0 4px; }
  h2 + .note { color: var(--dim); margin: 0 0 20px; max-width: 62ch; }
  h3 { font-family: 'IBM Plex Sans Condensed', system-ui, sans-serif; font-weight: 600; font-size: 15px; margin: 0 0 8px; letter-spacing: .01em; }

  .legend { display: flex; flex-wrap: wrap; gap: 6px 18px; margin: 18px 0 22px; font-size: 13px; color: var(--dim); }
  .legend span { display: inline-flex; align-items: center; gap: 7px; }
  .pin, .legend i { width: 9px; height: 9px; border-radius: 50%; display: inline-block; flex: none; box-shadow: 0 0 0 1.5px rgba(0,0,0,.45); }
  .pin { margin-right: 8px; vertical-align: -1px; }
  .m-bomb { background: var(--bomb); } .m-candle { background: var(--candle); }
  .m-item { background: var(--item); } .m-gate { background: var(--gate); }
  .m-door { background: #cfd6c4; } .m-chest, .m-sealed { background: var(--chest); }
  .m-pickup { background: var(--gold-bright); }

  .board { display: flex; gap: 26px; align-items: flex-start; overflow-x: auto; padding-bottom: 8px; }
  .grid { display: grid; grid-template-columns: repeat(${cols}, minmax(104px, 1fr)); grid-template-rows: repeat(${rows}, auto); gap: 6px; flex: 1 1 auto; min-width: 640px; }
  .aside { flex: none; width: 138px; padding-left: 22px; border-left: 1px dashed var(--rule); }
  .track { display: grid; grid-template-rows: repeat(${mountain.length}, auto); gap: 6px; }
  .lbl { font-family: 'Silkscreen', monospace; font-size: 9px; color: var(--faint); letter-spacing: .1em; text-transform: uppercase; margin: 0 0 8px; }

  .screen { position: relative; margin: 0; }
  .screen canvas { width: 100%; height: auto; display: block; image-rendering: pixelated; border: 1px solid var(--rule); background: #000; }
  .screen.small canvas { border-color: var(--rule); }
  figcaption { margin-top: 4px; }
  .sname { font-family: 'IBM Plex Sans Condensed', system-ui, sans-serif; font-size: 12px; font-weight: 600; color: var(--dim); }
  .mk { position: absolute; width: 8px; height: 8px; border-radius: 50%; transform: translate(-50%, -50%); margin-left: 3.1%; margin-top: 4.5%; box-shadow: 0 0 0 1.5px rgba(0,0,0,.6); }

  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th { text-align: left; font-family: 'Silkscreen', monospace; font-size: 9px; letter-spacing: .14em; text-transform: uppercase; color: var(--faint); font-weight: 400; padding: 0 12px 8px 0; border-bottom: 1px solid var(--rule); }
  td { padding: 9px 12px 9px 0; border-bottom: 1px solid var(--rule); vertical-align: top; }
  td:first-child { font-weight: 500; }
  .mono { font-family: 'IBM Plex Mono', monospace; font-size: 12.5px; color: var(--dim); font-variant-numeric: tabular-nums; white-space: nowrap; }
  .scroller { overflow-x: auto; }

  .cluster { margin-bottom: 22px; }
  .strip { display: flex; flex-wrap: wrap; gap: 10px; }
  .strip .screen { width: 128px; }

  .cols { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 26px; }
  .stack { display: flex; flex-direction: column; gap: 7px; }
  .row { display: flex; justify-content: space-between; gap: 14px; border-bottom: 1px solid var(--rule); padding-bottom: 6px; }
  .row b { font-weight: 500; }
  .row span { color: var(--dim); font-size: 13.5px; text-align: right; }

  footer { margin-top: 56px; padding-top: 16px; border-top: 2px solid var(--rule); color: var(--faint); font-size: 13px; }
</style>

<div class="wrap">
  <header class="top">
    <div>
      <p class="eyebrow">Parent's copy · every secret shown</p>
      <h1>Atlas of the Land</h1>
      <p class="lede">Every screen in the game, drawn from the game's own tiles. The ${findings.length} ways in that nobody finds by accident are listed first.</p>
    </div>
    <div class="stamp">${world.screens.length} screens<br>${overworld.length} you can walk between<br>generated ${esc(world.generated)}</div>
  </header>

  <h2>What you cannot find by walking</h2>
  <p class="note">These are the doors with nothing marking them. Everything else in the world is reachable by walking into it.</p>
  <div class="scroller">
    <table>
      <thead><tr><th>Leads to</th><th>On this screen</th><th>Tile</th><th>How it opens</th></tr></thead>
      <tbody>${findingRows}</tbody>
    </table>
  </div>

  <h2>The overworld</h2>
  <p class="note">Laid out exactly as it connects — each square is one screen, in its true position. The Mountain Track is drawn apart because it is entered through the crypt door and its one downhill exit would put it on top of the Graveyard.</p>
  <div class="legend">
    <span><i class="m-bomb"></i>Needs a bomb</span>
    <span><i class="m-candle"></i>Needs the candle</span>
    <span><i class="m-item"></i>Needs an item</span>
    <span><i class="m-gate"></i>Spelling barrier</span>
    <span><i class="m-chest"></i>Chest</span>
    <span><i class="m-pickup"></i>On the ground</span>
    <span><i class="m-door"></i>Plain door</span>
  </div>
  <div class="board">
    <div class="grid">${gridCells}</div>
    <div class="aside">
      <p class="lbl">Mountain Track</p>
      <div class="track">${trackCells}</div>
    </div>
  </div>

  <h2>Inside</h2>
  <p class="note">Caves, shops and dungeon rooms are reached through doors, so they have no place on the grid above — the same split the original made.</p>
  ${clusterHtml}

  <h2>Everything worth walking to</h2>
  <div class="cols">
    <div>
      <h3>Chests you just open</h3>
      <div class="stack">${treasures.map((s) => `<div class="row"><b>${esc(s.treasure.rupees)} rupees</b><span>${esc(s.name)}</span></div>`).join('')}</div>
      <h3 style="margin-top:22px">Lying on the ground</h3>
      <div class="stack">${pickups.map((s) => `<div class="row"><b>${esc(s.pickup.itemName)}</b><span>${esc(s.name)}</span></div>`).join('')}</div>
      <h3 style="margin-top:22px">Shops</h3>
      <div class="stack">${shops.map((s) => `<div class="row"><b>${esc(s.name)}</b><span>${esc(s.region)}</span></div>`).join('')}</div>
    </div>
    <div>
      <h3>Chests behind a spelling exercise</h3>
      <div class="stack">${sealedChests.map((c) => `<div class="row"><b>${esc(c.screen.name)}</b><span class="mono">col ${c.gate.col}, row ${c.gate.row}</span></div>`).join('')}</div>
    </div>
  </div>

  <footer>Drawn from the game's own screen data, so it cannot drift from what he is playing. The map he finds in the game shows only where he has been — this one shows everything.</footer>
</div>

<script>
  // The game's real tile colours, so a screen here looks like the screen he is
  // standing on rather than an approximation of it.
  const P = {
    overworld: { g:'#4aab4a', s:'#3f9a41', wall:'#7c6a4a', rock:'#b08b52', water:'#2c6fd4', path:'#d8b878', leaf:'#116b22', leafDark:'#063d12' },
    dungeon:   { g:'#2b2f6b', s:'#333878', wall:'#4550c0', rock:'#3a4290', water:'#1c58b8', path:'#3a3f80', leaf:'#3a4290', leafDark:'#1d2258' },
    cave:      { g:'#4a3a2a', s:'#3d3022', wall:'#6b5540', rock:'#7a6248', water:'#2c5fa4', path:'#5a4632', leaf:'#7a6248', leafDark:'#4f3f2b' },
  }
  function colourFor(ch, p) {
    switch (ch) {
      case '~': return p.water
      case 'T': return p.leafDark
      case ',': return p.leaf
      case 'R': return p.rock
      case '#': return p.wall
      case 'X': return p.rock
      case '*': return p.rock
      case 'S': case 'B': return p.path
      case '=': return '#c9a86a'
      case 'D': case 'C': case 'H': case '^': return '#12131a'
      default: return p.g
    }
  }
  for (const canvas of document.querySelectorAll('.screen canvas')) {
    const rows = canvas.dataset.rows.split('|')
    const p = P[canvas.dataset.theme] || P.overworld
    const ctx = canvas.getContext('2d')
    for (let r = 0; r < 11; r++) {
      for (let c = 0; c < 16; c++) {
        ctx.fillStyle = colourFor((rows[r] || '')[c] || '.', p)
        ctx.fillRect(c, r, 1, 1)
      }
    }
  }
</script>
`

writeFileSync(OUT, html)
console.log(`Wrote ${OUT} — ${world.screens.length} screens, ${findings.length} hidden ways in`)
