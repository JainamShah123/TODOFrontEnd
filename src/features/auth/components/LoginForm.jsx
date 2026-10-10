import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema } from '@/features/auth/schemas/login.schema'
import { useLogin } from '@/hooks/useAuth'
import { ROUTES } from '@/constants/routes'
import { Role } from '@/constants/roles'
import Input from '@/components/common/Input'
import Button from '@/components/common/Button'

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) })
  const login = useLogin()
  const navigate = useNavigate()

  const onSubmit = (values) => {
    login.mutate(values, {
      onSuccess: (data) => {
        const destination = data.data.user.role === Role.ADMIN ? ROUTES.ADMIN_DASHBOARD : ROUTES.STAFF_DASHBOARD
        navigate(destination, { replace: true })
      },
    })
  }

  return (
    <form className="space-y-unit-lg" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Input
        label="ID or Email Address"
        placeholder="Enter your ID or email"
        autoComplete="username"
        error={errors.identifier?.message}
        {...register('identifier')}
      />

      <div>
        <div className="mb-unit-xs flex items-center justify-between">
          <label
            htmlFor="password"
            className="block text-label-bold font-bold tracking-[0.05em] text-on-surface uppercase"
          >
            Password
          </label>
          <a href="#forgot-password" className="text-label-md font-medium text-primary hover:text-surface-tint">
            Forgot Password?
          </a>
        </div>
        <Input
          id="password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Enter your password"
          autoComplete="current-password"
          error={errors.password?.message}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-outline hover:text-on-surface-variant focus:outline-none"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <span className="material-symbols-outlined text-[24px]">
                {showPassword ? 'visibility' : 'visibility_off'}
              </span>
            </button>
          }
          {...register('password')}
        />
      </div>

      {login.isError && (
        <p className="text-sm text-error">
          {login.error?.response?.data?.message ?? 'Unable to sign in. Please try again.'}
        </p>
      )}

      <Button type="submit" isLoading={login.isPending} icon="arrow_forward">
        Login
      </Button>
    </form>
  )
}
