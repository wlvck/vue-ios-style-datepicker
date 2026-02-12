import type { SelectorOption } from '../core/types'

/**
 * Get the number of days in a month
 * @param year - Full year (e.g., 2024)
 * @param month - Month index (0-11)
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

/**
 * Generate year options for picker
 * @param startYear - Start year (inclusive)
 * @param endYear - End year (inclusive)
 */
export function getYears(startYear: number, endYear: number): SelectorOption[] {
  const years: SelectorOption[] = []
  for (let year = startYear; year <= endYear; year++) {
    years.push({ value: year, label: String(year) })
  }
  return years
}

/** @deprecated Use getYears instead */
export const generateYears = getYears

/**
 * Generate locale-aware month names
 * @param locale - BCP 47 locale string (default: 'en')
 * @param format - Month format: 'long', 'short', 'narrow', 'numeric', '2-digit'
 */
export function getMonths(
  locale = 'en',
  format: 'long' | 'short' | 'narrow' | 'numeric' | '2-digit' = 'long'
): SelectorOption[] {
  const months: SelectorOption[] = []

  if (format === 'numeric' || format === '2-digit') {
    for (let month = 0; month < 12; month++) {
      const label = format === '2-digit' ? String(month + 1).padStart(2, '0') : String(month + 1)
      months.push({ value: month, label })
    }
  } else {
    const formatter = new Intl.DateTimeFormat(locale, { month: format })
    for (let month = 0; month < 12; month++) {
      const date = new Date(2000, month, 1)
      months.push({
        value: month,
        label: formatter.format(date),
      })
    }
  }

  return months
}

/** @deprecated Use getMonths instead */
export const generateMonths = (locale = 'en') => getMonths(locale, 'long')

/** @deprecated Use getMonths(locale, 'short') instead */
export const generateShortMonths = (locale = 'en') => getMonths(locale, 'short')

/**
 * Generate day options for a specific month
 * @param year - Full year
 * @param month - Month index (0-11)
 */
export function getDays(year: number, month: number): SelectorOption[] {
  const daysInMonth = getDaysInMonth(year, month)
  const days: SelectorOption[] = []

  for (let day = 1; day <= daysInMonth; day++) {
    days.push({
      value: day,
      label: String(day),
    })
  }
  return days
}

/** @deprecated Use getDays instead */
export const generateDays = getDays

/**
 * Generate hour options
 * @param is24Hour - Use 24-hour format (default: true)
 */
export function getHours(is24Hour = true): SelectorOption[] {
  const hours: SelectorOption[] = []

  if (is24Hour) {
    for (let hour = 0; hour < 24; hour++) {
      hours.push({
        value: hour,
        label: String(hour).padStart(2, '0'),
      })
    }
  } else {
    for (let hour = 1; hour <= 12; hour++) {
      hours.push({
        value: hour,
        label: String(hour),
      })
    }
  }
  return hours
}

/** @deprecated Use getHours instead */
export const generateHours = getHours

/**
 * Generate minute options with optional step
 * @param step - Minute interval (default: 1)
 */
export function getMinutes(step = 1): SelectorOption[] {
  const minutes: SelectorOption[] = []

  for (let minute = 0; minute < 60; minute += step) {
    minutes.push({
      value: minute,
      label: String(minute).padStart(2, '0'),
    })
  }
  return minutes
}

/** @deprecated Use getMinutes instead */
export const generateMinutes = getMinutes

/**
 * Generate AM/PM options
 */
export function getAmPm(): SelectorOption[] {
  return [
    { value: 0, label: 'AM' },
    { value: 1, label: 'PM' },
  ]
}

/** @deprecated Use getAmPm instead */
export const generateAmPm = getAmPm

/**
 * Clamp a date between min and max bounds
 */
export function clampDate(date: Date, minDate?: Date, maxDate?: Date): Date {
  let result = new Date(date)

  if (minDate && result < minDate) {
    result = new Date(minDate)
  }
  if (maxDate && result > maxDate) {
    result = new Date(maxDate)
  }

  return result
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

/**
 * Check if a date is valid
 */
export function isValidDate(date: unknown): date is Date {
  return date instanceof Date && !isNaN(date.getTime())
}

/**
 * Format a date to a string
 *
 * Supported tokens:
 * - YYYY: 4-digit year
 * - YY: 2-digit year
 * - MM: 2-digit month (01-12)
 * - M: Month (1-12)
 * - DD: 2-digit day (01-31)
 * - D: Day (1-31)
 * - HH: 2-digit hour 24h (00-23)
 * - H: Hour 24h (0-23)
 * - hh: 2-digit hour 12h (01-12)
 * - h: Hour 12h (1-12)
 * - mm: 2-digit minutes (00-59)
 * - m: Minutes (0-59)
 * - ss: 2-digit seconds (00-59)
 * - s: Seconds (0-59)
 * - A: AM/PM
 * - a: am/pm
 *
 * @param date - Date to format
 * @param format - Format string (default: 'YYYY-MM-DD')
 */
export function formatDate(date: Date, format = 'YYYY-MM-DD'): string {
  if (!isValidDate(date)) {
    return ''
  }

  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours24 = date.getHours()
  const hours12 = hours24 % 12 || 12
  const minutes = date.getMinutes()
  const seconds = date.getSeconds()
  const ampm = hours24 < 12 ? 'AM' : 'PM'

  const tokens: Record<string, string> = {
    YYYY: String(year),
    YY: String(year).slice(-2),
    MM: String(month).padStart(2, '0'),
    M: String(month),
    DD: String(day).padStart(2, '0'),
    D: String(day),
    HH: String(hours24).padStart(2, '0'),
    H: String(hours24),
    hh: String(hours12).padStart(2, '0'),
    h: String(hours12),
    mm: String(minutes).padStart(2, '0'),
    m: String(minutes),
    ss: String(seconds).padStart(2, '0'),
    s: String(seconds),
    A: ampm,
    a: ampm.toLowerCase(),
  }

  // Replace tokens in order of length (longest first to avoid partial matches)
  const sortedTokens = Object.keys(tokens).sort((a, b) => b.length - a.length)
  let result = format

  for (const token of sortedTokens) {
    result = result.replace(new RegExp(token, 'g'), tokens[token])
  }

  return result
}

/**
 * Parse a date string using a format pattern
 *
 * Supported tokens: YYYY, YY, MM, M, DD, D, HH, H, hh, h, mm, m, ss, s, A, a
 *
 * @param dateString - String to parse
 * @param format - Format pattern (default: 'YYYY-MM-DD')
 * @returns Parsed Date or null if invalid
 */
export function parseDate(dateString: string, format = 'YYYY-MM-DD'): Date | null {
  if (!dateString || !format) {
    return null
  }

  // Build regex pattern from format
  const tokenPatterns: Record<string, { regex: string; handler: string }> = {
    YYYY: { regex: '(\\d{4})', handler: 'year' },
    YY: { regex: '(\\d{2})', handler: 'shortYear' },
    MM: { regex: '(\\d{2})', handler: 'month' },
    M: { regex: '(\\d{1,2})', handler: 'month' },
    DD: { regex: '(\\d{2})', handler: 'day' },
    D: { regex: '(\\d{1,2})', handler: 'day' },
    HH: { regex: '(\\d{2})', handler: 'hours' },
    H: { regex: '(\\d{1,2})', handler: 'hours' },
    hh: { regex: '(\\d{2})', handler: 'hours12' },
    h: { regex: '(\\d{1,2})', handler: 'hours12' },
    mm: { regex: '(\\d{2})', handler: 'minutes' },
    m: { regex: '(\\d{1,2})', handler: 'minutes' },
    ss: { regex: '(\\d{2})', handler: 'seconds' },
    s: { regex: '(\\d{1,2})', handler: 'seconds' },
    A: { regex: '(AM|PM)', handler: 'ampm' },
    a: { regex: '(am|pm)', handler: 'ampm' },
  }

  // Sort tokens by length (longest first)
  const sortedTokens = Object.keys(tokenPatterns).sort((a, b) => b.length - a.length)

  // Escape special regex characters in format, then replace tokens
  let regexPattern = format.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  // Build handlers based on actual token order in format
  const actualHandlers: Array<{ pos: number; handler: string }> = []
  let tempFormat = format

  for (const token of sortedTokens) {
    const idx = tempFormat.indexOf(token)
    if (idx !== -1) {
      actualHandlers.push({ pos: idx, handler: tokenPatterns[token].handler })
      tempFormat =
        tempFormat.substring(0, idx) +
        '_'.repeat(token.length) +
        tempFormat.substring(idx + token.length)
    }
    regexPattern = regexPattern.replace(new RegExp(token, 'g'), tokenPatterns[token].regex)
  }

  actualHandlers.sort((a, b) => a.pos - b.pos)

  try {
    const regex = new RegExp(`^${regexPattern}$`, 'i')
    const matches = dateString.match(regex)

    if (!matches) {
      return null
    }

    // Extract values
    const values: Record<string, number | string> = {
      year: new Date().getFullYear(),
      month: 1,
      day: 1,
      hours: 0,
      minutes: 0,
      seconds: 0,
      ampm: '',
    }

    for (let i = 1; i < matches.length; i++) {
      const handler = actualHandlers[i - 1]?.handler
      const value = matches[i]

      if (handler === 'year') {
        values.year = parseInt(value, 10)
      } else if (handler === 'shortYear') {
        const shortYear = parseInt(value, 10)
        values.year = shortYear >= 70 ? 1900 + shortYear : 2000 + shortYear
      } else if (handler === 'month') {
        values.month = parseInt(value, 10)
      } else if (handler === 'day') {
        values.day = parseInt(value, 10)
      } else if (handler === 'hours' || handler === 'hours12') {
        values.hours = parseInt(value, 10)
      } else if (handler === 'minutes') {
        values.minutes = parseInt(value, 10)
      } else if (handler === 'seconds') {
        values.seconds = parseInt(value, 10)
      } else if (handler === 'ampm') {
        values.ampm = value.toUpperCase()
      }
    }

    // Handle 12-hour format conversion
    if (values.ampm === 'PM' && (values.hours as number) < 12) {
      values.hours = (values.hours as number) + 12
    } else if (values.ampm === 'AM' && (values.hours as number) === 12) {
      values.hours = 0
    }

    const result = new Date(
      values.year as number,
      (values.month as number) - 1,
      values.day as number,
      values.hours as number,
      values.minutes as number,
      values.seconds as number
    )

    return isValidDate(result) ? result : null
  } catch {
    return null
  }
}

/**
 * Get today's date at midnight
 */
export function getToday(): Date {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Add months to a date
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

/**
 * Add years to a date
 */
export function addYears(date: Date, years: number): Date {
  const result = new Date(date)
  result.setFullYear(result.getFullYear() + years)
  return result
}
