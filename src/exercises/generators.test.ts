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
        const challenge = generateChallenge(skillId, difficulty, '2026-09-01', index, index % 4)
        expect(challenge.skillId).toBe(skillId)
        expect(challenge.difficulty).toBe(difficulty)
        expect(Number.isInteger(challenge.answer)).toBe(true)
        expect(challenge.answer).toBeGreaterThanOrEqual(0)
        expect(challenge.answer).toBeLessThanOrEqual(skillId === 'money' ? 999 : 100)
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
        if (challenge.promptVisual.type === 'money') {
          const total = challenge.promptVisual.coins.reduce((sum, coin) => sum + coin, 0)
          const target = challenge.prompt.match(/bis (\d+)/)?.[1]
          expect(challenge.answer).toBe(target ? Number(target) - total : total)
        }
        if (challenge.promptVisual.type === 'ruler') {
          expect(challenge.answer).toBe(challenge.promptVisual.end - challenge.promptVisual.start)
        }
        if (challenge.promptVisual.type === 'symmetry-grid') {
          expect(challenge.answer).toBe(challenge.promptVisual.missingIndexes.length)
        }
        if (challenge.promptVisual.type === 'array') {
          expect(challenge.answer).toBe(
            challenge.prompt.includes('Wie viele je Reihe')
              ? challenge.promptVisual.columns
              : challenge.promptVisual.rows * challenge.promptVisual.columns,
          )
        }
        if (challenge.promptVisual.type === 'sharing') {
          expect(challenge.answer).toBe(
            challenge.prompt.includes('Wie viele Gruppen')
              ? challenge.promptVisual.groups
              : challenge.promptVisual.total / challenge.promptVisual.groups,
          )
        }
        if (challenge.promptVisual.type === 'clock' && challenge.prompt === 'Wie viele Minuten vergehen?') {
          const start = challenge.promptVisual.hour * 60 + challenge.promptVisual.minute
          const end = challenge.promptVisual.endHour! * 60 + challenge.promptVisual.endMinute!
          expect(challenge.answer).toBe(end >= start ? end - start : end + 12 * 60 - start)
        }
      }
    }
  })

  it.each(SKILL_IDS)('rotates through substantially different %s task forms across rounds', (skillId) => {
    const forms = new Set(
      Array.from({ length: 8 }, (_, round) => {
        const challenge = generateChallenge(skillId, 2, '2026-09-01', 4, round)
        const visualPattern = challenge.promptVisual.type === 'sequence'
          ? challenge.promptVisual.values.map((value) => value === null ? '?' : '#').join(',')
          : challenge.promptVisual.type
        return [
          challenge.interaction,
          challenge.representation,
          challenge.prompt.replace(/\d+/g, '#'),
          visualPattern,
        ].join('|')
      }),
    )

    expect(forms.size).toBeGreaterThanOrEqual(3)
  })
})
