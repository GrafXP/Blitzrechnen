import type { AppSettings, DailyLedger } from './types'

export function formatReward(settings: Pick<AppSettings, 'rewardLabel' | 'rewardMinutes'>): string {
  return settings.rewardMinutes > 0
    ? `${settings.rewardMinutes} Min. ${settings.rewardLabel}`
    : settings.rewardLabel
}

export function redeemedReward(ledger: DailyLedger): string | null {
  if (!ledger.redeemedAt || !ledger.redeemedRewardLabel) return null
  return formatReward({
    rewardLabel: ledger.redeemedRewardLabel,
    rewardMinutes: ledger.redeemedRewardMinutes ?? 0,
  })
}
