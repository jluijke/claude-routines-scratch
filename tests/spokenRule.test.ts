/**
 * Rules are read aloud, and the text was written to be read silently.
 *
 * A voice given '"ee" and "ea"' makes a noise; given '/ee/' it says "slash".
 * These check the rewriting that turns the panel's text into something a
 * child can follow with his ears, across every rule the game has.
 */
import { describe, expect, it } from 'vitest'
import { sayableRule, spokenParts } from '../src/spelling/ui/spokenRule'
import { EXERCISES } from '../src/content/exercises'
import { GRAMMAR_RULES } from '../src/content/grammar'

describe('a rule made sayable', () => {
  it('spells out quoted letter patterns', () => {
    expect(sayableRule('"ee" and "ea" are common inside a word')).toBe('E, E and E, A are common inside a word')
  })

  it('leaves quoted words and phrases as they are', () => {
    // "it is" is a phrase, not a pattern; "don’t" has an apostrophe in it.
    expect(sayableRule('it is becomes "it’s"')).toBe('it is becomes "it’s"')
    expect(sayableRule('say "sorry"')).toBe('say "sorry"')
  })

  it('says a sound between slashes as the sound', () => {
    expect(sayableRule('The /ee/ sound can be spelled in different ways.')).toBe(
      'The ee sound can be spelled in different ways.',
    )
  })

  it('reads an arrow as "becomes"', () => {
    expect(sayableRule('green, sleep → ee')).toBe('green, sleep becomes E, E')
    expect(sayableRule('consonant + y')).toBe('consonant plus y')
  })

  it('speaks the title, the rule, then the examples, as separate parts', () => {
    const parts = spokenParts({
      title: 'The /ee/ Mystery',
      text: 'Short.',
      examples: ['green → ee', 'team → ea'],
    })
    expect(parts).toEqual(['The ee Mystery.', 'Short.', 'For example.', 'green becomes E, E.', 'team becomes E, A.'])
  })

  it('never ends a part with two full stops', () => {
    for (const part of spokenParts({ title: 'A rule.', text: 'It ends.', examples: ['done.'] })) {
      expect(part).not.toMatch(/\.\.$/)
    }
  })
})

describe('every rule in the game can be said', () => {
  const rules = [
    ...EXERCISES.map((e) => e.ruleReveal),
    ...GRAMMAR_RULES.map((r) => ({ title: r.title, text: r.text, examples: r.examples })),
  ]

  it('has the whole set', () => {
    expect(rules.length).toBe(66)
  })

  it('leaves no slash, arrow or quoted pattern for the voice to stumble on', () => {
    for (const rule of rules) {
      for (const part of spokenParts(rule)) {
        expect(part, rule.title).not.toMatch(/\/[a-z]{1,4}\//)
        expect(part, rule.title).not.toContain('→')
        expect(part, rule.title).not.toMatch(/["“”][a-z]{1,4}["“”]/)
      }
    }
  })

  it('is short enough to sit through: two or three sentences, not a lecture', () => {
    for (const rule of rules) {
      const sentences = rule.text.split(/[.!?]\s/).filter((s) => s.trim().length > 0).length
      expect(sentences, rule.title).toBeLessThanOrEqual(4)
    }
  })
})
