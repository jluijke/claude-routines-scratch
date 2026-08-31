/**
 * Answer normalisation — spec §8.
 *
 * This program teaches spelling, not typing. We forgive capitalisation, stray
 * spaces and trailing punctuation, but we never forgive a wrong letter.
 */

export interface NormaliseOptions {
  capitalMatters?: boolean
  punctuationMatters?: boolean
}

/** Curly quotes, long dashes and non-breaking spaces all become plain ASCII. */
function unifyTypography(value: string): string {
  return value
    .replace(/[‘’ʼ′]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/ /g, ' ')
}

export function normalise(value: string, options: NormaliseOptions = {}): string {
  let out = unifyTypography(value).trim().replace(/\s+/g, ' ')
  if (!options.capitalMatters) out = out.toLowerCase()
  if (!options.punctuationMatters) {
    // Strip sentence punctuation, but keep apostrophes and hyphens: they are
    // letters as far as spelling is concerned ("don't", "well-known").
    out = out.replace(/[.,!?;:"]/g, '')
    out = out.replace(/\s+/g, ' ').trim()
  }
  return out
}

/** True when the child's answer matches the expected spelling. */
export function matches(
  given: string,
  expected: string,
  options: NormaliseOptions = {},
): boolean {
  return normalise(given, options) === normalise(expected, options)
}

/** True when the answer matches the expected spelling or any accepted variant. */
export function matchesAny(
  given: string,
  accepted: readonly string[],
  options: NormaliseOptions = {},
): boolean {
  return accepted.some((candidate) => matches(given, candidate, options))
}

/** Splits a sentence into comparable words, keeping apostrophes and hyphens. */
export function words(sentence: string): string[] {
  return unifyTypography(sentence)
    .split(/[^A-Za-z'-]+/)
    .filter((w) => w.length > 0)
}

/**
 * Index of the first character where two spellings diverge, or -1 if the only
 * difference is length. Used to point the child at the part that went wrong
 * without simply showing them the answer.
 */
export function firstDifference(given: string, expected: string): number {
  const a = normalise(given)
  const b = normalise(expected)
  const limit = Math.min(a.length, b.length)
  for (let i = 0; i < limit; i++) {
    if (a[i] !== b[i]) return i
  }
  return a.length === b.length ? -1 : limit
}

/** True when the two spellings differ only in letter case. */
export function differsOnlyByCase(given: string, expected: string): boolean {
  return given !== expected && given.toLowerCase() === expected.toLowerCase()
}
