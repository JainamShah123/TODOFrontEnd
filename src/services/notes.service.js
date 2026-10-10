import { apiClient } from '@/services/apiClient'

export const notesService = {
  list: () => apiClient.get('/notes').then((res) => res.data),
  create: (payload) => apiClient.post('/notes', payload).then((res) => res.data),
  update: (noteId, payload) => apiClient.put(`/notes/${noteId}`, payload).then((res) => res.data),
  togglePin: (noteId) => apiClient.patch(`/notes/${noteId}/pin`).then((res) => res.data),
  toggleArchive: (noteId) => apiClient.patch(`/notes/${noteId}/archive`).then((res) => res.data),
  remove: (noteId) => apiClient.delete(`/notes/${noteId}`).then((res) => res.data),
}
