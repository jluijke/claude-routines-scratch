/**
 * Question renderers. One per activity type, all exposing the same contract,
 * so a new activity type is additive and never touches the engine.
 */
import type { GradeResult, Question, QuestionType, Response, WordBank } from '../types'
import type { SpeechEngine } from '../../core/audio/speech'

export interface RenderContext {
  question: Question
  bank: WordBank
  speech: SpeechEngine
  /** Submit the current answer — used by Enter and by clicking a choice. */
  submit: () => void
  /** Tell the shell the answer changed, so it can clear stale feedback. */
  changed: () => void
}

export interface QuestionView {
  element: HTMLElement
  /** Puts keyboard focus where the child should be working (spec §8). */
  focus(): void
  /** The child's current answer. */
  read(): Response
  /** Marks up which parts were right after grading. */
  showResult(result: GradeResult): void
  /** Clears the wrong answer so the child can try again. */
  reset(): void
  /** Plays the question audio. Present only for audio-bearing questions. */
  replay?(slow: boolean): void
}

export type Renderer = (ctx: RenderContext) => QuestionView

import { renderAudioDictation } from './audioDictation'
import { renderSentenceDictation } from './sentenceDictation'
import { renderMissingLetters } from './missingLetters'
import { renderMissingPattern } from './missingPattern'
import { renderWordSort } from './wordSort'
import { renderSyllableSplit } from './syllableSplit'
import { renderWordBuild } from './wordBuild'
import { renderWordFamily } from './wordFamily'
import { renderCloze } from './cloze'
import { renderFindMistake } from './findMistake'
import { renderProofread } from './proofread'
import { renderVisualMemory } from './visualMemory'

export const RENDERERS: Record<QuestionType, Renderer> = {
  audioDictation: renderAudioDictation,
  sentenceDictation: renderSentenceDictation,
  missingLetters: renderMissingLetters,
  missingPattern: renderMissingPattern,
  wordSort: renderWordSort,
  syllableSplit: renderSyllableSplit,
  wordBuild: renderWordBuild,
  wordFamily: renderWordFamily,
  cloze: renderCloze,
  findMistake: renderFindMistake,
  proofread: renderProofread,
  visualMemory: renderVisualMemory,
}

export function renderQuestion(ctx: RenderContext): QuestionView {
  return RENDERERS[ctx.question.type](ctx)
}

/** The instruction shown when content does not write its own. */
export const DEFAULT_PROMPTS: Record<QuestionType, string> = {
  audioDictation: 'Listen, then type the word.',
  sentenceDictation: 'Listen, then write it down.',
  missingLetters: 'Listen, then fill in the missing letters.',
  missingPattern: 'Which spelling completes the word?',
  wordSort: 'Sort each word into the right group.',
  syllableSplit: 'Chop the word into its beats, then spell it.',
  wordBuild: 'Put the parts together to make a word.',
  wordFamily: 'Build the word family.',
  cloze: 'Choose the word that fits the sentence.',
  findMistake: 'One word is spelled wrongly. Find it and fix it.',
  proofread: 'Find every spelling mistake and fix it.',
  visualMemory: 'Look carefully, then spell it from memory.',
}

export function promptFor(question: Question): string {
  return question.prompt ?? DEFAULT_PROMPTS[question.type]
}
