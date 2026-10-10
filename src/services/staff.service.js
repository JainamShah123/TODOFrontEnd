import { apiClient } from '@/services/apiClient'

export const staffService = {
  create: (payload) => apiClient.post('/staff', payload).then((res) => res.data),
  list: ({ page, limit }) => apiClient.get('/staff', { params: { page, limit } }).then((res) => res.data),
  remove: (staffId) => apiClient.delete(`/staff/${staffId}`).then((res) => res.data),
  updateStatus: (staffId, status) =>
    apiClient.patch(`/staff/${staffId}/status`, { status }).then((res) => res.data),
  resetPassword: (staffId, password) =>
    apiClient.patch(`/staff/${staffId}/password`, { password }).then((res) => res.data),
  update: (staffId, payload) => apiClient.put(`/staff/${staffId}`, payload).then((res) => res.data),
}
