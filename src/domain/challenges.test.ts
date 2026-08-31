import { describe, expect, it } from 'vitest'
import { challengeFor } from './challenges'

describe('foundation challenges', () => {
  it('is deterministic for a date and index', () => {
    expect(challengeFor('2026-08-31', 7)).toEqual(challengeFor('2026-08-31', 7))
    expect(challengeFor('2026-08-31', 7).id).not.toBe(challengeFor('2026-09-01', 7).id)
  })

  it('generates valid, child-sized answers for every supported daily slot', () => {
    for (let index = 0; index < 20; index += 1) {
      const challenge = challengeFor('2026-08-31', index)
      expect(challenge.answer).toBeGreaterThanOrEqual(0)
      expect(challenge.answer).toBeLessThanOrEqual(20)
      expect(challenge.visualGroups.every((count) => count >= 0 && count <= 20)).toBe(true)
      expect(challenge.prompt).not.toContain('undefined')
    }
  })
})
