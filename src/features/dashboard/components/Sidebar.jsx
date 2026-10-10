import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { useChangePassword, useLogout } from '@/hooks/useAuth'
import { ROUTES } from '@/constants/routes'
import { Role } from '@/constants/roles'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import PasswordModal from '@/components/common/PasswordModal'
import Toast from '@/components/common/Toast'
import { changePasswordSchema } from '@/features/auth/schemas/password.schema'

const ADMIN_NAV_LINKS = [
  { label: 'Dashboard', icon: 'dashboard', to: ROUTES.ADMIN_DASHBOARD },
  { label: 'Task Board', icon: 'assignment', to: ROUTES.ADMIN_TASK_BOARD },
  { label: 'Staff Directory', icon: 'group', to: ROUTES.ADMIN_STAFF },
  { label: 'Schedule', icon: 'calendar_month', to: ROUTES.ADMIN_SCHEDULE },
  { label: 'Private Notes', icon: 'lock', to: ROUTES.PRIVATE_NOTES },
  { label: 'Broadcast / Notice', icon: 'campaign', to: ROUTES.ADMIN_BROADCAST },
]

const STAFF_NAV_LINKS = [
  { label: 'Dashboard', icon: 'dashboard', to: ROUTES.STAFF_DASHBOARD },
  { label: 'Task Board', icon: 'assignment', to: ROUTES.STAFF_TASK_BOARD },
  { label: 'Private Notes', icon: 'lock', to: ROUTES.PRIVATE_NOTES },
  { label: 'Profile', icon: 'person', to: ROUTES.STAFF_PROFILE },
]

export default function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }) {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const queryClient = useQueryClient()
  const logoutMutation = useLogout()
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false)
  const [isPasswordOpen, setIsPasswordOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const changePassword = useChangePassword()
  const isStaff = user?.role === Role.STAFF
  const navLinks = isStaff ? STAFF_NAV_LINKS : ADMIN_NAV_LINKS

  const endSession = () => {
    logout()
    navigate(ROUTES.LOGIN, { replace: true })
    queryClient.clear()
  }

  // The API call revokes the token server-side; if it fails, the user is still signed out here.
  const handleConfirmLogout = async () => {
    try {
      await logoutMutation.mutateAsync()
    } catch {
      // Ignored: ending the session below doesn't depend on the server.
    }
    endSession()
  }

  const openLogoutConfirm = () => {
    logoutMutation.reset()
    setIsLogoutConfirmOpen(true)
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-on-surface/40 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <nav
        className={`fixed top-0 left-0 z-50 flex h-full w-64 flex-col border-r border-border-light bg-surface-container-lowest shadow-md transition-[transform,width] duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'md:w-20' : 'md:w-64'}`}
      >
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute top-20 -right-4 z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-border-light bg-surface-container-lowest text-on-surface-variant shadow-sm transition-colors hover:bg-surface-container hover:text-primary md:flex"
        >
          <span className="material-symbols-outlined text-lg">
            {isCollapsed ? 'chevron_right' : 'chevron_left'}
          </span>
        </button>

        <div className="border-b border-border-light p-margin-mobile md:p-margin-desktop">
          <div className={`mb-unit-lg flex items-center gap-unit-sm ${isCollapsed ? 'md:justify-center' : 'justify-between'}`}>
            <div className={`flex min-w-0 items-center gap-unit-sm ${isCollapsed ? 'md:justify-center' : ''}`}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-primary-container bg-secondary-container text-on-secondary-container">
                <span className="material-symbols-outlined text-xl">{isStaff ? 'badge' : 'admin_panel_settings'}</span>
              </div>
              <div className={`min-w-0 ${isCollapsed ? 'md:hidden' : ''}`}>
                <h1 className="truncate font-[var(--font-headline)] text-headline-sm text-primary">
                  {isStaff ? 'Staff Portal' : 'Admin Portal'}
                </h1>
                <p className="truncate text-label-md text-on-surface-variant">{user?.name ?? 'Management Suite'}</p>
              </div>
            </div>
            <button
              type="button"
              className="shrink-0 text-on-surface-variant md:hidden"
              onClick={onClose}
              aria-label="Close menu"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <button
            type="button"
            title="Create Task"
            onClick={() => {
              navigate(isStaff ? ROUTES.STAFF_TASKS_CREATE : ROUTES.ADMIN_TASKS_CREATE)
              onClose()
            }}
            className={`flex w-full items-center justify-center gap-2 rounded-lg bg-primary-container py-unit-sm text-label-bold font-bold tracking-[0.05em] text-on-primary uppercase transition-all hover:bg-primary ${
              isCollapsed ? 'md:mx-auto md:h-10 md:w-10 md:rounded-full md:p-0' : 'px-unit-md'
            }`}
          >
            <span className="material-symbols-outlined text-lg">add</span>
            <span className={`whitespace-nowrap ${isCollapsed ? 'md:hidden' : ''}`}>Create Task</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-unit-sm py-unit-md">
          <ul className="space-y-unit-sm">
            {navLinks.map((link) =>
              link.to ? (
                <li key={link.label}>
                  <NavLink
                    to={link.to}
                    onClick={onClose}
                    title={link.label}
                    className={({ isActive }) =>
                      `flex items-center gap-unit-md rounded-xl p-unit-md text-label-bold font-bold tracking-[0.05em] transition-all ${
                        isCollapsed ? 'md:justify-center' : ''
                      } ${
                        isActive
                          ? 'bg-secondary-container text-on-secondary-container'
                          : 'text-secondary hover:bg-surface-container'
                      }`
                    }
                  >
                    <span className="material-symbols-outlined shrink-0 text-xl" data-weight="fill">
                      {link.icon}
                    </span>
                    <span className={`whitespace-nowrap ${isCollapsed ? 'md:hidden' : ''}`}>{link.label}</span>
                  </NavLink>
                </li>
              ) : (
                <li key={link.label}>
                  <a
                    href="#"
                    title={link.label}
                    onClick={(event) => event.preventDefault()}
                    className={`flex items-center gap-unit-md rounded-xl p-unit-md text-label-bold font-bold tracking-[0.05em] text-secondary transition-all hover:bg-surface-container ${
                      isCollapsed ? 'md:justify-center' : ''
                    }`}
                  >
                    <span className="material-symbols-outlined shrink-0 text-xl">{link.icon}</span>
                    <span className={`whitespace-nowrap ${isCollapsed ? 'md:hidden' : ''}`}>{link.label}</span>
                  </a>
                </li>
              ),
            )}
          </ul>
        </div>

        <div className="border-t border-border-light p-unit-sm">
          {!isStaff && (
            <button
              type="button"
              title="Change Password"
              onClick={() => setIsPasswordOpen(true)}
              className={`flex w-full items-center gap-unit-md rounded-lg p-unit-sm text-label-bold font-bold tracking-[0.05em] text-secondary transition-all hover:bg-surface-container ${
                isCollapsed ? 'md:justify-center' : ''
              }`}
            >
              <span className="material-symbols-outlined shrink-0 text-lg">lock_reset</span>
              <span className={`whitespace-nowrap ${isCollapsed ? 'md:hidden' : ''}`}>Change Password</span>
            </button>
          )}
          <button
            type="button"
            title="Logout"
            onClick={openLogoutConfirm}
            className={`flex w-full items-center gap-unit-md rounded-lg p-unit-sm text-label-bold font-bold tracking-[0.05em] text-tertiary transition-all hover:bg-error-container hover:text-on-error-container ${
              isCollapsed ? 'md:justify-center' : ''
            }`}
          >
            <span className="material-symbols-outlined shrink-0 text-lg">logout</span>
            <span className={`whitespace-nowrap ${isCollapsed ? 'md:hidden' : ''}`}>Logout</span>
          </button>
        </div>
      </nav>

      {isPasswordOpen && (
        <PasswordModal
          title="Change your password"
          fields={[
            { name: 'currentPassword', label: 'Current password', autoComplete: 'current-password' },
            { name: 'newPassword', label: 'New password', autoComplete: 'new-password' },
            { name: 'confirmPassword', label: 'Confirm new password', autoComplete: 'new-password' },
          ]}
          schema={changePasswordSchema}
          submitLabel="Change Password"
          onSubmit={async ({ currentPassword, newPassword }) => {
            await changePassword.mutateAsync({ currentPassword, newPassword })
            setToast({ message: 'Password changed.', tone: 'success' })
          }}
          onClose={() => setIsPasswordOpen(false)}
        />
      )}

      {toast && <Toast message={toast.message} tone={toast.tone} onDismiss={() => setToast(null)} />}

      {isLogoutConfirmOpen && (
        <ConfirmDialog
          title="Log out?"
          description="You'll need to sign in again."
          confirmLabel="Logout"
          cancelLabel="Cancel"
          confirmIcon="logout"
          tone="primary"
          isConfirming={logoutMutation.isPending}
          onConfirm={handleConfirmLogout}
          onCancel={() => setIsLogoutConfirmOpen(false)}
        />
      )}
    </>
  )
}
