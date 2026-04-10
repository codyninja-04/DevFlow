import { cache } from "react"

import { prisma } from "@/lib/prisma"

/**
 * Sprints for a single project, ordered by status (active → planned → completed)
 * and then by start date.
 */
export const getProjectSprints = cache(async (projectId: string) => {
  const sprints = await prisma.sprint.findMany({
    where: { projectId },
    include: {
      _count: { select: { issues: true } },
      issues: {
        select: { id: true, status: true, storyPoints: true },
      },
    },
    orderBy: [{ status: "asc" }, { startDate: "desc" }],
  })

  return sprints.map((s) => {
    const total = s.issues.length
    const done = s.issues.filter(
      (i) => i.status === "DONE" || i.status === "CANCELLED"
    ).length
    const points = s.issues.reduce((sum, i) => sum + (i.storyPoints ?? 0), 0)
    const donePoints = s.issues
      .filter((i) => i.status === "DONE")
      .reduce((sum, i) => sum + (i.storyPoints ?? 0), 0)
    return {
      id: s.id,
      projectId: s.projectId,
      name: s.name,
      goal: s.goal,
      status: s.status,
      startDate: s.startDate,
      endDate: s.endDate,
      completedAt: s.completedAt,
      issueCount: total,
      doneCount: done,
      progress: total === 0 ? 0 : Math.round((done / total) * 100),
      totalPoints: points,
      donePoints,
    }
  })
})

/**
 * Active and planned sprints across all projects in a workspace.
 */
export const getWorkspaceSprints = cache(async (workspaceId: string) => {
  const sprints = await prisma.sprint.findMany({
    where: {
      project: { workspaceId },
      status: { in: ["ACTIVE", "PLANNED"] },
    },
    include: {
      project: { select: { id: true, name: true, slug: true, color: true } },
      _count: { select: { issues: true } },
      issues: { select: { status: true } },
    },
    orderBy: [{ status: "asc" }, { startDate: "asc" }],
  })

  return sprints.map((s) => {
    const total = s.issues.length
    const done = s.issues.filter(
      (i) => i.status === "DONE" || i.status === "CANCELLED"
    ).length
    return {
      id: s.id,
      name: s.name,
      goal: s.goal,
      status: s.status,
      startDate: s.startDate,
      endDate: s.endDate,
      project: s.project,
      issueCount: total,
      doneCount: done,
      progress: total === 0 ? 0 : Math.round((done / total) * 100),
    }
  })
})

/**
 * Single sprint by ID with project info.
 */
export const getSprintById = cache(async (sprintId: string) => {
  return prisma.sprint.findUnique({
    where: { id: sprintId },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          slug: true,
          color: true,
          workspaceId: true,
          workspace: { select: { slug: true } },
        },
      },
      _count: { select: { issues: true } },
    },
  })
})
