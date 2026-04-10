import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeftIcon, PlusIcon } from "lucide-react"

import { auth } from "@/auth"
import {
  getProjectBoardIssues,
  getWorkspaceMembers,
} from "@/lib/queries/issue"
import { getProjectBySlug } from "@/lib/queries/project"
import { getWorkspaceBySlug } from "@/lib/queries/workspace"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/header"
import { CreateIssueDialog } from "@/components/issues/create-issue-dialog"
import {
  KanbanBoard,
  type BoardIssue,
} from "@/components/issues/kanban-board"

interface PageProps {
  params: Promise<{ workspaceSlug: string; projectSlug: string }>
}

export default async function ProjectBoardPage({ params }: PageProps) {
  const { workspaceSlug, projectSlug } = await params
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const workspace = await getWorkspaceBySlug(workspaceSlug, session.user.id)
  if (!workspace) redirect("/sign-in")

  const project = await getProjectBySlug(workspace.id, projectSlug)
  if (!project) notFound()

  const [issues, members] = await Promise.all([
    getProjectBoardIssues(project.id),
    getWorkspaceMembers(workspace.id),
  ])

  const canEdit = workspace.currentMember.role !== "VIEWER"

  return (
    <>
      <Header title={`${project.name} · Board`} workspaceSlug={workspaceSlug} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b px-6 py-3">
          <Link
            href={`/${workspaceSlug}/projects/${projectSlug}`}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeftIcon className="size-3" />
            {project.name}
          </Link>
          {canEdit && (
            <CreateIssueDialog projectId={project.id} members={members}>
              <Button size="sm">
                <PlusIcon data-icon="inline-start" />
                New Issue
              </Button>
            </CreateIssueDialog>
          )}
        </div>
        <div className="flex-1 overflow-auto p-4">
          <KanbanBoard
            issues={issues as BoardIssue[]}
            workspaceSlug={workspaceSlug}
            canEdit={canEdit}
          />
        </div>
      </div>
    </>
  )
}
