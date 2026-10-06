import { useMutation, useQuery } from '@tanstack/react-query'
import { noticesService } from '@/services/notices.service'

export const useCreateNotice = () =>
  useMutation({
    mutationFn: noticesService.create,
  })

export const useUpdateNotice = () =>
  useMutation({
    mutationFn: ({ noticeId, payload }) => noticesService.update(noticeId, payload),
  })

export const useUpdateNoticeStatus = () =>
  useMutation({
    mutationFn: ({ noticeId, status }) => noticesService.updateStatus(noticeId, status),
  })

export const useDeleteNotice = () =>
  useMutation({
    mutationFn: (noticeId) => noticesService.remove(noticeId),
  })

// The server scopes this by the caller's role already (admin sees every
// notice, a staff caller only sees active notices sent to them), so the same
// call works for both — no role branching needed on the frontend.
export const useNoticesList = ({ page, limit }) =>
  useQuery({
    queryKey: ['notices', page, limit],
    queryFn: () => noticesService.list({ page, limit }),
    placeholderData: (previousData) => previousData,
  })
