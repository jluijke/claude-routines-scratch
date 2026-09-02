import { describe, expect, it } from 'vitest'
import { overworldLayout, layoutConflicts } from '../src/game/world/analysis'
import { SCREENS, screenById } from '../src/game/world/screens'

describe('laying the overworld on a grid', () => {
  const { cells, conflicts } = overworldLayout()

  it('agrees with itself about where every screen sits', () => {
    expect(conflicts).toEqual([])
    expect(layoutConflicts()).toEqual([])
  })

  it('puts no two screens in the same square', () => {
    // layoutConflicts only ever checked a *target* against its stored spot, so
    // two screens landing on one square slipped past it. The map is drawn from
    // this, and a square with two names in it cannot be drawn.
    const taken = new Map<string, string>()
    for (const [id, at] of cells) {
      const key = `${at.x},${at.y}`
      expect(taken.has(key), `${id} and ${taken.get(key)} both sit at ${key}`).toBe(false)
      taken.set(key, id)
    }
  })

  it('holds every screen he can walk to, and only those', () => {
    // Anything else is behind a door and has no position to draw.
    const walkable = new Set<string>(['village-square'])
    let grew = true
    while (grew) {
      grew = false
      for (const id of [...walkable]) {
        for (const target of Object.values(screenById(id)?.exits ?? {})) {
          if (target && !walkable.has(target)) {
            walkable.add(target)
            grew = true
          }
        }
      }
    }
    expect([...cells.keys()].sort()).toEqual([...walkable].sort())
  })

  it('leaves the mountain track off the main grid', () => {
    // It is walkable, but it is entered through the crypt door and its one
    // downward exit would drop it on top of the graveyard. The map draws it as
    // a column of its own; what matters here is that it never silently
    // overlaps something else.
    const mountains = SCREENS.filter((s) => s.region === 'Mountain').map((s) => s.id)
    expect(mountains.length).toBeGreaterThan(0)
    for (const id of mountains) expect(cells.has(id)).toBe(false)
  })

  it('reaches the places the map is meant to show', () => {
    for (const id of ['village-square', 'forest-3', 'lagoon-shore', 'waterfall', 'graveyard-1']) {
      expect(cells.has(id), `${id} is missing from the map`).toBe(true)
    }
  })
})
