import { cache } from "react"

import { prisma } from "@/lib/prisma"

/**
 * Get a workspace by slug, including membership check for the given user.
 * Returns null if workspace doesn't exist or user isn't a member.
 */
export const getWorkspaceBySlug = cache(
  async (slug: string, userId: string) => {
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
      include: {
        members: {
          where: { userId },
          select: { id: true, role: true },
        },
        _count: {
          select: { projects: true, members: true },
        },
      },
    })

    if (!workspace || workspace.members.length === 0) return null

    return {
      ...workspace,
      currentMember: workspace.members[0]!,
    }
  }
)

/**
 * Get all workspaces a user belongs to (for the workspace switcher).
 */
export const getUserWorkspaces = cache(async (userId: string) => {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    select: {
      role: true,
      workspace: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  })

  return memberships.map((m) => ({
    ...m.workspace,
    role: m.role,
  }))
})

/**
 * Get projects in a workspace (for sidebar nav).
 */
export const getWorkspaceProjects = cache(
  async (workspaceId: string) => {
    return prisma.project.findMany({
      where: { workspaceId, status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        slug: true,
        color: true,
        icon: true,
      },
      orderBy: { name: "asc" },
    })
  }
)

/**
 * Get workspace stats for dashboard.
 */
export const getWorkspaceStats = cache(async (workspaceId: string) => {
  const [projectCount, memberCount, openIssueCount, activeSprints] =
    await Promise.all([
      prisma.project.count({ where: { workspaceId, status: "ACTIVE" } }),
      prisma.workspaceMember.count({ where: { workspaceId } }),
      prisma.issue.count({
        where: {
          project: { workspaceId },
          status: { notIn: ["DONE", "CANCELLED"] },
        },
      }),
      prisma.sprint.count({
        where: {
          project: { workspaceId },
          status: "ACTIVE",
        },
      }),
    ])

  return { projectCount, memberCount, openIssueCount, activeSprints }
})

/**
 * Get all members of a workspace with their user info.
 */
export const getWorkspaceMembers = cache(async (workspaceId: string) => {
  return prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { joinedAt: "asc" },
  })
})

/**
 * Get recent activity in a workspace.
 */
export const getWorkspaceRecentActivity = cache(
  async (workspaceId: string, limit = 10) => {
    return prisma.activity.findMany({
      where: { project: { workspaceId } },
      include: {
        actor: { select: { id: true, name: true, image: true } },
        issue: { select: { id: true, title: true } },
        project: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    })
  }
)
