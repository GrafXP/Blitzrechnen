import type { Challenge } from './types'

function hashString(value: string): number {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function randomFromSeed(seed: number): () => number {
  let value = seed
  return () => {
    value += 0x6d2b79f5
    let result = value
    result = Math.imul(result ^ (result >>> 15), result | 1)
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61)
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296
  }
}

function integer(random: () => number, minimum: number, maximum: number): number {
  return Math.floor(random() * (maximum - minimum + 1)) + minimum
}

export function challengeFor(dateKey: string, index: number): Challenge {
  const safeIndex = Math.max(0, Math.floor(index))
  const random = randomFromSeed(hashString(`${dateKey}:foundation:${safeIndex}`))
  const kind = safeIndex % 4
  const id = `${dateKey}:foundation:${safeIndex}`

  if (kind === 0) {
    const first = integer(random, 2, 12)
    const second = integer(random, 1, 20 - first)
    return {
      id,
      kind: 'addition',
      prompt: `${first} + ${second} = ?`,
      spokenPrompt: `Wie viel ist ${first} plus ${second}?`,
      answer: first + second,
      hint: `Lege zuerst ${first} Punkte und dann noch ${second} dazu.`,
      visualGroups: [first, second],
    }
  }

  if (kind === 1) {
    const total = integer(random, 8, 20)
    const removed = integer(random, 1, Math.min(9, total - 1))
    return {
      id,
      kind: 'subtraction',
      prompt: `${total} − ${removed} = ?`,
      spokenPrompt: `Wie viel ist ${total} minus ${removed}?`,
      answer: total - removed,
      hint: `Starte bei ${total} und gehe ${removed} Schritte zurück.`,
      visualGroups: [total - removed, removed],
    }
  }

  if (kind === 2) {
    const target = random() > 0.45 ? 20 : 10
    const first = integer(random, 1, target - 1)
    return {
      id,
      kind: 'complete',
      prompt: `${first} + ? = ${target}`,
      spokenPrompt: `Was fehlt? ${first} plus wie viel ist ${target}?`,
      answer: target - first,
      hint: `Zähle von ${first} bis ${target} weiter.`,
      visualGroups: [first, target - first],
    }
  }

  const first = integer(random, 1, 10)
  return {
    id,
    kind: 'double',
    prompt: `Doppelt ${first} = ?`,
    spokenPrompt: `Was ist doppelt so viel wie ${first}?`,
    answer: first * 2,
    hint: `Zwei gleich grosse Gruppen: ${first} und nochmals ${first}.`,
    visualGroups: [first, first],
  }
}
