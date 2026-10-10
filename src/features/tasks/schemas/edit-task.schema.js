import { z } from 'zod'
import {
  createTimelineValidator,
  timelineFields,
} from '@/features/tasks/schemas/timelineRefinement'

export const editTaskSchema = z
  .object({
    title: z.string().min(1, 'Task title is required'),
    description: z.string().optional(),
    attachment: z.any().optional(),
    broker: z.string().optional(),
    ...timelineFields,
    priority: z.enum(['low', 'medium', 'high']),
  })
  .superRefine(createTimelineValidator({ checkPastDates: false }))
