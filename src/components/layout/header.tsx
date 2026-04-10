import { MobileSidebarTrigger } from "./mobile-sidebar"
import { NotificationBell } from "./notification-bell"

interface HeaderProps {
  title?: string
  workspaceSlug?: string
  actions?: React.ReactNode
}

export async function Header({ title, workspaceSlug, actions }: HeaderProps) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
      <MobileSidebarTrigger />
      {title && <h1 className="text-sm font-semibold">{title}</h1>}
      <div className="ml-auto flex items-center gap-1">
        {actions}
        {workspaceSlug && <NotificationBell workspaceSlug={workspaceSlug} />}
      </div>
    </header>
  )
}
