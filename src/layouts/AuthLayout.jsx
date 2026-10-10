import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-surface-subtle">
      <div className="flex flex-grow flex-col">
        <Outlet />
      </div>
    </div>
  )
}
