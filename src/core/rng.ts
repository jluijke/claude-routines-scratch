/**
 * Seeded pseudo-random number generator (mulberry32).
 *
 * The review scheduler must be repeatable: if a child closes the browser
 * mid-exercise and comes back, the same questions should be waiting.
 */
export class Rng {
  private state: number

  constructor(seed: number | string) {
    this.state = typeof seed === 'string' ? hashString(seed) : seed >>> 0
  }

  /** Float in [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0
    let t = this.state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  /** Integer in [min, max]. */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1))
  }

  /** Picks one item. Returns undefined only for an empty array. */
  pick<T>(items: readonly T[]): T | undefined {
    if (items.length === 0) return undefined
    return items[Math.floor(this.next() * items.length)]
  }

  /** Fisher-Yates, returns a new array. */
  shuffle<T>(items: readonly T[]): T[] {
    const out = items.slice()
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1))
      const a = out[i] as T
      const b = out[j] as T
      out[i] = b
      out[j] = a
    }
    return out
  }

  /** True with the given probability. */
  chance(probability: number): boolean {
    return this.next() < probability
  }
}

export function hashString(value: string): number {
  let h = 2166136261
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
