/**
 * Answering a question from the outside.
 *
 * Both the full 40-exercise sweep and the leave-an-exercise check need to play
 * the spelling screen for real. Keeping one copy means a new question type
 * cannot be handled correctly in one checker and wrongly in the other.
 */

export function makeAnswerer(page) {
  /**
   * The question the UI is showing right now. The engine's own pointer advances
   * the moment an answer is accepted, half a second before the screen redraws,
   * so reading it directly would race the render.
   */
  async function expected() {
    return page.evaluate(async () => {
      const [{ expectedAnswer }, { WORD_BANK }, { EXERCISES }, { CONCEPTS }, { INTRO_CANDLE }] =
        await Promise.all([
          import('/src/spelling/grading.ts'),
          import('/src/content/words.ts'),
          import('/src/content/exercises/index.ts'),
          import('/src/content/concepts.ts'),
          // Deliberately not in EXERCISES — it is the shopkeeper's two
          // questions, and must never count as a curriculum exercise.
          import('/src/content/exercises/intro-candle.ts'),
        ])
      const shown = document.querySelector('.activity')?.dataset?.questionId
      if (!shown) return null
  
      // The engine tags reused questions with @review and #fix suffixes.
      const base = shown.split(/[@#]/)[0]
      const pool = [
        ...INTRO_CANDLE.activities,
        ...EXERCISES.flatMap((e) => e.activities),
        ...[...CONCEPTS.values()].flatMap((c) => c.reviewPool),
      ]
      const question = pool.find((q) => q.id === base)
      if (!question) return null
      return { question, answer: expectedAnswer(question, WORD_BANK), shownId: shown }
    })
  }
  
  /** Clicks the word token matching `word`, comparing the way the app does. */
  async function clickToken(word) {
    await page.evaluate((w) => {
      const norm = (t) => t.replace(/[^A-Za-z'’-]/g, '').replace(/’/g, "'").toLowerCase()
      const token = [...document.querySelectorAll('.word-token')].find((n) => norm(n.textContent) === norm(w))
      token?.click()
    }, word)
  }
  
  async function answerQuestion(question, answer) {
    const activity = page.locator('.activity .q')
    await activity.first().waitFor({ state: 'visible', timeout: 8000 })
  
    switch (question.type) {
      case 'wordSort':
        await page.evaluate((groups) => {
          for (const group of groups) {
            for (const word of group.words) {
              const chip = document.querySelector(`.chip[data-word="${CSS.escape(word)}"]`)
              const column = document.querySelector(`.sort-column[data-label="${CSS.escape(group.label)}"]`)
              if (chip && column) {
                chip.click()
                column.click()
              }
            }
          }
        }, question.groups)
        return
  
      case 'syllableSplit': {
        const parts = answer[0].split('|')
        let index = 0
        for (const part of parts.slice(0, -1)) {
          index += part.length
          await page.evaluate((n) => {
            document.querySelectorAll('.syllable-word .cut')[n - 1]?.click()
          }, index)
        }
        if (answer.length > 1) await page.locator('.q-syllable input.answer').fill(answer[1])
        return
      }
  
      case 'findMistake':
        await clickToken(question.wrong)
        await page.locator('.q-mistake input.answer').fill(answer[1])
        return
  
      case 'proofread':
        for (const error of question.errors) {
          await clickToken(error.wrong)
          await page.locator('.fix-list input.answer').last().fill(error.right)
        }
        return
  
      case 'wordFamily': {
        const inputs = page.locator('.q-family input.answer')
        for (let i = 0; i < answer.length; i++) await inputs.nth(i).fill(answer[i])
        return
      }
  
      case 'visualMemory':
        await page.locator('.memory-input:not([hidden]) input.answer').waitFor({ timeout: 8000 })
        await page.locator('.q-memory input.answer').fill(answer[0])
        return
  
      default: {
        const choice = page.locator('.choice').filter({ hasText: new RegExp(`^${escapeRegex(answer[0])}$`) })
        if (await choice.count()) {
          await choice.first().click()
          return
        }
        const field = page.locator('.activity input.answer, .activity textarea.answer').first()
        if (!(await field.count())) {
          const html = await page.locator('.activity').innerHTML().catch(() => '')
          throw new Error(
            `no way to answer ${question.id} (${question.type}); expected ${JSON.stringify(answer)}\n${html.slice(0, 400)}`,
          )
        }
        await field.fill(answer[0])
      }
    }
  }
  
  function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  /** Answers whatever is on screen and waits for the screen to move on. */
  async function answerOne() {
    const info = await expected()
    if (!info) return undefined
    await answerQuestion(info.question, info.answer)
    await page.getByRole('button', { name: 'Check' }).click({ timeout: 5000 }).catch(() => {})
    const moved = await page
      .waitForFunction(
        (previous) =>
          document.querySelector('.rule-reveal') !== null ||
          (document.querySelector('.activity')?.dataset?.questionId ?? null) !== previous,
        info.shownId,
        { timeout: 5000 },
      )
      .then(() => true)
      .catch(() => false)
    return { ...info, moved }
  }

  return { expected, answerQuestion, answerOne, clickToken }
}
