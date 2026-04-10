import Link from "next/link"
import { redirect } from "next/navigation"
import { CalendarIcon } from "lucide-react"

import { auth } from "@/auth"
import { getWorkspaceSprints } from "@/lib/queries/sprint"
import { getWorkspaceBySlug } from "@/lib/queries/workspace"
import { formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Header } from "@/components/layout/header"

interface PageProps {
  params: Promise<{ workspaceSlug: string }>
}

export default async function SprintsPage({ params }: PageProps) {
  const { workspaceSlug } = await params
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const workspace = await getWorkspaceBySlug(workspaceSlug, session.user.id)
  if (!workspace) redirect("/sign-in")

  const sprints = await getWorkspaceSprints(workspace.id)
  const active = sprints.filter((s) => s.status === "ACTIVE")
  const planned = sprints.filter((s) => s.status === "PLANNED")

  return (
    <>
      <Header title="Sprints" workspaceSlug={workspaceSlug} />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl p-6 space-y-8">
          <Section title="Active" sprints={active} workspaceSlug={workspaceSlug} emptyText="No active sprints right now." />
          <Section title="Planned" sprints={planned} workspaceSlug={workspaceSlug} emptyText="No upcoming sprints planned." />
        </div>
      </div>
    </>
  )
}

interface SectionProps {
  title: string
  sprints: Awaited<ReturnType<typeof getWorkspaceSprints>>
  workspaceSlug: string
  emptyText: string
}

function Section({ title, sprints, workspaceSlug, emptyText }: SectionProps) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
        {title} ({sprints.length})
      </h2>
      {sprints.length === 0 ? (
        <Card className="flex items-center justify-center py-8">
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {sprints.map((sprint) => (
            <Card key={sprint.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-3 shrink-0 rounded-sm"
                      style={{ backgroundColor: sprint.project.color }}
                    />
                    <Link
                      href={`/${workspaceSlug}/projects/${sprint.project.slug}/sprints/${sprint.id}`}
                      className="font-semibold hover:underline"
                    >
                      {sprint.name}
                    </Link>
                    <Badge variant={sprint.status === "ACTIVE" ? "default" : "secondary"}>
                      {sprint.status === "ACTIVE" ? "Active" : "Planned"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      in{" "}
                      <Link
                        href={`/${workspaceSlug}/projects/${sprint.project.slug}`}
                        className="hover:underline"
                      >
                        {sprint.project.name}
                      </Link>
                    </span>
                  </div>
                  {sprint.goal && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {sprint.goal}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="size-3" />
                      {formatDate(sprint.startDate)} – {formatDate(sprint.endDate)}
                    </span>
                    <span>
                      {sprint.doneCount} / {sprint.issueCount} done
                    </span>
                  </div>
                  {sprint.issueCount > 0 && (
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${sprint.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}
