import { create } from 'zustand'
import { INITIAL_NOTICES } from '@/features/broadcast/data/broadcast.data'

let nextSequence = INITIAL_NOTICES.length + 1

export const useBroadcastStore = create((set) => ({
  notices: INITIAL_NOTICES,
  addNotice: (notice) =>
    set((state) => ({
      notices: [
        {
          id: `NTC-${1000 + nextSequence++}`,
          sentBy: 'Admin',
          createdAt: new Date().toISOString(),
          status: 'active',
          ...notice,
        },
        ...state.notices,
      ],
    })),
  toggleNoticeStatus: (id) =>
    set((state) => ({
      notices: state.notices.map((notice) =>
        notice.id === id
          ? { ...notice, status: notice.status === 'active' ? 'inactive' : 'active' }
          : notice,
      ),
    })),
}))
