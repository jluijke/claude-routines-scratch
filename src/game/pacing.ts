/**
 * The pacing governor.
 *
 * The brief asks for roughly a 50/50 split between playing and spelling. Rather
 * than nagging or locking the game, the governor quietly decides which optional
 * barriers are live and how freely rupees fall:
 *
 *   - play running ahead   -> rupees thin out, optional barriers stay shut, so
 *                             the natural next step is a sealed door
 *   - spelling running ahead -> optional barriers open for free and rupees are
 *                             generous, so the reward for studying is a proper
 *                             stretch of play
 *
 * The ratio is never shown to the child and never interrupts anything. Only the
 * parent dashboard sees the actual numbers.
 */

export interface PacingState {
  playSeconds: number
  exerciseSeconds: number
}

export type PacingVerdict = 'play-ahead' | 'balanced' | 'spelling-ahead'

/** Below this much total time, everything is "balanced" — too early to judge. */
const WARM_UP_SECONDS = 240

/**
 * The most one sitting at an exercise can be worth. The engine measures wall
 * clock, so a tab left open over lunch would otherwise credit an hour of
 * "spelling" — which tips the verdict to spelling-ahead and hands out free
 * barriers and 1.6x rupees for going to lunch.
 */
export const MAX_SITTING_SECONDS = 20 * 60

/** Time actually worth crediting for one sitting. */
export function creditSeconds(elapsed: number): number {
  if (!Number.isFinite(elapsed) || elapsed <= 0) return 0
  return Math.min(elapsed, MAX_SITTING_SECONDS)
}
/** How far from 50/50 counts as drifting. */
const DRIFT = 0.12

export function ratio(state: PacingState): number {
  const total = state.playSeconds + state.exerciseSeconds
  if (total <= 0) return 0.5
  return state.playSeconds / total
}

export function verdict(state: PacingState): PacingVerdict {
  const total = state.playSeconds + state.exerciseSeconds
  if (total < WARM_UP_SECONDS) return 'balanced'
  const share = ratio(state)
  if (share > 0.5 + DRIFT) return 'play-ahead'
  if (share < 0.5 - DRIFT) return 'spelling-ahead'
  return 'balanced'
}

/**
 * Multiplier on rupee drops. Thinning drops when play is running ahead nudges
 * the child toward a sealed door without ever telling them to go and study.
 */
export function dropMultiplier(state: PacingState): number {
  switch (verdict(state)) {
    case 'play-ahead':
      return 0.5
    case 'spelling-ahead':
      return 1.6
    default:
      return 1
  }
}

/**
 * True when an optional barrier should simply open, as a reward for being ahead
 * on the spelling side.
 */
export function opensFreely(state: PacingState): boolean {
  return verdict(state) === 'spelling-ahead'
}

/** Human-readable summary for the parent dashboard. */
export function describe(state: PacingState): string {
  const play = Math.round(state.playSeconds / 60)
  const spelling = Math.round(state.exerciseSeconds / 60)
  const total = play + spelling
  if (total === 0) return 'No play recorded yet.'
  const share = Math.round(ratio(state) * 100)
  return `${play} min playing · ${spelling} min spelling (${share}% play / ${100 - share}% spelling)`
}
