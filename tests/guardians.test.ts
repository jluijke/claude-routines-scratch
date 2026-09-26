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

  it('are three, each in a lair up the stairs from a station at the end of the line', () => {
    expect(lairs.map((s) => s.id).sort()).toEqual(['nyc-boardwalk', 'nyc-columbus-park', 'nyc-trump-green'])
    for (const lair of lairs) {
      expect(lair.exits).toEqual({})
      const back = lair.portals?.find((p) => p.to.startsWith('nyc-sub-'))
      expect(back, lair.id).toBeDefined()
      const mezz = screenById(back?.to as string)
      expect(mezz?.portals?.some((p) => p.to === lair.id)).toBe(true)
    }
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
