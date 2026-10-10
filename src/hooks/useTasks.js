import { useEffect, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tasksService } from '@/services/tasks.service'
import { useTaskStore } from '@/features/tasks/store/taskStore'
import { mapApiTask } from '@/features/tasks/utils/task.utils'

// Every task list/detail query lives under ['tasks', ...]. Any change made here makes them all stale, so
// whichever list or detail is on screen (or opened next) is read again instead of showing old data.
const useInvalidateTaskLists = () => {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ['tasks', 'list'] })
    queryClient.invalidateQueries({ queryKey: ['tasks', 'facets'] })
  }
}

export const useCreateTask = () => {
  const invalidateLists = useInvalidateTaskLists()
  return useMutation({
    mutationFn: tasksService.create,
    onSuccess: invalidateLists,
  })
}

export const useUpdateTaskStatus = () => {
  const queryClient = useQueryClient()
  const invalidateLists = useInvalidateTaskLists()
  return useMutation({
    mutationFn: ({ taskId, status }) => tasksService.updateStatus(taskId, status),
    onSuccess: (_data, { taskId }) => {
      invalidateLists()
      queryClient.invalidateQueries({ queryKey: ['tasks', 'detail', taskId] })
    },
  })
}

export const useUpdateChecklistItem = () => {
  const queryClient = useQueryClient()
  const invalidateLists = useInvalidateTaskLists()
  return useMutation({
    mutationFn: ({ taskId, index, checked }) =>
      tasksService.updateChecklistItem(taskId, index, checked),
    onSuccess: (_, { taskId }) => {
      invalidateLists()
      queryClient.invalidateQueries({ queryKey: ['tasks', 'detail', taskId] })
    },
  })
}

export const useUpdateTask = () => {
  const queryClient = useQueryClient()
  const invalidateLists = useInvalidateTaskLists()
  return useMutation({
    mutationFn: ({ taskId, payload }) => tasksService.update(taskId, payload),
    onSuccess: (_data, { taskId }) => {
      invalidateLists()
      queryClient.invalidateQueries({ queryKey: ['tasks', 'detail', taskId] })
    },
  })
}

// Only the lists are refreshed, not the deleted task's own detail query: that would 404 while the page
// is still open, just before it navigates back to the board.
export const useDeleteTask = () => {
  const invalidateLists = useInvalidateTaskLists()
  return useMutation({
    mutationFn: (taskId) => tasksService.remove(taskId),
    onSuccess: invalidateLists,
  })
}

// Other people change this list too (a staff member creates a task, an admin assigns one), so it is
// re-read every time a task page opens, when the browser tab regains focus, and once a minute while
// a page stays open - not loaded once and kept forever.
const TASKS_REFRESH_INTERVAL_MS = 60 * 1000

const useTasksListQuery = () =>
  useQuery({
    queryKey: ['tasks', 'list', 'all'],
    // Every status, not the API's default window (open + completed in the last 7 days), so the admin
    // dashboard's numbers match the Task Board views its cells link to.
    queryFn: () => tasksService.listAll({ statuses: 'todo,delayed,completed,completed_late' }),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: TASKS_REFRESH_INTERVAL_MS,
  })

// Fetches GET /tasks and syncs the shared task store from it, then returns the store's live
// (possibly locally-edited) tasks. Any page that needs the task list should use this instead of
// reading useTaskStore directly, so the list is always loaded no matter which page is entered first.
export const useSyncedTasks = () => {
  const query = useTasksListQuery()
  const tasks = useTaskStore((state) => state.tasks)
  const tasksLoaded = useTaskStore((state) => state.tasksLoaded)
  const tasksSyncedAt = useTaskStore((state) => state.tasksSyncedAt)
  const syncTasks = useTaskStore((state) => state.syncTasks)

  useEffect(() => {
    // Each fetch is applied once: cached data that's already been applied is skipped, so a page
    // re-mounting can't roll back an edit made locally since.
    if (query.data?.data && query.dataUpdatedAt > tasksSyncedAt) {
      syncTasks(query.data.data.map(mapApiTask), query.dataUpdatedAt)
    }
  }, [query.data, query.dataUpdatedAt, tasksSyncedAt, syncTasks])

  return {
    tasks,
    isLoading: query.isLoading && !tasksLoaded,
    isError: query.isError && !tasksLoaded,
    error: query.error,
  }
}

// Every task matching `filters` (see GET /tasks: status, range, from, to, ...), all pages read. Used by
// the staff dashboard's short lists. Returns the tasks plus the response's counts and resolved range.
export const useTaskList = (filters, { enabled = true } = {}) => {
  const query = useQuery({
    queryKey: ['tasks', 'list', 'filtered', filters],
    queryFn: () => tasksService.listAll(filters),
    enabled,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: TASKS_REFRESH_INTERVAL_MS,
  })

  const tasks = useMemo(() => (query.data?.data ?? []).map(mapApiTask), [query.data])

  return {
    tasks,
    counts: query.data?.counts ?? null,
    range: query.data?.range ?? null,
    isLoading: enabled && query.isLoading,
    isError: query.isError,
  }
}

// One task by id, whatever its age or status. The shared store is updated from the response, so the
// detail page keeps reading the store (and its optimistic edits and local-only delay reason) as before.
export const useTask = (taskId) => {
  const query = useQuery({
    queryKey: ['tasks', 'detail', taskId],
    queryFn: () => tasksService.get(taskId),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    retry: (failureCount, error) => error?.response?.status !== 404 && failureCount < 2,
  })
  const storedTask = useTaskStore((state) => state.tasks.find((task) => task.id === taskId))
  const upsertTask = useTaskStore((state) => state.upsertTask)

  useEffect(() => {
    if (query.data?.data?.task) upsertTask(mapApiTask(query.data.data.task))
  }, [query.data, query.dataUpdatedAt, upsertTask])

  const notFound = query.error?.response?.status === 404

  return {
    task: notFound ? undefined : storedTask,
    isLoading: query.isLoading && !storedTask,
    isError: query.isError && !notFound && !storedTask,
  }
}

// Boards show this many tasks per page; the API does the paging, searching and status/assignee filtering
// so a long list never loads in one go. 25 sits in the 20-30 the client asked for.
export const TASKS_PAGE_SIZE = 25

// One page of a task board. `filters` is any GET /tasks filter plus `page`.
// The previous page stays on screen while the next one loads, so paging doesn't flash empty.
export const useTasksPage = (filters, { enabled = true } = {}) => {
  const params = { ...filters, limit: TASKS_PAGE_SIZE }
  const query = useQuery({
    queryKey: ['tasks', 'list', 'page', params],
    queryFn: () => tasksService.list(params),
    enabled,
    placeholderData: (previousData) => previousData,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: TASKS_REFRESH_INTERVAL_MS,
  })

  const tasks = useMemo(() => (query.data?.data ?? []).map(mapApiTask), [query.data])

  return {
    tasks,
    pagination: query.data?.pagination ?? null,
    range: query.data?.range ?? null,
    counts: query.data?.counts ?? null,
    isLoading: enabled && query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
  }
}

// The values (with counts) each task board column filter offers, under the board's other filters.
// Every task mutation invalidates it along with the lists.
export const useTaskFacets = (filters, { enabled = true } = {}) =>
  useQuery({
    queryKey: ['tasks', 'facets', filters],
    queryFn: () => tasksService.facets(filters),
    enabled,
    placeholderData: (previousData) => previousData,
    select: (response) => response.data,
  })
