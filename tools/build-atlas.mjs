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

// The dump carries each screen's theme, worked out by the game's own rule.
const themeOf = (s) => s.theme

const byId = new Map(world.screens.map((s) => [s.id, s]))
const land = world.screens.filter((s) => s.level === 1)
const ship = world.screens.filter((s) => s.level === 2)
const city = world.screens.filter((s) => s.level === 3)
const overworld = land.filter((s) => s.at)
const decks = ship.filter((s) => s.at)
const blocks = city.filter((s) => s.at)

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
const sMinX = Math.min(...decks.map((s) => s.at.x))
const sMinY = Math.min(...decks.map((s) => s.at.y))
const sCols = Math.max(...decks.map((s) => s.at.x)) - sMinX + 1
const sRows = Math.max(...decks.map((s) => s.at.y)) - sMinY + 1
const cMinX = Math.min(...blocks.map((s) => s.at.x))
const cMinY = Math.min(...blocks.map((s) => s.at.y))
const cCols = Math.max(...blocks.map((s) => s.at.x)) - cMinX + 1
const cRows = Math.max(...blocks.map((s) => s.at.y)) - cMinY + 1

/** Everything hard to find, in the order he would meet it. */
const findings = []
for (const s of world.screens) {
  for (const p of s.portals) {
    if (!p.hidden && !p.requires && !p.guardedBy && !p.needsSuit) continue
    findings.push({
      what: p.toName,
      where: s.name,
      tile: `col ${p.col}, row ${p.row}`,
      how: p.teleporter
        ? (p.hidden === 'bomb'
            ? 'Blow the cracked plate with a Plasma Charge, and a teleporter pad is behind it'
            : 'Step onto the teleporter pad')
        : p.hidden === 'bomb'
        ? (s.level === 2 ? 'Blow the cracked bulkhead with a Plasma Charge' : 'Bomb the cracked rock')
        : p.hidden === 'candle'
          ? (s.level === 2 ? 'Unscrew the loose panel with the Laser Screwdriver' : 'Burn the bush with the Blue Candle')
          : p.requires
            ? `${p.requires}, held in the B slot — press C until it shows${p.consumes ? (s.level === 2 ? '. It burns out on landing, so it is one way only' : '. They tear on the way, so it is one way only') : ''}`
            : p.needsSuit
              ? 'Walk into the locker first: without the suit this door is fatal'
              : `Opens once "${p.guardedBy}" is done`,
      kind: p.teleporter ? 'warp' : p.hidden ?? (p.requires ? 'item' : 'gate'),
      level: s.level,
    })
  }
}

const treasures = world.screens.filter((s) => s.treasure)
const pickups = world.screens.filter((s) => s.pickup)
const shops = world.screens.filter((s) => s.shop)
const sealedChests = world.screens.flatMap((s) =>
  s.gates.filter((g) => g.kind === 'chest').map((g) => ({ screen: s, gate: g })),
)
const levelTag = (s) => (s.level === 2 ? ' · Level 2' : '')

/**
 * The guardians: where each one lives, and the walk to it.
 *
 * Found by walking back from the boss room through the doors that lead into
 * it until a screen on the walkable map is reached, so the route is the real
 * one and not a description that could drift.
 */
const isBossRoom = (s) => s.spawns.some((k) => /^boss/.test(k))
function routeTo(room) {
  // Breadth-first over "which screens have a door into this one".
  const parent = new Map([[room.id, null]])
  const queue = [room.id]
  while (queue.length) {
    const id = queue.shift()
    const here = byId.get(id)
    if (here.at) {
      const path = []
      for (let cur = id; cur; cur = parent.get(cur)) path.push(byId.get(cur))
      return path
    }
    for (const other of world.screens) {
      if (other.level !== room.level || parent.has(other.id)) continue
      // Doors, and walking off an edge: the Mountain Track sits off the map
      // and is climbed screen by screen to the Hollow Keep.
      if (other.portals.some((p) => p.to === id) || Object.values(other.exits).includes(id)) {
        parent.set(other.id, id)
        queue.push(other.id)
      }
    }
  }
  return [room]
}
const guardians = world.screens
  .filter(isBossRoom)
  .map((room) => {
    const path = routeTo(room)
    const number = Number(room.spawns.find((k) => /^boss/.test(k)).replace('boss', ''))
    const barriers = path.flatMap((sc) =>
      sc.gates
        .filter((g) => g.kind !== 'chest' && g.kind !== 'wall')
        .map((g) => ({ screen: sc.name, kind: g.kind, id: g.id, optional: g.optional, challenge: g.challenge })),
    )
    return { room, number, path, barriers, level: room.level }
  })
  .sort((a, b) => a.level - b.level || a.number - b.number)

/**
 * The mouth of each guardian's lair, on the walkable map.
 *
 * The guardian himself is deep inside, in a room that has no place on the
 * grid — so what is worth marking out there is the door he goes in by. Taken
 * from the first step of each route, so it is the real door and not a guess.
 */
const lairs = new Map()
for (const g of guardians) {
  // The last screen on the route he can still walk to, and the door he leaves
  // it by. For three of the four that is the first step; for the one up the
  // Mountain Track it is four screens further on, at the Summit Gate, and
  // marking the crypt door at the bottom of the hill would be a lie.
  const outside = (sc) => Boolean(sc.at) || mountain.includes(sc.id)
  let i = -1
  g.path.forEach((sc, at) => { if (outside(sc)) i = at })
  const entry = g.path[i]
  const next = g.path[i + 1]
  if (!entry || !next) continue
  const door = entry.portals.find((p) => p.to === next.id)
  if (!door) continue
  const list = lairs.get(entry.id) ?? []
  list.push({ col: door.col, row: door.row, number: g.number, room: g.room.name, level: g.level })
  lairs.set(entry.id, list)
}

const kindWord = (g) =>
  g.challenge === 'half' ? 'half an exercise'
  : g.challenge === 'intro' ? 'two quick words'
  : g.optional ? 'a short review challenge'
  : 'the next unfinished exercise'

const guardianHtml = (level) =>
  guardians
    .filter((g) => g.level === level)
    .map((g) => {
      const entry = g.path[0]
      const steps = g.path.map((sc) => esc(sc.name)).join(' → ')
      const rows = g.barriers
        .map((b) => `<div class="row"><b>${esc(b.screen)}</b><span>${esc(b.kind)} · ${esc(kindWord(b))}</span></div>`)
        .join('')
      return `<section class="guardian">
        <h3><span class="pin m-boss"></span>${level === 2 ? 'Mech' : 'Guardian'} ${g.number} · ${esc(g.room.region)}</h3>
        <p><b>Lives in:</b> ${esc(g.room.name)}. <b>Start from:</b> ${esc(entry.name)} on the map${level === 2 ? '' : ''}.</p>
        <p class="mono">${steps}</p>
        <p class="lbl">Spelling barriers on the screens along the way (${g.barriers.length})</p>
        <div class="stack">${rows || '<div class="row"><span>none</span></div>'}</div>
      </section>`
    })
    .join('\n')

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** What opens a piece of cracked rock, in the words of the world it is in. */
const charge = (level) => (level === 2 ? 'a Plasma Charge' : 'a bomb')
const flame = (level) => (level === 2 ? 'the Laser Screwdriver' : 'the Blue Candle')

/** True if a teleporter pad is hiding on this tile. */
const warpAt = (s, col, row) => s.portals.some((p) => p.teleporter && p.col === col && p.row === row)

/** The hover text on a cracked tile: what it is, and what is behind it. */
function breakTitle(s, b) {
  const tool = b.needs === 'bomb' ? charge(s.level) : flame(s.level)
  if (b.opens) return `Open with ${tool} — into ${b.opens.name}`
  if (b.gate) return `Open with ${tool}, or spell it open — nothing behind it either way`
  return `Cracked, and nothing behind it — ${tool} spent here buys nothing`
}

/** A screen as a 16x11 pixel map, plus its markers. */
function tile(s, opts = {}) {
  const marks = []
  const breakable = (col, row) => s.breakables.some((b) => b.col === col && b.row === row)
  // Anything sitting on breakable rock is marked from the rock, below, so a
  // door and the boulder in front of it do not put two dots on one tile.
  for (const p of s.portals) {
    if (p.hidden) continue
    marks.push({
      col: p.col,
      row: p.row,
      cls: p.teleporter ? 'm-warp' : p.requires ? 'm-item' : 'm-door',
      title: p.teleporter ? `Teleporter — to ${p.toName}` : `to ${p.toName}`,
    })
  }
  if (s.treasure) marks.push({ col: s.treasure.col, row: s.treasure.row, cls: 'm-chest', title: `${s.treasure.rupees} rupees` })
  if (s.pickup) marks.push({ col: s.pickup.col, row: s.pickup.row, cls: 'm-pickup', title: s.pickup.itemName })
  if (isBossRoom(s)) marks.push({ col: 7, row: 4, cls: 'm-boss', title: 'The guardian' })
  for (const g of s.gates) {
    if (breakable(g.col, g.row)) continue
    marks.push({ col: g.col, row: g.row, cls: g.kind === 'chest' ? 'm-sealed' : 'm-gate', title: g.id })
  }
  // Every piece of cracked rock on the screen, whether or not it hides
  // anything — a hollow pin is rock that opens onto nothing.
  for (const b of s.breakables) {
    marks.push({
      col: b.col,
      row: b.row,
      cls:
        warpAt(s, b.col, b.row) ? 'm-bomb m-warp'
        : b.needs === 'candle' ? 'm-candle'
        : b.opens || b.gate ? 'm-bomb'
        : 'm-dud',
      title: warpAt(s, b.col, b.row)
        ? `${breakTitle(s, b)} — and a teleporter behind it`
        : breakTitle(s, b),
    })
  }

  // The way in to a big monster's cave, drawn on the tile of the door itself.
  // If something already marks that tile — a boulder, usually — the black
  // centre goes inside that pin rather than beside it.
  for (const lair of lairs.get(s.id) ?? []) {
    const note = `The way to ${lair.level === 2 ? 'mech' : 'guardian'} ${lair.number}, in ${lair.room}`
    // Every pin on that tile, not just the first: a dungeon door usually
    // carries a barrier pin as well, and blacking out only the one underneath
    // leaves the other sitting on top of it still wearing its own colour.
    const existing = marks.filter((m) => m.col === lair.col && m.row === lair.row)
    if (existing.length) {
      for (const m of existing) {
        m.cls += ' m-lair'
        m.title += ` · ${note}`
      }
    } else {
      marks.push({ col: lair.col, row: lair.row, cls: 'm-lair', title: note })
    }
  }

  const dots = marks
    .map((m) => `<i class="mk ${m.cls}" style="left:${(m.col / 16) * 100}%;top:${(m.row / 11) * 100}%" title="${esc(m.title)}"></i>`)
    .join('')

  // The pins hang off the picture, not off the figure: with the caption inside
  // the positioning box, a pin on the bottom row of a screen landed somewhere
  // in the middle of the screen's name.
  return `<figure class="screen${opts.small ? ' small' : ''}">
      <div class="shot">
        <canvas width="16" height="11" data-rows="${esc(s.rows.join('|'))}" data-theme="${themeOf(s)}"></canvas>
        ${dots}
      </div>
      <figcaption><span class="sname">${esc(s.name)}</span></figcaption>
    </figure>`
}

const gridCells = overworld
  .map((s) => `<div class="cell" style="grid-column:${s.at.x - minX + 1};grid-row:${s.at.y - minY + 1}">${tile(s)}</div>`)
  .join('\n')

const deckCells = decks
  .map((s) => `<div class="cell" style="grid-column:${s.at.x - sMinX + 1};grid-row:${s.at.y - sMinY + 1}">${tile(s)}</div>`)
  .join('\n')

const blockCells = blocks
  .map((s) => `<div class="cell" style="grid-column:${s.at.x - cMinX + 1};grid-row:${s.at.y - cMinY + 1}">${tile(s)}</div>`)
  .join('\n')

const trackCells = mountain
  .map((id, i) => `<div class="cell" style="grid-row:${mountain.length - i}">${tile(byId.get(id))}</div>`)
  .join('\n')

/** Interiors, grouped the way they connect. */
function clustersOf(list) {
  const clusters = []
  for (const region of [...new Set(list.filter((s) => !s.at && s.region !== 'Mountain').map((s) => s.region))]) {
    const members = list.filter((s) => !s.at && s.region === region)
    clusters.push({ region, members })
  }
  return clusters
    .map(
      (c) => `<section class="cluster">
      <h3>${esc(c.region)}</h3>
      <div class="strip">${c.members.map((s) => tile(s, { small: true })).join('')}</div>
    </section>`,
    )
    .join('\n')
}
/**
 * Every piece of cracked rock in a world, and what a bomb on it buys.
 *
 * The table above this one is a list of doors, so a bomb that opens nothing
 * never appears in it — and those are exactly the ones that make him think he
 * is stuck. This is the other list: every cracked tile there is, taken off the
 * tile rows themselves.
 */
function bombSpots(level) {
  return world.screens
    .filter((s) => s.level === level)
    .flatMap((s) => s.breakables.filter((b) => b.needs === 'bomb').map((b) => ({ s, b })))
}

/** True if a door is a step on some guardian's route — i.e. he must open it. */
const onGuardianRoute = (fromId, toId) =>
  guardians.some((g) => g.path.some((sc, i) => sc.id === fromId && g.path[i + 1]?.id === toId))

const bombRows = (level) =>
  bombSpots(level)
    .map(({ s, b }) => {
      const must = b.opens && onGuardianRoute(s.id, b.opens.id)
      const what = b.opens
        ? `<b>${esc(b.opens.name)}</b>`
        : b.gate
          ? 'Nothing — a spelling barrier stands on it, and open or not there is only more path behind it'
          : '<i>Nothing at all.</i> Solid rock, and the charge is wasted'
      return `<tr class="${must ? 'must' : b.opens ? '' : 'dud'}">
      <td><span class="pin ${b.opens || b.gate ? 'm-bomb' : 'm-dud'}"></span>${esc(s.name)}</td>
      <td class="mono">col ${b.col}, row ${b.row}</td>
      <td>${what}</td>
      <td>${must ? '<b class="must-tag">Must be opened to finish the game</b>' : b.opens ? 'Optional' : '—'}</td>
    </tr>`
    })
    .join('\n')

const mustCount = (level) => bombSpots(level).filter(({ s, b }) => b.opens && onGuardianRoute(s.id, b.opens.id)).length
const dudCount = (level) => bombSpots(level).filter(({ b }) => !b.opens && !b.gate).length

/** The key to the pins, above each of the two maps. */
const legend = `<div class="legend">
    <span><i class="m-lair"></i>The way in to a big monster's cave</span>
    <span><i class="m-warp"></i>A teleporter pad — only two in the game</span>
    <span><i class="m-bomb"></i>Cracked — a bomb opens it</span>
    <span><i class="m-dud"></i>Cracked, with nothing behind it</span>
    <span><i class="m-candle"></i>Needs the candle</span>
    <span><i class="m-item"></i>Needs an item</span>
    <span><i class="m-gate"></i>Spelling barrier</span>
    <span><i class="m-chest"></i>Chest</span>
    <span><i class="m-pickup"></i>On the ground</span>
    <span><i class="m-door"></i>Plain door</span>
    <span><i class="m-boss"></i>The guardian's own room</span>
  </div>`

const clusterHtml = clustersOf(land)
const shipClusterHtml = clustersOf(ship)
const cityClusterHtml = clustersOf(city)

const findingRow = (f) => `<tr>
      <td><span class="pin ${f.kind === 'warp' ? 'm-warp' : f.kind === 'bomb' ? 'm-bomb' : f.kind === 'candle' ? 'm-candle' : f.kind === 'item' ? 'm-item' : 'm-gate'}"></span>${esc(f.what)}</td>
      <td>${esc(f.where)}</td>
      <td class="mono">${esc(f.tile)}</td>
      <td>${esc(f.how)}</td>
    </tr>`
const findingRows = findings.filter((f) => f.level === 1).map(findingRow).join('\n')
const shipFindingRows = findings.filter((f) => f.level === 2).map(findingRow).join('\n')
const cityFindingRows = findings.filter((f) => f.level === 3).map(findingRow).join('\n')

const html = `<title>Atlas of Both Worlds</title>
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
    --bomb: #ffd400;
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
      --bomb: #ffe14d;
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
    --bomb: #ffe14d; --candle: #f2a04a; --item: #6aa3f0; --gate: #b393f0;
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
  .pin, .legend i { width: 9px; height: 9px; border-radius: 50%; display: inline-block; flex: none; }
  .pin { margin-right: 8px; vertical-align: -1px; }
  /* The ring every pin gets unless it asks for its own. Wrapped in :where() so
     that it counts for nothing: without that, ".legend i" outranks the rules
     below and a pin in the key comes out a different shape from the same pin
     on the map. */
  :where(.pin, .legend i, .mk) { box-shadow: 0 0 0 1.5px rgba(0,0,0,.5); }
  /* Bright yellow, and ringed dark, because it has to carry on pale sand as
     well as on black rock. Hollow yellow is cracked rock with nothing in it. */
  .m-bomb { background: var(--bomb); box-shadow: 0 0 0 1.6px rgba(0,0,0,.75); }
  .m-dud { background: #fff; box-shadow: inset 0 0 0 3px var(--bomb), 0 0 0 1.4px rgba(0,0,0,.55); }
  .m-candle { background: var(--candle); }
  /* A teleporter: pink, because there are two of them in ninety-nine screens
     and they have to be findable at a glance. The game's own cyan was the
     first try and it read as one more bomb spot among the hull plating. On a
     cracked tile the pink keeps the yellow ring, because it is still a charge
     that opens it. */
  .m-warp { background: #ff3fc5 !important; box-shadow: 0 0 0 1.8px #f6f3e7, 0 0 0 3.2px rgba(0,0,0,.65); }
  .m-bomb.m-warp { box-shadow: 0 0 0 2.2px var(--bomb), 0 0 0 3.6px rgba(0,0,0,.7); }
  .m-item { background: var(--item); } .m-gate { background: var(--gate); }
  .m-door { background: #cfd6c4; } .m-chest, .m-sealed { background: var(--chest); }
  /* Ringed white, so a thing lying on the ground is not mistaken for the
     bright yellow of cracked rock. */
  .m-pickup { background: var(--gold-bright); box-shadow: 0 0 0 1.5px #fff, 0 0 0 2.8px rgba(0,0,0,.5); }
  .m-boss { background: #ff3b30; box-shadow: 0 0 0 2px #fff, 0 0 0 3.5px rgba(0,0,0,.6); }
  /* The mouth of a big monster's cave, out on the walkable map: a black dot,
     ringed white so it still reads against the dark doorway underneath it.
     On a tile that is already marked, the black takes the centre and whatever
     was there keeps the ring. */
  .m-lair { background: #000 !important; box-shadow: 0 0 0 1.8px #fff, 0 0 0 3px rgba(0,0,0,.55); }
  .m-bomb.m-lair { box-shadow: 0 0 0 2.2px var(--bomb), 0 0 0 3.4px rgba(0,0,0,.7); }
  .m-candle.m-lair { box-shadow: 0 0 0 2.2px var(--candle), 0 0 0 3.4px rgba(0,0,0,.7); }
  .m-dud.m-lair { box-shadow: 0 0 0 1.8px #fff, 0 0 0 3px rgba(0,0,0,.55); }
  .guardian { border: 1px solid var(--rule); border-left: 4px solid #ff3b30; border-radius: 6px; padding: 12px 14px; margin-bottom: 14px; background: var(--panel); }
  .guardian h3 { display: flex; align-items: center; gap: 4px; }
  .guardian p { margin: 4px 0; }
  .guardian .mono { color: var(--dim); white-space: normal; }
  .guardians { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 14px; }

  .board { display: flex; gap: 26px; align-items: flex-start; overflow-x: auto; padding-bottom: 8px; }
  .grid { display: grid; grid-template-columns: repeat(${cols}, minmax(104px, 1fr)); grid-template-rows: repeat(${rows}, auto); gap: 6px; flex: 1 1 auto; min-width: 640px; }
  .grid.ship { grid-template-columns: repeat(${sCols}, minmax(104px, 1fr)); grid-template-rows: repeat(${sRows}, auto); }
  .grid.city { grid-template-columns: repeat(${cCols}, minmax(104px, 1fr)); grid-template-rows: repeat(${cRows}, auto); min-width: 900px; }
  .aside { flex: none; width: 138px; padding-left: 22px; border-left: 1px dashed var(--rule); }
  .track { display: grid; grid-template-rows: repeat(${mountain.length}, auto); gap: 6px; }
  .lbl { font-family: 'Silkscreen', monospace; font-size: 9px; color: var(--faint); letter-spacing: .1em; text-transform: uppercase; margin: 0 0 8px; }

  .screen { margin: 0; }
  .shot { position: relative; display: block; }
  .shot canvas { width: 100%; height: auto; display: block; image-rendering: pixelated; border: 1px solid var(--rule); background: #000; }
  .screen.small .shot canvas { border-color: var(--rule); }
  figcaption { margin-top: 4px; }
  .sname { font-family: 'IBM Plex Sans Condensed', system-ui, sans-serif; font-size: 12px; font-weight: 600; color: var(--dim); }
  .mk { position: absolute; width: 8px; height: 8px; border-radius: 50%; transform: translate(-50%, -50%); margin-left: 3.1%; margin-top: 4.5%; }

  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th { text-align: left; font-family: 'Silkscreen', monospace; font-size: 9px; letter-spacing: .14em; text-transform: uppercase; color: var(--faint); font-weight: 400; padding: 0 12px 8px 0; border-bottom: 1px solid var(--rule); }
  td { padding: 9px 12px 9px 0; border-bottom: 1px solid var(--rule); vertical-align: top; }
  td:first-child { font-weight: 500; }
  .mono { font-family: 'IBM Plex Mono', monospace; font-size: 12.5px; color: var(--dim); font-variant-numeric: tabular-nums; white-space: nowrap; }
  .scroller { overflow-x: auto; }
  /* A bomb he has to spend, and a bomb he would waste. */
  tr.must td { background: color-mix(in srgb, var(--bomb) 14%, transparent); }
  .must-tag { color: var(--ink); }
  tr.dud td { color: var(--faint); }

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
      <p class="eyebrow">Parent's copy · every secret shown · three worlds</p>
      <h1>Atlas of the Land, the Ship, and the City</h1>
      <p class="lede">Every screen in all three levels, drawn from the game's own tiles. Level 1 is the land; Level 2 is the sky-ship a thousand years on, reached by beating all four dungeon guardians; Level 3 is New York, now, reached by beating all four mechs — or any of them from the parent panel. The ways in that nobody finds by accident are listed first for each.</p>
    </div>
    <div class="stamp">${land.length} screens in the land · ${ship.length} on the ship · ${city.length} in the city<br>${overworld.length} + ${decks.length} + ${blocks.length} you can walk between<br>generated ${esc(world.generated)}</div>
  </header>

  <h2>Level 1 · The four guardians</h2>
  <p class="note">All four have to fall before the story moves to Level 2. Each lives at the far end of a dungeon; the route below runs from a screen on the walkable map, through every door, to the room the guardian is in. A defeated guardian stays defeated. A red pin marks each guardian's room on the maps further down.</p>
  <div class="guardians">${guardianHtml(1)}</div>

  <h2>Level 1 · What you cannot find by walking</h2>
  <p class="note">These are the doors with nothing marking them. Everything else in the land is reachable by walking into it.</p>
  <div class="scroller">
    <table>
      <thead><tr><th>Leads to</th><th>On this screen</th><th>Tile</th><th>How it opens</th></tr></thead>
      <tbody>${findingRows}</tbody>
    </table>
  </div>

  <h2>Level 1 · Where every bomb goes</h2>
  <p class="note">All ${bombSpots(1).length} pieces of cracked rock in the land, read off the tiles themselves. <b>${mustCount(1)} of them have to be blown open to finish the game</b> — two of the four dungeons have no other way in, so a child with no bombs cannot reach half the guardians however well he spells. Bombs are 40 rupees in the village shop, and the blast opens every cracked tile it touches, so one is often enough for a cluster. ${dudCount(1)} of the ${bombSpots(1).length} open onto nothing at all — all three inside the Ember Vault, where picking the right slab is the puzzle. Those are the hollow pins.</p>
  <div class="scroller">
    <table>
      <thead><tr><th>On this screen</th><th>Tile</th><th>What is behind it</th><th>Needed?</th></tr></thead>
      <tbody>${bombRows(1)}</tbody>
    </table>
  </div>

  <h2>Level 1 · The overworld</h2>
  <p class="note">Laid out exactly as it connects — each square is one screen, in its true position. The Mountain Track is drawn apart because it is entered through the crypt door and its one downhill exit would put it on top of the Graveyard.</p>
  ${legend}
  <div class="board">
    <div class="grid">${gridCells}</div>
    <div class="aside">
      <p class="lbl">Mountain Track</p>
      <div class="track">${trackCells}</div>
    </div>
  </div>

  <h2>Level 1 · Inside</h2>
  <p class="note">Caves, shops and dungeon rooms are reached through doors, so they have no place on the grid above — the same split the original made.</p>
  ${clusterHtml}

  <h2>Level 2 · The sky-ship</h2>
  <p class="note">The same quest a thousand years on, in a different shape: a block of decks he works his way round rather than a road north. The four rocks — the dungeons of the future — hang off the middle of it through four airlocks. There are no shop doors: each shop is a computer he walks into. The stores console is on the Bridge, the cyborg bay console in the Medbay, the forge console in Engineering; the two hidden terminals are behind cracked bulkheads in the Vault and on the Lower Deck.</p>
  ${legend}
  <div class="board">
    <div class="grid ship">${deckCells}</div>
  </div>

  <h2>Level 2 · The four mechs</h2>
  <p class="note">All four have to fall to finish the game. Each lives at the core of a rock, and every rock is reached through an airlock — suit up at the locker inside before the outer door.</p>
  <div class="guardians">${guardianHtml(2)}</div>

  <h2>Level 2 · What you cannot find by walking</h2>
  <p class="note">The airlocks are the one new rule of the ship: walk into the locker inside each one to put the space suit on before the outer door. Without it the outer door ends him on the spot, and a medical drone carries him back to the bridge. The suit comes off by itself when he walks back into the ship.</p>
  <div class="scroller">
    <table>
      <thead><tr><th>Leads to</th><th>On this screen</th><th>Tile</th><th>How it opens</th></tr></thead>
      <tbody>${shipFindingRows}</tbody>
    </table>
  </div>

  <h2>Level 2 · Where every Plasma Charge goes</h2>
  <p class="note">The same list for the ship. All ${bombSpots(2).length} cracked bulkheads, and this time <b>none of them stands between him and a mech</b> — every rock is reached through an airlock, so the charges here buy shortcuts, money and the Ship Schematic rather than progress. The one worth spending a charge on early is the Observatory: the Schematic behind it is the ship's map, and it is the only copy.</p>
  <div class="scroller">
    <table>
      <thead><tr><th>On this deck</th><th>Tile</th><th>What is behind it</th><th>Needed?</th></tr></thead>
      <tbody>${bombRows(2)}</tbody>
    </table>
  </div>

  <h2>Level 2 · Inside, and out on the rocks</h2>
  <p class="note">The airlocks, the four rocks with a mech at the core of each, the hidden rooms behind bulkheads, and the outpost across the void from the hangar — the island of the ship, reached by rocket and left by a second one bought from the stranded pilot below it.</p>
  ${shipClusterHtml}

  <h2>Level 3 · The Village</h2>
  <p class="note">New York, now: the West Village west of Sixth Avenue, the East Village and Alphabet City east of Broadway, Washington Square in the middle and Tompkins Square at the far end. Nine blocks across, three deep, laid out exactly as they connect. Streets run across a square, avenues run up one, and where they meet there is a crosswalk. He arrives in Washington Square with nothing; the knife is on a bench by the fountain. The two police tapes either side of the square are the first spellings. <b>This is stage one of the city</b>: the streets and the shops. The traffic, the subway, the guns and the three guardians are still to come.</p>
  ${legend}
  <div class="board">
    <div class="grid city">${blockCells}</div>
  </div>

  <h2>Level 3 · Inside</h2>
  <p class="note">The shops, the pet shop, and the community garden on Avenue B. Every shop door is under an awning; walk into it. The newsstand on Sheridan Square sells the Street Map, which is the only way to get one. The pawn shop (We Buy Gold) is the hidden trader; the hardware store on Christopher Street is the smith, and it wants a spelling before it sells the box hammer.</p>
  ${cityClusterHtml}

  <h2>Level 3 · What you cannot find by walking</h2>
  <p class="note">The city keeps its secrets behind boarded-up doors (firecrackers) and padlocked dumpsters (bolt cutters). None of the boarded doors lead anywhere yet.</p>
  <div class="scroller">
    <table>
      <thead><tr><th>Leads to</th><th>On this screen</th><th>Tile</th><th>How it opens</th></tr></thead>
      <tbody>${cityFindingRows || '<tr><td colspan="4">Nothing hidden yet. The boarded doors open in a later stage.</td></tr>'}</tbody>
    </table>
  </div>

  <h2>Level 3 · Same things, new names</h2>
  <div class="cols">
    <div class="stack">
      <div class="row"><b>Wooden, Metal Sword</b><span>Kitchen Knife, Box Hammer</span></div>
      <div class="row"><b>Bronze, Golden Sword</b><span>Pistol, Rifle</span></div>
      <div class="row"><b>Bow and arrows</b><span>Machine Gun and Bullets</span></div>
      <div class="row"><b>Shields</b><span>Pizza Box, Trash-can Lid, Manhole Cover, Riot Shield</span></div>
      <div class="row"><b>Wings</b><span>Citi Bike Pass — over the bridge, one way</span></div>
      <div class="row"><b>Blue Candle</b><span>Bolt Cutters — open a padlocked dumpster</span></div>
      <div class="row"><b>Bombs</b><span>Firecrackers — blow open a boarded door, or a hydrant</span></div>
    </div>
    <div class="stack">
      <div class="row"><b>Bait</b><span>Pizza Slice</span></div>
      <div class="row"><b>Tunics, Blue Ring</b><span>Knicks and Yankees jackets, Subway Token</span></div>
      <div class="row"><b>Map</b><span>Street Map — forty dollars at the newsstand on Sheridan Square</span></div>
      <div class="row"><b>Animal food</b><span>Bodega sandwich — same grammar rule and four questions</span></div>
      <div class="row"><b>Vanishing potion</b><span>Hoodie and Sunglasses</span></div>
      <div class="row"><b>The animal</b><span>The same six, at the original pet shop on Bleecker Street</span></div>
    </div>
  </div>

  <h2>Level 2 · Same things, new names</h2>
  <div class="cols">
    <div class="stack">
      <div class="row"><b>Wooden, Metal, Bronze Sword</b><span>Training Saber, Blue and Green Lightsaber</span></div>
      <div class="row"><b>Golden Sword</b><span>Scythe — its sweep hits all round him</span></div>
      <div class="row"><b>Shields</b><span>Deflector Plate, Energy, Force, Photon Shield</span></div>
      <div class="row"><b>Wings</b><span>Rocketship — hangar to outpost and back</span></div>
      <div class="row"><b>Blue Candle</b><span>Laser Screwdriver — lights dark decks, unscrews panels</span></div>
      <div class="row"><b>Bombs</b><span>Plasma Charges — blow cracked bulkheads</span></div>
    </div>
    <div class="stack">
      <div class="row"><b>Bait</b><span>Scrap Metal</span></div>
      <div class="row"><b>Tunics, Blue Ring</b><span>Nano-suits, Circuit Ring</span></div>
      <div class="row"><b>Map</b><span>Ship Schematic — behind the cracked bulkhead in the Observatory</span></div>
      <div class="row"><b>Animal food</b><span>Battery pack — same grammar rule and four questions</span></div>
      <div class="row"><b>Vanishing potion</b><span>Cloaking Serum — behind sealed panels in the Mess Hall and Laboratory Two</span></div>
      <div class="row"><b>The animal</b><span>The same six, half chrome; chosen at the cyborg bay console</span></div>
    </div>
  </div>

  <h2>Everything worth walking to</h2>
  <div class="cols">
    <div>
      <h3>Chests you just open</h3>
      <div class="stack">${treasures.map((s) => `<div class="row"><b>${esc(s.treasure.rupees)} rupees</b><span>${esc(s.name)}${levelTag(s)}</span></div>`).join('')}</div>
      <h3 style="margin-top:22px">Lying on the ground</h3>
      <div class="stack">${pickups.map((s) => `<div class="row"><b>${esc(s.pickup.itemName)}</b><span>${esc(s.name)}${levelTag(s)}</span></div>`).join('')}</div>
      <h3 style="margin-top:22px">Shops and computers</h3>
      <div class="stack">${shops.map((s) => `<div class="row"><b>${esc(s.name)}</b><span>${esc(s.region)}${levelTag(s)}</span></div>`).join('')}</div>
    </div>
    <div>
      <h3>Chests behind a spelling exercise</h3>
      <div class="stack">${sealedChests.map((c) => `<div class="row"><b>${esc(c.screen.name)}${levelTag(c.screen)}</b><span class="mono">col ${c.gate.col}, row ${c.gate.row}</span></div>`).join('')}</div>
    </div>
  </div>

  <h2>His animal, and the grammar behind it</h2>
  <p class="note">The one thing on this page that is not a place. Worth knowing about, because it is where a good deal of the grammar practice happens.</p>
  <div class="cols">
    <div>
      <h3>Choosing one</h3>
      <p>In the rocks on the left of <b>North Gate</b>, one screen north of the square, there is a cave mouth. Inside, a keeper offers six animals — dog, cat, rabbit, wombat, kangaroo, goat. They are identical in everything but looks, and he can walk back in and swap as often as he likes.</p>
      <p>The animal follows him everywhere above ground. It waits behind when he goes into a cave or dungeon, or flies to the island, and is at his heel again the moment he is back out.</p>
    </div>
    <div>
      <h3>Animal food</h3>
      <p>A sack turns up in the open every <b>four screens</b> he walks onto above ground — going back and forth over the same two screens counts just as well as exploring. Only one is ever out at a time.</p>
      <p>Walking onto it asks whether he wants it. Saying yes puts <b>one grammar rule</b> on screen — explained first, not withheld — and then <b>four questions</b> on that rule. Six rules take turns: plural nouns, past-tense verbs, comparing with -er and -est, the two jobs of an apostrophe, verbs matching their subject, and commas. Each has fourteen questions, and recent ones are held back.</p>
      <p>Earning a sack makes the animal fight monsters for the screen he is on and the next one, then it goes back to just walking along. It never touches a dungeon guardian. None of this counts towards the forty exercises.</p>
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
    ship:      { g:'#3b4452', s:'#46505f', wall:'#3a414d', rock:'#5a6b8a', water:'#06070f', path:'#c9a32c', leaf:'#e2883a', leafDark:'#6b7686' },
    rock:      { g:'#5c5e66', s:'#4f5159', wall:'#3a3c45', rock:'#7a7c86', water:'#06070f', path:'#8a8c96', leaf:'#57d2c6', leafDark:'#3a3c45' },
    airlock:   { g:'#2e3440', s:'#3a4252', wall:'#4e5563', rock:'#5a6b8a', water:'#06070f', path:'#c9a32c', leaf:'#e2883a', leafDark:'#4e5563' },
    street:    { g:'#b7b3a8', s:'#9e9a8f', wall:'#7a6154', rock:'#9d9a90', water:'#3a3b41', path:'#ece9df', road:'#3a3b41', leaf:'#16161b', leafDark:'#a4543b' },
    park:      { g:'#4f9f47', s:'#43903d', wall:'#23242a', rock:'#a89f8f', water:'#2f6fd0', path:'#a49a94', road:'#a49a94', leaf:'#2e7a3a', leafDark:'#1d5824' },
    platform:  { g:'#8d8b84', s:'#76746d', wall:'#e6e2d6', rock:'#2f6b46', water:'#17171b', path:'#f2c12e', road:'#c6c8c4', leaf:'#16161b', leafDark:'#e6e2d6' },
    train:     { g:'#a7a398', s:'#8f8b80', wall:'#c6c8c4', rock:'#e0862c', water:'#0d0d14', path:'#f2c12e', road:'#a7a398', leaf:'#16161b', leafDark:'#c6c8c4' },
    bodega:    { g:'#d8d3c4', s:'#b9b3a3', wall:'#3f6b5a', rock:'#8a6a44', water:'#c9e6f2', path:'#e8bb2c', road:'#d8d3c4', leaf:'#e8e4d8', leafDark:'#3f6b5a' },
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
      case 'S': return p.path
      case 'B': return p.road ?? p.path
      case 'p': return p.rock
      case 'A': return p.rock
      case '=': return '#c9a86a'
      case 'D': case 'C': case 'H': case '^': return '#12131a'
      default: return p.g
    }
  }
  for (const canvas of document.querySelectorAll('.shot canvas')) {
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
