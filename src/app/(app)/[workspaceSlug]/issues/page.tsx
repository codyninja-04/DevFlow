import { redirect } from "next/navigation"
import { PlusIcon, TicketIcon } from "lucide-react"

import { auth } from "@/auth"
import { getWorkspaceIssues, getWorkspaceMembers } from "@/lib/queries/issue"
import { getWorkspaceBySlug } from "@/lib/queries/workspace"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/header"
import { IssueFilters } from "@/components/issues/issue-filters"
import { IssueList } from "@/components/issues/issue-list"

interface PageProps {
  params: Promise<{ workspaceSlug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function IssuesPage({ params, searchParams }: PageProps) {
  const { workspaceSlug } = await params
  const sp = await searchParams
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const workspace = await getWorkspaceBySlug(workspaceSlug, session.user.id)
  if (!workspace) redirect("/sign-in")

  const filters = {
    status: sp.status ? [sp.status as string] : undefined,
    priority: sp.priority ? [sp.priority as string] : undefined,
    type: sp.type ? [sp.type as string] : undefined,
    search: (sp.q as string) || undefined,
  }

  const page = Number(sp.page) || 1

  const { issues, total, totalPages } = await getWorkspaceIssues(
    workspace.id,
    filters,
    page
  )

  return (
    <>
      <Header title="Issues" workspaceSlug={workspaceSlug} />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl space-y-4 p-6">
          {/* Header + create button */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Issues</h2>
              <p className="text-sm text-muted-foreground">
                {total} issue{total !== 1 && "s"} across all projects
              </p>
            </div>
          </div>

          {/* Filters */}
          <IssueFilters />

          {/* Issue list */}
          {issues.length === 0 && !filters.search && !filters.status && !filters.priority && !filters.type ? (
            <div className="flex flex-col items-center justify-center rounded-lg border py-16">
              <TicketIcon className="mb-4 size-12 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold">No issues yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first issue from a project page.
              </p>
            </div>
          ) : (
            <IssueList
              issues={issues}
              workspaceSlug={workspaceSlug}
              showProject
            />
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              {page > 1 && (
                <a
                  href={`/${workspaceSlug}/issues?${new URLSearchParams({
                    ...Object.fromEntries(
                      Object.entries(sp).filter(([, v]) => typeof v === "string" && v) as [string, string][]
                    ),
                    page: String(page - 1),
                  })}`}
                >
                  <Button variant="outline" size="sm">
                    Previous
                  </Button>
                </a>
              )}
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <a
                  href={`/${workspaceSlug}/issues?${new URLSearchParams({
                    ...Object.fromEntries(
                      Object.entries(sp).filter(([, v]) => typeof v === "string" && v) as [string, string][]
                    ),
                    page: String(page + 1),
                  })}`}
                >
                  <Button variant="outline" size="sm">
                    Next
                  </Button>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
