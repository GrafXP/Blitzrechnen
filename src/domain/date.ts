const ZURICH_TIME_ZONE = 'Europe/Zurich'

export function zurichDateKey(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: ZURICH_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? ''

  return `${part('year')}-${part('month')}-${part('day')}`
}

export function friendlyZurichDate(date = new Date()): string {
  return new Intl.DateTimeFormat('de-CH', {
    timeZone: ZURICH_TIME_ZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date)
}
