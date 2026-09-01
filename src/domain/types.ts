export type SchoolTopic =
  | 'zahlen-bis-100'
  | 'plus-minus'
  | 'verdoppeln-halbieren'
  | 'groessen-sachrechnen'
  | 'formen-symmetrie'
  | 'mal-teilen'

export interface AppSettings {
  pointsGoal: number
  rewardLabel: string
  rewardMinutes: number
  schoolTopic: SchoolTopic
  readAloud: boolean
  reducedMotion: boolean
  highContrast: boolean
  leftHanded: boolean
  multiplicationEnabled: boolean
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
  version: 4
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
  | 'money'
  | 'time'
  | 'length'
  | 'shapes'
  | 'symmetry'
  | 'multiplication'
  | 'sharing'
  | 'word-problems'

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
  | 'money'
  | 'time'
  | 'length'
  | 'shape-properties'
  | 'symmetry'
  | 'multiplication'
  | 'sharing'
  | 'word-problem'

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
  | 'money'
  | 'clock'
  | 'ruler'
  | 'shape'
  | 'symmetry-grid'
  | 'array'
  | 'sharing'

export type ChallengeVisual =
  | { type: 'none' }
  | { type: 'hundred-field'; value: number; mode: 'quantity' | 'complement' }
  | { type: 'ten-strip'; filled: number; total: 10 | 20 }
  | { type: 'place-value'; value: number }
  | { type: 'number-line'; minimum: number; maximum: number; start: number; end: number; jumps?: number[] }
  | { type: 'sequence'; values: Array<number | null> }
  | { type: 'groups'; groups: number[]; crossedGroup?: number }
  | { type: 'part-whole'; whole: number; known: number; missing: number }
  | { type: 'money'; coins: number[] }
  | { type: 'clock'; hour: number; minute: number; endHour?: number; endMinute?: number }
  | { type: 'ruler'; start: number; end: number; maximum: number }
  | { type: 'shape'; shape: 'circle' | 'triangle' | 'square' | 'rectangle' | 'pentagon' | 'hexagon' }
  | { type: 'symmetry-grid'; leftCells: Array<{ row: number; column: number }>; missingIndexes: number[]; showSolution: boolean }
  | { type: 'array'; rows: number; columns: number; showTotal: boolean }
  | { type: 'sharing'; total: number; groups: number; showGroups: boolean }

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
