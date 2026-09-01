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
    id: `${dateKey}:round-${round}:v3:${index}:${skillId}`,
    skillId,
    skillLabel: skill.shortLabel,
    difficulty,
  }
}

function taskStyle(
  dateKey: string,
  skillId: SkillId,
  round: number,
): 0 | 1 | 2 | 3 {
  return ((hashString(`${dateKey}:${skillId}:style`) + round) % 4) as 0 | 1 | 2 | 3
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
  const style = taskStyle(dateKey, skillId, round)

  switch (skillId) {
    case 'number-recognition': {
      const upper = [30, 50, 80, 100][difficulty - 1]
      const value = integer(random, 1, upper)
      const usesChoices = style === 1 || style === 3
      const usesPlaceValue = style >= 2
      return {
        ...base,
        kind: 'read-quantity',
        interaction: usesChoices ? 'choice' : 'number-input',
        representation: usesPlaceValue ? 'place-value' : 'hundred-field',
        prompt: style === 0
          ? 'Wie viele Punkte siehst du?'
          : style === 1
            ? 'Welche Zahl passt zum Punktefeld?'
            : style === 2
              ? 'Lies die Zehner und Einer. Welche Zahl ist das?'
              : 'Welche Zahl ist hier gebaut?',
        spokenPrompt: usesPlaceValue
          ? 'Lies die Zehnerstangen und Einerpunkte. Welche Zahl ist gebaut?'
          : 'Zähle die Punkte. Welche Zahl passt?',
        answer: value,
        options: usesChoices ? optionsAround(random, value, 1, upper) : undefined,
        hint: 'Zähle zuerst die vollen Zehnerreihen und dann die einzelnen Punkte.',
        promptVisual: usesPlaceValue
          ? { type: 'place-value', value }
          : { type: 'hundred-field', value, mode: 'quantity' },
        hintVisual: usesPlaceValue
          ? { type: 'hundred-field', value, mode: 'quantity' }
          : { type: 'place-value', value },
      }
    }

    case 'place-value': {
      const upper = [30, 50, 80, 100][difficulty - 1]
      const maximumTens = Math.max(1, Math.floor((upper - 1) / 10))
      const value = integer(random, 1, maximumTens) * 10 + integer(random, 0, 9)
      const tens = Math.floor(value / 10)
      const ones = value % 10
      const asksTens = style === 2
      const asksOnes = style === 3
      return {
        ...base,
        kind: 'build-number',
        interaction: 'number-input',
        representation: style === 1 ? 'symbolic' : 'place-value',
        prompt: style === 0
          ? 'Welche Zahl zeigen die Zehner und Einer?'
          : style === 1
            ? `${tens} Zehner und ${ones} Einer. Welche Zahl ist das?`
            : asksTens
              ? `Wie viele Zehner stecken in ${value}?`
              : `Wie viele Einer hat ${value}?`,
        spokenPrompt: style === 0
          ? 'Welche Zahl zeigen die Zehnerstangen und Einerpunkte?'
          : style === 1
            ? `${tens} Zehner und ${ones} Einer. Welche Zahl ist das?`
            : asksTens
              ? `Wie viele Zehner stecken in der Zahl ${value}?`
              : `Wie viele Einer hat die Zahl ${value}?`,
        answer: asksTens ? tens : asksOnes ? ones : value,
        hint: `${tens} Zehner sind ${tens * 10}. Dazu kommen ${ones} Einer.`,
        promptVisual: style === 1 ? NONE : { type: 'place-value', value },
        hintVisual: { type: 'hundred-field', value, mode: 'quantity' },
      }
    }

    case 'number-order': {
      const upper = [30, 50, 80, 100][difficulty - 1]
      if (style >= 2) {
        const value = style === 2 ? integer(random, 1, upper - 1) : integer(random, 2, upper)
        const answer = style === 2 ? value + 1 : value - 1
        return {
          ...base,
          kind: 'choose-order',
          interaction: 'number-input',
          representation: 'number-line',
          prompt: style === 2
            ? `Welche Zahl kommt direkt nach ${value}?`
            : `Welche Zahl kommt direkt vor ${value}?`,
          spokenPrompt: style === 2
            ? `Welche Zahl kommt direkt nach ${value}?`
            : `Welche Zahl kommt direkt vor ${value}?`,
          answer,
          hint: `Auf dem Zahlenweg steht ${answer} direkt ${style === 2 ? 'rechts' : 'links'} neben ${value}.`,
          promptVisual: NONE,
          hintVisual: {
            type: 'number-line',
            minimum: Math.max(0, value - 5),
            maximum: Math.min(100, value + 5),
            start: value,
            end: answer,
          },
        }
      }
      const values = new Set<number>()
      while (values.size < 4) values.add(integer(random, 1, upper))
      const options = [...values]
      const wantsLargest = style === 1
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
      const missingIndex = 1 + (style % 3)
      const start = backwards
        ? integer(random, step * 4, upper)
        : integer(random, 0, Math.max(0, upper - step * 4))
      const completeValues = Array.from({ length: 5 }, (_, valueIndex) =>
        backwards ? start - step * valueIndex : start + step * valueIndex,
      )
      const answer = completeValues[missingIndex]
      const values: Array<number | null> = completeValues.map((value, valueIndex) =>
        valueIndex === missingIndex ? null : value,
      )
      return {
        ...base,
        kind: 'continue-sequence',
        interaction: 'number-input',
        representation: 'sequence',
        prompt: `Welche Zahl fehlt? ${backwards ? `Immer ${step} zurück.` : `Immer ${step} weiter.`}`,
        spokenPrompt: `Welche Zahl fehlt? Zähle immer in ${step}er Schritten ${backwards ? 'zurück' : 'weiter'}.`,
        answer,
        hint: `Gehe von einer sichtbaren Zahl immer ${step} ${backwards ? 'zurück' : 'weiter'}.`,
        promptVisual: { type: 'sequence', values },
        hintVisual: {
          type: 'number-line',
          minimum: 0,
          maximum: upper <= 50 ? 50 : 100,
          start,
          end: completeValues[4],
          jumps: [step, step, step, step],
        },
      }
    }

    case 'complement-ten': {
      const maximumTarget = [20, 50, 80, 100][difficulty - 1]
      const target = integer(random, 1, maximumTarget / 10) * 10
      const value = integer(random, Math.max(1, target - 9), target - 1)
      const answer = target - value
      const usesChoices = style === 3
      return {
        ...base,
        kind: 'complete-ten',
        interaction: usesChoices ? 'choice' : 'number-input',
        representation: 'number-line',
        prompt: style === 0
          ? `${value} + ? = ${target}`
          : style === 1
            ? `? + ${value} = ${target}`
            : style === 2
              ? `${target} − ${value} = ?`
              : `Wie viel fehlt von ${value} bis ${target}?`,
        spokenPrompt: `Wie viel fehlt von ${value} bis zum nächsten Zehner ${target}?`,
        answer,
        options: usesChoices ? optionsAround(random, answer, 0, 10) : undefined,
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
      const usesChoices = style === 3
      return {
        ...base,
        kind: 'complete-hundred',
        interaction: usesChoices ? 'choice' : 'number-input',
        representation: 'hundred-field',
        prompt: style === 0
          ? `${value} + ? = 100`
          : style === 1
            ? `? + ${value} = 100`
            : style === 2
              ? `100 − ${value} = ?`
              : `Von ${value} bis 100 fehlen wie viele?`,
        spokenPrompt: `Wie viel fehlt von ${value} bis einhundert?`,
        answer,
        options: usesChoices ? optionsAround(random, answer, 0, 100) : undefined,
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
      const sum = first + second
      const jumps = [Math.floor(second / 10) * 10, second % 10].filter((value) => value > 0)
      const answer = style === 1 ? second : style === 2 ? first : sum
      const usesChoices = style === 3
      return {
        ...base,
        kind: 'addition',
        interaction: usesChoices ? 'choice' : 'number-input',
        representation: 'symbolic',
        prompt: style === 1
          ? `${first} + ? = ${sum}`
          : style === 2
            ? `? + ${second} = ${sum}`
            : `${first} + ${second} = ?`,
        spokenPrompt: style === 1
          ? `Was muss zu ${first} dazukommen, damit es ${sum} gibt?`
          : style === 2
            ? `Welche Zahl plus ${second} ergibt ${sum}?`
            : `Wie viel ist ${first} plus ${second}?`,
        answer,
        options: usesChoices ? optionsAround(random, answer, 0, 100) : undefined,
        hint: style === 1
          ? `Gehe von ${first} bis ${sum}. Der Abstand ist die gesuchte Zahl.`
          : style === 2
            ? `Gehe von ${sum} um ${second} zurück. Dort liegt die gesuchte Zahl.`
            : `Starte bei ${first}. Springe zuerst die Zehner und dann die Einer von ${second}.`,
        promptVisual: NONE,
        hintVisual: { type: 'number-line', minimum: 0, maximum: 100, start: first, end: sum, jumps },
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
      const difference = whole - removed
      const jumps = [Math.floor(removed / 10) * 10, removed % 10].filter((value) => value > 0)
      const answer = style === 1 ? removed : style === 2 ? whole : difference
      const usesChoices = style === 3
      return {
        ...base,
        kind: 'subtraction',
        interaction: usesChoices ? 'choice' : 'number-input',
        representation: 'symbolic',
        prompt: style === 1
          ? `${whole} − ? = ${difference}`
          : style === 2
            ? `? − ${removed} = ${difference}`
            : `${whole} − ${removed} = ?`,
        spokenPrompt: style === 1
          ? `Was musst du von ${whole} wegnehmen, damit ${difference} bleibt?`
          : style === 2
            ? `Von welcher Zahl musst du ${removed} wegnehmen, damit ${difference} bleibt?`
            : `Wie viel ist ${whole} minus ${removed}?`,
        answer,
        options: usesChoices ? optionsAround(random, answer, 0, 100) : undefined,
        hint: style === 1
          ? `Der Abstand von ${difference} bis ${whole} ist die weggenommene Zahl.`
          : style === 2
            ? `Rechne ${difference} plus ${removed}, um die Startzahl zu finden.`
            : `Starte bei ${whole}. Gehe zuerst die Zehner und dann die Einer von ${removed} zurück.`,
        promptVisual: NONE,
        hintVisual: { type: 'number-line', minimum: 0, maximum: 100, start: whole, end: difference, jumps },
      }
    }

    case 'double-half': {
      const wantsHalf = random() > 0.5
      const upper = [10, 20, 35, 50][difficulty - 1]
      const half = integer(random, 1, upper)
      const whole = half * 2
      const usesChoices = style === 1 || style === 3
      if (wantsHalf) {
        return {
          ...base,
          kind: 'half',
          interaction: usesChoices ? 'choice' : 'number-input',
          representation: 'groups',
          prompt: style >= 2
            ? `${whole} Dinge auf 2 gleiche Gruppen. Wie viele in jeder?`
            : `Die Hälfte von ${whole} = ?`,
          spokenPrompt: style >= 2
            ? `Teile ${whole} Dinge auf zwei gleich grosse Gruppen. Wie viele sind in jeder?`
            : `Was ist die Hälfte von ${whole}?`,
          answer: half,
          options: usesChoices ? optionsAround(random, half, 0, 50) : undefined,
          hint: `Teile ${whole} in zwei gleich grosse Gruppen.`,
          promptVisual: difficulty <= 2 ? { type: 'groups', groups: [half, half] } : NONE,
          hintVisual: { type: 'groups', groups: [half, half] },
        }
      }
      return {
        ...base,
        kind: 'double',
        interaction: usesChoices ? 'choice' : 'number-input',
        representation: 'groups',
        prompt: style >= 2
          ? `2 Gruppen mit je ${half}. Wie viele zusammen?`
          : `Doppelt ${half} = ?`,
        spokenPrompt: style >= 2
          ? `Zwei Gruppen mit je ${half}. Wie viele sind es zusammen?`
          : `Was ist doppelt so viel wie ${half}?`,
        answer: whole,
        options: usesChoices ? optionsAround(random, whole, 0, 100) : undefined,
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
      const usesChoices = style === 3
      return {
        ...base,
        kind: 'decompose',
        interaction: usesChoices ? 'choice' : 'number-input',
        representation: 'part-whole',
        prompt: style === 0
          ? `${whole} = ${known} + ?`
          : style === 1
            ? `${whole} = ? + ${known}`
            : style === 2
              ? `${known} + ? ergibt ${whole}. Was fehlt?`
              : `Welcher Teil ergänzt ${known} zum Ganzen ${whole}?`,
        spokenPrompt: `${whole} wird zerlegt. Was fehlt neben ${known}?`,
        answer,
        options: usesChoices ? optionsAround(random, answer, 0, whole) : undefined,
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
      const total = coins.reduce((sum, coin) => sum + coin, 0)
      const asksMissing = style >= 2
      const target = Math.ceil((total + 1) / 50) * 50
      const answer = asksMissing ? target - total : total
      const usesChoices = style === 1 || style === 3
      return {
        ...base,
        kind: 'money',
        interaction: usesChoices ? 'choice' : 'number-input',
        representation: 'money',
        prompt: asksMissing
          ? `Wie viele Rappen fehlen noch bis ${target}?`
          : style === 0
            ? 'Wie viele Rappen sind das zusammen?'
            : 'Welcher Betrag liegt hier?',
        spokenPrompt: asksMissing
          ? `Zähle den Betrag. Wie viele Rappen fehlen noch bis ${target}?`
          : 'Zähle die Münzen zusammen. Wie viele Rappen sind es?',
        answer,
        options: usesChoices ? optionsAround(random, answer, 0, asksMissing ? 100 : 999) : undefined,
        hint: asksMissing
          ? `Die Münzen geben ${total} Rappen. Ergänze von ${total} bis ${target}.`
          : 'Ein Franken sind 100 Rappen. Zähle zuerst die grossen Münzen.',
        promptVisual: { type: 'money', coins },
        hintVisual: asksMissing
          ? { type: 'part-whole', whole: target, known: total, missing: answer }
          : { type: 'money', coins: [...coins].sort((a, b) => b - a) },
      }
    }

    case 'time': {
      const hour = integer(random, 1, 11)
      if (difficulty === 1) {
        const usesChoices = style === 1 || style === 3
        return {
          ...base,
          kind: 'time',
          interaction: usesChoices ? 'choice' : 'number-input',
          representation: 'clock',
          prompt: style < 2 ? 'Welche Stunde zeigt die Uhr?' : 'Wie spät ist es? Nenne die volle Stunde.',
          spokenPrompt: 'Welche volle Stunde zeigt die Uhr?',
          answer: hour,
          options: usesChoices ? optionsAround(random, hour, 1, 12) : undefined,
          hint: 'Der kurze Zeiger zeigt die Stunde. Der lange Zeiger steht bei zwölf.',
          promptVisual: { type: 'clock', hour, minute: 0 },
          hintVisual: { type: 'clock', hour, minute: 0 },
        }
      }
      if (difficulty === 4) {
        const duration = pick(random, [15, 30, 45, 60])
        const totalMinutes = hour * 60 + pick(random, [0, 15, 30])
        const endTotal = totalMinutes + duration
        const usesChoices = style === 1 || style === 3
        return {
          ...base,
          kind: 'time',
          interaction: usesChoices ? 'choice' : 'number-input',
          representation: 'clock',
          prompt: 'Wie viele Minuten vergehen?',
          spokenPrompt: 'Wie viele Minuten vergehen zwischen den beiden Uhren?',
          answer: duration,
          options: usesChoices ? shuffle(random, [15, 30, 45, 60]) : undefined,
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
      const usesChoices = style === 1 || style === 3
      return {
        ...base,
        kind: 'time',
        interaction: usesChoices ? 'choice' : 'number-input',
        representation: 'clock',
        prompt: style < 2
          ? `Wie viele Minuten nach ${hour} Uhr?`
          : 'Auf welcher Minutenzahl steht der lange Zeiger?',
        spokenPrompt: `Wie viele Minuten nach ${hour} Uhr zeigt die Uhr?`,
        answer: minute,
        options: usesChoices ? shuffle(random, [0, 15, 30, 45]) : undefined,
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
      const usesChoices = style === 1 || style === 3
      return {
        ...base,
        kind: 'length',
        interaction: usesChoices ? 'choice' : 'number-input',
        representation: 'ruler',
        prompt: style === 0
          ? 'Wie lang ist die Strecke in Zentimetern?'
          : style === 1
            ? 'Welche Länge passt zur roten Strecke?'
            : style === 2
              ? `Die Strecke beginnt bei ${start} cm und endet bei ${end} cm. Wie lang ist sie?`
              : 'Miss genau: Wie viele Zentimeter liegen zwischen den Punkten?',
        spokenPrompt: 'Miss die Strecke am Lineal. Wie viele Zentimeter ist sie lang?',
        answer,
        options: usesChoices ? optionsAround(random, answer, 0, maximum) : undefined,
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
      const asksCorners = style === 0 || style === 3
      const usesChoices = style === 1 || style === 3
      return {
        ...base,
        kind: 'shape-properties',
        interaction: usesChoices ? 'choice' : 'number-input',
        representation: 'shape',
        prompt: style < 2
          ? `Wie viele ${asksCorners ? 'Ecken' : 'Seiten'} hat diese Figur?`
          : `Fahre die Figur ab und zähle ihre ${asksCorners ? 'Ecken' : 'Seiten'}.`,
        spokenPrompt: `Wie viele ${asksCorners ? 'Ecken' : 'Seiten'} hat die gezeigte Figur?`,
        answer: sides,
        options: usesChoices ? optionsAround(random, sides, 0, 6) : undefined,
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
      const usesChoices = style === 1 || style === 3
      return {
        ...base,
        kind: 'symmetry',
        interaction: usesChoices ? 'choice' : 'number-input',
        representation: 'symmetry-grid',
        prompt: style < 2
          ? 'Wie viele Kästchen fehlen im Spiegelbild?'
          : 'Ergänze das Muster im Kopf. Wie viele Felder fehlen rechts?',
        spokenPrompt: 'Spiegle das Muster an der roten Linie. Wie viele Kästchen fehlen rechts?',
        answer: missingCount,
        options: usesChoices ? optionsAround(random, missingCount, 0, 8) : undefined,
        hint: 'Jedes gefüllte Kästchen links braucht ein Kästchen gleich weit rechts von der Achse.',
        promptVisual: { type: 'symmetry-grid', leftCells, missingIndexes, showSolution: false },
        hintVisual: { type: 'symmetry-grid', leftCells, missingIndexes, showSolution: true },
      }
    }

    case 'multiplication': {
      const limits = [[2, 3, 5], [2, 5, 5], [2, 7, 8], [2, 10, 10]][difficulty - 1]
      const rows = integer(random, limits[0], limits[1])
      const columns = integer(random, 2, Math.min(limits[2], Math.floor(100 / rows)))
      const total = rows * columns
      const asksRowSize = style === 3
      const answer = asksRowSize ? columns : total
      const usesChoices = style === 1 || style === 3
      return {
        ...base,
        kind: 'multiplication',
        interaction: usesChoices ? 'choice' : 'number-input',
        representation: 'array',
        prompt: style === 0
          ? `${rows} Reihen mit je ${columns}. Wie viele Punkte?`
          : style === 1
            ? `${rows} × ${columns} = ?`
            : style === 2
              ? `${Array.from({ length: rows }, () => columns).join(' + ')} = ?`
              : `${total} Punkte in ${rows} gleichen Reihen. Wie viele je Reihe?`,
        spokenPrompt: asksRowSize
          ? `${total} Punkte liegen in ${rows} gleich langen Reihen. Wie viele Punkte hat jede Reihe?`
          : `${rows} Reihen mit je ${columns} Punkten. Wie viele Punkte sind es zusammen?`,
        answer,
        options: usesChoices ? optionsAround(random, answer, 0, 100) : undefined,
        hint: asksRowSize
          ? `Teile die ${total} Punkte in ${rows} gleich lange Reihen.`
          : `Addiere ${columns} genau ${rows} Mal: ${Array.from({ length: rows }, () => columns).join(' plus ')}.`,
        promptVisual: { type: 'array', rows, columns, showTotal: false },
        hintVisual: { type: 'array', rows, columns, showTotal: true },
      }
    }

    case 'sharing': {
      const groups = integer(random, 2, [2, 4, 5, 10][difficulty - 1])
      const each = integer(random, 2, Math.min([5, 8, 10, 10][difficulty - 1], Math.floor(100 / groups)))
      const total = groups * each
      const asksGroups = style === 2
      const answer = asksGroups ? groups : each
      const usesChoices = style === 1 || style === 3
      return {
        ...base,
        kind: 'sharing',
        interaction: usesChoices ? 'choice' : 'number-input',
        representation: 'sharing',
        prompt: asksGroups
          ? `${total} Plättchen, je ${each} pro Gruppe. Wie viele Gruppen?`
          : style === 3
            ? `${total} Beeren fair auf ${groups} Schalen. Wie viele pro Schale?`
            : `${total} Plättchen fair auf ${groups} Gruppen. Wie viele pro Gruppe?`,
        spokenPrompt: asksGroups
          ? `${total} Plättchen kommen in Gruppen mit je ${each}. Wie viele Gruppen entstehen?`
          : `Teile ${total} Dinge fair auf ${groups} Gruppen. Wie viele kommen in jede Gruppe?`,
        answer,
        options: usesChoices ? optionsAround(random, answer, 0, 20) : undefined,
        hint: asksGroups
          ? `Bilde immer eine Gruppe mit ${each}, bis alle ${total} Plättchen verteilt sind.`
          : `Verteile immer eines pro Gruppe, bis alle ${total} Plättchen verteilt sind.`,
        promptVisual: { type: 'sharing', total, groups, showGroups: false },
        hintVisual: { type: 'sharing', total, groups, showGroups: true },
      }
    }

    case 'word-problems': {
      const upper = [20, 40, 70, 100][difficulty - 1]
      const adds = random() >= 0.5
      const usesChoices = style === 1 || style === 3
      if (adds) {
        const first = integer(random, 2, upper - 2)
        const second = integer(random, 1, upper - first)
        const answer = first + second
        const stories = [
          {
            prompt: `Noemi hat ${first} Murmeln. Sie bekommt ${second} dazu. Wie viele hat sie jetzt?`,
            spoken: `Noemi hat ${first} Murmeln und bekommt ${second} dazu. Wie viele Murmeln hat sie jetzt?`,
          },
          {
            prompt: `Im Korb liegen ${first} Äpfel. ${second} kommen dazu. Wie viele sind es zusammen?`,
            spoken: `Im Korb liegen ${first} Äpfel. ${second} Äpfel kommen dazu. Wie viele sind es zusammen?`,
          },
          {
            prompt: `Leo hat ${first} Sticker und findet ${second} weitere. Wie viele Sticker hat er?`,
            spoken: `Leo hat ${first} Sticker und findet ${second} weitere. Wie viele Sticker hat er jetzt?`,
          },
          {
            prompt: `Auf dem Regal stehen ${first} Bücher. Es kommen ${second} dazu. Wie viele Bücher stehen dort?`,
            spoken: `Auf dem Regal stehen ${first} Bücher. Es kommen ${second} Bücher dazu. Wie viele stehen dort jetzt?`,
          },
        ]
        const story = stories[style]
        return {
          ...base,
          kind: 'word-problem',
          interaction: usesChoices ? 'choice' : 'number-input',
          representation: 'part-whole',
          prompt: story.prompt,
          spokenPrompt: story.spoken,
          answer,
          options: usesChoices ? optionsAround(random, answer, 0, upper) : undefined,
          hint: `Es werden mehr. Rechne ${first} plus ${second}.`,
          promptVisual: NONE,
          hintVisual: { type: 'part-whole', whole: answer, known: first, missing: second },
        }
      }
      const whole = integer(random, 3, upper)
      const removed = integer(random, 1, whole - 1)
      const answer = whole - removed
      const stories = [
        {
          prompt: `Am Znüni liegen ${whole} Äpfel bereit. ${removed} werden gegessen. Wie viele bleiben?`,
          spoken: `Am Znüni liegen ${whole} Äpfel bereit. ${removed} werden gegessen. Wie viele bleiben übrig?`,
        },
        {
          prompt: `Im Bus sitzen ${whole} Kinder. ${removed} steigen aus. Wie viele fahren weiter?`,
          spoken: `Im Bus sitzen ${whole} Kinder. ${removed} Kinder steigen aus. Wie viele fahren weiter?`,
        },
        {
          prompt: `Mia hat ${whole} Farbstifte. Sie verschenkt ${removed}. Wie viele behält sie?`,
          spoken: `Mia hat ${whole} Farbstifte. Sie verschenkt ${removed} davon. Wie viele behält sie?`,
        },
        {
          prompt: `Auf dem Teich schwimmen ${whole} Enten. ${removed} fliegen weg. Wie viele bleiben?`,
          spoken: `Auf dem Teich schwimmen ${whole} Enten. ${removed} fliegen weg. Wie viele Enten bleiben?`,
        },
      ]
      const story = stories[style]
      return {
        ...base,
        kind: 'word-problem',
        interaction: usesChoices ? 'choice' : 'number-input',
        representation: 'part-whole',
        prompt: story.prompt,
        spokenPrompt: story.spoken,
        answer,
        options: usesChoices ? optionsAround(random, answer, 0, upper) : undefined,
        hint: `Es werden weniger. Rechne ${whole} minus ${removed}.`,
        promptVisual: NONE,
        hintVisual: { type: 'part-whole', whole, known: removed, missing: answer },
      }
    }
  }
}
