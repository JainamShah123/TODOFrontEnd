import { z } from 'zod'

// `when` is how fixed the meeting is: not at all, a day, or a day and a time. Fields that don't apply
// to the chosen mode are ignored (and sent as null).
export const meetingSchema = z
  .object({
    title: z.string().trim().min(1, 'Give the meeting a title').max(200),
    when: z.enum(['anytime', 'date', 'datetime']),
    date: z.string().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    attendees: z.string().max(300).optional(),
    location: z.string().max(300).optional(),
    notes: z.string().max(5000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.when !== 'anytime' && !data.date) {
      ctx.addIssue({ code: 'custom', path: ['date'], message: 'Pick a date' })
    }
    if (data.when === 'datetime') {
      if (!data.startTime) {
        ctx.addIssue({ code: 'custom', path: ['startTime'], message: 'Pick a start time' })
      } else if (data.endTime && data.endTime <= data.startTime) {
        ctx.addIssue({ code: 'custom', path: ['endTime'], message: 'Must end after it starts' })
      }
    }
  })

export const toMeetingPayload = (values) => ({
  title: values.title.trim(),
  date: values.when === 'anytime' ? null : values.date || null,
  startTime: values.when === 'datetime' ? values.startTime || null : null,
  endTime: values.when === 'datetime' ? values.endTime || null : null,
  attendees: values.attendees?.trim() ?? '',
  location: values.location?.trim() ?? '',
  notes: values.notes ?? '',
})
