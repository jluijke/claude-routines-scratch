/**
 * Pure grading for every question type. No DOM, so it is directly testable.
 *
 * Rendering lives in spelling/questions/*; this module only decides whether
 * what the child produced is right.
 */
import type { GradeResult, Question, Response, WordBank } from './types'
import { matches, normalise, words } from './normalise'
import { patternSpanOf, syllablesOf } from './wordbank'

function opts(q: Question) {
  return {
    capitalMatters: q.capitalMatters === true,
    punctuationMatters: q.punctuationMatters === true,
  }
}

function textOf(response: Response): string {
  if (response.kind === 'text') return response.value
  if (response.kind === 'texts') return response.values[0] ?? ''
  if (response.kind === 'segments') return response.value.join('')
  return ''
}

function textsOf(response: Response): string[] {
  if (response.kind === 'texts') return response.values
  if (response.kind === 'segments') return response.value
  if (response.kind === 'text') return [response.value]
  return []
}

/** Grades a list of parts against expected values, reporting each one. */
function gradeParts(
  given: string[],
  expected: string[],
  q: Question,
): GradeResult {
  const parts = expected.map((want, i) => matches(given[i] ?? '', want, opts(q)))
  const correct = parts.every(Boolean)
  const wrongCount = parts.filter((p) => !p).length
  return {
    correct,
    parts,
    note: correct
      ? undefined
      : wrongCount === 1
        ? 'One of those is not quite right.'
        : `${wrongCount} of those are not quite right yet.`,
  }
}

/**
 * The expected spelling for a question, used by hints and by the answer reveal.
 * Multi-part questions return their parts joined for display purposes.
 */
export function expectedAnswer(q: Question, bank: WordBank): string[] {
  switch (q.type) {
    case 'audioDictation':
    case 'missingLetters':
    case 'visualMemory':
      return [q.word]
    case 'missingPattern': {
      if (q.inputMode === 'select') {
        const [start, end] = q.span ?? patternSpanOf(q.word, bank)
        return [q.word.slice(start, end)]
      }
      return [q.word]
    }
    case 'syllableSplit':
      return q.thenSpell === false
        ? [syllablesOf(q.word, bank).join('|')]
        : [syllablesOf(q.word, bank).join('|'), q.word]
    case 'sentenceDictation':
      return [q.targetWord ?? q.sentence]
    case 'cloze':
      return [q.answer]
    case 'wordBuild':
      return [q.answer]
    case 'wordFamily':
      return q.targets.map((t) => t.answer)
    case 'findMistake':
      return [q.wrong, q.right]
    case 'proofread':
      return q.errors.map((e) => e.right)
    case 'wordSort':
      return q.groups.flatMap((g) => g.words.map((w) => `${w}=${g.label}`))
  }
}

export function grade(q: Question, response: Response, bank: WordBank): GradeResult {
  switch (q.type) {
    case 'audioDictation':
    case 'missingLetters':
    case 'visualMemory':
    case 'wordBuild':
    case 'cloze': {
      const want = q.type === 'wordBuild' ? q.answer : q.type === 'cloze' ? q.answer : q.word
      const ok = matches(textOf(response), want, opts(q))
      return { correct: ok, parts: [ok] }
    }

    case 'missingPattern': {
      const want = expectedAnswer(q, bank)[0] as string
      const ok = matches(textOf(response), want, opts(q))
      return { correct: ok, parts: [ok] }
    }

    case 'sentenceDictation': {
      if (q.targetWord) {
        const ok = matches(textOf(response), q.targetWord, opts(q))
        return { correct: ok, parts: [ok] }
      }
      // Whole-sentence dictation is assessed on spelling only: the child must
      // produce the same words in the same order, but capitals and full stops
      // are not what is being tested.
      const want = words(q.sentence).map((w) => normalise(w))
      const got = words(textOf(response)).map((w) => normalise(w))
      const parts = want.map((w, i) => got[i] === w)
      const correct = parts.every(Boolean) && got.length === want.length
      return {
        correct,
        parts,
        note: correct
          ? undefined
          : got.length !== want.length
            ? 'Check that you wrote every word in the sentence.'
            : 'Some words are not spelled correctly yet.',
      }
    }

    case 'syllableSplit': {
      const expected = expectedAnswer(q, bank)
      const given = textsOf(response)
      return gradeParts(given, expected, q)
    }

    case 'wordFamily':
      return gradeParts(textsOf(response), q.targets.map((t) => t.answer), q)

    case 'findMistake':
      return gradeParts(textsOf(response), [q.wrong, q.right], q)

    case 'proofread': {
      const result = gradeParts(textsOf(response), q.errors.map((e) => e.right), q)
      if (!result.correct && result.parts) {
        const found = result.parts.filter(Boolean).length
        result.note = `You have fixed ${found} of ${q.errors.length}. Keep looking.`
      }
      return result
    }

    case 'wordSort': {
      if (response.kind !== 'assign') return { correct: false }
      const entries = q.groups.flatMap((g) => g.words.map((w) => [w, g.label] as const))
      const parts = entries.map(([word, label]) => response.value[word] === label)
      const correct = parts.every(Boolean)
      const wrong = parts.filter((p) => !p).length
      return {
        correct,
        parts,
        note: correct ? undefined : `${wrong} ${wrong === 1 ? 'word is' : 'words are'} in the wrong group.`,
      }
    }
  }
}
