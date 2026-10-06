import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { useLogout } from '@/hooks/useAuth'
import { ROUTES } from '@/constants/routes'
import { Role } from '@/constants/roles'
import ConfirmDialog from '@/components/common/ConfirmDialog'

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
  const isStaff = user?.role === Role.STAFF
  const navLinks = isStaff ? STAFF_NAV_LINKS : ADMIN_NAV_LINKS

  const endSession = () => {
    logout()
    navigate(ROUTES.LOGIN, { replace: true })
    queryClient.clear()
  }

  const handleConfirmLogout = async () => {
    try {
      await logoutMutation.mutateAsync()
      endSession()
    } catch (err) {
      if (err?.response?.status === 401) endSession()
    }
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
          className="absolute top-20 -right-3 z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-border-light bg-surface-container-lowest text-on-surface-variant shadow-sm transition-colors hover:bg-surface-container hover:text-primary md:flex"
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
            title="Create New Task"
            onClick={() => {
              navigate(isStaff ? ROUTES.STAFF_TASKS_CREATE : ROUTES.ADMIN_TASKS_CREATE)
              onClose()
            }}
            className={`flex w-full items-center justify-center gap-2 rounded-lg bg-primary-container py-unit-sm text-label-bold font-bold tracking-[0.05em] text-on-primary uppercase transition-all hover:bg-primary ${
              isCollapsed ? 'md:mx-auto md:h-10 md:w-10 md:rounded-full md:p-0' : 'px-unit-md'
            }`}
          >
            <span className="material-symbols-outlined text-lg">add</span>
            <span className={`whitespace-nowrap ${isCollapsed ? 'md:hidden' : ''}`}>Create New Task</span>
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

      {isLogoutConfirmOpen && (
        <ConfirmDialog
          title="Heading out already?"
          description="You'll be signed out and need to log in again to pick up where you left off."
          confirmLabel="Logout"
          cancelLabel="Cancel"
          confirmIcon="logout"
          tone="primary"
          error={
            logoutMutation.isError
              ? (logoutMutation.error?.response?.data?.message ?? 'Unable to log out. Please try again.')
              : null
          }
          isConfirming={logoutMutation.isPending}
          onConfirm={handleConfirmLogout}
          onCancel={() => setIsLogoutConfirmOpen(false)}
        />
      )}
    </>
  )
}
