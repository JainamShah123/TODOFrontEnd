import { apiClient } from '@/services/apiClient'

const buildTaskFormData = ({ customDates, attachment, ...fields }) => {
  const formData = new FormData()

  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') formData.append(key, value)
  })
  if (customDates?.length) formData.append('customDates', JSON.stringify(customDates))
  if (attachment) formData.append('attachment', attachment)

  return formData
}

// The API caps a page at 100 tasks. Safety stop only: 50 pages is 5,000 tasks.
const LIST_ALL_PAGE_SIZE = 100
const LIST_ALL_MAX_PAGES = 50

// `filters` is any GET /tasks filter. Missing (undefined/null) values are left out of the request; an
// empty string is sent, since for some filters it means something (brokers "" = no broker).
const listPage = ({ page = 1, limit = 50, ...filters } = {}) => {
  const params = { page, limit }
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) params[key] = value
  })
  return apiClient.get('/tasks', { params }).then((res) => res.data)
}

export const tasksService = {
  create: (payload) => apiClient.post('/tasks', buildTaskFormData(payload)).then((res) => res.data),
  list: listPage,
  // Values (with counts) for the task board's column filters, under the same filters as the list.
  facets: (filters = {}) => {
    const params = {}
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) params[key] = value
    })
    return apiClient.get('/tasks/facets', { params }).then((res) => res.data)
  },
  get: (taskId) => apiClient.get(`/tasks/${taskId}`).then((res) => res.data),
  // The task board and both dashboards work out their counts, filters and per-staff summaries in the
  // browser from the full list, so a single page of 50 silently dropped everything past the 50th task
  // (sorted by due date) - including a task that had just been created. This reads every page.
  listAll: async (filters = {}) => {
    const first = await listPage({ ...filters, page: 1, limit: LIST_ALL_PAGE_SIZE })
    const lastPage = Math.min(first.pagination?.totalPages ?? 1, LIST_ALL_MAX_PAGES)

    const rest = await Promise.all(
      Array.from({ length: Math.max(lastPage - 1, 0) }, (_, index) =>
        listPage({ ...filters, page: index + 2, limit: LIST_ALL_PAGE_SIZE }),
      ),
    )

    // A task created or removed while the pages are being read can shift rows between pages, so the
    // same task could show up twice; keep one copy of each.
    const byId = new Map()
    ;[first, ...rest].forEach((result) => result.data.forEach((task) => byId.set(task.id, task)))

    const data = [...byId.values()]
    return { ...first, data, pagination: { ...first.pagination, page: 1, limit: data.length } }
  },
  updateStatus: (taskId, status) =>
    apiClient.patch(`/tasks/${taskId}/status`, { status }).then((res) => res.data),
  // PUT replaces the task's editable fields wholesale — a field left out of the
  // payload is cleared server-side, EXCEPT attachment: omitting it preserves the
  // existing file (the API has no way to remove an attachment once set, only
  // replace it), so buildTaskFormData only appends it when a new file is chosen.
  update: (taskId, payload) => apiClient.put(`/tasks/${taskId}`, buildTaskFormData(payload)).then((res) => res.data),
  remove: (taskId) => apiClient.delete(`/tasks/${taskId}`).then((res) => res.data),
}
