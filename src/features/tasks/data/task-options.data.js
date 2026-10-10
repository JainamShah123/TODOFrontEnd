export const ADMIN_ASSIGNEE_OPTION = { value: 'admin', label: 'Assign To Me' }

// Labels for every timeline a task can have. New tasks only use none / custom / repeat; the rest are
// older fixed schedules that existing tasks may still carry.
export const TIMELINE_OPTIONS = [
  { value: 'none', label: 'No deadline' },
  { value: 'custom', label: 'One time' },
  { value: 'repeat', label: 'Repeats' },
  { value: 'daily', label: 'Daily (Mon-Fri)' },
  { value: 'saturday', label: 'Every Saturday' },
  { value: '1st', label: '1st of every month' },
  { value: '16th', label: '16th of every month' },
  { value: 'monthly', label: 'Monthly' },
]

export const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', accentClass: 'accent-status-scheduled' },
  { value: 'medium', label: 'Medium', accentClass: 'accent-status-pending' },
  { value: 'high', label: 'High', accentClass: 'accent-status-delayed' },
]
