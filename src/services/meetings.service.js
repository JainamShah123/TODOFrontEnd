import { apiClient } from '@/services/apiClient'

export const meetingsService = {
  list: (status = 'open') =>
    apiClient.get('/meetings', { params: { status } }).then((res) => res.data),
  create: (payload) => apiClient.post('/meetings', payload).then((res) => res.data),
  update: (meetingId, payload) =>
    apiClient.put(`/meetings/${meetingId}`, payload).then((res) => res.data),
  setDone: (meetingId, done) =>
    apiClient.patch(`/meetings/${meetingId}/done`, { done }).then((res) => res.data),
  remove: (meetingId) => apiClient.delete(`/meetings/${meetingId}`).then((res) => res.data),
}
