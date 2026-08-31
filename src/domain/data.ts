import { zurichDateKey } from './date'
import type {
  AppData,
  AppSettings,
  DailyLedger,
  SchoolTopic,
} from './types'

export const POINTS_PER_CHALLENGE = 10
const MAX_LEDGER_HISTORY = 40
const MAX_ATTEMPT_HISTORY = 500

export const DEFAULT_SETTINGS: AppSettings = {
  pointsGoal: 100,
  rewardLabel: 'Gamen',
  rewardMinutes: 30,
  schoolTopic: 'zahlen-bis-100',
  readAloud: false,
  reducedMotion: false,
  highContrast: false,
  leftHanded: false,
}

export function emptyLedger(dateKey: string): DailyLedger {
  return {
    dateKey,
    points: 0,
    awardedChallengeIds: [],
    redeemedAt: null,
    redeemedRewardLabel: null,
    redeemedRewardMinutes: null,
  }
}

export function createDefaultData(now = new Date()): AppData {
  const dateKey = zurichDateKey(now)
  return {
    version: 1,
    settings: { ...DEFAULT_SETTINGS },
    security: {
      pinHash: null,
      pinSalt: null,
      failedAttempts: 0,
      lockedUntil: null,
    },
    ledgers: { [dateKey]: emptyLedger(dateKey) },
    attempts: [],
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

  return pruneHistory({
    ...data,
    ledgers: { ...data.ledgers, [input.dateKey]: updatedLedger },
    attempts: [
      ...data.attempts,
      {
        challengeId: input.challengeId,
        dateKey: input.dateKey,
        wrongAnswers: Math.max(0, Math.floor(input.wrongAnswers)),
        hintUsed: input.hintUsed,
        completedAt: input.completedAt ?? new Date().toISOString(),
      },
    ],
  })
}

export function redeemReward(
  data: AppData,
  dateKey: string,
  redeemedAt = new Date().toISOString(),
): AppData {
  const ledger = currentLedger(data, dateKey)
  if (ledger.redeemedAt || ledger.points < data.settings.pointsGoal) return data

  return {
    ...data,
    ledgers: {
      ...data.ledgers,
      [dateKey]: {
        ...ledger,
        redeemedAt,
        redeemedRewardLabel: data.settings.rewardLabel,
        redeemedRewardMinutes: data.settings.rewardMinutes,
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
  const candidate = value as Partial<AppData>
  if (candidate.version !== 1) return createDefaultData(now)

  const base = createDefaultData(now)
  const settings = candidate.settings ?? base.settings
  const schoolTopic: SchoolTopic = [
    'zahlen-bis-100',
    'plus-minus',
    'verdoppeln-halbieren',
  ].includes(settings.schoolTopic)
    ? settings.schoolTopic
    : base.settings.schoolTopic

  const merged: AppData = {
    version: 1,
    settings: {
      ...base.settings,
      ...settings,
      schoolTopic,
    },
    security: { ...base.security, ...(candidate.security ?? {}) },
    ledgers:
      candidate.ledgers && typeof candidate.ledgers === 'object'
        ? candidate.ledgers
        : base.ledgers,
    attempts: Array.isArray(candidate.attempts) ? candidate.attempts : [],
  }

  return updateSettings(merged, {})
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
