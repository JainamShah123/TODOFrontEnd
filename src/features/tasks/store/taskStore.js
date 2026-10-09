import { create } from 'zustand'

export const useTaskStore = create((set) => ({
  tasks: [],
  tasksLoaded: false,
  // Timestamp (react-query dataUpdatedAt) of the GET /tasks result currently reflected in `tasks`.
  // Lets useSyncedTasks apply each fetch once, so re-mounting a page with cached data can't
  // overwrite a local edit that was made after that fetch.
  tasksSyncedAt: 0,
  // Replaces the list with a fresh GET /tasks result. Tasks other users created or changed show up,
  // and ones removed on the server drop out. delayReason/delayReasonAt only exist in the browser
  // (the API doesn't store them yet), so they're carried over from the existing copy of each task.
  syncTasks: (serverTasks, fetchedAt) =>
    set((state) => {
      const localById = new Map(state.tasks.map((task) => [task.id, task]))
      const merged = serverTasks.map((task) => {
        const local = localById.get(task.id)
        if (!local) return task
        return {
          ...task,
          delayReason: local.delayReason ?? task.delayReason,
          delayReasonAt: local.delayReasonAt ?? task.delayReasonAt,
        }
      })
      return { tasks: merged, tasksLoaded: true, tasksSyncedAt: fetchedAt }
    }),
  addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),
  // Adds a task read on its own (GET /tasks/:id), or refreshes it if the store already has it, without
  // touching any other task. Local-only delay reason fields are kept, as in syncTasks.
  upsertTask: (serverTask) =>
    set((state) => {
      const local = state.tasks.find((task) => task.id === serverTask.id)
      if (!local) return { tasks: [serverTask, ...state.tasks] }
      const merged = {
        ...serverTask,
        delayReason: local.delayReason ?? serverTask.delayReason,
        delayReasonAt: local.delayReasonAt ?? serverTask.delayReasonAt,
      }
      return { tasks: state.tasks.map((task) => (task.id === serverTask.id ? merged : task)) }
    }),
  updateTaskStatus: (taskId, status) =>
    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === taskId ? { ...task, status } : task)),
    })),
  updateTask: (taskId, values) =>
    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === taskId ? { ...task, ...values } : task)),
    })),
  setDelayReason: (taskId, delayReason) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, delayReason, delayReasonAt: new Date().toISOString() } : task,
      ),
    })),
  deleteTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== taskId),
    })),
}))
