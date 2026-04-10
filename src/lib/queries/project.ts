import { cache } from "react"

import { prisma } from "@/lib/prisma"

/**
 * Get all projects in a workspace with issue counts.
 */
export const getWorkspaceProjectsWithStats = cache(
  async (workspaceId: string) => {
    return prisma.project.findMany({
      where: { workspaceId },
      include: {
        _count: {
          select: {
            issues: true,
            sprints: true,
          },
        },
      },
      orderBy: [{ status: "asc" }, { name: "asc" }],
    })
  }
)

/**
 * Get a single project by slug within a workspace.
 */
export const getProjectBySlug = cache(
  async (workspaceId: string, projectSlug: string) => {
    return prisma.project.findUnique({
      where: { workspaceId_slug: { workspaceId, slug: projectSlug } },
      include: {
        _count: {
          select: {
            issues: true,
            sprints: true,
            labels: true,
          },
        },
      },
    })
  }
)

/**
 * Get project issue stats breakdown by status.
 */
export const getProjectIssueStats = cache(async (projectId: string) => {
  const issues = await prisma.issue.groupBy({
    by: ["status"],
    where: { projectId },
    _count: { status: true },
  })

  const total = issues.reduce((sum, i) => sum + i._count.status, 0)
  const done =
    issues.find((i) => i.status === "DONE")?._count.status ?? 0
  const cancelled =
    issues.find((i) => i.status === "CANCELLED")?._count.status ?? 0

  return {
    total,
    open: total - done - cancelled,
    done,
    cancelled,
    byStatus: Object.fromEntries(
      issues.map((i) => [i.status, i._count.status])
    ) as Record<string, number>,
  }
})
