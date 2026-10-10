import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notesService } from '@/services/notes.service'

export const useNotesList = () =>
  useQuery({
    queryKey: ['notes'],
    queryFn: notesService.list,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

export const useDashboardNotes = () =>
  useQuery({
    queryKey: ['notes', 'dashboard'],
    queryFn: notesService.list,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

// The notes page keeps its own local copy, so only the dashboard panel's query is refreshed; refetching
// ['notes'] here would reset the page's list under the editor.
const useNoteMutation = (mutationFn) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes', 'dashboard'] }),
  })
}

export const useCreateNote = () => useNoteMutation(notesService.create)

export const useUpdateNote = () =>
  useNoteMutation(({ noteId, payload }) => notesService.update(noteId, payload))

export const useToggleNotePin = () => useNoteMutation(notesService.togglePin)

export const useToggleNoteArchive = () => useNoteMutation(notesService.toggleArchive)

export const useDeleteNote = () => useNoteMutation(notesService.remove)
