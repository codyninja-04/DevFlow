import Link from "next/link"
import { redirect } from "next/navigation"
import {
  FolderKanbanIcon,
  LayersIcon,
  PlusIcon,
  TicketIcon,
  UsersIcon,
} from "lucide-react"

import { auth } from "@/auth"
import {
  getWorkspaceBySlug,
  getWorkspaceRecentActivity,
  getWorkspaceStats,
} from "@/lib/queries/workspace"
import { formatRelativeDate } from "@/lib/utils"
import { ACTIVITY_TYPES } from "@/config/constants"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Header } from "@/components/layout/header"

interface PageProps {
  params: Promise<{ workspaceSlug: string }>
}

const ACTIVITY_LABELS: Record<string, string> = {
  ISSUE_CREATED: "created an issue",
  ISSUE_UPDATED: "updated an issue",
  ISSUE_DELETED: "deleted an issue",
  ISSUE_ASSIGNED: "assigned an issue",
  ISSUE_UNASSIGNED: "unassigned an issue",
  STATUS_CHANGED: "changed status",
  PRIORITY_CHANGED: "changed priority",
  COMMENT_ADDED: "commented",
  COMMENT_EDITED: "edited a comment",
  COMMENT_DELETED: "deleted a comment",
  SPRINT_STARTED: "started a sprint",
  SPRINT_COMPLETED: "completed a sprint",
  MEMBER_ADDED: "added a member",
  MEMBER_REMOVED: "removed a member",
}

export default async function WorkspaceDashboard({ params }: PageProps) {
  const { workspaceSlug } = await params
  const session = await auth()

  if (!session?.user?.id) redirect("/sign-in")

  const workspace = await getWorkspaceBySlug(workspaceSlug, session.user.id)
  if (!workspace) redirect("/sign-in")

  const [stats, recentActivity] = await Promise.all([
    getWorkspaceStats(workspace.id),
    getWorkspaceRecentActivity(workspace.id),
  ])

  const statCards = [
    {
      title: "Active Projects",
      value: stats.projectCount,
      icon: FolderKanbanIcon,
      href: `/${workspaceSlug}/projects`,
    },
    {
      title: "Open Issues",
      value: stats.openIssueCount,
      icon: TicketIcon,
      href: `/${workspaceSlug}/issues`,
    },
    {
      title: "Active Sprints",
      value: stats.activeSprints,
      icon: LayersIcon,
      href: `/${workspaceSlug}/sprints`,
    },
    {
      title: "Members",
      value: stats.memberCount,
      icon: UsersIcon,
      href: `/${workspaceSlug}/members`,
    },
  ]

  return (
    <>
      <Header title="Dashboard" workspaceSlug={workspaceSlug} />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl space-y-6 p-6">
          {/* Welcome section */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                {workspace.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                Here&apos;s an overview of your workspace.
              </p>
            </div>
            <Button render={<Link href={`/${workspaceSlug}/projects`} />}>
              <PlusIcon data-icon="inline-start" />
              New Project
            </Button>
          </div>

          {/* Stats grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => (
              <Link key={stat.title} href={stat.href}>
                <Card className="transition-colors hover:bg-muted/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardDescription className="text-sm font-medium">
                      {stat.title}
                    </CardDescription>
                    <stat.icon className="size-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Recent activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest updates across your workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No activity yet. Create a project to get started.
                </p>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 text-sm"
                    >
                      <Avatar size="sm">
                        {activity.actor.image && (
                          <AvatarImage
                            src={activity.actor.image}
                            alt={activity.actor.name ?? ""}
                          />
                        )}
                        <AvatarFallback>
                          {activity.actor.name?.charAt(0) ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-0.5">
                        <p>
                          <span className="font-medium">
                            {activity.actor.name}
                          </span>{" "}
                          <span className="text-muted-foreground">
                            {ACTIVITY_LABELS[activity.type] ?? activity.type}
                          </span>
                          {activity.issue && (
                            <>
                              {" "}
                              <span className="font-medium">
                                {activity.issue.title}
                              </span>
                            </>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.project?.name} &middot;{" "}
                          {formatRelativeDate(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
