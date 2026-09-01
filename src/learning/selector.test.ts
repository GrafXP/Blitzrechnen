import { describe, expect, it } from 'vitest'
import { awardResolvedChallenge, createDefaultData } from '../domain/data'
import { availableSkills, challengeForSession, isDue } from './selector'

describe('adaptive challenge selection', () => {
  it('is deterministic from the same learning state', () => {
    const data = createDefaultData(new Date('2026-09-01T10:00:00.000Z'))
    expect(challengeForSession(data, '2026-09-01', 0)).toEqual(
      challengeForSession(data, '2026-09-01', 0),
    )
  })

  it('builds a varied first mission and records mastery evidence', () => {
    let data = createDefaultData(new Date('2026-09-01T10:00:00.000Z'))
    const skillIds = new Set<string>()

    for (let index = 0; index < 10; index += 1) {
      const challenge = challengeForSession(data, '2026-09-01', index)
      skillIds.add(challenge.skillId)
      data = awardResolvedChallenge(data, {
        challengeId: challenge.id,
        dateKey: '2026-09-01',
        skillId: challenge.skillId,
        representation: challenge.representation,
        wrongAnswers: 0,
        hintUsed: false,
        completedAt: `2026-09-01T10:${String(index).padStart(2, '0')}:00.000Z`,
      })
    }

    expect(skillIds.size).toBeGreaterThanOrEqual(7)
    expect(Object.values(data.mastery).filter((state) => state.attempts > 0).length).toBe(skillIds.size)
  })

  it('recognises when scheduled practice is due', () => {
    const data = createDefaultData(new Date('2026-09-01T10:00:00.000Z'))
    const state = { ...data.mastery.addition, band: 'secure' as const, nextReviewDate: '2026-09-10' }
    expect(isDue(state, '2026-09-09')).toBe(false)
    expect(isDue(state, '2026-09-10')).toBe(true)
  })

  it('keeps multiplication locked until a parent enables it', () => {
    const data = createDefaultData(new Date('2026-09-01T10:00:00.000Z'))
    expect(availableSkills(data).map((skill) => skill.id)).not.toContain('multiplication')
    expect(availableSkills(data).map((skill) => skill.id)).not.toContain('sharing')

    const unlocked = {
      ...data,
      settings: { ...data.settings, schoolTopic: 'mal-teilen' as const, multiplicationEnabled: true },
    }
    const unlockedIds = availableSkills(unlocked).map((skill) => skill.id)
    expect(unlockedIds).toContain('multiplication')
    expect(unlockedIds).toContain('sharing')
    expect(unlockedIds).toContain('word-problems')
  })
})
