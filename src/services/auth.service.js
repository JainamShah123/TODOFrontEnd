import { apiClient } from '@/services/apiClient'
import { Role } from '@/constants/roles'

const STAFF_ID_PATTERN = /^EMP-/i

const loginAdmin = async ({ identifier, password }) => {
  const response = await apiClient.post('/auth/login', { email: identifier, password })
  const { admin, token } = response.data.data

  return {
    data: {
      user: { id: admin.id, name: admin.name, email: admin.email, role: Role.ADMIN },
      token,
    },
  }
}

const loginStaff = async ({ identifier, password }) => {
  const response = await apiClient.post('/auth/staff-login', { staffId: identifier.toUpperCase(), password })
  const { staff, token } = response.data.data

  return {
    data: {
      user: {
        // GET /tasks and GET /staff both key a staff member by their Mongo _id
        // (returned as `id`), not by the human-readable staffId (EMP-xxx) — so
        // `id` here must match that, or task.assignee.id === user.id never
        // matches and the staff member's own tasks never show up.
        id: staff.id ?? staff._id,
        staffId: staff.staffId,
        name: [staff.firstName, staff.lastName].filter(Boolean).join(' '),
        email: staff.email,
        role: Role.STAFF,
      },
      token,
    },
  }
}

export const authService = {
  login: ({ identifier, password }) => {
    const trimmedIdentifier = identifier.trim()
    return STAFF_ID_PATTERN.test(trimmedIdentifier)
      ? loginStaff({ identifier: trimmedIdentifier, password })
      : loginAdmin({ identifier: trimmedIdentifier, password })
  },
  logout: () => apiClient.post('/auth/logout').then((res) => res.data),
}
