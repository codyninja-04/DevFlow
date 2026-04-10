import { cache } from "react"
import type { Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { DEFAULT_PAGE_SIZE } from "@/config/constants"

export interface IssueFilters {
  status?: string[]
  priority?: string[]
  type?: string[]
  assigneeId?: string | null
  sprintId?: string | null
  search?: string
}

/**
 * Get issues for a project with filters and pagination.
 */
export const getProjectIssues = cache(
  async (
    projectId: string,
    filters: IssueFilters = {},
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE
  ) => {
    const where: Prisma.IssueWhereInput = {
      projectId,
      ...(filters.status?.length && { status: { in: filters.status as any } }),
      ...(filters.priority?.length && {
        priority: { in: filters.priority as any },
      }),
      ...(filters.type?.length && { type: { in: filters.type as any } }),
      ...(filters.assigneeId !== undefined && {
        assigneeId: filters.assigneeId,
      }),
      ...(filters.sprintId !== undefined && { sprintId: filters.sprintId }),
      ...(filters.search && {
        title: { contains: filters.search, mode: "insensitive" as const },
      }),
    }

    const [issues, total] = await Promise.all([
      prisma.issue.findMany({
        where,
        include: {
          assignee: { select: { id: true, name: true, image: true } },
          creator: { select: { id: true, name: true, image: true } },
          labels: {
            include: { label: { select: { id: true, name: true, color: true } } },
          },
          _count: { select: { comments: true, subIssues: true } },
        },
        orderBy: [{ orderIndex: "asc" }, { createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.issue.count({ where }),
    ])

    return {
      issues: issues.map((issue) => ({
        ...issue,
        labels: issue.labels.map((il) => il.label),
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }
  }
)

/**
 * Get issues across all projects in a workspace.
 */
export const getWorkspaceIssues = cache(
  async (
    workspaceId: string,
    filters: IssueFilters = {},
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE
  ) => {
    const where: Prisma.IssueWhereInput = {
      project: { workspaceId },
      ...(filters.status?.length && { status: { in: filters.status as any } }),
      ...(filters.priority?.length && {
        priority: { in: filters.priority as any },
      }),
      ...(filters.type?.length && { type: { in: filters.type as any } }),
      ...(filters.assigneeId !== undefined && {
        assigneeId: filters.assigneeId,
      }),
      ...(filters.search && {
        title: { contains: filters.search, mode: "insensitive" as const },
      }),
    }

    const [issues, total] = await Promise.all([
      prisma.issue.findMany({
        where,
        include: {
          project: { select: { id: true, name: true, slug: true, color: true } },
          assignee: { select: { id: true, name: true, image: true } },
          creator: { select: { id: true, name: true, image: true } },
          labels: {
            include: { label: { select: { id: true, name: true, color: true } } },
          },
          _count: { select: { comments: true, subIssues: true } },
        },
        orderBy: [{ createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.issue.count({ where }),
    ])

    return {
      issues: issues.map((issue) => ({
        ...issue,
        labels: issue.labels.map((il) => il.label),
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }
  }
)

/**
 * Get all issues for a project's kanban board, grouped by status and ordered
 * by orderIndex within each column.
 */
export const getProjectBoardIssues = cache(async (projectId: string) => {
  const issues = await prisma.issue.findMany({
    where: { projectId },
    include: {
      assignee: { select: { id: true, name: true, image: true } },
      creator: { select: { id: true, name: true, image: true } },
      labels: {
        include: { label: { select: { id: true, name: true, color: true } } },
      },
      _count: { select: { comments: true, subIssues: true } },
    },
    orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
  })

  return issues.map((issue) => ({
    ...issue,
    labels: issue.labels.map((il) => il.label),
  }))
})

/**
 * Get a single issue by ID with full detail.
 */
export const getIssueById = cache(async (issueId: string) => {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
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
      assignee: { select: { id: true, name: true, email: true, image: true } },
      creator: { select: { id: true, name: true, email: true, image: true } },
      sprint: { select: { id: true, name: true, status: true } },
      parent: { select: { id: true, title: true } },
      subIssues: {
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          assignee: { select: { id: true, name: true, image: true } },
        },
        orderBy: { orderIndex: "asc" },
      },
      labels: {
        include: { label: { select: { id: true, name: true, color: true } } },
      },
      comments: {
        include: {
          author: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      activities: {
        include: {
          actor: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      _count: { select: { comments: true, subIssues: true, watchers: true } },
    },
  })

  if (!issue) return null

  return {
    ...issue,
    labels: issue.labels.map((il) => il.label),
  }
})

/**
 * Get workspace members for assignee selector.
 */
export const getWorkspaceMembers = cache(async (workspaceId: string) => {
  return prisma.workspaceMember.findMany({
    where: { workspaceId },
    select: {
      userId: true,
      role: true,
      user: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { user: { name: "asc" } },
  })
})

/**
 * Get project labels for label selector.
 */
export const getProjectLabels = cache(async (projectId: string) => {
  return prisma.label.findMany({
    where: { projectId },
    select: { id: true, name: true, color: true },
    orderBy: { name: "asc" },
  })
})
