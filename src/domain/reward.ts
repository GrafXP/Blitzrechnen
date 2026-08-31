import type { AppSettings } from './types'

export function formatReward(settings: Pick<AppSettings, 'rewardLabel' | 'rewardMinutes'>): string {
  return settings.rewardMinutes > 0
    ? `${settings.rewardMinutes} Min. ${settings.rewardLabel}`
    : settings.rewardLabel
}
