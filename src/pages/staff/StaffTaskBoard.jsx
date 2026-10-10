import TaskBoardView from '@/features/tasks/components/TaskBoardView'
import { ROUTES } from '@/constants/routes'

// The API only returns tasks assigned to or created by the signed-in staff member. Editing stays
// admin-only for now; the assignee completes a task with the Done tick.
export default function StaffTaskBoard() {
  return (
    <TaskBoardView
      title="My Tasks"
      subtitle="Tasks assigned to you and the ones you assigned. Tick Done when a task is finished."
      detailBase={ROUTES.STAFF_TASK_BOARD}
      createRoute={ROUTES.STAFF_TASKS_CREATE}
    />
  )
}
