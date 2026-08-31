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
  round: number
  points: number
  awardedChallengeIds: string[]
  redemptions: RewardRedemption[]
}

export interface RewardRedemption {
  id: string
  round: number
  points: number
  redeemedAt: string
  rewardLabel: string
  rewardMinutes: number
}

export interface Attempt {
  challengeId: string
  dateKey: string
  round: number
  skillId: SkillId | null
  representation: ChallengeRepresentation | null
  wrongAnswers: number
  hintUsed: boolean
  completedAt: string
}

export interface AppData {
  version: 3
  settings: AppSettings
  security: ParentSecurity
  ledgers: Record<string, DailyLedger>
  attempts: Attempt[]
  mastery: Record<SkillId, MasteryState>
}

export type SkillId =
  | 'number-recognition'
  | 'place-value'
  | 'number-order'
  | 'count-steps'
  | 'complement-ten'
  | 'complement-hundred'
  | 'addition'
  | 'subtraction'
  | 'double-half'
  | 'decompose'

export type MasteryBand = 'new' | 'learning' | 'practising' | 'secure'

export interface MasteryState {
  skillId: SkillId
  band: MasteryBand
  score: number
  attempts: number
  independentSuccesses: number
  lastPractisedAt: string | null
  nextReviewDate: string | null
  representationEvidence: Partial<Record<ChallengeRepresentation, number>>
}

export type ChallengeKind =
  | 'read-quantity'
  | 'build-number'
  | 'choose-order'
  | 'continue-sequence'
  | 'complete-ten'
  | 'complete-hundred'
  | 'addition'
  | 'subtraction'
  | 'double'
  | 'half'
  | 'decompose'

export type ChallengeInteraction = 'number-input' | 'choice'

export type ChallengeRepresentation =
  | 'symbolic'
  | 'hundred-field'
  | 'ten-strip'
  | 'place-value'
  | 'number-line'
  | 'sequence'
  | 'groups'
  | 'part-whole'

export type ChallengeVisual =
  | { type: 'none' }
  | { type: 'hundred-field'; value: number; mode: 'quantity' | 'complement' }
  | { type: 'ten-strip'; filled: number; total: 10 | 20 }
  | { type: 'place-value'; value: number }
  | { type: 'number-line'; minimum: number; maximum: number; start: number; end: number; jumps?: number[] }
  | { type: 'sequence'; values: Array<number | null> }
  | { type: 'groups'; groups: number[]; crossedGroup?: number }
  | { type: 'part-whole'; whole: number; known: number; missing: number }

export interface Challenge {
  id: string
  skillId: SkillId
  skillLabel: string
  kind: ChallengeKind
  interaction: ChallengeInteraction
  representation: ChallengeRepresentation
  difficulty: 1 | 2 | 3 | 4
  prompt: string
  spokenPrompt: string
  answer: number
  options?: number[]
  hint: string
  promptVisual: ChallengeVisual
  hintVisual: ChallengeVisual
}
