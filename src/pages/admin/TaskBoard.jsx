import TaskBoardView from '@/features/tasks/components/TaskBoardView'
import { ROUTES } from '@/constants/routes'

export default function TaskBoard() {
  return (
    <TaskBoardView
      title="Task Board"
      subtitle="All tasks for you and your team."
      detailBase={ROUTES.ADMIN_TASK_BOARD}
      createRoute={ROUTES.ADMIN_TASKS_CREATE}
      canEdit
    />
  )
}
