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
    if (skill.id === 'money' || skill.id === 'time' || skill.id === 'length') {
      return data.settings.quantitiesEnabled
    }
    if (skill.id === 'word-problems') {
      return data.settings.quantitiesEnabled || data.settings.multiplicationEnabled
    }
    if (skill.id === 'shapes' || skill.id === 'symmetry') {
      return data.settings.geometryEnabled
    }
    return false
  })
}

export function challengeForSession(
  data: AppData,
  dateKey: string,
  index: number,
): Challenge {
  const round = currentLedger(data, dateKey).round
  const random = randomFromSeed(hashString(`${dateKey}:${round}:adaptive-selector:${index}`))
  const roundAttempts = data.attempts
    .filter((attempt) => attempt.dateKey === dateKey && attempt.round === round && attempt.skillId)
  const roundSkillIds = roundAttempts
    .map((attempt) => attempt.skillId!)
  const recentSkillIds = data.attempts
    .filter((attempt) => attempt.skillId)
    .slice(-12)
    .map((attempt) => attempt.skillId!)
  const eligible = availableSkills(data)
  const due = eligible.filter((skill) => isDue(data.mastery[skill.id], dateKey))
  const currentTopic = eligible.filter((skill) => skill.topics.includes(data.settings.schoolTopic))
  const roll = random()
  let pool = roll < 0.5 ? due : roll < 0.8 ? currentTopic : eligible
  if (pool.length === 0) pool = eligible

  const unseenThisRound = pool.filter((skill) => !roundSkillIds.includes(skill.id))
  if (unseenThisRound.length) pool = unseenThisRound

  const lastTwo = recentSkillIds.slice(-2)
  const withoutRecent = pool.filter((skill) => !lastTwo.includes(skill.id))
  if (withoutRecent.length) pool = withoutRecent

  const sameSlotInRecentRounds = new Set(
    data.attempts
      .filter((attempt) =>
        attempt.dateKey === dateKey
        && attempt.round >= Math.max(0, round - 3)
        && attempt.round < round
        && challengeSlot(attempt.challengeId) === index,
      )
      .map((attempt) => attempt.skillId)
      .filter((skillId): skillId is SkillId => skillId !== null),
  )
  const withoutSameSlot = pool.filter((skill) => !sameSlotInRecentRounds.has(skill.id))
  if (withoutSameSlot.length) pool = withoutSameSlot

  const selected = choose(random, pool)
  const state = data.mastery[selected.id]
  return generateChallenge(selected.id, difficultyFor(state), dateKey, index, round)
}

function challengeSlot(challengeId: string): number | null {
  const match = challengeId.match(/:v\d+:(\d+):/)
  return match ? Number(match[1]) : null
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
