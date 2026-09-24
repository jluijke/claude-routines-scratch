/**
 * The quiet square, checked as data.
 *
 * The behaviour of the place — the dissolve, the hearts, the rabbit — is a
 * browser's job and lives in tools/haven-smoke.mjs. What belongs here is the
 * shape of it: that there is genuinely no way out but the pad, that the pad at
 * each end points at the other one, and that nothing in it can hurt him.
 */
import { describe, expect, it } from 'vitest'
import { screenById, SCREENS } from '../src/game/world/screens'
import { gateById } from '../src/game/gates'
import { TILES, type TileChar } from '../src/game/world/tiles'

const haven = screenById('haven-square')!
const lab = screenById('ship-lab-2')!

describe('a safe place to land', () => {
  it('exists, in the old world, but belongs to the new one', () => {
    expect(haven).toBeDefined()
    // Level 2, so he keeps the ship's pack and the ship's names for it —
    // it is a side trip, not a way home.
    expect(haven.level).toBe(2)
    // And no ship setting, so it is drawn and scored as the land: grass,
    // trees, and the overworld theme playing over it.
    expect(haven.setting).toBeUndefined()
  })

  it('has no way in or out but the pad', () => {
    expect(haven.exits).toEqual({})
    expect((haven.portals ?? []).length).toBe(1)
    expect(haven.portals![0]!.teleporter).toBe(true)
    expect(haven.portals![0]!.to).toBe('ship-lab-2')
  })

  it('is sealed all the way round', () => {
    // Every tile on the border is solid, so leaning on a key never walks him
    // off an edge into a screen that does not exist.
    const solid = (col: number, row: number): boolean =>
      TILES[((haven.rows[row] ?? '')[col] ?? '#') as TileChar]?.solid === true
    for (let col = 0; col < 16; col++) {
      expect(solid(col, 0), `top at ${col}`).toBe(true)
      expect(solid(col, 10), `bottom at ${col}`).toBe(true)
    }
    for (let row = 0; row < 11; row++) {
      expect(solid(0, row), `left at ${row}`).toBe(true)
      expect(solid(15, row), `right at ${row}`).toBe(true)
    }
  })

  it('has nothing in it that fights', () => {
    expect(haven.spawns ?? []).toEqual([])
    expect(haven.dark ?? false).toBe(false)
  })

  it('is left exactly as it was written', () => {
    // Run through the usual scenery pass it came out a thicket with a
    // fountain in it, which is the opposite of a tended square.
    expect(haven.tidy).toBe(true)
    expect(haven.rows[5]).toBe('T.....SSSS.....T')
  })

  it('keeps a villager and the old rabbit, and both have something to say', () => {
    const props = haven.props ?? []
    expect(props.length).toBe(2)
    for (const prop of props) expect(prop.talk?.length ?? 0).toBeGreaterThan(20)
    expect(props.some((p) => p.sprite === 'rabbitA')).toBe(true)
    // She asks him about the future rather than telling him anything.
    expect(props.some((p) => /\?/.test(p.talk ?? ''))).toBe(true)
  })

  it('pays a hundred rupees for five words', () => {
    const chest = gateById('haven-chest')!
    expect(chest.kind).toBe('chest')
    expect(chest.reward.rupees).toBe(100)
    expect(chest.challenge).toBe('five')
    // Optional, so it never eats one of the forty curriculum exercises.
    expect(chest.optional).toBe(true)
    expect((haven.gates ?? []).some((g) => g.gateId === 'haven-chest')).toBe(true)
  })
})

describe('the way there', () => {
  it('is a cracked plate in Laboratory Two with a pad behind it', () => {
    const pad = (lab.portals ?? []).find((p) => p.teleporter)
    expect(pad).toBeDefined()
    expect(pad!.to).toBe('haven-square')
    const char = (lab.rows[pad!.row] ?? '')[pad!.col] as TileChar
    expect(TILES[char]?.cracked, 'the pad is not behind anything').toBe(true)
  })

  it('is pointed at by someone a screen away', () => {
    const below = screenById('ship-lab-1')!
    expect(below.exits.up).toBe('ship-lab-2')
    const talk = (below.props ?? []).map((p) => p.talk ?? '').join(' ')
    expect(talk).toMatch(/lab above|back wall/i)
    expect(talk).toMatch(/crack/i)
  })

  it('lands him beside each pad rather than on it', () => {
    // Otherwise arriving would send him straight back, for ever.
    for (const from of [lab, haven]) {
      const pad = (from.portals ?? []).find((p) => p.teleporter)!
      const other = screenById(pad.to)!
      const far = (other.portals ?? []).find((p) => p.teleporter)!
      expect(
        pad.spawnCol !== far.col || pad.spawnRow !== far.row,
        `${from.id} drops him onto the pad he would come back through`,
      ).toBe(true)
    }
  })

  it('is the only pair of teleporters in the game', () => {
    const pads = SCREENS.flatMap((s) => (s.portals ?? []).filter((p) => p.teleporter).map(() => s.id))
    expect(pads.sort()).toEqual(['haven-square', 'ship-lab-2'])
  })
})
