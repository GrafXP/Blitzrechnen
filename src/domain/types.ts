export type SchoolTopic =
  | 'zahlen-bis-100'
  | 'plus-minus'
  | 'verdoppeln-halbieren'

export interface AppSettings {
  pointsGoal: number
  rewardLabel: string
  rewardMinutes: number
  schoolTopic: SchoolTopic
  readAloud: boolean
  reducedMotion: boolean
  highContrast: boolean
  leftHanded: boolean
}

export interface ParentSecurity {
  pinHash: string | null
  pinSalt: string | null
  failedAttempts: number
  lockedUntil: string | null
}

export interface DailyLedger {
  dateKey: string
  points: number
  awardedChallengeIds: string[]
  redeemedAt: string | null
  redeemedRewardLabel: string | null
  redeemedRewardMinutes: number | null
}

export interface Attempt {
  challengeId: string
  dateKey: string
  wrongAnswers: number
  hintUsed: boolean
  completedAt: string
}

export interface AppData {
  version: 1
  settings: AppSettings
  security: ParentSecurity
  ledgers: Record<string, DailyLedger>
  attempts: Attempt[]
}

export type ChallengeKind = 'addition' | 'subtraction' | 'complete' | 'double'

export interface Challenge {
  id: string
  kind: ChallengeKind
  prompt: string
  spokenPrompt: string
  answer: number
  hint: string
  visualGroups: number[]
}
