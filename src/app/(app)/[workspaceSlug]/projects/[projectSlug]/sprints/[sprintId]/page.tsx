import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeftIcon, CalendarIcon } from "lucide-react"

import { auth } from "@/auth"
import { getProjectIssues } from "@/lib/queries/issue"
import { getSprintById } from "@/lib/queries/sprint"
import { getWorkspaceBySlug } from "@/lib/queries/workspace"
import { formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/header"
import { IssueList } from "@/components/issues/issue-list"

interface PageProps {
  params: Promise<{
    workspaceSlug: string
    projectSlug: string
    sprintId: string
  }>
}

const STATUS_LABELS = {
  ACTIVE: "Active",
  PLANNED: "Planned",
  COMPLETED: "Completed",
} as const

export default async function SprintDetailPage({ params }: PageProps) {
  const { workspaceSlug, projectSlug, sprintId } = await params
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const workspace = await getWorkspaceBySlug(workspaceSlug, session.user.id)
  if (!workspace) redirect("/sign-in")

  const sprint = await getSprintById(sprintId)
  if (
    !sprint ||
    sprint.project.workspaceId !== workspace.id ||
    sprint.project.slug !== projectSlug
  )
    notFound()

  const { issues } = await getProjectIssues(
    sprint.projectId,
    { sprintId: sprint.id },
    1,
    100
  )

  return (
    <>
      <Header title={sprint.name} workspaceSlug={workspaceSlug} />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl p-6 space-y-6">
          <div>
            <Link
              href={`/${workspaceSlug}/projects/${projectSlug}`}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeftIcon className="size-3" />
              Back to {sprint.project.name}
            </Link>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight">
                {sprint.name}
              </h2>
              <Badge
                variant={sprint.status === "ACTIVE" ? "default" : "secondary"}
              >
                {STATUS_LABELS[sprint.status]}
              </Badge>
            </div>
            {sprint.goal && (
              <p className="mt-2 text-sm text-muted-foreground">
                {sprint.goal}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarIcon className="size-3" />
                {formatDate(sprint.startDate)} – {formatDate(sprint.endDate)}
              </span>
              <span>{sprint._count.issues} issues</span>
              {sprint.completedAt && (
                <span>Completed {formatDate(sprint.completedAt)}</span>
              )}
            </div>
          </div>

          <IssueList issues={issues} workspaceSlug={workspaceSlug} />
        </div>
      </div>
    </>
  )
}
