import { zurichDateKey } from './date'
import { emptyMasteryMap, SKILL_IDS } from '../curriculum/skills'
import { recordMasteryEvidence } from '../learning/mastery'
import type {
  AppData,
  AppSettings,
  ChallengeRepresentation,
  DailyLedger,
  RewardRedemption,
  SchoolTopic,
  SkillId,
} from './types'

export const POINTS_PER_CHALLENGE = 10
const MAX_LEDGER_HISTORY = 40
const MAX_ATTEMPT_HISTORY = 500
const MAX_REDEMPTIONS_PER_DAY = 50

export const DEFAULT_SETTINGS: AppSettings = {
  pointsGoal: 100,
  rewardLabel: 'Gamen',
  rewardMinutes: 30,
  schoolTopic: 'zahlen-bis-100',
  readAloud: false,
  reducedMotion: false,
  highContrast: false,
  leftHanded: false,
  multiplicationEnabled: false,
}

export function emptyLedger(dateKey: string): DailyLedger {
  return {
    dateKey,
    round: 0,
    points: 0,
    awardedChallengeIds: [],
    redemptions: [],
  }
}

export function createDefaultData(now = new Date()): AppData {
  const dateKey = zurichDateKey(now)
  return {
    version: 4,
    settings: { ...DEFAULT_SETTINGS },
    security: {
      pinHash: null,
      pinSalt: null,
      failedAttempts: 0,
      lockedUntil: null,
    },
    ledgers: { [dateKey]: emptyLedger(dateKey) },
    attempts: [],
    mastery: emptyMasteryMap(),
  }
}

export function currentLedger(data: AppData, dateKey: string): DailyLedger {
  return data.ledgers[dateKey] ?? emptyLedger(dateKey)
}

export function hasReachedGoal(data: AppData, dateKey: string): boolean {
  return currentLedger(data, dateKey).points >= data.settings.pointsGoal
}

export function awardResolvedChallenge(
  data: AppData,
  input: {
    challengeId: string
    dateKey: string
    wrongAnswers: number
    hintUsed: boolean
    skillId?: SkillId
    representation?: ChallengeRepresentation
    completedAt?: string
  },
): AppData {
  const ledger = currentLedger(data, input.dateKey)
  if (ledger.awardedChallengeIds.includes(input.challengeId)) return data

  const updatedLedger: DailyLedger = {
    ...ledger,
    points: ledger.points + POINTS_PER_CHALLENGE,
    awardedChallengeIds: [...ledger.awardedChallengeIds, input.challengeId],
  }

  const completedAt = input.completedAt ?? new Date().toISOString()
  const nextMastery = input.skillId && input.representation
    ? {
        ...data.mastery,
        [input.skillId]: recordMasteryEvidence(data.mastery[input.skillId], {
          skillId: input.skillId,
          representation: input.representation,
          dateKey: input.dateKey,
          completedAt,
          wrongAnswers: input.wrongAnswers,
          hintUsed: input.hintUsed,
        }),
      }
    : data.mastery

  return pruneHistory({
    ...data,
    ledgers: { ...data.ledgers, [input.dateKey]: updatedLedger },
    attempts: [
      ...data.attempts,
      {
        challengeId: input.challengeId,
        dateKey: input.dateKey,
        round: ledger.round,
        skillId: input.skillId ?? null,
        representation: input.representation ?? null,
        wrongAnswers: Math.max(0, Math.floor(input.wrongAnswers)),
        hintUsed: input.hintUsed,
        completedAt,
      },
    ],
    mastery: nextMastery,
  })
}

export function redeemReward(
  data: AppData,
  dateKey: string,
  redeemedAt = new Date().toISOString(),
): AppData {
  const ledger = currentLedger(data, dateKey)
  if (ledger.points < data.settings.pointsGoal) return data

  const redemption: RewardRedemption = {
    id: `${dateKey}:${ledger.round}:${redeemedAt}`,
    round: ledger.round,
    points: ledger.points,
    redeemedAt,
    rewardLabel: data.settings.rewardLabel,
    rewardMinutes: data.settings.rewardMinutes,
  }

  return {
    ...data,
    ledgers: {
      ...data.ledgers,
      [dateKey]: {
        dateKey,
        round: ledger.round + 1,
        points: 0,
        awardedChallengeIds: [],
        redemptions: [...ledger.redemptions, redemption].slice(-MAX_REDEMPTIONS_PER_DAY),
      },
    },
  }
}

export function updateSettings(
  data: AppData,
  changes: Partial<AppSettings>,
): AppData {
  const next = { ...data.settings, ...changes }
  const safeGoal = Math.min(200, Math.max(50, Math.round(next.pointsGoal / 10) * 10))
  const safeMinutes = Math.min(180, Math.max(0, Math.round(next.rewardMinutes)))
  const safeLabel = next.rewardLabel.trim().slice(0, 40) || DEFAULT_SETTINGS.rewardLabel

  return {
    ...data,
    settings: {
      ...next,
      pointsGoal: safeGoal,
      rewardMinutes: safeMinutes,
      rewardLabel: safeLabel,
    },
  }
}

export function normaliseData(value: unknown, now = new Date()): AppData {
  if (!value || typeof value !== 'object') return createDefaultData(now)
  const dataVersion = (value as { version?: number }).version
  if (![1, 2, 3, 4].includes(dataVersion ?? 0)) return createDefaultData(now)
  const candidate = value as Partial<Omit<AppData, 'version'>> & { version?: number }

  const base = createDefaultData(now)
  const settings = candidate.settings ?? base.settings
  const schoolTopic: SchoolTopic = [
    'zahlen-bis-100',
    'plus-minus',
    'verdoppeln-halbieren',
    'groessen-sachrechnen',
    'formen-symmetrie',
    'mal-teilen',
  ].includes(settings.schoolTopic)
    ? settings.schoolTopic
    : base.settings.schoolTopic

  const merged: AppData = {
    version: 4,
    settings: {
      ...base.settings,
      ...settings,
      schoolTopic,
    },
    security: { ...base.security, ...(candidate.security ?? {}) },
    ledgers: normaliseLedgers(candidate.ledgers, base),
    attempts: Array.isArray(candidate.attempts)
      ? candidate.attempts.map((attempt) => ({
          ...attempt,
          round: Number.isInteger(attempt.round) && Number(attempt.round) >= 0
            ? Number(attempt.round)
            : 0,
          skillId: attempt.skillId ?? null,
          representation: attempt.representation ?? null,
        }))
      : [],
    mastery: Object.fromEntries(
      SKILL_IDS.map((skillId) => [
        skillId,
        {
          ...base.mastery[skillId],
          ...(candidate.mastery?.[skillId] ?? {}),
          skillId,
          representationEvidence: {
            ...base.mastery[skillId].representationEvidence,
            ...(candidate.mastery?.[skillId]?.representationEvidence ?? {}),
          },
        },
      ]),
    ) as AppData['mastery'],
  }

  return updateSettings(merged, {})
}

function normaliseLedgers(value: unknown, base: AppData): Record<string, DailyLedger> {
  if (!value || typeof value !== 'object') return base.ledgers

  return Object.fromEntries(
    Object.entries(value).map(([dateKey, rawLedger]) => [
      dateKey,
      normaliseLedger(dateKey, rawLedger),
    ]),
  )
}

function normaliseLedger(dateKey: string, value: unknown): DailyLedger {
  if (!value || typeof value !== 'object') return emptyLedger(dateKey)
  const ledger = value as Record<string, unknown>
  const legacyRedeemedAt = typeof ledger.redeemedAt === 'string' ? ledger.redeemedAt : null
  const legacyRedemption: RewardRedemption[] = legacyRedeemedAt
    ? [{
        id: `${dateKey}:0:${legacyRedeemedAt}`,
        round: 0,
        points: safeNonNegativeInteger(ledger.points),
        redeemedAt: legacyRedeemedAt,
        rewardLabel: typeof ledger.redeemedRewardLabel === 'string'
          ? ledger.redeemedRewardLabel
          : DEFAULT_SETTINGS.rewardLabel,
        rewardMinutes: safeNonNegativeInteger(ledger.redeemedRewardMinutes),
      }]
    : []
  const redemptions = Array.isArray(ledger.redemptions)
    ? ledger.redemptions.flatMap((redemption, index) => normaliseRedemption(redemption, dateKey, index))
    : legacyRedemption
  const completedLegacyRound = legacyRedemption.length > 0 && !Array.isArray(ledger.redemptions)

  return {
    dateKey,
    round: completedLegacyRound
      ? 1
      : safeNonNegativeInteger(ledger.round),
    points: completedLegacyRound ? 0 : safeNonNegativeInteger(ledger.points),
    awardedChallengeIds: completedLegacyRound
      ? []
      : Array.isArray(ledger.awardedChallengeIds)
        ? ledger.awardedChallengeIds.filter((id): id is string => typeof id === 'string')
        : [],
    redemptions: redemptions.slice(-MAX_REDEMPTIONS_PER_DAY),
  }
}

function normaliseRedemption(
  value: unknown,
  dateKey: string,
  index: number,
): RewardRedemption[] {
  if (!value || typeof value !== 'object') return []
  const redemption = value as Record<string, unknown>
  if (typeof redemption.redeemedAt !== 'string' || typeof redemption.rewardLabel !== 'string') return []
  const round = safeNonNegativeInteger(redemption.round)
  return [{
    id: typeof redemption.id === 'string'
      ? redemption.id
      : `${dateKey}:${round}:${redemption.redeemedAt}:${index}`,
    round,
    points: safeNonNegativeInteger(redemption.points),
    redeemedAt: redemption.redeemedAt,
    rewardLabel: redemption.rewardLabel,
    rewardMinutes: safeNonNegativeInteger(redemption.rewardMinutes),
  }]
}

function safeNonNegativeInteger(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : 0
}

function pruneHistory(data: AppData): AppData {
  const ledgerEntries = Object.entries(data.ledgers)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, MAX_LEDGER_HISTORY)

  return {
    ...data,
    ledgers: Object.fromEntries(ledgerEntries),
    attempts: data.attempts.slice(-MAX_ATTEMPT_HISTORY),
  }
}
