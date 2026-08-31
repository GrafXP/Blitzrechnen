import { expect, test, type Page } from '@playwright/test'

function answerFor(prompt: string): string {
  let match = prompt.match(/^(\d+) \+ (\d+) = \?$/)
  if (match) return String(Number(match[1]) + Number(match[2]))

  match = prompt.match(/^(\d+) − (\d+) = \?$/)
  if (match) return String(Number(match[1]) - Number(match[2]))

  match = prompt.match(/^(\d+) \+ \? = (\d+)$/)
  if (match) return String(Number(match[2]) - Number(match[1]))

  match = prompt.match(/^Doppelt (\d+) = \?$/)
  if (match) return String(Number(match[1]) * 2)

  throw new Error(`Unknown prompt: ${prompt}`)
}

async function solveCurrentChallenge(page: Page) {
  const prompt = (await page.locator('.challenge-card > h1').textContent())?.trim() ?? ''
  const answer = answerFor(prompt)
  for (const digit of answer) {
    await page.getByRole('button', { name: digit, exact: true }).click()
  }
  await page.getByRole('button', { name: 'Antwort prüfen' }).click()
  await expect(page.getByText('Du bekommst 10 Punkte.')).toBeVisible()
}

test('finishes, persists, and redeems the daily goal', async ({ page }) => {
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

  await expect(page.getByText('Eingelöste Belohnung')).toBeVisible()
  await expect(page.getByText('Jetzt ist Bildschirm-Pause.')).toBeVisible()

  await page.reload()
  await expect(page.getByText('Eingelöste Belohnung')).toBeVisible()
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
