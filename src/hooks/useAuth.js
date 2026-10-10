import { useMutation } from '@tanstack/react-query'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/store/authStore'

export const useLogout = () =>
  useMutation({
    mutationFn: authService.logout,
  })

export const useChangePassword = () =>
  useMutation({
    mutationFn: authService.changePassword,
  })

export const useLogin = () => {
  const setSession = useAuthStore((state) => state.setSession)

  return useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      setSession(data.data.user, data.data.token)
    },
  })
}
