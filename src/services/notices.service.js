import { apiClient } from '@/services/apiClient'

export const noticesService = {
  create: (payload) => apiClient.post('/notices', payload).then((res) => res.data),
  // status/search aren't sent yet — the list page only needs page/limit for now.
  list: ({ page = 1, limit = 10 } = {}) =>
    apiClient.get('/notices', { params: { page, limit } }).then((res) => res.data),
  // PUT takes the full desired state (title, message and the complete recipient list).
  update: (noticeId, payload) => apiClient.put(`/notices/${noticeId}`, payload).then((res) => res.data),
  updateStatus: (noticeId, status) =>
    apiClient.patch(`/notices/${noticeId}/status`, { status }).then((res) => res.data),
  remove: (noticeId) => apiClient.delete(`/notices/${noticeId}`).then((res) => res.data),
}
