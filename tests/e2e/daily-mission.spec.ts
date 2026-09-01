import { expect, test, type Page } from '@playwright/test'

async function answerFor(page: Page, prompt: string): Promise<string> {
  const money = page.locator('.prompt-visual .money-visual')
  if (await money.count()) {
    const total = Number(await money.getAttribute('data-total'))
    const target = prompt.match(/bis (\d+)/)?.[1]
    return String(target ? Number(target) - total : total)
  }

  const ruler = page.locator('.prompt-visual .ruler-visual')
  if (await ruler.count()) {
    return String(Number(await ruler.getAttribute('data-end')) - Number(await ruler.getAttribute('data-start')))
  }

  const shape = page.locator('.prompt-visual .shape-visual')
  if (await shape.count()) {
    const sides = { circle: 0, triangle: 3, square: 4, rectangle: 4, pentagon: 5, hexagon: 6 }
    return String(sides[(await shape.getAttribute('data-shape')) as keyof typeof sides])
  }

  const symmetry = page.locator('.prompt-visual .symmetry-grid')
  if (await symmetry.count()) return String(await symmetry.getAttribute('data-missing'))

  const array = page.locator('.prompt-visual .array-visual-wrap')
  if (await array.count()) {
    const total = Number(await array.getAttribute('data-answer'))
    const rowQuestion = prompt.match(/(\d+) Punkte in (\d+) gleichen Reihen/)
    return String(rowQuestion ? Number(rowQuestion[1]) / Number(rowQuestion[2]) : total)
  }

  const sharing = page.locator('.prompt-visual .sharing-visual')
  if (await sharing.count()) {
    const groupQuestion = prompt.match(/(\d+) Plättchen, je (\d+) pro Gruppe/)
    return String(groupQuestion
      ? Number(groupQuestion[1]) / Number(groupQuestion[2])
      : await sharing.getAttribute('data-answer'))
  }

  const clocks = page.locator('.prompt-visual .clock-face-wrap')
  if (await clocks.count()) {
    const hour = Number(await clocks.first().getAttribute('data-hour'))
    const minute = Number(await clocks.first().getAttribute('data-minute'))
    if (prompt.includes('Stunde') || prompt.startsWith('Wie spät')) return String(hour)
    if (prompt.startsWith('Wie viele Minuten nach') || prompt.includes('Minutenzahl')) return String(minute)
    const endHour = Number(await clocks.last().getAttribute('data-hour'))
    const endMinute = Number(await clocks.last().getAttribute('data-minute'))
    let duration = endHour * 60 + endMinute - (hour * 60 + minute)
    if (duration < 0) duration += 12 * 60
    return String(duration)
  }

  const hundredField = page.locator('.prompt-visual .hundred-field')
  if (await hundredField.count()) {
    return String(await page.locator('.prompt-visual .hundred-field__dot--filled').count())
  }

  const placeValue = page.locator('.prompt-visual .place-value')
  if (await placeValue.count()) {
    const tens = await page.locator('.prompt-visual .ten-rod').count()
    const ones = await page.locator('.prompt-visual .place-value__ones span').count()
    if (prompt.startsWith('Wie viele Zehner')) return String(tens)
    if (prompt.startsWith('Wie viele Einer')) return String(ones)
    return String(tens * 10 + ones)
  }

  let match = prompt.match(/^Welche Zahl fehlt\? Immer (\d+) (weiter|zurück)\.$/)
  if (match) {
    const values = await page.locator('.sequence-visual span').allTextContents()
    const missingIndex = values.indexOf('?')
    const step = Number(match[1]) * (match[2] === 'weiter' ? 1 : -1)
    const knownIndex = missingIndex > 0 ? missingIndex - 1 : missingIndex + 1
    return String(Number(values[knownIndex]) + step * (missingIndex - knownIndex))
  }

  match = prompt.match(/^(\d+) Zehner und (\d+) Einer/)
  if (match) return String(Number(match[1]) * 10 + Number(match[2]))

  match = prompt.match(/^Wie viele Zehner stecken in (\d+)\?$/)
  if (match) return String(Math.floor(Number(match[1]) / 10))

  match = prompt.match(/^Wie viele Einer hat (\d+)\?$/)
  if (match) return String(Number(match[1]) % 10)

  match = prompt.match(/^Welche Zahl kommt direkt (nach|vor) (\d+)\?$/)
  if (match) return String(Number(match[2]) + (match[1] === 'nach' ? 1 : -1))

  match = prompt.match(/^(?:Wie viel fehlt von|Von) (\d+) (?:bis (\d+)|bis 100 fehlen)/)
  if (match) return String(Number(match[2] ?? 100) - Number(match[1]))

  match = prompt.match(/^(\d+) \+ (\d+) = \?$/)
  if (match) return String(Number(match[1]) + Number(match[2]))

  match = prompt.match(/^(\d+(?: \+ \d+){2,}) = \?$/)
  if (match) return String(match[1].split(' + ').reduce((sum, value) => sum + Number(value), 0))

  match = prompt.match(/^(\d+) × (\d+) = \?$/)
  if (match) return String(Number(match[1]) * Number(match[2]))

  match = prompt.match(/^(\d+) − (\d+) = \?$/)
  if (match) return String(Number(match[1]) - Number(match[2]))

  match = prompt.match(/^(\d+) \+ \? = (\d+)$/)
  if (match) return String(Number(match[2]) - Number(match[1]))

  match = prompt.match(/^\? \+ (\d+) = (\d+)$/)
  if (match) return String(Number(match[2]) - Number(match[1]))

  match = prompt.match(/^(\d+) − \? = (\d+)$/)
  if (match) return String(Number(match[1]) - Number(match[2]))

  match = prompt.match(/^\? − (\d+) = (\d+)$/)
  if (match) return String(Number(match[1]) + Number(match[2]))

  match = prompt.match(/^Doppelt (\d+) = \?$/)
  if (match) return String(Number(match[1]) * 2)

  match = prompt.match(/^Die Hälfte von (\d+) = \?$/)
  if (match) return String(Number(match[1]) / 2)

  match = prompt.match(/^(\d+) Dinge auf 2 gleiche Gruppen/)
  if (match) return String(Number(match[1]) / 2)

  match = prompt.match(/^2 Gruppen mit je (\d+)/)
  if (match) return String(Number(match[1]) * 2)

  match = prompt.match(/^(\d+) = (\d+) \+ \?$/)
  if (match) return String(Number(match[1]) - Number(match[2]))

  match = prompt.match(/^(\d+) = \? \+ (\d+)$/)
  if (match) return String(Number(match[1]) - Number(match[2]))

  match = prompt.match(/^(\d+) \+ \? ergibt (\d+)/)
  if (match) return String(Number(match[2]) - Number(match[1]))

  match = prompt.match(/ergänzt (\d+) zum Ganzen (\d+)/)
  if (match) return String(Number(match[2]) - Number(match[1]))

  const storyNumbers = prompt.match(/\d+/g)?.map(Number) ?? []
  if (storyNumbers.length >= 2 && /dazu|zusammen|weitere/.test(prompt)) {
    return String(storyNumbers[0] + storyNumbers[1])
  }

  if (storyNumbers.length >= 2 && /gegessen|steigen aus|verschenkt|fliegen weg/.test(prompt)) {
    return String(storyNumbers[0] - storyNumbers[1])
  }

  throw new Error(`Unknown prompt: ${prompt}`)
}

async function solveCurrentChallenge(page: Page) {
  const prompt = (await page.locator('.challenge-card > h1').textContent())?.trim() ?? ''
  const choices = page.locator('.choice-card')
  if (await choices.count()) {
    const values = (await choices.allTextContents()).map(Number)
    const answer = prompt.includes('grössten')
      ? Math.max(...values)
      : prompt.includes('kleinsten')
        ? Math.min(...values)
        : Number(await answerFor(page, prompt))
    await page.getByRole('button', { name: String(answer), exact: true }).click()
    await page.getByRole('button', { name: 'Antwort prüfen' }).click()
    await expect(page.getByText('Du bekommst 10 Punkte.')).toBeVisible()
    return
  }

  const answer = await answerFor(page, prompt)
  for (const digit of answer) {
    await page.getByRole('button', { name: digit, exact: true }).click()
  }
  await page.getByRole('button', { name: 'Antwort prüfen' }).click()
  await expect(page.getByText('Du bekommst 10 Punkte.')).toBeVisible()
}

async function chooseMission(page: Page, name = 'Zahlenweg') {
  await expect(page.getByRole('heading', { name: 'Welche Mission möchtest du?' })).toBeVisible()
  await page.getByRole('button', { name: new RegExp(name) }).click()
  await expect(page.getByLabel(new RegExp(`${name}: 0 von`))).toBeVisible()
}

async function chooseReward(page: Page, name = '30 Min. Gamen') {
  await expect(page.getByRole('heading', { name: 'Welche Belohnung möchtest du sammeln?' })).toBeVisible()
  await page.getByRole('button', { name: new RegExp(name) }).click()
}

test('collects rewards freely and lets a parent redeem them later', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Mathe-Mission' })).toBeVisible()
  await page.getByRole('button', { name: 'Belohnung wählen' }).click()
  await chooseReward(page)
  await chooseMission(page)

  await solveCurrentChallenge(page)
  await expect(page.getByText('10 / 100')).toBeVisible()

  await page.reload()
  await expect(page.getByText('Aufgabe 2')).toBeVisible()
  await expect(page.getByText('10 / 100')).toBeVisible()

  for (let completed = 1; completed < 10; completed += 1) {
    await solveCurrentChallenge(page)
    await page.getByRole('button', { name: 'Weiter' }).click()
  }

  await expect(page.getByRole('heading', { name: 'Stark gerechnet!' })).toBeVisible()
  await expect(page.getByText('30 Min. Gamen')).toBeVisible()
  await page.getByRole('button', { name: /Belohnung sammeln/ }).click()

  await expect(page.getByRole('heading', { name: 'Gesammelte Belohnungen' })).toBeVisible()
  await expect(page.getByText('Bereit zum Einlösen')).toBeVisible()

  // A new mission can be chosen before an adult redeems the collected reward.
  await chooseReward(page)
  await expect(page.getByRole('heading', { name: 'Welche Mission möchtest du?' })).toBeVisible()
  await page.getByRole('button', { name: 'Zurück zum Start' }).click()
  await page.getByRole('button', { name: 'Meine Belohnungen' }).last().click()
  await page.getByRole('button', { name: /Mit Elternteil einlösen/ }).click()

  await page.getByLabel('Neue PIN', { exact: true }).fill('2468')
  await page.getByLabel('PIN wiederholen').fill('2468')
  await page.getByRole('button', { name: 'PIN speichern' }).click()

  await expect(page.getByText('Eingelöst')).toBeVisible()
  await expect(page.getByText('Bereit zum Einlösen')).not.toBeVisible()

  await page.reload()
  await expect(page.getByText('Eingelöst')).toBeVisible()
  await page.getByRole('button', { name: 'Zurück zum Start' }).click()
  await expect(page.getByRole('progressbar', { name: '0 von 100 Punkten' })).toBeVisible()
  await page.getByRole('button', { name: 'Mission starten' }).click()
  await chooseMission(page, 'Markttag')
  await expect(page.getByText('Aufgabe 1', { exact: false })).toBeVisible()
  await solveCurrentChallenge(page)
  await expect(page.getByText('10 / 100')).toBeVisible()

  await page.getByRole('button', { name: 'Mission verlassen' }).click()
  await page.getByRole('button', { name: 'Elternbereich' }).click()
  await page.getByLabel('PIN', { exact: true }).fill('2468')
  await page.getByRole('button', { name: 'Öffnen' }).click()
  await expect(page.getByRole('heading', { name: 'Elternübersicht' })).toBeVisible()
  await expect(page.locator('.stat-grid > div').filter({ hasText: 'heute gesammelt' })).toContainText('1')
  await expect(page.getByText('Punkte dieser Runde')).toBeVisible()
  const masteryValues = await page.locator('.mastery-track').evaluateAll((elements) =>
    elements.map((element) => Number(element.getAttribute('aria-valuenow'))),
  )
  expect(masteryValues).toHaveLength(18)
  expect(masteryValues.reduce((sum, value) => sum + value, 0)).toBeGreaterThan(0)
})

test('a parent can unlock conceptual multiplication and sharing', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Elternbereich' }).click()
  await page.getByLabel('Neue PIN', { exact: true }).fill('2468')
  await page.getByLabel('PIN wiederholen').fill('2468')
  await page.getByRole('button', { name: 'PIN speichern' }).click()

  await page.getByRole('checkbox', { name: /^Mal und Teilen/ }).check()
  await page.getByLabel('Belohnung').fill('Comic lesen')
  await page.getByLabel('Dauer', { exact: true }).selectOption('15')
  await page.getByLabel('Punkteziel').selectOption('100')
  await page.getByLabel('Mathe-Kategorie').selectOption('mal-teilen')
  await page.getByRole('button', { name: 'Belohnung hinzufügen' }).click()
  await expect(page.getByText('15 Min. Comic lesen')).toBeVisible()
  await page.getByRole('button', { name: 'Einstellungen speichern' }).click()
  await page.getByRole('button', { name: 'Zurück zum Start' }).click()
  await page.getByRole('button', { name: 'Belohnung wählen' }).click()
  await chooseReward(page, '15 Min. Comic lesen')
  await chooseMission(page, 'Formenwerkstatt')

  let sawConceptualModel = false
  for (let index = 0; index < 13; index += 1) {
    if (await page.locator('.array-visual, .sharing-visual').count()) sawConceptualModel = true
    await solveCurrentChallenge(page)
    if (sawConceptualModel) break
    await page.getByRole('button', { name: 'Weiter' }).click()
  }
  expect(sawConceptualModel).toBe(true)
})

test('loads the app shell offline after the first visit', async ({ page, context }) => {
  await page.goto('/')
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await context.setOffline(true)
  try {
    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Mathe-Mission' })).toBeVisible()
    await page.getByRole('button', { name: 'Belohnung wählen' }).click()
    await chooseReward(page)
    await chooseMission(page)
    await expect(page.getByText('Aufgabe 1')).toBeVisible()
  } finally {
    await context.setOffline(false)
  }
})
