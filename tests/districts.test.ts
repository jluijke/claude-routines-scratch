/**
 * Midtown and Downtown: the museum, the tower, Chinatown and the harbour.
 *
 * What the browser check cannot cheaply prove — that the rooms are joined
 * up the way the story says, that the statues are the right creatures, that
 * the ferry wants the ticket and the last guardian is the one who has it.
 */
import { describe, expect, it } from 'vitest'
import { Enemy, FALCON_PERCH_X, FALCON_PERCH_Y, isBossKind } from '../src/game/entities/enemies'
import { screenById, SCREENS, type Screen } from '../src/game/world/screens'
import { ITEMS } from '../src/game/items'
import { SPRITES } from '../src/game/render/sprites'
import { CITY_SAVED, PRINCESS_SAVED } from '../src/game/ui/story'

const screen = (id: string): Screen => screenById(id) as Screen

describe('the museum', () => {
  it('is four rooms in a row, north of the park, north of the green', () => {
    expect(screen('nyc-trump-green').exits.up).toBe('nyc-central-park')
    expect(screen('nyc-central-park').exits.up).toBe('nyc-museum-steps')
    expect(screen('nyc-museum-steps').portals?.some((p) => p.to === 'nyc-museum-hall')).toBe(true)
    expect(screen('nyc-museum-hall').exits.right).toBe('nyc-museum-dinosaurs')
    expect(screen('nyc-museum-dinosaurs').exits.right).toBe('nyc-museum-birds')
    expect(screen('nyc-museum-birds').exits.right).toBe('nyc-museum-vault')
    expect(screen('nyc-museum-vault').exits).toEqual({ left: 'nyc-museum-birds' })
  })

  it('has animals behind glass in the hall', () => {
    const hall = screen('nyc-museum-hall')
    const cases = (hall.props ?? []).filter((p) => hall.rows[p.row]?.[p.col] === '~')
    expect(cases.length).toBeGreaterThanOrEqual(5)
  })

  it('has a T-Rex that wakes in the dinosaur hall and a falcon that wakes on its perch', () => {
    const rex = screen('nyc-museum-dinosaurs').awakens?.[0]
    expect(rex?.kind).toBe('trex')
    expect(rex?.after).toBeGreaterThan(120)
    const falcon = screen('nyc-museum-birds').awakens?.[0]
    expect(falcon?.kind).toBe('falcon')
    // It wakes where it perches, so the first dive starts from the corner.
    const bird = new Enemy('falcon', falcon?.col as number, falcon?.row as number, 1, 'creature')
    expect(Math.abs(bird.x - FALCON_PERCH_X)).toBeLessThan(TILE_SLACK)
    expect(Math.abs(bird.y - FALCON_PERCH_Y)).toBeLessThan(TILE_SLACK)
  })

  it('the T-Rex is big, slow enough to outrun, and not a boss', () => {
    const rex = new Enemy('trex', 8, 5, 1, 'creature')
    expect(isBossKind('trex')).toBe(false)
    expect(rex.def.speed).toBeLessThan(60)
    expect(SPRITES.trexA.width).toBe(48)
    expect(rex.sprite).toBe('trexA')
  })

  it('the falcon dives corner to corner and goes back to its perch', () => {
    const bird = new Enemy('falcon', 13, 1, 5, 'creature')
    const open = () => false
    const fire = () => {}
    const him = { x: 40, y: 150 }
    let dived = false
    let perchedAgain = false
    let lowest = bird.y
    for (let i = 0; i < 600; i++) {
      bird.update(1 / 60, him, open, fire)
      if (bird.y > lowest) lowest = bird.y
      if (!bird.perched && bird.x < 100 && bird.y > 100) dived = true
      if (dived && bird.perched && Math.abs(bird.x - FALCON_PERCH_X) < 2) perchedAgain = true
    }
    expect(dived).toBe(true)
    expect(perchedAgain).toBe(true)
    expect(lowest).toBeGreaterThan(150)
  })

  it('ends in a vault with a chest', () => {
    expect(screen('nyc-museum-vault').treasure?.rupees).toBeGreaterThanOrEqual(200)
  })
})

describe('downtown', () => {
  it('runs from Columbus Park down Mott Street to the water', () => {
    expect(screen('nyc-columbus-park').exits.right).toBe('nyc-mott-street')
    expect(screen('nyc-mott-street').exits.down).toBe('nyc-bowling-green')
    expect(screen('nyc-bowling-green').exits.down).toBe('nyc-battery-park')
    expect(screen('nyc-battery-park').exits).toEqual({ up: 'nyc-bowling-green' })
  })

  it('has the statue on the water, binoculars on the promenade, and a ferry that wants the ticket', () => {
    const park = screen('nyc-battery-park')
    expect(park.props?.some((p) => p.sprite === 'libertyFar')).toBe(true)
    expect(park.props?.some((p) => p.view === 'liberty')).toBe(true)
    const ferry = park.portals?.find((p) => p.ferry)
    expect(ferry?.to).toBe('nyc-liberty-island')
    expect(ferry?.requires).toBe('ferryTicket')
    expect(ferry?.refusal).toMatch(/ticket/i)
    // The ticket is never sold.
    expect(ITEMS.ferryTicket.price).toBeUndefined()
    expect(ITEMS.ferryTicket.city?.price).toBeUndefined()
  })

  it('the island has the statue, a door in its base, the crown above, and her in it', () => {
    const island = screen('nyc-liberty-island')
    expect(island.props?.some((p) => p.sprite === 'libertyNear')).toBe(true)
    expect(island.portals?.some((p) => p.to === 'nyc-liberty-crown')).toBe(true)
    // The ferry back needs no ticket.
    const back = island.portals?.find((p) => p.ferry)
    expect(back?.to).toBe('nyc-battery-park')
    expect(back?.requires).toBeUndefined()
    const crown = screen('nyc-liberty-crown')
    expect(crown.props?.some((p) => p.princess)).toBe(true)
  })

  it('tells the story in two parts: the ticket, then the crown', () => {
    expect(CITY_SAVED.paragraphs.join(' ')).toMatch(/ferry ticket/i)
    expect(CITY_SAVED.paragraphs.join(' ')).toMatch(/crown/i)
    expect(PRINCESS_SAVED.title).toMatch(/princess/i)
  })
})

describe('the three lairs together', () => {
  it('are the penthouse, the back room and the boardwalk, and nothing else in the city has a boss', () => {
    const lairs = SCREENS.filter((s) => s.level === 3 && (s.spawns ?? []).some((sp) => isBossKind(sp.kind))).map((s) => s.id)
    expect(lairs.sort()).toEqual(['nyc-boardwalk', 'nyc-trump-penthouse', 'nyc-xi-backroom'])
  })
})

const TILE_SLACK = 12
