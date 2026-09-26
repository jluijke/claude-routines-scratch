/**
 * A rule, said aloud.
 *
 * He does not always read the explanation. Two or three sentences spoken to
 * him land where a paragraph on a panel does not, so every rule the game
 * names — the reveal at the end of an exercise, the grammar rule before a
 * sack of food — is read out as it appears, and can be played again.
 *
 * The text is written for the eye, and a voice reads some of it badly:
 * "ee" comes out as a noise, "/ee/" as "slash ee slash", and "→" as
 * nothing at all. This rewrites those for the ear before they are spoken.
 * Letters in quotes are spelled out the way a teacher would say them
 * ("E, E"), a sound between slashes is just said, and an arrow is
 * "becomes".
 */

export interface SpokenRule {
  title: string
  text: string
  examples: readonly string[]
}

/** Spells a short run of letters out loud: ee → "E, E". */
function spellOut(letters: string): string {
  return letters.toUpperCase().split('').join(', ')
}

/** A single sentence or example, made sayable. */
export function sayableRule(text: string): string {
  return (
    text
      // A sound between slashes, /ee/, is said as itself: the voice can say
      // "ee" as a sound better than it can read the slashes.
      .replace(/\/([a-z]{1,4})\//g, '$1')
      // Quoted letter patterns are spelled out. Only short, lowercase, unspaced
      // runs: a quoted word or phrase ("it is") is read as it stands.
      .replace(/["“”']([a-z]{1,4})["“”']/g, (_m, letters: string) => spellOut(letters))
      // letter + letter, as in consonant + y.
      .replace(/\s\+\s/g, ' plus ')
      // An example that ends in a bare pattern — "green, sleep → ee" — spells
      // the pattern out too; that is what the example is showing.
      .replace(/→\s*([a-z]{1,4})\s*$/g, (_m, letters: string) => `→ ${spellOut(letters)}`)
      .replace(/→/g, ' becomes ')
      .replace(/\s+/g, ' ')
      .trim()
  )
}

/**
 * The parts to speak, in order, with a pause between: the title, the rule,
 * then each example. Kept as parts so the engine can put a beat between them
 * rather than running a list into one breath.
 */
export function spokenParts(rule: SpokenRule): string[] {
  const parts = [`${sayableRule(rule.title)}.`, sayableRule(rule.text)]
  if (rule.examples.length > 0) {
    parts.push('For example.')
    for (const example of rule.examples) parts.push(`${sayableRule(example)}.`)
  }
  return parts.map((part) => part.replace(/\.\.$/, '.'))
}
