import { useMutation, useQuery } from '@tanstack/react-query'
import { staffService } from '@/services/staff.service'

export const useAddStaff = () =>
  useMutation({
    mutationFn: staffService.create,
  })

export const useStaffList = ({ page, limit }) =>
  useQuery({
    queryKey: ['staff', page, limit],
    queryFn: () => staffService.list({ page, limit }),
    placeholderData: (previousData) => previousData,
  })

export const useStaffOptions = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: ['staff', 'options'],
    queryFn: () => staffService.list({ page: 1, limit: 100 }),
    enabled,
    retry: (failureCount, error) => failureCount < 2 && !(error?.response?.status < 500),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    select: (response) =>
      response.data
        .filter((member) => member.status === 'active')
        .map((member) => ({ value: member.id, label: `${member.firstName} ${member.lastName}` })),
  })

export const useDeleteStaff = () =>
  useMutation({
    mutationFn: staffService.remove,
  })

export const useUpdateStaffStatus = () =>
  useMutation({
    mutationFn: ({ staffId, status }) => staffService.updateStatus(staffId, status),
  })

export const useResetStaffPassword = () =>
  useMutation({
    mutationFn: ({ staffId, password }) => staffService.resetPassword(staffId, password),
  })

export const useUpdateStaff = () =>
  useMutation({
    mutationFn: ({ staffId, values }) => staffService.update(staffId, values),
  })
