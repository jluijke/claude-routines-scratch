/**
 * The subway line, and a ride on it.
 *
 * One line runs under the Village. Its stops are platform screens, in order
 * from the uptown end to the downtown end; the train is a screen of its own
 * that he stands in while the tunnel goes past, and the ride is a small
 * clock: so many frames moving, then the doors open at the next stop for so
 * many frames, then they close and it moves again. At the end of the line it
 * turns round. Nothing here knows about the canvas or the save, so the ride
 * can be proved without a browser.
 */

export interface Stop {
  /** The platform screen. */
  id: string
  /** What the conductor calls it. */
  name: string
  /** What fits in the mosaic band on the wall. */
  short: string
  /**
   * Not on the printed map, and not named by the conductor, until he has
   * stood there. The train stops anyway. City Hall closed in 1945.
   */
  secret?: boolean
}

/** The screen he stands in while the train moves. */
export const TRAIN_CAR = 'nyc-train-car'

/** The line, as the map shows it: 'V' for the Village, on a green bullet. */
export const LINE_NAME = 'V'
export const LINE_COLOUR = '#00933c'

/**
 * Uptown end first. Union Square to Christopher Street is the Village; the
 * far ends are where the three guardians are: Trump up at 59th Street, Xi
 * down at Canal Street, Putin out at Brighton Beach in Brooklyn.
 */
export const STOPS: readonly Stop[] = [
  { id: 'nyc-sub-59st-platform', name: '5th Avenue – 59th Street', short: '5 AV-59 ST' },
  { id: 'nyc-sub-union-platform', name: '14th Street – Union Square', short: '14 ST-UNION SQ' },
  { id: 'nyc-sub-astor-platform', name: 'Astor Place', short: 'ASTOR PL' },
  { id: 'nyc-sub-2av-platform', name: 'Second Avenue', short: '2 AV' },
  { id: 'nyc-sub-w4-platform', name: 'West 4th Street', short: 'W 4 ST' },
  { id: 'nyc-sub-christopher-platform', name: 'Christopher Street', short: 'CHRISTOPHER ST' },
  { id: 'nyc-sub-canal-platform', name: 'Canal Street', short: 'CANAL ST' },
  { id: 'nyc-sub-cityhall-platform', name: 'City Hall', short: 'CITY HALL', secret: true },
  { id: 'nyc-sub-atlantic-platform', name: 'Atlantic Avenue', short: 'ATLANTIC AV' },
  { id: 'nyc-sub-brighton-platform', name: 'Brighton Beach', short: 'BRIGHTON BEACH' },
]

/** Which stop a platform screen is, or -1 for anywhere that is not one. */
export function stopIndex(screenId: string): number {
  return STOPS.findIndex((s) => s.id === screenId)
}

/** -1 runs uptown, toward the first stop; +1 runs downtown. */
export type RideDirection = -1 | 1

export interface Ride {
  /** The stop the train is at, or has just left. */
  index: number
  dir: RideDirection
  /** Moving through the tunnel, or standing at a stop with the doors open. */
  phase: 'moving' | 'doors'
  /** Frames left in this phase. */
  frames: number
}

/** Five seconds in the tunnel, six with the doors open. */
export const MOVING_FRAMES = 300
export const DOORS_FRAMES = 360
/** The car lurches every two seconds, and he is shoved a little. */
export const LURCH_EVERY = 120

/** Where he can go from a stop. The ends of the line offer one way only. */
export function directionsFrom(index: number): { uptown?: Stop; downtown?: Stop } {
  const uptown = STOPS[index - 1]
  const downtown = STOPS[index + 1]
  return {
    ...(uptown ? { uptown } : {}),
    ...(downtown ? { downtown } : {}),
  }
}

export function beginRide(index: number, dir: RideDirection): Ride {
  return { index, dir, phase: 'moving', frames: MOVING_FRAMES }
}

export type RideEvent = 'arrive' | 'depart'

/**
 * One frame of the ride. Returns the ride as it is now and what, if
 * anything, just happened: the train pulled into a stop, or pulled out of
 * one. A train that reaches the end of the line leaves the other way.
 */
export function tickRide(ride: Ride): { ride: Ride; event?: RideEvent } {
  const frames = ride.frames - 1
  if (frames > 0) return { ride: { ...ride, frames } }
  if (ride.phase === 'moving') {
    return { ride: { ...ride, index: ride.index + ride.dir, phase: 'doors', frames: DOORS_FRAMES }, event: 'arrive' }
  }
  const atEnd = STOPS[ride.index + ride.dir] === undefined
  const dir: RideDirection = atEnd ? (ride.dir === 1 ? -1 : 1) : ride.dir
  return { ride: { ...ride, dir, phase: 'moving', frames: MOVING_FRAMES }, event: 'depart' }
}

/** The stop the train is heading for, or standing at. */
export function nextStop(ride: Ride): Stop {
  const index = ride.phase === 'doors' ? ride.index : ride.index + ride.dir
  return STOPS[index] ?? (STOPS[ride.index] as Stop)
}

/** How far along the line the train is, in stops, for the map: 2.5 is halfway from the third stop to the fourth. */
export function rideProgress(ride: Ride): number {
  if (ride.phase === 'doors') return ride.index
  const travelled = 1 - ride.frames / MOVING_FRAMES
  return ride.index + ride.dir * travelled
}

export function isUnderground(setting: string | undefined): boolean {
  return setting === 'platform' || setting === 'train'
}

/** Which stop a station's mezzanine, passage or platform belongs to, or -1. */
export function stationIndex(screenId: string): number {
  const match = /^nyc-sub-([a-z0-9]+)-/.exec(screenId)
  if (!match) return -1
  return STOPS.findIndex((s) => s.id.startsWith(`nyc-sub-${match[1]}-`))
}

/** The stops he has stood in any part of, as their platform ids. */
export function stationsVisited(visited: readonly string[]): string[] {
  const seen = new Set(visited.map(stationIndex).filter((i) => i >= 0))
  return STOPS.filter((_, i) => seen.has(i)).map((s) => s.id)
}
