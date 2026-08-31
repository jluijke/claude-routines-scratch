import { describe, expect, it } from 'vitest'
import { differsOnlyByCase, firstDifference, matches, normalise, words } from '../src/spelling/normalise'

describe('normalise', () => {
  it('forgives capitals, stray spaces and trailing punctuation', () => {
    expect(matches('  Running ', 'running')).toBe(true)
    expect(matches('running.', 'running')).toBe(true)
    expect(matches('the  cat  sat', 'the cat sat')).toBe(true)
  })

  it('never forgives a wrong letter', () => {
    expect(matches('runing', 'running')).toBe(false)
    expect(matches('babys', 'babies')).toBe(false)
    expect(matches('recieve', 'receive')).toBe(false)
  })

  it('treats curly and straight apostrophes as the same', () => {
    expect(matches('don’t', "don't")).toBe(true)
    expect(matches("they’re", "they're")).toBe(true)
  })

  it('keeps apostrophes and hyphens, which are part of the spelling', () => {
    expect(normalise("don't")).toBe("don't")
    expect(normalise('well-known')).toBe('well-known')
    expect(matches('dont', "don't")).toBe(false)
  })

  it('enforces capitals only when the question asks for it', () => {
    expect(matches('september', 'September')).toBe(true)
    expect(matches('september', 'September', { capitalMatters: true })).toBe(false)
  })

  it('enforces punctuation only when the question asks for it', () => {
    expect(matches('I am here', 'I am here.')).toBe(true)
    expect(matches('I am here', 'I am here.', { punctuationMatters: true })).toBe(false)
  })

  it('splits sentences into comparable words', () => {
    expect(words("They're going to the park.")).toEqual(["They're", 'going', 'to', 'the', 'park'])
  })

  it('points at the first letter that went wrong', () => {
    expect(firstDifference('runing', 'running')).toBe(3)
    expect(firstDifference('running', 'running')).toBe(-1)
    expect(firstDifference('run', 'running')).toBe(3)
  })

  it('spots a case-only difference', () => {
    expect(differsOnlyByCase('September', 'september')).toBe(true)
    expect(differsOnlyByCase('septamber', 'september')).toBe(false)
  })
})

describe('words a child clicks on', () => {
  it('keeps the apostrophe when a contraction is clicked, curly or straight', () => {
    // The find-the-mistake and proofreading activities strip punctuation from
    // the word a child clicks. If that strips the apostrophe, "it's" becomes
    // "its" and the child can never match the expected answer.
    const strip = (token: string) => token.replace(/^[^A-Za-z'’-]+|[^A-Za-z'’-]+$/g, '')
    expect(strip('it’s')).toBe('it’s')
    expect(strip("it's,")).toBe("it's")
    expect(strip('"couldn’t."')).toBe('couldn’t')
    expect(strip('well-known!')).toBe('well-known')
  })

  it('matches a clicked curly-apostrophe word against a straight-quoted answer', () => {
    expect(matches('it’s', "it's")).toBe(true)
    expect(matches('could’nt', "could'nt")).toBe(true)
  })
})
