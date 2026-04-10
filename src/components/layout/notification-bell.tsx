import Link from "next/link"
import { BellIcon } from "lucide-react"

import { auth } from "@/auth"
import { getUnreadNotificationCount } from "@/lib/queries/notification"

interface NotificationBellProps {
  workspaceSlug: string
}

export async function NotificationBell({
  workspaceSlug,
}: NotificationBellProps) {
  const session = await auth()
  const count = session?.user?.id
    ? await getUnreadNotificationCount(session.user.id)
    : 0

  return (
    <Link
      href={`/${workspaceSlug}/notifications`}
      aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ""}`}
      className="relative inline-flex size-8 items-center justify-center rounded-md hover:bg-muted"
    >
      <BellIcon className="size-4" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[0.625rem] font-semibold text-primary-foreground">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  )
}
