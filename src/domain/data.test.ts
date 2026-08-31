import { describe, expect, it } from 'vitest'
import {
  awardResolvedChallenge,
  createDefaultData,
  currentLedger,
  hasReachedGoal,
  redeemReward,
  updateSettings,
} from './data'

const NOW = new Date('2026-08-31T12:00:00.000Z')
const DATE_KEY = '2026-08-31'

describe('daily point and reward ledger', () => {
  it('awards ten points exactly once for a resolved challenge', () => {
    const initial = createDefaultData(NOW)
    const once = awardResolvedChallenge(initial, {
      challengeId: `${DATE_KEY}:foundation:0`,
      dateKey: DATE_KEY,
      wrongAnswers: 1,
      hintUsed: false,
    })
    const twice = awardResolvedChallenge(once, {
      challengeId: `${DATE_KEY}:foundation:0`,
      dateKey: DATE_KEY,
      wrongAnswers: 0,
      hintUsed: false,
    })

    expect(currentLedger(once, DATE_KEY).points).toBe(10)
    expect(currentLedger(twice, DATE_KEY).points).toBe(10)
    expect(twice.attempts).toHaveLength(1)
  })

  it('reaches the default goal after ten unique challenges and redeems once', () => {
    let data = createDefaultData(NOW)
    for (let index = 0; index < 10; index += 1) {
      data = awardResolvedChallenge(data, {
        challengeId: `${DATE_KEY}:foundation:${index}`,
        dateKey: DATE_KEY,
        wrongAnswers: 0,
        hintUsed: false,
      })
    }

    expect(hasReachedGoal(data, DATE_KEY)).toBe(true)
    const redeemed = redeemReward(data, DATE_KEY, '2026-08-31T18:00:00.000Z')
    const duplicate = redeemReward(redeemed, DATE_KEY, '2026-08-31T19:00:00.000Z')

    expect(currentLedger(redeemed, DATE_KEY)).toMatchObject({
      points: 100,
      redeemedAt: '2026-08-31T18:00:00.000Z',
      redeemedRewardLabel: 'Gamen',
      redeemedRewardMinutes: 30,
    })
    expect(duplicate).toBe(redeemed)
  })

  it('does not redeem before the goal', () => {
    const data = createDefaultData(NOW)
    expect(redeemReward(data, DATE_KEY)).toBe(data)
  })

  it('keeps a new day independent from previous progress', () => {
    const initial = createDefaultData(NOW)
    const withPoints = awardResolvedChallenge(initial, {
      challengeId: `${DATE_KEY}:foundation:0`,
      dateKey: DATE_KEY,
      wrongAnswers: 0,
      hintUsed: false,
    })

    expect(currentLedger(withPoints, '2026-09-01').points).toBe(0)
    expect(currentLedger(withPoints, DATE_KEY).points).toBe(10)
  })

  it('normalises parent-configurable ranges and text', () => {
    const data = updateSettings(createDefaultData(NOW), {
      pointsGoal: 243,
      rewardMinutes: -5,
      rewardLabel: '   ',
    })
    expect(data.settings.pointsGoal).toBe(200)
    expect(data.settings.rewardMinutes).toBe(0)
    expect(data.settings.rewardLabel).toBe('Gamen')
  })
})
