import { z } from 'zod'
import {
  createTimelineValidator,
  timelineFields,
} from '@/features/tasks/schemas/timelineRefinement'

export const createTaskSchema = z
  .object({
    title: z.string().min(1, 'Task title is required'),
    description: z.string().optional(),
    attachment: z.any().optional(),
    broker: z.string().optional(),
    assignedTo: z.string().min(1, 'Please select a staff member'),
    ...timelineFields,
    priority: z.enum(['low', 'medium', 'high']),
  })
  .superRefine(createTimelineValidator())
