import { z } from 'zod'
import { todayKey } from '@/features/tasks/utils/dates'

// The timeline-dependent rules both task forms share: a time for everything except "no deadline",
// at least one (future) date for specific dates, and a complete rule for a custom repeat.
export const createTimelineValidator =
  ({ checkPastDates = true } = {}) =>
  (data, ctx) => {
    const issue = (path, message) => ctx.addIssue({ code: z.ZodIssueCode.custom, path, message })

    if (data.timeline !== 'none' && !data.time) issue(['time'], 'Please select a time')

    if (data.timeline === 'custom') {
      const dates = (data.customDates ?? []).filter((entry) => entry.date)
      if (dates.length === 0) issue(['customDates'], 'Please add a date')
      else if (checkPastDates && dates.some((entry) => entry.date < todayKey())) {
        issue(['customDates'], 'Dates cannot be in the past')
      }
    }

    if (data.timeline === 'repeat') {
      const rule = data.recurrence
      if (!(Number(rule?.every) >= 1)) issue(['recurrence'], 'Repeat every must be at least 1')
      else if (rule.unit === 'week' && !rule.weekdays?.length)
        issue(['recurrence'], 'Pick at least one day')
      else if (rule.unit === 'month' && !rule.monthDays?.length)
        issue(['recurrence'], 'Pick at least one date')
      else if (rule.until && rule.start && rule.until < rule.start) {
        issue(['recurrence'], 'The end date must be after the start date')
      }
    }
  }

export const timelineFields = {
  timeline: z.string().min(1, 'Please select a timeline'),
  time: z.string().optional(),
  customDates: z.array(z.object({ date: z.string() })).optional(),
  recurrence: z.any().optional(),
}
