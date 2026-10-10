import { toApiRepeatRule } from '@/features/tasks/utils/repeatRule'

// The timeline part of a create/edit request: only what the chosen timeline uses.
export const timelinePayload = ({ timeline, time, customDates, recurrence }) => ({
  timeline,
  time: timeline === 'none' ? undefined : time,
  customDates: timeline === 'custom' ? customDates.filter((entry) => entry.date) : undefined,
  recurrence: timeline === 'repeat' ? toApiRepeatRule(recurrence) : undefined,
})
