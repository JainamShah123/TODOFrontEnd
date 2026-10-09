// Date windows offered on the task boards. The API works out "this week" / "last week" itself (server
// time zone, Monday to Sunday); the browser only sends the choice, plus the two dates for a custom range.

export const BOARD_RANGE = {
  THIS_WEEK: 'this_week',
  LAST_WEEK: 'last_week',
  CUSTOM: 'custom',
}

// Matches the API limit: both ends included, so 30 days is e.g. 1 Sep to 30 Sep.
export const MAX_CUSTOM_RANGE_DAYS = 30

export const INITIAL_RANGE_FILTER = { range: BOARD_RANGE.THIS_WEEK, from: '', to: '' }

const MS_PER_DAY = 24 * 60 * 60 * 1000

// "YYYY-MM-DD" -> UTC milliseconds, so the maths below can't be thrown off by the browser's time zone or DST.
const toUtcMs = (dateKey) => {
  const [year, month, day] = dateKey.split('-').map(Number)
  return Date.UTC(year, month - 1, day)
}

export const addDays = (dateKey, days) => new Date(toUtcMs(dateKey) + days * MS_PER_DAY).toISOString().slice(0, 10)

// Why a custom from/to pair can't be used yet, or null when it can. Empty fields aren't an "error": the
// board just waits for the missing date.
export const customRangeError = (from, to) => {
  if (!from || !to) return null
  if (to < from) return 'The end date must be on or after the start date.'
  const days = (toUtcMs(to) - toUtcMs(from)) / MS_PER_DAY + 1
  if (days > MAX_CUSTOM_RANGE_DAYS) return `Choose a range of ${MAX_CUSTOM_RANGE_DAYS} days or fewer.`
  return null
}

// What to send to GET /tasks for the current selection, or null while a custom range is incomplete/invalid.
export const toApiFilters = ({ range, from, to }) => {
  if (range !== BOARD_RANGE.CUSTOM) return { range }
  if (!from || !to || customRangeError(from, to)) return null
  return { range, from, to }
}
