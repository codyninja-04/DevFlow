import Link from "next/link"
import { redirect } from "next/navigation"
import { FolderKanbanIcon, PlusIcon, TicketIcon } from "lucide-react"

import { auth } from "@/auth"
import { getWorkspaceProjectsWithStats } from "@/lib/queries/project"
import { getWorkspaceBySlug } from "@/lib/queries/workspace"
import { formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { CreateProjectDialog } from "@/components/projects/create-project-dialog"

interface PageProps {
  params: Promise<{ workspaceSlug: string }>
}

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "outline"
> = {
  ACTIVE: "default",
  PAUSED: "secondary",
  ARCHIVED: "outline",
}

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Active",
  PAUSED: "Paused",
  ARCHIVED: "Archived",
}

export default async function ProjectsPage({ params }: PageProps) {
  const { workspaceSlug } = await params
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const workspace = await getWorkspaceBySlug(workspaceSlug, session.user.id)
  if (!workspace) redirect("/sign-in")

  const projects = await getWorkspaceProjectsWithStats(workspace.id)

  return (
    <>
      <Header title="Projects" workspaceSlug={workspaceSlug} />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl space-y-6 p-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Projects</h2>
              <p className="text-sm text-muted-foreground">
                {projects.length} project{projects.length !== 1 && "s"} in this
                workspace
              </p>
            </div>
            <CreateProjectDialog workspaceId={workspace.id}>
              <Button>
                <PlusIcon data-icon="inline-start" />
                New Project
              </Button>
            </CreateProjectDialog>
          </div>

          {/* Project grid */}
          {projects.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FolderKanbanIcon className="mb-4 size-12 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold">No projects yet</h3>
                <p className="mt-1 mb-4 text-sm text-muted-foreground">
                  Create your first project to start organizing work.
                </p>
                <CreateProjectDialog workspaceId={workspace.id}>
                  <Button>
                    <PlusIcon data-icon="inline-start" />
                    Create Project
                  </Button>
                </CreateProjectDialog>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/${workspaceSlug}/projects/${project.slug}`}
                >
                  <Card className="h-full transition-colors hover:bg-muted/50">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <span
                          className="size-3 shrink-0 rounded-sm"
                          style={{ backgroundColor: project.color }}
                        />
                        <CardTitle className="truncate">
                          {project.name}
                        </CardTitle>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {project.description || "No description"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <TicketIcon className="size-3" />
                            {project._count.issues} issues
                          </span>
                          {project.targetDate && (
                            <span>
                              Due {formatDate(project.targetDate, "MMM d")}
                            </span>
                          )}
                        </div>
                        <Badge variant={STATUS_VARIANT[project.status] ?? "outline"}>
                          {STATUS_LABEL[project.status] ?? project.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
