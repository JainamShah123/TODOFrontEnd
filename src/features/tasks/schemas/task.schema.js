import { z } from 'zod'
import { validateCustomDates } from '@/features/tasks/schemas/customDatesRefinement'

export const createTaskSchema = z
  .object({
    title: z.string().min(1, 'Task title is required'),
    description: z.string().optional(),
    attachment: z.any().optional(),
    broker: z.string().optional(),
    assignedTo: z.string().min(1, 'Please select a staff member'),
    timeline: z.string().min(1, 'Please select a timeline'),
    time: z.string().min(1, 'Please select a time'),
    customDates: z.array(z.object({ date: z.string() })).optional(),
    priority: z.enum(['low', 'medium', 'high']),
  })
  .superRefine(validateCustomDates)
