/**
 * The animals.
 *
 * One of them walks with him, chosen in the cave off the North Gate and
 * changed there whenever he likes. They differ in nothing but how they look —
 * a child who picks the wombat because it is a wombat should not find out
 * later that the wombat was the wrong answer.
 */
import type { SpriteName } from './render/sprites'

export type PetKind = 'dog' | 'cat' | 'rabbit' | 'wombat' | 'kangaroo' | 'goat'

export interface PetDef {
  kind: PetKind
  /** What the keeper calls it. */
  name: string
  /** One line, in the keeper's voice, so choosing is a small pleasure. */
  blurb: string
  /** On the ground, and mid-stride — or mid-air, for the ones that hop. */
  frames: [SpriteName, SpriteName]
  /**
   * Pixels of lift, for an animal that hops rather than trots. A rabbit and a
   * kangaroo do not walk, and drawing them sliding along the grass looked
   * wrong beside a dog that does.
   */
  hop?: number
  /** Hops a second while it is moving. */
  hopRate?: number
}

/**
 * How high a hopper is off the ground, given where it is in its hop.
 *
 * An arc: on the ground at the start of the cycle, highest in the middle, back
 * down by the end. Never below the ground, whatever phase it is handed.
 */
export function hopOffset(phase: number, height: number): number {
  const cycle = ((phase % 1) + 1) % 1
  return Math.sin(cycle * Math.PI) * height
}

export const PETS: PetDef[] = [
  {
    kind: 'dog',
    name: 'Dog',
    blurb: 'Scruffy, loyal, and convinced every monster started it.',
    frames: ['dogA', 'dogB'],
  },
  {
    kind: 'cat',
    name: 'Cat',
    blurb: 'Comes along because she has decided to, not because you asked.',
    frames: ['catA', 'catB'],
  },
  {
    kind: 'rabbit',
    name: 'Rabbit',
    blurb: 'Quick, nervous, and much braver after a good meal.',
    frames: ['rabbitA', 'rabbitB'],
    hop: 3,
    hopRate: 3.4,
  },
  {
    kind: 'wombat',
    name: 'Wombat',
    blurb: 'Low, wide and stubborn. Nothing moves a wombat that does not want moving.',
    frames: ['wombatA', 'wombatB'],
  },
  {
    kind: 'kangaroo',
    name: 'Kangaroo',
    blurb: 'Keeps up without trying. Kicks like a falling gate.',
    frames: ['kangarooA', 'kangarooB'],
    // Longer, slower bounds than the rabbit's — it covers the same ground in
    // fewer of them, which is most of what tells the two apart in motion.
    hop: 5,
    hopRate: 2.3,
  },
  {
    kind: 'goat',
    name: 'Goat',
    blurb: 'Eats anything, fears nothing, and headbutts first.',
    frames: ['goatA', 'goatB'],
  },
]

export function petByKind(kind: PetKind | undefined): PetDef | undefined {
  return PETS.find((pet) => pet.kind === kind)
}

/** True for anything the save might be carrying from an older version. */
export function isPetKind(value: unknown): value is PetKind {
  return PETS.some((pet) => pet.kind === value)
}
