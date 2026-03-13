const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
const dtf = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' })

const THRESHOLDS: [number, Intl.RelativeTimeFormatUnit][] = [
  [60, 'seconds'],
  [3600, 'minutes'],
  [86400, 'hours'],
  [7 * 86400, 'days'],
]

export function formatTimestamp(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (isNaN(date.getTime())) return value

  const diffSec = (date.getTime() - Date.now()) / 1000

  for (const [limit, unit] of THRESHOLDS) {
    if (Math.abs(diffSec) < limit) {
      const divisor = unit === 'seconds' ? 1 : unit === 'minutes' ? 60 : unit === 'hours' ? 3600 : 86400
      return rtf.format(Math.round(diffSec / divisor), unit)
    }
  }

  return dtf.format(date)
}
