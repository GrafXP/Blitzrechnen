import { describe, expect, it } from 'vitest'
import {
  awardResolvedChallenge,
  addRewardDefinition,
  collectActiveReward,
  createDefaultData,
  currentLedger,
  hasReachedGoal,
  redeemCollectedReward,
  undoCollectedRewardRedemption,
  selectRewardDefinition,
  selectMissionSkin,
  updateSettings,
  normaliseData,
} from './data'

const NOW = new Date('2026-08-31T12:00:00.000Z')
const DATE_KEY = '2026-08-31'

function chooseDefaultReward(data: ReturnType<typeof createDefaultData>) {
  return selectRewardDefinition(data, DATE_KEY, data.rewardDefinitions[0].id)
}

describe('repeatable point and reward rounds', () => {
  it('awards ten points exactly once for a resolved challenge', () => {
    const initial = chooseDefaultReward(createDefaultData(NOW))
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

  it('collects without a parent and can earn another reward on the same day', () => {
    let data = chooseDefaultReward(createDefaultData(NOW))
    for (let index = 0; index < 10; index += 1) {
      data = awardResolvedChallenge(data, {
        challengeId: `${DATE_KEY}:round-0:${index}`,
        dateKey: DATE_KEY,
        wrongAnswers: 0,
        hintUsed: false,
      })
    }

    expect(hasReachedGoal(data, DATE_KEY)).toBe(true)
    data = collectActiveReward(data, DATE_KEY, '2026-08-31T18:00:00.000Z')

    expect(currentLedger(data, DATE_KEY)).toMatchObject({
      round: 1,
      points: 0,
      activeRewardId: null,
      awardedChallengeIds: [],
    })
    expect(data.collectedRewards).toEqual([
      expect.objectContaining({
        round: 0,
        points: 100,
        collectedAt: '2026-08-31T18:00:00.000Z',
        redeemedAt: null,
        rewardLabel: 'Gamen',
        rewardMinutes: 30,
      }),
    ])

    const tooEarly = collectActiveReward(data, DATE_KEY, '2026-08-31T18:30:00.000Z')
    expect(tooEarly).toBe(data)

    data = selectRewardDefinition(data, DATE_KEY, data.rewardDefinitions[0].id)
    for (let index = 0; index < 10; index += 1) {
      data = awardResolvedChallenge(data, {
        challengeId: `${DATE_KEY}:round-1:${index}`,
        dateKey: DATE_KEY,
        wrongAnswers: 0,
        hintUsed: false,
      })
    }
    data = collectActiveReward(data, DATE_KEY, '2026-08-31T19:00:00.000Z')

    expect(currentLedger(data, DATE_KEY)).toMatchObject({ round: 2, points: 0 })
    expect(data.collectedRewards).toHaveLength(2)
  })

  it('does not collect before the goal and can redeem or undo a collected item idempotently', () => {
    let data = chooseDefaultReward(createDefaultData(NOW))
    expect(collectActiveReward(data, DATE_KEY)).toBe(data)
    for (let index = 0; index < 10; index += 1) {
      data = awardResolvedChallenge(data, {
        challengeId: `${DATE_KEY}:round-0:${index}`,
        dateKey: DATE_KEY,
        wrongAnswers: 0,
        hintUsed: false,
      })
    }
    data = collectActiveReward(data, DATE_KEY, '2026-08-31T18:00:00.000Z')
    const rewardId = data.collectedRewards[0].id
    data = redeemCollectedReward(data, rewardId, '2026-08-31T19:00:00.000Z')
    expect(data.collectedRewards[0].redeemedAt).toBe('2026-08-31T19:00:00.000Z')
    expect(redeemCollectedReward(data, rewardId)).toBe(data)

    data = undoCollectedRewardRedemption(data, rewardId)
    expect(data.collectedRewards[0].redeemedAt).toBeNull()
    expect(undoCollectedRewardRedemption(data, rewardId)).toBe(data)
    expect(undoCollectedRewardRedemption(data, 'missing-reward')).toBe(data)
  })

  it('keeps a new day independent from previous progress', () => {
    const initial = chooseDefaultReward(createDefaultData(NOW))
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

  it('requires the adult speech switch before automatic reading can be enabled', () => {
    const initial = createDefaultData(NOW)
    expect(initial.settings.speechEnabled).toBe(false)
    expect(initial.settings.readAloud).toBe(false)

    const blocked = updateSettings(initial, { readAloud: true })
    expect(blocked.settings.readAloud).toBe(false)

    const enabled = updateSettings(initial, { speechEnabled: true, readAloud: true })
    expect(enabled.settings.speechEnabled).toBe(true)
    expect(enabled.settings.readAloud).toBe(true)

    const disabled = updateSettings(enabled, { speechEnabled: false })
    expect(disabled.settings.speechEnabled).toBe(false)
    expect(disabled.settings.readAloud).toBe(false)
  })

  it('moves focus back to the number foundations when a current content family is locked', () => {
    const unlocked = updateSettings(createDefaultData(NOW), {
      quantitiesEnabled: true,
      schoolTopic: 'groessen-sachrechnen',
    })
    expect(unlocked.settings.schoolTopic).toBe('groessen-sachrechnen')

    const locked = updateSettings(unlocked, { quantitiesEnabled: false })
    expect(locked.settings.schoolTopic).toBe('zahlen-bis-100')
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
    expect(migrated.version).toBe(7)
    expect(migrated.settings.speechEnabled).toBe(false)
    expect(Object.keys(migrated.mastery)).toHaveLength(18)
    expect(migrated.settings.multiplicationEnabled).toBe(false)
    expect(migrated.attempts[0].skillId).toBeNull()
    expect(migrated.attempts[0].round).toBe(0)
    expect(currentLedger(migrated, DATE_KEY).points).toBe(0)
  })

  it('migrates Phase 4 settings and an active round into Phase 7', () => {
    const phaseFour = createDefaultData(NOW) as unknown as Record<string, unknown>
    phaseFour.version = 4
    const settings = phaseFour.settings as Record<string, unknown>
    delete settings.soundEffects
    delete settings.quantitiesEnabled
    delete settings.geometryEnabled
    settings.schoolTopic = 'formen-symmetrie'
    const ledgers = phaseFour.ledgers as Record<string, Record<string, unknown>>
    ledgers[DATE_KEY].points = 20
    ledgers[DATE_KEY].awardedChallengeIds = ['old:0', 'old:1']
    delete ledgers[DATE_KEY].missionSkin

    const migrated = normaliseData(phaseFour, NOW)

    expect(migrated.version).toBe(7)
    expect(migrated.settings.soundEffects).toBe(false)
    expect(migrated.settings.geometryEnabled).toBe(true)
    expect(migrated.settings.quantitiesEnabled).toBe(false)
    expect(currentLedger(migrated, DATE_KEY).missionSkin).toBe('number-trail')
    expect(currentLedger(migrated, DATE_KEY).activeRewardId).toBe(migrated.rewardDefinitions[0].id)
  })

  it('turns the Phase 5 global reward into a selectable catalogue item', () => {
    const phaseFive = createDefaultData(NOW) as unknown as Record<string, unknown>
    phaseFive.version = 5
    delete phaseFive.rewardDefinitions
    delete phaseFive.collectedRewards
    const settings = phaseFive.settings as Record<string, unknown>
    settings.rewardLabel = 'Comic lesen'
    settings.rewardMinutes = 15
    settings.pointsGoal = 100
    settings.schoolTopic = 'zahlen-bis-100'
    const ledgers = phaseFive.ledgers as Record<string, Record<string, unknown>>
    delete ledgers[DATE_KEY].activeRewardId
    ledgers[DATE_KEY].points = 30
    ledgers[DATE_KEY].missionSkin = 'number-trail'

    const migrated = normaliseData(phaseFive, NOW)

    expect(migrated.rewardDefinitions).toEqual([
      expect.objectContaining({ label: 'Comic lesen', minutes: 15, pointsGoal: 100, schoolTopic: 'zahlen-bis-100' }),
    ])
    expect(currentLedger(migrated, DATE_KEY).activeRewardId).toBe(migrated.rewardDefinitions[0].id)
    expect(currentLedger(migrated, DATE_KEY).points).toBe(30)
  })

  it('keeps mission cosmetics separate from points and resets the choice after collection', () => {
    let data = selectMissionSkin(chooseDefaultReward(createDefaultData(NOW)), DATE_KEY, 'market-day')
    expect(currentLedger(data, DATE_KEY)).toMatchObject({ points: 0, missionSkin: 'market-day' })

    data = awardResolvedChallenge(data, {
      challengeId: `${DATE_KEY}:round-0:0`,
      dateKey: DATE_KEY,
      wrongAnswers: 0,
      hintUsed: false,
    })
    const unchanged = selectMissionSkin(data, DATE_KEY, 'shape-workshop')
    expect(unchanged).toBe(data)
    expect(currentLedger(unchanged, DATE_KEY).points).toBe(10)

    for (let index = 1; index < 10; index += 1) {
      data = awardResolvedChallenge(data, {
        challengeId: `${DATE_KEY}:round-0:${index}`,
        dateKey: DATE_KEY,
        wrongAnswers: 0,
        hintUsed: false,
      })
    }
    data = collectActiveReward(data, DATE_KEY)
    expect(currentLedger(data, DATE_KEY)).toMatchObject({ points: 0, activeRewardId: null, missionSkin: null })
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
    expect(migrated.collectedRewards).toEqual([
      expect.objectContaining({
        rewardId: null,
        collectedAt: '2026-08-31T18:00:00.000Z',
        redeemedAt: '2026-08-31T18:00:00.000Z',
      }),
    ])
  })

  it('stores a parent-defined reward with its own points and category', () => {
    const initial = createDefaultData(NOW)
    const data = addRewardDefinition(initial, {
      id: 'comic',
      label: 'Comic lesen',
      minutes: 15,
      pointsGoal: 100,
      schoolTopic: 'zahlen-bis-100',
    })

    expect(data.rewardDefinitions).toContainEqual({
      id: 'comic',
      label: 'Comic lesen',
      minutes: 15,
      pointsGoal: 100,
      schoolTopic: 'zahlen-bis-100',
    })
    const locked = addRewardDefinition(initial, {
      id: 'multiplication',
      label: 'Spiel wählen',
      minutes: 10,
      pointsGoal: 50,
      schoolTopic: 'mal-teilen',
    })
    expect(selectRewardDefinition(locked, DATE_KEY, 'multiplication')).toBe(locked)
  })
})
