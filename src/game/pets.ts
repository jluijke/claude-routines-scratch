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
  /** Trotting and mid-stride. */
  frames: [SpriteName, SpriteName]
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
