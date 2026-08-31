import { expect, test, type Page } from '@playwright/test'

async function answerFor(page: Page, prompt: string): Promise<string> {
  if (prompt === 'Wie viele Punkte siehst du?') {
    return String(await page.locator('.prompt-visual .hundred-field__dot--filled').count())
  }

  if (prompt === 'Welche Zahl zeigen die Zehner und Einer?') {
    const tens = await page.locator('.prompt-visual .ten-rod').count()
    const ones = await page.locator('.prompt-visual .place-value__ones span').count()
    return String(tens * 10 + ones)
  }

  let match = prompt.match(/^Welche Zahl fehlt\? Immer (\d+) (weiter|zurück)\.$/)
  if (match) {
    const visibleValues = await page.locator('.sequence-visual span').allTextContents()
    const previous = Number(visibleValues[1])
    return String(match[2] === 'weiter' ? previous + Number(match[1]) : previous - Number(match[1]))
  }

  match = prompt.match(/^(\d+) \+ (\d+) = \?$/)
  if (match) return String(Number(match[1]) + Number(match[2]))

  match = prompt.match(/^(\d+) − (\d+) = \?$/)
  if (match) return String(Number(match[1]) - Number(match[2]))

  match = prompt.match(/^(\d+) \+ \? = (\d+)$/)
  if (match) return String(Number(match[2]) - Number(match[1]))

  match = prompt.match(/^Doppelt (\d+) = \?$/)
  if (match) return String(Number(match[1]) * 2)

  match = prompt.match(/^Die Hälfte von (\d+) = \?$/)
  if (match) return String(Number(match[1]) / 2)

  match = prompt.match(/^(\d+) = (\d+) \+ \?$/)
  if (match) return String(Number(match[1]) - Number(match[2]))

  throw new Error(`Unknown prompt: ${prompt}`)
}

async function solveCurrentChallenge(page: Page) {
  const prompt = (await page.locator('.challenge-card > h1').textContent())?.trim() ?? ''
  const choices = page.locator('.choice-card')
  if (await choices.count()) {
    const values = (await choices.allTextContents()).map(Number)
    const answer = prompt.includes('grössten') ? Math.max(...values) : Math.min(...values)
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

test('redeems a reward and immediately starts a fresh same-day round', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Mathe-Mission' })).toBeVisible()
  await page.getByRole('button', { name: 'Mission starten' }).click()

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
  await page.getByRole('button', { name: /Mit Elternteil einlösen/ }).click()

  await page.getByLabel('Neue PIN', { exact: true }).fill('2468')
  await page.getByLabel('PIN wiederholen').fill('2468')
  await page.getByRole('button', { name: 'PIN speichern' }).click()

  await expect(page.getByRole('heading', { name: 'Mathe-Mission' })).toBeVisible()
  await expect(page.getByRole('progressbar', { name: '0 von 100 Punkten' })).toBeVisible()
  await expect(page.getByText('1× eingelöst')).toBeVisible()
  await expect(page.getByText(/Heute schon 1 Belohnung eingelöst/)).toBeVisible()

  await page.reload()
  await expect(page.getByRole('progressbar', { name: '0 von 100 Punkten' })).toBeVisible()
  await page.getByRole('button', { name: 'Mission starten' }).click()
  await expect(page.getByText('Aufgabe 1', { exact: false })).toBeVisible()
  await solveCurrentChallenge(page)
  await expect(page.getByText('10 / 100')).toBeVisible()

  await page.getByRole('button', { name: 'Mission verlassen' }).click()
  await page.getByRole('button', { name: 'Elternbereich' }).click()
  await page.getByLabel('PIN', { exact: true }).fill('2468')
  await page.getByRole('button', { name: 'Öffnen' }).click()
  await expect(page.getByRole('heading', { name: 'Elternübersicht' })).toBeVisible()
  await expect(page.getByText('1× eingelöst')).toBeVisible()
  await expect(page.getByText('Punkte dieser Runde')).toBeVisible()
  const masteryValues = await page.locator('.mastery-track').evaluateAll((elements) =>
    elements.map((element) => Number(element.getAttribute('aria-valuenow'))),
  )
  expect(masteryValues).toHaveLength(10)
  expect(masteryValues.reduce((sum, value) => sum + value, 0)).toBeGreaterThan(0)
})

test('loads the app shell offline after the first visit', async ({ page, context }) => {
  await page.goto('/')
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await context.setOffline(true)
  try {
    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Mathe-Mission' })).toBeVisible()
    await page.getByRole('button', { name: 'Mission starten' }).click()
    await expect(page.getByText('Aufgabe 1')).toBeVisible()
  } finally {
    await context.setOffline(false)
  }
})
