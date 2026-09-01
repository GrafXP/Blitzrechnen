import { describe, expect, it } from 'vitest'
import {
  awardResolvedChallenge,
  createDefaultData,
  currentLedger,
  hasReachedGoal,
  redeemReward,
  updateSettings,
  normaliseData,
} from './data'

const NOW = new Date('2026-08-31T12:00:00.000Z')
const DATE_KEY = '2026-08-31'

describe('repeatable point and reward rounds', () => {
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

  it('resets after redemption and can earn another reward on the same day', () => {
    let data = createDefaultData(NOW)
    for (let index = 0; index < 10; index += 1) {
      data = awardResolvedChallenge(data, {
        challengeId: `${DATE_KEY}:round-0:${index}`,
        dateKey: DATE_KEY,
        wrongAnswers: 0,
        hintUsed: false,
      })
    }

    expect(hasReachedGoal(data, DATE_KEY)).toBe(true)
    data = redeemReward(data, DATE_KEY, '2026-08-31T18:00:00.000Z')

    expect(currentLedger(data, DATE_KEY)).toMatchObject({
      round: 1,
      points: 0,
      awardedChallengeIds: [],
    })
    expect(currentLedger(data, DATE_KEY).redemptions).toEqual([
      expect.objectContaining({
        round: 0,
        points: 100,
        redeemedAt: '2026-08-31T18:00:00.000Z',
        rewardLabel: 'Gamen',
        rewardMinutes: 30,
      }),
    ])

    const tooEarly = redeemReward(data, DATE_KEY, '2026-08-31T18:30:00.000Z')
    expect(tooEarly).toBe(data)

    for (let index = 0; index < 10; index += 1) {
      data = awardResolvedChallenge(data, {
        challengeId: `${DATE_KEY}:round-1:${index}`,
        dateKey: DATE_KEY,
        wrongAnswers: 0,
        hintUsed: false,
      })
    }
    data = redeemReward(data, DATE_KEY, '2026-08-31T19:00:00.000Z')

    expect(currentLedger(data, DATE_KEY)).toMatchObject({ round: 2, points: 0 })
    expect(currentLedger(data, DATE_KEY).redemptions).toHaveLength(2)
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

  it('migrates Phase 1 data without losing its ledger', () => {
    const phaseOne = createDefaultData(NOW) as unknown as Record<string, unknown>
    phaseOne.version = 1
    delete phaseOne.mastery
    const attempts = phaseOne.attempts as Array<Record<string, unknown>>
    attempts.push({
      challengeId: `${DATE_KEY}:foundation:0`,
      dateKey: DATE_KEY,
      wrongAnswers: 0,
      hintUsed: false,
      completedAt: '2026-08-31T12:00:00.000Z',
    })

    const migrated = normaliseData(phaseOne, NOW)
    expect(migrated.version).toBe(4)
    expect(Object.keys(migrated.mastery)).toHaveLength(18)
    expect(migrated.settings.multiplicationEnabled).toBe(false)
    expect(migrated.attempts[0].skillId).toBeNull()
    expect(migrated.attempts[0].round).toBe(0)
    expect(currentLedger(migrated, DATE_KEY).points).toBe(0)
  })

  it('turns a redeemed Phase 2 day into a fresh round with redemption history', () => {
    const phaseTwo = createDefaultData(NOW) as unknown as Record<string, unknown>
    phaseTwo.version = 2
    const ledgers = phaseTwo.ledgers as Record<string, Record<string, unknown>>
    ledgers[DATE_KEY] = {
      dateKey: DATE_KEY,
      points: 100,
      awardedChallengeIds: Array.from({ length: 10 }, (_, index) => `${DATE_KEY}:v2:${index}`),
      redeemedAt: '2026-08-31T18:00:00.000Z',
      redeemedRewardLabel: 'Gamen',
      redeemedRewardMinutes: 30,
    }

    const migrated = normaliseData(phaseTwo, NOW)
    const ledger = currentLedger(migrated, DATE_KEY)
    expect(ledger).toMatchObject({ round: 1, points: 0, awardedChallengeIds: [] })
    expect(ledger.redemptions).toEqual([
      expect.objectContaining({
        round: 0,
        redeemedAt: '2026-08-31T18:00:00.000Z',
        rewardLabel: 'Gamen',
      }),
    ])
  })
})
