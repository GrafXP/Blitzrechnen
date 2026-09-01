import type { MasteryState, SchoolTopic, SkillId } from '../domain/types'

export interface SkillDefinition {
  id: SkillId
  label: string
  shortLabel: string
  description: string
  topics: SchoolTopic[]
  scope: 'core' | 'extension' | 'multiplication'
}

export const SKILLS: SkillDefinition[] = [
  {
    id: 'number-recognition',
    label: 'Zahlen erkennen',
    shortLabel: 'Zahlenblick',
    description: 'Anzahlen und Zahlen im Hunderterraum sicher erkennen.',
    topics: ['zahlen-bis-100'],
    scope: 'core',
  },
  {
    id: 'place-value',
    label: 'Zehner und Einer',
    shortLabel: 'Stellenwert',
    description: 'Zahlen als Zehner und Einer lesen und aufbauen.',
    topics: ['zahlen-bis-100'],
    scope: 'core',
  },
  {
    id: 'number-order',
    label: 'Zahlen ordnen',
    shortLabel: 'Zahlen ordnen',
    description: 'Zahlen vergleichen und auf dem Zahlenweg einordnen.',
    topics: ['zahlen-bis-100'],
    scope: 'core',
  },
  {
    id: 'count-steps',
    label: 'In Schritten zählen',
    shortLabel: 'Zählschritte',
    description: 'Vorwärts und rückwärts in passenden Schritten zählen.',
    topics: ['zahlen-bis-100'],
    scope: 'core',
  },
  {
    id: 'complement-ten',
    label: 'Zum Zehner ergänzen',
    shortLabel: 'Zum Zehner',
    description: 'Bis zum nächsten vollen Zehner ergänzen.',
    topics: ['zahlen-bis-100', 'plus-minus'],
    scope: 'core',
  },
  {
    id: 'complement-hundred',
    label: 'Bis 100 ergänzen',
    shortLabel: 'Bis 100',
    description: 'Eine Zahl geschickt bis 100 ergänzen.',
    topics: ['zahlen-bis-100', 'plus-minus'],
    scope: 'core',
  },
  {
    id: 'addition',
    label: 'Plus im Hunderterraum',
    shortLabel: 'Plus',
    description: 'Einer und Zehner schrittweise addieren.',
    topics: ['plus-minus'],
    scope: 'core',
  },
  {
    id: 'subtraction',
    label: 'Minus im Hunderterraum',
    shortLabel: 'Minus',
    description: 'Einer und Zehner schrittweise subtrahieren.',
    topics: ['plus-minus'],
    scope: 'core',
  },
  {
    id: 'double-half',
    label: 'Verdoppeln und halbieren',
    shortLabel: 'Doppelt & halb',
    description: 'Zahlen mit zwei gleich grossen Gruppen verstehen.',
    topics: ['verdoppeln-halbieren'],
    scope: 'core',
  },
  {
    id: 'decompose',
    label: 'Zahlen zerlegen',
    shortLabel: 'Zerlegen',
    description: 'Zahlen in verschiedene passende Teile zerlegen.',
    topics: ['zahlen-bis-100', 'plus-minus', 'verdoppeln-halbieren'],
    scope: 'core',
  },
  {
    id: 'money',
    label: 'Franken und Rappen',
    shortLabel: 'Geld',
    description: 'Symbolische Münzen erkennen und Beträge zusammenzählen.',
    topics: ['groessen-sachrechnen'],
    scope: 'extension',
  },
  {
    id: 'time',
    label: 'Uhrzeit und Dauer',
    shortLabel: 'Uhrzeit',
    description: 'Volle, halbe und Viertelstunden sowie kurze Zeitspannen lesen.',
    topics: ['groessen-sachrechnen'],
    scope: 'extension',
  },
  {
    id: 'length',
    label: 'Längen messen',
    shortLabel: 'Längen',
    description: 'Strecken am Lineal in Zentimetern bestimmen.',
    topics: ['groessen-sachrechnen'],
    scope: 'extension',
  },
  {
    id: 'shapes',
    label: 'Figuren untersuchen',
    shortLabel: 'Figuren',
    description: 'Ecken und Seiten ebener Figuren sicher bestimmen.',
    topics: ['formen-symmetrie'],
    scope: 'extension',
  },
  {
    id: 'symmetry',
    label: 'Symmetrie ergänzen',
    shortLabel: 'Symmetrie',
    description: 'Spiegelbilder an einer senkrechten Achse vervollständigen.',
    topics: ['formen-symmetrie'],
    scope: 'extension',
  },
  {
    id: 'multiplication',
    label: 'Mal als Punktefeld',
    shortLabel: 'Mal',
    description: 'Gleich grosse Reihen als Malaufgabe verstehen.',
    topics: ['mal-teilen'],
    scope: 'multiplication',
  },
  {
    id: 'sharing',
    label: 'Fair teilen',
    shortLabel: 'Teilen',
    description: 'Mengen ohne Rest auf gleich grosse Gruppen verteilen.',
    topics: ['mal-teilen'],
    scope: 'multiplication',
  },
  {
    id: 'word-problems',
    label: 'Sachaufgaben verstehen',
    shortLabel: 'Sachaufgabe',
    description: 'Kurze Alltagssituationen in eine Rechnung übersetzen.',
    topics: ['plus-minus', 'groessen-sachrechnen', 'mal-teilen'],
    scope: 'extension',
  },
]

export const SKILL_IDS = SKILLS.map((skill) => skill.id)

export function skillById(skillId: SkillId): SkillDefinition {
  return SKILLS.find((skill) => skill.id === skillId) ?? SKILLS[0]
}

export function emptyMastery(skillId: SkillId): MasteryState {
  return {
    skillId,
    band: 'new',
    score: 0,
    attempts: 0,
    independentSuccesses: 0,
    lastPractisedAt: null,
    nextReviewDate: null,
    representationEvidence: {},
  }
}

export function emptyMasteryMap(): Record<SkillId, MasteryState> {
  return Object.fromEntries(
    SKILL_IDS.map((skillId) => [skillId, emptyMastery(skillId)]),
  ) as Record<SkillId, MasteryState>
}
