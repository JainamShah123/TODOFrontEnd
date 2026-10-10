import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { meetingsService } from '@/services/meetings.service'

// status is 'open' or 'done'. Both lists live under ['meetings'], so every mutation below refreshes them.
export const useMeetings = (status = 'open') =>
  useQuery({
    queryKey: ['meetings', status],
    queryFn: () => meetingsService.list(status),
    placeholderData: (previous) => previous,
  })

const useMeetingMutation = (mutationFn) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meetings'] }),
  })
}

export const useCreateMeeting = () => useMeetingMutation(meetingsService.create)

export const useUpdateMeeting = () =>
  useMeetingMutation(({ meetingId, payload }) => meetingsService.update(meetingId, payload))

export const useDeleteMeeting = () => useMeetingMutation(meetingsService.remove)

// Optimistic: the row leaves the open list the moment the tick is clicked, so a run of meetings can be
// ticked off quickly. On failure the lists are refetched and the row comes back.
export const useSetMeetingDone = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ meetingId, done }) => meetingsService.setDone(meetingId, done),
    onMutate: async ({ meetingId }) => {
      await queryClient.cancelQueries({ queryKey: ['meetings'] })
      queryClient.setQueriesData({ queryKey: ['meetings'] }, (data) =>
        data?.data
          ? {
              ...data,
              data: {
                ...data.data,
                meetings: data.data.meetings.filter((m) => m.id !== meetingId),
              },
            }
          : data,
      )
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['meetings'] }),
  })
}
