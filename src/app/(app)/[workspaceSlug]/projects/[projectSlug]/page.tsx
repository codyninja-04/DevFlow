import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import {
  KanbanSquareIcon,
  LayersIcon,
  PlusIcon,
  SettingsIcon,
  TagIcon,
  TicketIcon,
} from "lucide-react"

import { auth } from "@/auth"
import { getProjectIssues, getWorkspaceMembers } from "@/lib/queries/issue"
import { getProjectBySlug, getProjectIssueStats } from "@/lib/queries/project"
import { getProjectSprints } from "@/lib/queries/sprint"
import { getWorkspaceBySlug } from "@/lib/queries/workspace"
import { formatDate } from "@/lib/utils"
import { ISSUE_STATUS_LABELS } from "@/config/constants"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Header } from "@/components/layout/header"
import { CreateIssueDialog } from "@/components/issues/create-issue-dialog"
import { IssueList } from "@/components/issues/issue-list"
import { ProjectSettingsForm } from "@/components/projects/project-settings-form"
import { CreateSprintDialog } from "@/components/sprints/create-sprint-dialog"
import { SprintList } from "@/components/sprints/sprint-list"

interface PageProps {
  params: Promise<{ workspaceSlug: string; projectSlug: string }>
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { workspaceSlug, projectSlug } = await params
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const workspace = await getWorkspaceBySlug(workspaceSlug, session.user.id)
  if (!workspace) redirect("/sign-in")

  const project = await getProjectBySlug(workspace.id, projectSlug)
  if (!project) notFound()

  const [issueStats, { issues }, members, sprints] = await Promise.all([
    getProjectIssueStats(project.id),
    getProjectIssues(project.id),
    getWorkspaceMembers(workspace.id),
    getProjectSprints(project.id),
  ])

  const canManage = workspace.currentMember.role !== "VIEWER"

  const statusOrder = [
    "BACKLOG",
    "TODO",
    "IN_PROGRESS",
    "IN_REVIEW",
    "DONE",
    "CANCELLED",
  ] as const

  return (
    <>
      <Header title={project.name} workspaceSlug={workspaceSlug} />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl p-6">
          {/* Project header */}
          <div className="mb-6 flex items-start gap-3">
            <span
              className="mt-1 size-4 shrink-0 rounded-sm"
              style={{ backgroundColor: project.color }}
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold tracking-tight">
                {project.name}
              </h2>
              {project.description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {project.description}
                </p>
              )}
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                {project.startDate && (
                  <span>Started {formatDate(project.startDate)}</span>
                )}
                {project.targetDate && (
                  <span>Due {formatDate(project.targetDate)}</span>
                )}
              </div>
            </div>
            <Link
              href={`/${workspaceSlug}/projects/${projectSlug}/board`}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-sm font-medium shadow-sm transition-colors hover:bg-muted"
            >
              <KanbanSquareIcon className="size-4" />
              Board
            </Link>
          </div>

          <Tabs defaultValue="overview">
            <TabsList variant="line">
              <TabsTrigger value="overview">
                <TicketIcon />
                Overview
              </TabsTrigger>
              <TabsTrigger value="issues">
                <TicketIcon />
                Issues
              </TabsTrigger>
              <TabsTrigger value="sprints">
                <LayersIcon />
                Sprints
              </TabsTrigger>
              <TabsTrigger value="settings">
                <SettingsIcon />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Overview tab */}
            <TabsContent value="overview" className="mt-6 space-y-6">
              {/* Stats row */}
              <div className="grid gap-4 sm:grid-cols-3">
                <Card size="sm">
                  <CardHeader>
                    <CardDescription className="flex items-center gap-1">
                      <TicketIcon className="size-3" />
                      Issues
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {issueStats.total}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {issueStats.open} open &middot; {issueStats.done} done
                    </p>
                  </CardContent>
                </Card>
                <Card size="sm">
                  <CardHeader>
                    <CardDescription className="flex items-center gap-1">
                      <LayersIcon className="size-3" />
                      Sprints
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {project._count.sprints}
                    </div>
                  </CardContent>
                </Card>
                <Card size="sm">
                  <CardHeader>
                    <CardDescription className="flex items-center gap-1">
                      <TagIcon className="size-3" />
                      Labels
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {project._count.labels}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Issue breakdown */}
              {issueStats.total > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Issue Breakdown</CardTitle>
                    <CardDescription>
                      Distribution by status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {statusOrder.map((status) => {
                        const count = issueStats.byStatus[status] ?? 0
                        if (count === 0) return null
                        const pct =
                          issueStats.total > 0
                            ? Math.round((count / issueStats.total) * 100)
                            : 0
                        return (
                          <div key={status} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span>
                                {ISSUE_STATUS_LABELS[status] ?? status}
                              </span>
                              <span className="text-muted-foreground">
                                {count} ({pct}%)
                              </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <TicketIcon className="mb-3 size-10 text-muted-foreground/50" />
                    <h3 className="text-base font-semibold">No issues yet</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Issues will appear here once they&apos;re created.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Issues tab */}
            <TabsContent value="issues" className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {issueStats.total} issue{issueStats.total !== 1 && "s"} in
                  this project
                </p>
                <CreateIssueDialog
                  projectId={project.id}
                  members={members}
                >
                  <Button size="sm">
                    <PlusIcon data-icon="inline-start" />
                    New Issue
                  </Button>
                </CreateIssueDialog>
              </div>
              <IssueList issues={issues} workspaceSlug={workspaceSlug} />
            </TabsContent>

            {/* Sprints tab */}
            <TabsContent value="sprints" className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {sprints.length} sprint{sprints.length !== 1 && "s"}
                </p>
                {canManage && (
                  <CreateSprintDialog projectId={project.id}>
                    <Button size="sm">
                      <PlusIcon data-icon="inline-start" />
                      New Sprint
                    </Button>
                  </CreateSprintDialog>
                )}
              </div>
              <SprintList
                sprints={sprints}
                workspaceSlug={workspaceSlug}
                projectSlug={project.slug}
                canManage={canManage}
              />
            </TabsContent>

            {/* Settings tab */}
            <TabsContent value="settings" className="mt-6">
              <ProjectSettingsForm
                project={{
                  id: project.id,
                  name: project.name,
                  description: project.description,
                  color: project.color,
                  status: project.status,
                  startDate: project.startDate,
                  targetDate: project.targetDate,
                }}
                workspaceSlug={workspaceSlug}
                isAdmin={workspace.currentMember.role === "ADMIN"}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}
