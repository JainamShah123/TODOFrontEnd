import { formatDateKey, ordinal, todayKey } from '@/features/tasks/utils/dates'

export const WEEKDAYS = [
  { value: 1, short: 'M', label: 'Mon' },
  { value: 2, short: 'T', label: 'Tue' },
  { value: 3, short: 'W', label: 'Wed' },
  { value: 4, short: 'T', label: 'Thu' },
  { value: 5, short: 'F', label: 'Fri' },
  { value: 6, short: 'S', label: 'Sat' },
  { value: 7, short: 'S', label: 'Sun' },
]

// 1 = Monday ... 7 = Sunday, the same numbering as the API.
const isoWeekday = (date) => date.getDay() || 7

export const defaultRepeatRule = () => ({
  every: 1,
  unit: 'week',
  weekdays: [isoWeekday(new Date())],
  monthDays: [new Date().getDate()],
  start: todayKey(),
  until: null,
})

// The older fixed timelines, as the repeat rule that does the same thing. Editing such a task shows it
// as a repeat (and saves it as one). `dueDate` gives "Monthly" its day of the month.
const LEGACY_RULES = {
  daily: { unit: 'week', weekdays: [1, 2, 3, 4, 5] },
  saturday: { unit: 'week', weekdays: [6] },
  '1st': { unit: 'month', monthDays: [1] },
  '16th': { unit: 'month', monthDays: [16] },
}
export const legacyTimelineToRule = (timeline, dueDate) => {
  const rule =
    timeline === 'monthly'
      ? {
          unit: 'month',
          monthDays: [dueDate ? Number(dueDate.slice(8, 10)) : new Date().getDate()],
        }
      : LEGACY_RULES[timeline]
  return rule ? { ...defaultRepeatRule(), ...rule, every: 1 } : null
}

// Only what the chosen unit uses goes to the API.
export const toApiRepeatRule = (rule) => ({
  every: Number(rule.every) || 1,
  unit: rule.unit,
  ...(rule.unit === 'week' ? { weekdays: rule.weekdays } : {}),
  ...(rule.unit === 'month' ? { monthDays: rule.monthDays } : {}),
  start: rule.start || undefined,
  until: rule.until || null,
})

// A rule from the API back into the form's shape (filling in whatever its unit doesn't use).
export const fromApiRepeatRule = (rule) => ({
  ...defaultRepeatRule(),
  ...rule,
  until: rule?.until ?? null,
})

const joinWords = (words) =>
  words.length <= 1 ? words.join('') : `${words.slice(0, -1).join(', ')} and ${words.at(-1)}`

const isOddDays = (days) => days.length === 16 && days.every((day) => day % 2 === 1)
const isEvenDays = (days) => days.length === 15 && days.every((day) => day % 2 === 0)

// "Every 2 weeks on Mon, Wed and Fri, until Dec 31"
export const describeRepeatRule = (rule) => {
  if (!rule) return ''
  const every = Number(rule.every) || 1
  const unitWord = every === 1 ? rule.unit : `${every} ${rule.unit}s`
  let text = every === 1 && rule.unit === 'day' ? 'Every day' : `Every ${unitWord}`

  if (rule.unit === 'week' && rule.weekdays?.length) {
    const sorted = [...rule.weekdays].sort((a, b) => a - b)
    if (every === 1 && sorted.join() === '1,2,3,4,5') text = 'Every weekday'
    else text += ` on ${joinWords(sorted.map((day) => WEEKDAYS[day - 1].label))}`
  }
  if (rule.unit === 'month' && rule.monthDays?.length) {
    const sorted = [...rule.monthDays].sort((a, b) => a - b)
    text += isOddDays(sorted)
      ? ' on odd dates'
      : isEvenDays(sorted)
        ? ' on even dates'
        : ` on the ${joinWords(sorted.map(ordinal))}`
  }
  if (rule.start && rule.start > todayKey())
    text += `, starting ${formatDateKey(rule.start, { month: 'short', day: 'numeric' })}`
  if (rule.until)
    text += `, until ${formatDateKey(rule.until, { month: 'short', day: 'numeric', year: 'numeric' })}`
  return text
}
