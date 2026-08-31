import { describe, expect, it } from 'vitest'
import { SKILL_IDS } from '../curriculum/skills'
import { generateChallenge } from './generators'

describe('0–100 exercise generators', () => {
  it('is deterministic for the same skill, level, date, and slot', () => {
    const first = generateChallenge('addition', 3, '2026-09-01', 7)
    expect(first).toEqual(generateChallenge('addition', 3, '2026-09-01', 7))
    expect(first.id).not.toBe(generateChallenge('addition', 3, '2026-09-02', 7).id)
    expect(first.id).not.toBe(generateChallenge('addition', 3, '2026-09-01', 7, 1).id)
  })

  it.each(SKILL_IDS)('generates valid %s challenges at every difficulty', (skillId) => {
    for (const difficulty of [1, 2, 3, 4] as const) {
      for (let index = 0; index < 50; index += 1) {
        const challenge = generateChallenge(skillId, difficulty, '2026-09-01', index)
        expect(challenge.skillId).toBe(skillId)
        expect(challenge.difficulty).toBe(difficulty)
        expect(Number.isInteger(challenge.answer)).toBe(true)
        expect(challenge.answer).toBeGreaterThanOrEqual(0)
        expect(challenge.answer).toBeLessThanOrEqual(100)
        expect(challenge.prompt).not.toMatch(/undefined|NaN/)
        expect(challenge.spokenPrompt.length).toBeGreaterThan(5)
        expect(challenge.hintVisual.type).not.toBe('none')
        if (challenge.interaction === 'choice') {
          expect(new Set(challenge.options).size).toBe(4)
          expect(challenge.options).toContain(challenge.answer)
        }
        if (challenge.kind === 'addition' || challenge.kind === 'double') {
          expect(challenge.answer).toBeLessThanOrEqual(100)
        }
        if (challenge.kind === 'subtraction' || challenge.kind === 'half') {
          expect(challenge.answer).toBeGreaterThanOrEqual(0)
        }
      }
    }
  })
})
