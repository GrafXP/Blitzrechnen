import { skillById } from '../curriculum/skills'
import type {
  Challenge,
  ChallengeVisual,
  SkillId,
} from '../domain/types'

export function hashString(value: string): number {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function randomFromSeed(seed: number): () => number {
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

function pick<T>(random: () => number, values: readonly T[]): T {
  return values[Math.floor(random() * values.length)]
}

function shuffle<T>(random: () => number, values: T[]): T[] {
  const result = [...values]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = integer(random, 0, index)
    ;[result[index], result[other]] = [result[other], result[index]]
  }
  return result
}

function optionsAround(
  random: () => number,
  answer: number,
  minimum: number,
  maximum: number,
): number[] {
  const values = new Set<number>([answer])
  const offsets = shuffle(random, [-10, -5, -2, -1, 1, 2, 5, 10])
  for (const offset of offsets) {
    const value = answer + offset
    if (value >= minimum && value <= maximum) values.add(value)
    if (values.size === 4) break
  }
  while (values.size < 4) values.add(integer(random, minimum, maximum))
  return shuffle(random, [...values])
}

function challengeBase(
  dateKey: string,
  index: number,
  skillId: SkillId,
  difficulty: 1 | 2 | 3 | 4,
  round: number,
) {
  const skill = skillById(skillId)
  return {
    id: `${dateKey}:round-${round}:v2:${index}:${skillId}`,
    skillId,
    skillLabel: skill.shortLabel,
    difficulty,
  }
}

const NONE: ChallengeVisual = { type: 'none' }

export function generateChallenge(
  skillId: SkillId,
  difficulty: 1 | 2 | 3 | 4,
  dateKey: string,
  index: number,
  round = 0,
): Challenge {
  const random = randomFromSeed(hashString(`${dateKey}:${round}:${index}:${skillId}:${difficulty}`))
  const base = challengeBase(dateKey, index, skillId, difficulty, round)

  switch (skillId) {
    case 'number-recognition': {
      const upper = [30, 50, 80, 100][difficulty - 1]
      const value = integer(random, 1, upper)
      return {
        ...base,
        kind: 'read-quantity',
        interaction: 'number-input',
        representation: 'hundred-field',
        prompt: 'Wie viele Punkte siehst du?',
        spokenPrompt: 'Wie viele Punkte siehst du im Hunderterfeld?',
        answer: value,
        hint: 'Zähle zuerst die vollen Zehnerreihen und dann die einzelnen Punkte.',
        promptVisual: { type: 'hundred-field', value, mode: 'quantity' },
        hintVisual: { type: 'place-value', value },
      }
    }

    case 'place-value': {
      const upper = [30, 50, 80, 100][difficulty - 1]
      const maximumTens = Math.max(1, Math.floor((upper - 1) / 10))
      const value = integer(random, 1, maximumTens) * 10 + integer(random, 0, 9)
      return {
        ...base,
        kind: 'build-number',
        interaction: 'number-input',
        representation: 'place-value',
        prompt: 'Welche Zahl zeigen die Zehner und Einer?',
        spokenPrompt: 'Welche Zahl zeigen die Zehnerstangen und Einerpunkte?',
        answer: value,
        hint: `${Math.floor(value / 10)} Zehner sind ${Math.floor(value / 10) * 10}. Dazu kommen ${value % 10} Einer.`,
        promptVisual: { type: 'place-value', value },
        hintVisual: { type: 'hundred-field', value, mode: 'quantity' },
      }
    }

    case 'number-order': {
      const upper = [30, 50, 80, 100][difficulty - 1]
      const values = new Set<number>()
      while (values.size < 4) values.add(integer(random, 1, upper))
      const options = [...values]
      const wantsLargest = random() >= 0.5
      const answer = wantsLargest ? Math.max(...options) : Math.min(...options)
      return {
        ...base,
        kind: 'choose-order',
        interaction: 'choice',
        representation: 'ten-strip',
        prompt: wantsLargest ? 'Welche Zahl ist am grössten?' : 'Welche Zahl ist am kleinsten?',
        spokenPrompt: wantsLargest ? 'Tippe die grösste Zahl an.' : 'Tippe die kleinste Zahl an.',
        answer,
        options: shuffle(random, options),
        hint: `Auf dem Zahlenweg liegt ${answer} ${wantsLargest ? 'am weitesten rechts' : 'am weitesten links'}.`,
        promptVisual: NONE,
        hintVisual: {
          type: 'number-line',
          minimum: 0,
          maximum: upper <= 50 ? 50 : 100,
          start: 0,
          end: answer,
        },
      }
    }

    case 'count-steps': {
      const upper = [30, 50, 80, 100][difficulty - 1]
      const steps = difficulty === 1 ? [1, 2] : difficulty === 2 ? [2, 5, 10] : [2, 3, 5, 10]
      const step = pick(random, steps)
      const backwards = difficulty >= 3 && random() > 0.65
      const start = backwards
        ? integer(random, step * 3, upper)
        : integer(random, 0, Math.max(0, upper - step * 3))
      const values = backwards
        ? [start, start - step, null, start - step * 3]
        : [start, start + step, null, start + step * 3]
      const answer = backwards ? start - step * 2 : start + step * 2
      return {
        ...base,
        kind: 'continue-sequence',
        interaction: 'number-input',
        representation: 'sequence',
        prompt: `Welche Zahl fehlt? ${backwards ? `Immer ${step} zurück.` : `Immer ${step} weiter.`}`,
        spokenPrompt: `Welche Zahl fehlt? Zähle immer in ${step}er Schritten ${backwards ? 'zurück' : 'weiter'}.`,
        answer,
        hint: `Von ${values[1]} gehst du ${step} ${backwards ? 'zurück' : 'weiter'}.`,
        promptVisual: { type: 'sequence', values },
        hintVisual: {
          type: 'number-line',
          minimum: 0,
          maximum: upper <= 50 ? 50 : 100,
          start,
          end: values[3]!,
          jumps: [step, step, step],
        },
      }
    }

    case 'complement-ten': {
      const maximumTarget = [20, 50, 80, 100][difficulty - 1]
      const target = integer(random, 1, maximumTarget / 10) * 10
      const value = integer(random, Math.max(1, target - 9), target - 1)
      const answer = target - value
      return {
        ...base,
        kind: 'complete-ten',
        interaction: 'number-input',
        representation: 'number-line',
        prompt: `${value} + ? = ${target}`,
        spokenPrompt: `Wie viel fehlt von ${value} bis zum nächsten Zehner ${target}?`,
        answer,
        hint: `Gehe von ${value} bis ${target}. Es fehlen ${answer} Schritte.`,
        promptVisual: NONE,
        hintVisual: { type: 'ten-strip', filled: value - (target - 10), total: 10 },
      }
    }

    case 'complement-hundred': {
      const value = difficulty === 1
        ? integer(random, 1, 9) * 10
        : difficulty === 2
          ? integer(random, 1, 19) * 5
          : integer(random, 1, 99)
      const answer = 100 - value
      return {
        ...base,
        kind: 'complete-hundred',
        interaction: 'number-input',
        representation: 'hundred-field',
        prompt: `${value} + ? = 100`,
        spokenPrompt: `Wie viel fehlt von ${value} bis einhundert?`,
        answer,
        hint: `Im Hunderterfeld sind ${value} Punkte gefüllt. Zähle den freien Teil.`,
        promptVisual: NONE,
        hintVisual: { type: 'hundred-field', value, mode: 'complement' },
      }
    }

    case 'addition': {
      let first: number
      let second: number
      if (difficulty === 1) {
        first = integer(random, 2, 15)
        second = integer(random, 1, 20 - first)
      } else if (difficulty === 2) {
        first = integer(random, 10, 45)
        const candidates = [integer(random, 1, 9), 10, 20].filter((value) => first + value <= 60)
        second = pick(random, candidates)
      } else if (difficulty === 3) {
        first = integer(random, 20, 79)
        second = integer(random, 2, Math.min(20, 100 - first))
      } else {
        first = integer(random, 10, 79)
        second = integer(random, 10, 100 - first)
      }
      const answer = first + second
      const jumps = [Math.floor(second / 10) * 10, second % 10].filter((value) => value > 0)
      return {
        ...base,
        kind: 'addition',
        interaction: 'number-input',
        representation: 'symbolic',
        prompt: `${first} + ${second} = ?`,
        spokenPrompt: `Wie viel ist ${first} plus ${second}?`,
        answer,
        hint: `Starte bei ${first}. Springe zuerst die Zehner und dann die Einer von ${second}.`,
        promptVisual: NONE,
        hintVisual: { type: 'number-line', minimum: 0, maximum: 100, start: first, end: answer, jumps },
      }
    }

    case 'subtraction': {
      let whole: number
      let removed: number
      if (difficulty === 1) {
        whole = integer(random, 5, 20)
        removed = integer(random, 1, whole - 1)
      } else if (difficulty === 2) {
        whole = integer(random, 20, 60)
        const candidates = [integer(random, 1, 9), 10, 20].filter((value) => value < whole)
        removed = pick(random, candidates)
      } else if (difficulty === 3) {
        whole = integer(random, 20, 100)
        removed = integer(random, 2, Math.min(20, whole - 1))
      } else {
        whole = integer(random, 40, 100)
        removed = integer(random, 10, whole - 1)
      }
      const answer = whole - removed
      const jumps = [Math.floor(removed / 10) * 10, removed % 10].filter((value) => value > 0)
      return {
        ...base,
        kind: 'subtraction',
        interaction: 'number-input',
        representation: 'symbolic',
        prompt: `${whole} − ${removed} = ?`,
        spokenPrompt: `Wie viel ist ${whole} minus ${removed}?`,
        answer,
        hint: `Starte bei ${whole}. Gehe zuerst die Zehner und dann die Einer von ${removed} zurück.`,
        promptVisual: NONE,
        hintVisual: { type: 'number-line', minimum: 0, maximum: 100, start: whole, end: answer, jumps },
      }
    }

    case 'double-half': {
      const wantsHalf = random() > 0.5
      const upper = [10, 20, 35, 50][difficulty - 1]
      const half = integer(random, 1, upper)
      const whole = half * 2
      if (wantsHalf) {
        return {
          ...base,
          kind: 'half',
          interaction: 'number-input',
          representation: 'groups',
          prompt: `Die Hälfte von ${whole} = ?`,
          spokenPrompt: `Was ist die Hälfte von ${whole}?`,
          answer: half,
          hint: `Teile ${whole} in zwei gleich grosse Gruppen.`,
          promptVisual: difficulty <= 2 ? { type: 'groups', groups: [half, half] } : NONE,
          hintVisual: { type: 'groups', groups: [half, half] },
        }
      }
      return {
        ...base,
        kind: 'double',
        interaction: 'number-input',
        representation: 'groups',
        prompt: `Doppelt ${half} = ?`,
        spokenPrompt: `Was ist doppelt so viel wie ${half}?`,
        answer: whole,
        hint: `Lege ${half} und noch einmal ${half}.`,
        promptVisual: difficulty <= 2 ? { type: 'groups', groups: [half, half] } : NONE,
        hintVisual: { type: 'groups', groups: [half, half] },
      }
    }

    case 'decompose': {
      const upper = [30, 50, 80, 100][difficulty - 1]
      const whole = difficulty <= 2
        ? integer(random, 1, Math.floor(upper / 10)) * 10
        : integer(random, 15, upper)
      const known = difficulty === 1
        ? Math.max(1, whole - 10)
        : integer(random, 1, whole - 1)
      const answer = whole - known
      return {
        ...base,
        kind: 'decompose',
        interaction: 'number-input',
        representation: 'part-whole',
        prompt: `${whole} = ${known} + ?`,
        spokenPrompt: `${whole} wird zerlegt. Was fehlt neben ${known}?`,
        answer,
        hint: `Das Ganze ist ${whole}. Ein Teil ist ${known}. Finde den anderen Teil.`,
        promptVisual: { type: 'part-whole', whole, known, missing: answer },
        hintVisual: { type: 'part-whole', whole, known, missing: answer },
      }
    }

    case 'money': {
      const denominations = [
        [5, 10, 20],
        [5, 10, 20, 50],
        [10, 20, 50, 100],
        [20, 50, 100, 200],
      ][difficulty - 1]
      const coins = Array.from({ length: [2, 3, 4, 4][difficulty - 1] }, () => pick(random, denominations))
      const answer = coins.reduce((sum, coin) => sum + coin, 0)
      return {
        ...base,
        kind: 'money',
        interaction: 'number-input',
        representation: 'money',
        prompt: 'Wie viele Rappen sind das zusammen?',
        spokenPrompt: 'Zähle die Münzen zusammen. Wie viele Rappen sind es?',
        answer,
        hint: 'Ein Franken sind 100 Rappen. Zähle zuerst die grossen Münzen.',
        promptVisual: { type: 'money', coins },
        hintVisual: { type: 'money', coins: [...coins].sort((a, b) => b - a) },
      }
    }

    case 'time': {
      const hour = integer(random, 1, 11)
      if (difficulty === 1) {
        return {
          ...base,
          kind: 'time',
          interaction: 'number-input',
          representation: 'clock',
          prompt: 'Welche Stunde zeigt die Uhr?',
          spokenPrompt: 'Welche volle Stunde zeigt die Uhr?',
          answer: hour,
          hint: 'Der kurze Zeiger zeigt die Stunde. Der lange Zeiger steht bei zwölf.',
          promptVisual: { type: 'clock', hour, minute: 0 },
          hintVisual: { type: 'clock', hour, minute: 0 },
        }
      }
      if (difficulty === 4) {
        const duration = pick(random, [15, 30, 45, 60])
        const totalMinutes = hour * 60 + pick(random, [0, 15, 30])
        const endTotal = totalMinutes + duration
        return {
          ...base,
          kind: 'time',
          interaction: 'number-input',
          representation: 'clock',
          prompt: 'Wie viele Minuten vergehen?',
          spokenPrompt: 'Wie viele Minuten vergehen zwischen den beiden Uhren?',
          answer: duration,
          hint: 'Gehe in Viertelstunden weiter. Jede Viertelstunde hat 15 Minuten.',
          promptVisual: {
            type: 'clock',
            hour,
            minute: totalMinutes % 60,
            endHour: Math.floor(endTotal / 60) % 12 || 12,
            endMinute: endTotal % 60,
          },
          hintVisual: {
            type: 'clock',
            hour,
            minute: totalMinutes % 60,
            endHour: Math.floor(endTotal / 60) % 12 || 12,
            endMinute: endTotal % 60,
          },
        }
      }
      const minute = pick(random, difficulty === 2 ? [0, 30] : [0, 15, 30, 45])
      return {
        ...base,
        kind: 'time',
        interaction: 'number-input',
        representation: 'clock',
        prompt: `Wie viele Minuten nach ${hour} Uhr?`,
        spokenPrompt: `Wie viele Minuten nach ${hour} Uhr zeigt die Uhr?`,
        answer: minute,
        hint: 'Der lange Zeiger zeigt die Minuten: 3 bedeutet 15, 6 bedeutet 30 und 9 bedeutet 45.',
        promptVisual: { type: 'clock', hour, minute },
        hintVisual: { type: 'clock', hour, minute },
      }
    }

    case 'length': {
      const maximum = [10, 12, 15, 20][difficulty - 1]
      const start = difficulty <= 2 ? 0 : integer(random, 1, Math.floor(maximum / 2))
      const end = integer(random, start + 1, maximum)
      const answer = end - start
      return {
        ...base,
        kind: 'length',
        interaction: 'number-input',
        representation: 'ruler',
        prompt: 'Wie lang ist die Strecke in Zentimetern?',
        spokenPrompt: 'Miss die Strecke am Lineal. Wie viele Zentimeter ist sie lang?',
        answer,
        hint: start === 0
          ? `Die Strecke endet bei ${end}. Sie ist ${answer} Zentimeter lang.`
          : `Rechne vom Start ${start} bis zum Ende ${end}: ${end} minus ${start}.`,
        promptVisual: { type: 'ruler', start, end, maximum },
        hintVisual: { type: 'number-line', minimum: 0, maximum, start, end, jumps: [answer] },
      }
    }

    case 'shapes': {
      const shapes = [
        ['circle', 'triangle', 'square'],
        ['triangle', 'square', 'rectangle'],
        ['triangle', 'rectangle', 'pentagon'],
        ['rectangle', 'pentagon', 'hexagon'],
      ][difficulty - 1] as Array<'circle' | 'triangle' | 'square' | 'rectangle' | 'pentagon' | 'hexagon'>
      const shape = pick(random, shapes)
      const sides = { circle: 0, triangle: 3, square: 4, rectangle: 4, pentagon: 5, hexagon: 6 }[shape]
      const asksCorners = random() >= 0.5
      return {
        ...base,
        kind: 'shape-properties',
        interaction: 'number-input',
        representation: 'shape',
        prompt: `Wie viele ${asksCorners ? 'Ecken' : 'Seiten'} hat diese Figur?`,
        spokenPrompt: `Wie viele ${asksCorners ? 'Ecken' : 'Seiten'} hat die gezeigte Figur?`,
        answer: sides,
        hint: sides === 0 ? 'Eine runde Linie hat keine Ecke und keine gerade Seite.' : 'Fahre den Rand einmal herum und zähle sorgfältig.',
        promptVisual: { type: 'shape', shape },
        hintVisual: { type: 'shape', shape },
      }
    }

    case 'symmetry': {
      const count = difficulty + 2
      const used = new Set<string>()
      while (used.size < count) used.add(`${integer(random, 0, 4)}:${integer(random, 0, 2)}`)
      const leftCells = [...used].map((cell) => {
        const [row, column] = cell.split(':').map(Number)
        return { row, column }
      })
      const missingCount = Math.min(difficulty, leftCells.length)
      const missingIndexes = shuffle(random, leftCells.map((_, index) => index)).slice(0, missingCount)
      return {
        ...base,
        kind: 'symmetry',
        interaction: 'number-input',
        representation: 'symmetry-grid',
        prompt: 'Wie viele Kästchen fehlen im Spiegelbild?',
        spokenPrompt: 'Spiegle das Muster an der roten Linie. Wie viele Kästchen fehlen rechts?',
        answer: missingCount,
        hint: 'Jedes gefüllte Kästchen links braucht ein Kästchen gleich weit rechts von der Achse.',
        promptVisual: { type: 'symmetry-grid', leftCells, missingIndexes, showSolution: false },
        hintVisual: { type: 'symmetry-grid', leftCells, missingIndexes, showSolution: true },
      }
    }

    case 'multiplication': {
      const limits = [[2, 3, 5], [2, 5, 5], [2, 7, 8], [2, 10, 10]][difficulty - 1]
      const rows = integer(random, limits[0], limits[1])
      const columns = integer(random, 2, Math.min(limits[2], Math.floor(100 / rows)))
      const answer = rows * columns
      return {
        ...base,
        kind: 'multiplication',
        interaction: 'number-input',
        representation: 'array',
        prompt: `${rows} Reihen mit je ${columns}. Wie viele Punkte?`,
        spokenPrompt: `${rows} Reihen mit je ${columns} Punkten. Wie viele Punkte sind es zusammen?`,
        answer,
        hint: `Addiere ${columns} genau ${rows} Mal: ${Array.from({ length: rows }, () => columns).join(' plus ')}.`,
        promptVisual: { type: 'array', rows, columns, showTotal: false },
        hintVisual: { type: 'array', rows, columns, showTotal: true },
      }
    }

    case 'sharing': {
      const groups = integer(random, 2, [2, 4, 5, 10][difficulty - 1])
      const each = integer(random, 2, Math.min([5, 8, 10, 10][difficulty - 1], Math.floor(100 / groups)))
      const total = groups * each
      return {
        ...base,
        kind: 'sharing',
        interaction: 'number-input',
        representation: 'sharing',
        prompt: `${total} Plättchen fair auf ${groups} Gruppen. Wie viele pro Gruppe?`,
        spokenPrompt: `Teile ${total} Plättchen fair auf ${groups} Gruppen. Wie viele kommen in jede Gruppe?`,
        answer: each,
        hint: `Verteile immer eines pro Gruppe, bis alle ${total} Plättchen verteilt sind.`,
        promptVisual: { type: 'sharing', total, groups, showGroups: false },
        hintVisual: { type: 'sharing', total, groups, showGroups: true },
      }
    }

    case 'word-problems': {
      const upper = [20, 40, 70, 100][difficulty - 1]
      const adds = random() >= 0.5
      if (adds) {
        const first = integer(random, 2, upper - 2)
        const second = integer(random, 1, upper - first)
        const answer = first + second
        return {
          ...base,
          kind: 'word-problem',
          interaction: 'number-input',
          representation: 'part-whole',
          prompt: `Noemi hat ${first} Murmeln. Sie bekommt ${second} dazu. Wie viele hat sie jetzt?`,
          spokenPrompt: `Noemi hat ${first} Murmeln und bekommt ${second} dazu. Wie viele Murmeln hat sie jetzt?`,
          answer,
          hint: `Es werden mehr. Rechne ${first} plus ${second}.`,
          promptVisual: NONE,
          hintVisual: { type: 'part-whole', whole: answer, known: first, missing: second },
        }
      }
      const whole = integer(random, 3, upper)
      const removed = integer(random, 1, whole - 1)
      const answer = whole - removed
      return {
        ...base,
        kind: 'word-problem',
        interaction: 'number-input',
        representation: 'part-whole',
        prompt: `Am Znüni liegen ${whole} Äpfel bereit. ${removed} werden gegessen. Wie viele bleiben?`,
        spokenPrompt: `Am Znüni liegen ${whole} Äpfel bereit. ${removed} werden gegessen. Wie viele bleiben übrig?`,
        answer,
        hint: `Es werden weniger. Rechne ${whole} minus ${removed}.`,
        promptVisual: NONE,
        hintVisual: { type: 'part-whole', whole, known: removed, missing: answer },
      }
    }
  }
}
