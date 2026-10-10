import { z } from 'zod'

const newPasswordFields = {
  newPassword: z.string().min(6, 'Use at least 6 characters').max(100, 'Use at most 100 characters'),
  confirmPassword: z.string(),
}

const passwordsMatch = (values) => values.newPassword === values.confirmPassword
const mismatch = { message: 'Passwords do not match', path: ['confirmPassword'] }

export const resetPasswordSchema = z.object(newPasswordFields).refine(passwordsMatch, mismatch)

export const changePasswordSchema = z
  .object({ currentPassword: z.string().min(1, 'Current password is required'), ...newPasswordFields })
  .refine(passwordsMatch, mismatch)
