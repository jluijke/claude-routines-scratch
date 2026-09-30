/**
 * The three guardians, and what they are made of.
 *
 * They are the city's bosses, drawn big, beaten only with love bombs. What
 * can be proved without a browser is proved here: who they are, where they
 * stand, how much love each one takes, what a love bomb costs and where it
 * is sold. The fight itself is tools/guardians-smoke.mjs.
 */
import { describe, expect, it } from 'vitest'
import { Enemy, GUARDIAN_NAMES, isBossKind } from '../src/game/entities/enemies'
import { screenById, SCREENS } from '../src/game/world/screens'
import { FLORIST, ITEMS, itemPrice, TOOL_SLOT } from '../src/game/items'
import { SPRITES } from '../src/game/render/sprites'
import { flavourFor } from '../src/game/flavour'

describe('the guardians', () => {
  const lairs = SCREENS.filter((s) => s.level === 3 && (s.spawns ?? []).some((sp) => isBossKind(sp.kind)))

  it('are three: the boardwalk, the penthouse, and the back room of a restaurant', () => {
    expect(lairs.map((s) => s.id).sort()).toEqual(['nyc-boardwalk', 'nyc-trump-penthouse', 'nyc-xi-backroom'])
    for (const lair of lairs) expect(lair.exits).toEqual({})
    // Putin: up the stairs from Brighton Beach, and the stairs are the way out.
    const boardwalk = screenById('nyc-boardwalk')
    const back = boardwalk?.portals?.find((p) => p.to.startsWith('nyc-sub-'))
    expect(back).toBeDefined()
    expect(screenById(back?.to as string)?.portals?.some((p) => p.to === 'nyc-boardwalk')).toBe(true)
  })

  it('Trump is at the top of the tower, and the only way up is the lift from the lobby', () => {
    const lobby = screenById('nyc-trump-lobby')
    const up = lobby?.portals?.find((p) => p.to === 'nyc-trump-penthouse')
    expect(up?.lift).toBe('up')
    const down = screenById('nyc-trump-penthouse')?.portals?.find((p) => p.to === 'nyc-trump-lobby')
    expect(down?.lift).toBe('down')
    // The lobby is entered from the side street, not from Fifth Avenue: the
    // front has a doorman standing in it and no door.
    expect(screenById('nyc-56th-street')?.portals?.some((p) => p.to === 'nyc-trump-lobby')).toBe(true)
    expect(screenById('nyc-fifth-ave-midtown')?.portals?.some((p) => p.to === 'nyc-trump-lobby')).toBe(false)
    expect(screenById('nyc-fifth-ave-midtown')?.props?.some((p) => p.solid && /service door/i.test(p.talk ?? ''))).toBe(true)
  })

  it('Xi is behind a cabinet on a cracked wall in the kitchen, which a firecracker shifts', () => {
    const kitchen = screenById('nyc-restaurant-kitchen')
    const door = kitchen?.portals?.find((p) => p.to === 'nyc-xi-backroom')
    expect(door).toBeDefined()
    const char = kitchen?.rows[door?.row as number]?.[door?.col as number]
    expect(char).toBe('X')
    expect(kitchen?.props?.some((p) => p.sprite === 'cabinet' && p.col === door?.col && p.row === door?.row)).toBe(true)
    // The kitchen is off the dining room, which is off Mott Street, which is off the park by Canal Street.
    expect(screenById('nyc-restaurant')?.portals?.some((p) => p.to === 'nyc-restaurant-kitchen')).toBe(true)
    expect(screenById('nyc-mott-street')?.portals?.some((p) => p.to === 'nyc-restaurant')).toBe(true)
    expect(screenById('nyc-columbus-park')?.exits.right).toBe('nyc-mott-street')
  })

  it('are Trump, Putin and Xi, in the first three boss slots', () => {
    const kinds = lairs.flatMap((s) => (s.spawns ?? []).filter((sp) => isBossKind(sp.kind)).map((sp) => sp.kind)).sort()
    expect(kinds).toEqual(['boss1', 'boss2', 'boss3'])
    expect(GUARDIAN_NAMES.boss1).toBe('Trump')
    expect(GUARDIAN_NAMES.boss2).toBe('Putin')
    expect(GUARDIAN_NAMES.boss3).toBe('Xi')
  })

  it('are drawn at forty-eight pixels, in three different suits', () => {
    for (const name of ['guardianGold', 'guardianGrey', 'guardianDark'] as const) {
      expect(SPRITES[name].width).toBe(48)
      expect(SPRITES[name].height).toBe(48)
    }
    expect(new Enemy('boss1', 7, 3, 1, 'creature').sprite).toBe('guardianGold')
    expect(new Enemy('boss2', 7, 3, 1, 'creature').sprite).toBe('guardianGrey')
    expect(new Enemy('boss3', 7, 3, 1, 'creature').sprite).toBe('guardianDark')
  })

  it('take twelve, sixteen and twenty love bombs, and nothing else counts', () => {
    const trump = new Enemy('boss1', 7, 3, 1, 'creature')
    const putin = new Enemy('boss2', 7, 3, 1, 'creature')
    const xi = new Enemy('boss3', 7, 3, 1, 'creature')
    expect([trump.hp, putin.hp, xi.hp]).toEqual([12, 16, 20])
    for (const g of [trump, putin, xi]) expect(g.isGuardian).toBe(true)
    // The same slot on the land is a monster with the land's numbers.
    const landBoss = new Enemy('boss1', 7, 3, 1, 'monster')
    expect(landBoss.isGuardian).toBe(false)
    expect(landBoss.hp).not.toBe(12)
    // Halfway loved is halfway pink.
    for (let i = 0; i < 6; i++) {
      trump.hurt(1)
      trump.hurtTimer = 0
    }
    expect(trump.loved).toBeCloseTo(0.5)
  })

  it('and the street creatures are a rat, a pigeon, an alligator and a wraith', () => {
    expect(new Enemy('chaser', 1, 1, 1, 'creature').sprite).toBe('ratA')
    expect(new Enemy('flyer', 1, 1, 1, 'creature').sprite).toBe('pigeonA')
    expect(new Enemy('shooter', 1, 1, 1, 'creature').sprite).toBe('gatorA')
    expect(new Enemy('caster', 1, 1, 1, 'creature').sprite).toBe('wraithA')
  })
})

describe('love bombs', () => {
  it('are a tool, sold by Rosa for twelve dollars, and nowhere else', () => {
    expect(TOOL_SLOT).toContain('loveBomb')
    expect(ITEMS.loveBomb.stackable).toBe(true)
    expect(ITEMS.loveBomb.price).toBeUndefined()
    expect(itemPrice('loveBomb', 3)).toBe(12)
    expect(FLORIST).toContain('loveBomb')
    expect(screenById('nyc-florist')?.shop).toBe('florist')
  })

  it('come with words for the child who tries a hammer first', () => {
    const words = flavourFor(3)
    expect(words.notLikeThat.toLowerCase()).toContain('love')
    expect(words.guardianLoved('Xi')).toContain('Xi')
    expect(words.currency).toBe('dollars')
    expect(flavourFor(1).currency).toBe('rupees')
  })
})
