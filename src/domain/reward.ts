import type { AppSettings, RewardDefinition, SchoolTopic } from './types'

type RewardDisplay =
  | Pick<AppSettings, 'rewardLabel' | 'rewardMinutes'>
  | Pick<RewardDefinition, 'label' | 'minutes'>

export function formatReward(reward: RewardDisplay): string {
  const label = 'label' in reward ? reward.label : reward.rewardLabel
  const minutes = 'minutes' in reward ? reward.minutes : reward.rewardMinutes
  return minutes > 0 ? `${minutes} Min. ${label}` : label
}

export const SCHOOL_TOPICS: Array<{ id: SchoolTopic; label: string }> = [
  { id: 'zahlen-bis-100', label: 'Zahlen bis 100' },
  { id: 'plus-minus', label: 'Plus und Minus' },
  { id: 'verdoppeln-halbieren', label: 'Verdoppeln und Halbieren' },
  { id: 'groessen-sachrechnen', label: 'Geld, Uhr, Längen und Sachrechnen' },
  { id: 'formen-symmetrie', label: 'Figuren und Symmetrie' },
  { id: 'mal-teilen', label: 'Mal und Teilen' },
]

export function schoolTopicLabel(topic: SchoolTopic): string {
  return SCHOOL_TOPICS.find((entry) => entry.id === topic)?.label ?? SCHOOL_TOPICS[0].label
}

export function schoolTopicEnabled(settings: AppSettings, topic: SchoolTopic): boolean {
  if (topic === 'groessen-sachrechnen') return settings.quantitiesEnabled
  if (topic === 'formen-symmetrie') return settings.geometryEnabled
  if (topic === 'mal-teilen') return settings.multiplicationEnabled
  return true
}
