import { redirect } from "next/navigation"
import {
  BellIcon,
  MessageSquareIcon,
  UserCheckIcon,
  RefreshCwIcon,
  AtSignIcon,
  MailIcon,
  PlayIcon,
  CheckCircleIcon,
} from "lucide-react"
import type { NotificationType } from "@prisma/client"

import { auth } from "@/auth"
import { getUserNotifications } from "@/lib/queries/notification"
import { markNotificationRead, markAllNotificationsRead } from "@/lib/actions/notification"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface PageProps {
  params: Promise<{ workspaceSlug: string }>
}

const typeIcon: Record<NotificationType, React.ReactNode> = {
  ISSUE_ASSIGNED: <UserCheckIcon className="size-4" />,
  ISSUE_COMMENTED: <MessageSquareIcon className="size-4" />,
  ISSUE_STATUS_CHANGED: <RefreshCwIcon className="size-4" />,
  MENTION: <AtSignIcon className="size-4" />,
  PROJECT_INVITE: <MailIcon className="size-4" />,
  SPRINT_STARTED: <PlayIcon className="size-4" />,
  SPRINT_COMPLETED: <CheckCircleIcon className="size-4" />,
}

function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return date.toLocaleDateString()
}

export default async function NotificationsPage({ params }: PageProps) {
  const { workspaceSlug } = await params
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const notifications = await getUserNotifications(session.user.id)
  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <>
      <Header title="Notifications" workspaceSlug={workspaceSlug} />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-4 p-6">
          {/* Page heading */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Notifications</h2>
              <p className="text-sm text-muted-foreground">
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
                  : "All caught up"}
              </p>
            </div>
            {unreadCount > 0 && (
              <form action={markAllNotificationsRead}>
                <Button variant="outline" size="sm" type="submit">
                  Mark all as read
                </Button>
              </form>
            )}
          </div>

          {/* Notification list */}
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border py-16">
              <BellIcon className="mb-4 size-12 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold">No notifications</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                You&apos;ll be notified when issues are assigned or commented on.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border">
              {notifications.map((notification, index) => {
                const issueHref = notification.resourceId
                  ? `/${workspaceSlug}/issues/${notification.resourceId}`
                  : null

                return (
                  <div key={notification.id}>
                    {index > 0 && <Separator />}
                    <div
                      className={cn(
                        "flex items-start gap-3 px-4 py-3 transition-colors",
                        !notification.isRead && "bg-muted/40"
                      )}
                    >
                      {/* Unread dot */}
                      <div className="mt-1 flex size-2 shrink-0 items-center justify-center">
                        {!notification.isRead && (
                          <span className="size-2 rounded-full bg-primary" />
                        )}
                      </div>

                      {/* Type icon */}
                      <div className="mt-0.5 shrink-0 text-muted-foreground">
                        {typeIcon[notification.type]}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-sm", !notification.isRead && "font-medium")}>
                          {notification.title}
                        </p>
                        {notification.body && (
                          <p className="mt-0.5 truncate text-sm text-muted-foreground">
                            {notification.body}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatRelativeTime(notification.createdAt)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex shrink-0 items-center gap-2">
                        {issueHref && (
                          <a href={issueHref}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </a>
                        )}
                        {!notification.isRead && (
                          <form action={markNotificationRead}>
                            <input type="hidden" name="id" value={notification.id} />
                            <Button variant="ghost" size="sm" type="submit">
                              Mark read
                            </Button>
                          </form>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
