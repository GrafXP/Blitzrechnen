import { SKILLS, skillById } from '../curriculum/skills'
import { currentLedger } from '../domain/data'
import type { AppData, Challenge, MasteryState, SkillId } from '../domain/types'
import { generateChallenge, hashString, randomFromSeed } from '../exercises/generators'

function difficultyFor(state: MasteryState): 1 | 2 | 3 | 4 {
  if (state.score <= 0) return 1
  if (state.score <= 2) return 2
  if (state.score <= 5) return 3
  return 4
}

function choose<T>(random: () => number, values: T[]): T {
  return values[Math.floor(random() * values.length)]
}

export function isDue(state: MasteryState, dateKey: string): boolean {
  return state.band === 'new' || !state.nextReviewDate || state.nextReviewDate <= dateKey
}

export function availableSkills(data: AppData) {
  return SKILLS.filter((skill) => {
    if (skill.scope === 'core') return true
    if (skill.scope === 'multiplication') return data.settings.multiplicationEnabled
    return skill.topics.includes(data.settings.schoolTopic)
  })
}

export function challengeForSession(
  data: AppData,
  dateKey: string,
  index: number,
): Challenge {
  const round = currentLedger(data, dateKey).round
  const random = randomFromSeed(hashString(`${dateKey}:${round}:adaptive-selector:${index}`))
  const todaysSkillIds = data.attempts
    .filter((attempt) => attempt.dateKey === dateKey && attempt.skillId)
    .map((attempt) => attempt.skillId!)
  const eligible = availableSkills(data)
  const due = eligible.filter((skill) => isDue(data.mastery[skill.id], dateKey))
  const currentTopic = eligible.filter((skill) => skill.topics.includes(data.settings.schoolTopic))
  const roll = random()
  let pool = roll < 0.5 ? due : roll < 0.8 ? currentTopic : eligible
  if (pool.length === 0) pool = eligible

  const lastTwo = todaysSkillIds.slice(-2)
  if (lastTwo.length === 2 && lastTwo[0] === lastTwo[1]) {
    const withoutRepeat = pool.filter((skill) => skill.id !== lastTwo[0])
    if (withoutRepeat.length) pool = withoutRepeat
  }

  const unseen = pool.filter((skill) => !todaysSkillIds.includes(skill.id))
  if (unseen.length) pool = unseen

  const selected = choose(random, pool)
  const state = data.mastery[selected.id]
  return generateChallenge(selected.id, difficultyFor(state), dateKey, index, round)
}

export function masteryLabel(state: MasteryState, dateKey: string): string {
  if (state.band === 'secure' && isDue(state, dateKey)) return 'auffrischen'
  switch (state.band) {
    case 'new': return 'neu'
    case 'learning': return 'am Lernen'
    case 'practising': return 'am Üben'
    case 'secure': return 'sicher'
  }
}

export function currentFocusSkills(data: AppData): SkillId[] {
  return availableSkills(data)
    .filter((skill) => skill.topics.includes(data.settings.schoolTopic))
    .map((skill) => skill.id)
}

export function lowestMasterySkills(data: AppData, limit = 3): SkillId[] {
  return availableSkills(data)
    .sort((first, second) => {
      const scoreDifference = data.mastery[first.id].score - data.mastery[second.id].score
      return scoreDifference || skillById(first.id).label.localeCompare(skillById(second.id).label, 'de-CH')
    })
    .slice(0, limit)
    .map((skill) => skill.id)
}
