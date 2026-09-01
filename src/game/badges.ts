import type { AppData } from '../domain/types'

export interface MasteryBadge {
  id: 'first-step' | 'explorer' | 'steady-thinker' | 'pathfinder'
  name: string
  description: string
  symbol: string
  earned: boolean
}

export function masteryBadges(data: AppData): MasteryBadge[] {
  const states = Object.values(data.mastery)
  const practised = states.filter((state) => state.attempts > 0).length
  const secure = states.filter((state) => state.band === 'secure').length

  return [
    {
      id: 'first-step',
      name: 'Erste Spur',
      description: 'Einen Lernweg begonnen',
      symbol: '1',
      earned: practised >= 1,
    },
    {
      id: 'explorer',
      name: 'Entdecker:in',
      description: 'Sechs Lernwege ausprobiert',
      symbol: '✦',
      earned: practised >= 6,
    },
    {
      id: 'steady-thinker',
      name: 'Sicheres Köpfchen',
      description: 'Einen Lernweg sicher gemeistert',
      symbol: '✓',
      earned: secure >= 1,
    },
    {
      id: 'pathfinder',
      name: 'Wegweiser:in',
      description: 'Fünf Lernwege sicher gemeistert',
      symbol: '★',
      earned: secure >= 5,
    },
  ]
}
