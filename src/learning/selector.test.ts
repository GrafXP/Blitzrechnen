import { describe, expect, it } from 'vitest'
import { addRewardDefinition, awardResolvedChallenge, collectActiveReward, createDefaultData, selectRewardDefinition } from '../domain/data'
import { skillById } from '../curriculum/skills'
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
    data = selectRewardDefinition(data, '2026-09-01', data.rewardDefinitions[0].id)
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

  it('changes the skill order and task forms substantially between same-day rounds', () => {
    let data = createDefaultData(new Date('2026-09-01T10:00:00.000Z'))
    const rounds: Array<Array<{ skillId: string; form: string }>> = []

    for (let round = 0; round < 4; round += 1) {
      data = selectRewardDefinition(data, '2026-09-01', data.rewardDefinitions[0].id)
      const tasks: Array<{ skillId: string; form: string }> = []
      for (let index = 0; index < 10; index += 1) {
        const challenge = challengeForSession(data, '2026-09-01', index)
        tasks.push({
          skillId: challenge.skillId,
          form: `${challenge.interaction}:${challenge.prompt.replace(/\d+/g, '#')}`,
        })
        data = awardResolvedChallenge(data, {
          challengeId: challenge.id,
          dateKey: '2026-09-01',
          skillId: challenge.skillId,
          representation: challenge.representation,
          wrongAnswers: 0,
          hintUsed: false,
          completedAt: `2026-09-01T${10 + round}:${String(index).padStart(2, '0')}:00.000Z`,
        })
      }
      rounds.push(tasks)
      data = collectActiveReward(data, '2026-09-01', `2026-09-01T${10 + round}:30:00.000Z`)
    }

    rounds.forEach((tasks) => {
      expect(new Set(tasks.map((task) => task.skillId)).size).toBeGreaterThanOrEqual(7)
    })
    for (let round = 1; round < rounds.length; round += 1) {
      const sameSlots = rounds[round].filter((task, index) => task.skillId === rounds[round - 1][index].skillId)
      const previousForms = new Set(rounds[round - 1].map((task) => task.form))
      const repeatedForms = rounds[round].filter((task) => previousForms.has(task.form))
      expect(sameSlots.length).toBeLessThanOrEqual(3)
      expect(repeatedForms.length).toBeLessThanOrEqual(4)
    }
  })

  it('keeps every task inside the category of the chosen reward', () => {
    let data = createDefaultData(new Date('2026-09-01T10:00:00.000Z'))
    data = addRewardDefinition(data, {
      id: 'plus-reward',
      label: 'Comic lesen',
      minutes: 15,
      pointsGoal: 100,
      schoolTopic: 'plus-minus',
    })
    data = selectRewardDefinition(data, '2026-09-01', 'plus-reward')

    for (let index = 0; index < 20; index += 1) {
      const challenge = challengeForSession(data, '2026-09-01', index)
      expect(skillById(challenge.skillId).topics).toContain('plus-minus')
    }
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

  it('keeps Phase 4 content families behind their parent unlocks', () => {
    const data = createDefaultData(new Date('2026-09-01T10:00:00.000Z'))
    const defaultIds = availableSkills(data).map((skill) => skill.id)
    expect(defaultIds).not.toContain('money')
    expect(defaultIds).not.toContain('shapes')
    expect(defaultIds).not.toContain('word-problems')

    const quantities = {
      ...data,
      settings: { ...data.settings, quantitiesEnabled: true },
    }
    const quantityIds = availableSkills(quantities).map((skill) => skill.id)
    expect(quantityIds).toEqual(expect.arrayContaining(['money', 'time', 'length', 'word-problems']))
    expect(quantityIds).not.toContain('shapes')

    const geometry = {
      ...data,
      settings: { ...data.settings, geometryEnabled: true },
    }
    const geometryIds = availableSkills(geometry).map((skill) => skill.id)
    expect(geometryIds).toEqual(expect.arrayContaining(['shapes', 'symmetry']))
    expect(geometryIds).not.toContain('money')
  })
})
