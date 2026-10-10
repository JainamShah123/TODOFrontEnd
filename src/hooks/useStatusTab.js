import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DISPLAY_STATUS, STATUS_TABS } from '@/features/tasks/utils/task.utils'

// Which status tab a board shows. A link can pick one with ?tab=delayed (the dashboard tiles do).
// Otherwise the board opens on Delayed when anything is delayed (the thing most worth seeing first),
// else on To Do. `counts` is the API's counts.byStatus.
export const useStatusTab = (counts) => {
  const [searchParams] = useSearchParams()
  const linked = searchParams.get('tab')
  const [picked, setPicked] = useState(STATUS_TABS.includes(linked) ? linked : null)
  const tab = picked ?? (counts?.[DISPLAY_STATUS.DELAYED] > 0 ? DISPLAY_STATUS.DELAYED : DISPLAY_STATUS.TODO)
  return [tab, setPicked]
}
