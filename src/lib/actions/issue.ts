"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { createNotifications } from "@/lib/notifications"
import { prisma } from "@/lib/prisma"
import {
  createIssueSchema,
  deleteIssueSchema,
  reorderIssueSchema,
  updateIssueSchema,
} from "@/lib/validations/issue"

async function getUser() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  return { ...session.user, id: session.user.id }
}

async function assertProjectMember(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      workspaceId: true,
      workspace: { select: { slug: true } },
      slug: true,
    },
  })
  if (!project) throw new Error("Project not found")

  const member = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId: project.workspaceId, userId },
    },
    select: { role: true },
  })
  if (!member) throw new Error("Not a workspace member")

  return { project, member }
}

async function assertIssueAccess(issueId: string, userId: string) {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    select: {
      id: true,
      projectId: true,
      title: true,
      status: true,
      priority: true,
      assigneeId: true,
      project: {
        select: {
          id: true,
          slug: true,
          workspaceId: true,
          workspace: { select: { slug: true } },
        },
      },
    },
  })
  if (!issue) throw new Error("Issue not found")

  const member = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: issue.project.workspaceId,
        userId,
      },
    },
    select: { role: true },
  })
  if (!member) throw new Error("Not a workspace member")

  return { issue, member }
}

export async function createIssue(formData: FormData) {
  const user = await getUser()

  const labelIdsRaw = formData.get("labelIds") as string | null
  const raw = {
    projectId: formData.get("projectId") as string,
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || undefined,
    status: (formData.get("status") as string) || undefined,
    priority: (formData.get("priority") as string) || undefined,
    type: (formData.get("type") as string) || undefined,
    assigneeId: (formData.get("assigneeId") as string) || null,
    sprintId: (formData.get("sprintId") as string) || null,
    parentId: (formData.get("parentId") as string) || null,
    dueDate: (formData.get("dueDate") as string) || null,
    storyPoints: (formData.get("storyPoints") as string) || null,
    labelIds: labelIdsRaw ? labelIdsRaw.split(",").filter(Boolean) : undefined,
  }

  const data = createIssueSchema.parse(raw)
  const { project, member } = await assertProjectMember(
    data.projectId,
    user.id
  )

  if (member.role === "VIEWER") throw new Error("Viewers cannot create issues")

  // Get the max orderIndex for positioning
  const lastIssue = await prisma.issue.findFirst({
    where: { projectId: data.projectId },
    orderBy: { orderIndex: "desc" },
    select: { orderIndex: true },
  })
  const orderIndex = (lastIssue?.orderIndex ?? 0) + 1000

  const issue = await prisma.issue.create({
    data: {
      projectId: data.projectId,
      creatorId: user.id,
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      type: data.type,
      assigneeId: data.assigneeId,
      sprintId: data.sprintId,
      parentId: data.parentId,
      dueDate: data.dueDate,
      storyPoints: data.storyPoints,
      orderIndex,
      ...(data.labelIds?.length && {
        labels: {
          create: data.labelIds.map((labelId) => ({ labelId })),
        },
      }),
    },
  })

  // Log activity
  await prisma.activity.create({
    data: {
      projectId: data.projectId,
      issueId: issue.id,
      actorId: user.id,
      type: "ISSUE_CREATED",
    },
  })

  // Notify assignee
  if (data.assigneeId) {
    await createNotifications(
      [
        {
          userId: data.assigneeId,
          type: "ISSUE_ASSIGNED",
          title: "Assigned to issue",
          body: data.title,
          resourceId: issue.id,
        },
      ],
      user.id
    )
  }

  const wsSlug = project.workspace.slug
  revalidatePath(`/${wsSlug}`)
  revalidatePath(`/${wsSlug}/issues`)
  revalidatePath(`/${wsSlug}/projects/${project.slug}`)
}

export async function updateIssue(formData: FormData) {
  const user = await getUser()

  const labelIdsRaw = formData.get("labelIds") as string | null
  const raw = {
    issueId: formData.get("issueId") as string,
    title: (formData.get("title") as string) || undefined,
    description: formData.has("description")
      ? (formData.get("description") as string) || null
      : undefined,
    status: (formData.get("status") as string) || undefined,
    priority: (formData.get("priority") as string) || undefined,
    type: (formData.get("type") as string) || undefined,
    assigneeId: formData.has("assigneeId")
      ? (formData.get("assigneeId") as string) || null
      : undefined,
    sprintId: formData.has("sprintId")
      ? (formData.get("sprintId") as string) || null
      : undefined,
    dueDate: formData.has("dueDate")
      ? (formData.get("dueDate") as string) || null
      : undefined,
    storyPoints: formData.has("storyPoints")
      ? (formData.get("storyPoints") as string) || null
      : undefined,
    labelIds: labelIdsRaw ? labelIdsRaw.split(",").filter(Boolean) : undefined,
  }

  const data = updateIssueSchema.parse(raw)
  const { issue, member } = await assertIssueAccess(data.issueId, user.id)

  if (member.role === "VIEWER") throw new Error("Viewers cannot update issues")

  // Track changes for activity logging
  const activities: Array<{ type: string; metadata?: object }> = []

  if (data.status && data.status !== issue.status) {
    activities.push({
      type: "STATUS_CHANGED",
      metadata: { from: issue.status, to: data.status },
    })
  }
  if (data.priority && data.priority !== issue.priority) {
    activities.push({
      type: "PRIORITY_CHANGED",
      metadata: { from: issue.priority, to: data.priority },
    })
  }
  if (data.assigneeId !== undefined && data.assigneeId !== issue.assigneeId) {
    activities.push({
      type: data.assigneeId ? "ISSUE_ASSIGNED" : "ISSUE_UNASSIGNED",
      metadata: { from: issue.assigneeId, to: data.assigneeId },
    })
  }
  if (activities.length === 0 && Object.keys(data).length > 1) {
    activities.push({ type: "ISSUE_UPDATED" })
  }

  // Determine completedAt
  const completedAt =
    data.status === "DONE" || data.status === "CANCELLED"
      ? new Date()
      : data.status
        ? null
        : undefined

  await prisma.$transaction(async (tx) => {
    await tx.issue.update({
      where: { id: data.issueId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.assigneeId !== undefined && {
          assigneeId: data.assigneeId,
        }),
        ...(data.sprintId !== undefined && { sprintId: data.sprintId }),
        ...(data.dueDate !== undefined && { dueDate: data.dueDate }),
        ...(data.storyPoints !== undefined && {
          storyPoints: data.storyPoints,
        }),
        ...(completedAt !== undefined && { completedAt }),
      },
    })

    // Update labels if provided
    if (data.labelIds !== undefined) {
      await tx.issueLabel.deleteMany({ where: { issueId: data.issueId } })
      if (data.labelIds.length > 0) {
        await tx.issueLabel.createMany({
          data: data.labelIds.map((labelId) => ({
            issueId: data.issueId,
            labelId,
          })),
        })
      }
    }

    // Log activities
    if (activities.length > 0) {
      await tx.activity.createMany({
        data: activities.map((a) => ({
          projectId: issue.projectId,
          issueId: data.issueId,
          actorId: user.id,
          type: a.type as any,
          metadata: a.metadata ? (a.metadata as any) : undefined,
        })),
      })
    }
  })

  // Notifications
  const notifications: Parameters<typeof createNotifications>[0] = []
  if (data.assigneeId && data.assigneeId !== issue.assigneeId) {
    notifications.push({
      userId: data.assigneeId,
      type: "ISSUE_ASSIGNED",
      title: "Assigned to issue",
      body: issue.title,
      resourceId: issue.id,
    })
  }
  if (
    data.status &&
    data.status !== issue.status &&
    issue.assigneeId &&
    (data.assigneeId === undefined || data.assigneeId === issue.assigneeId)
  ) {
    notifications.push({
      userId: issue.assigneeId,
      type: "ISSUE_STATUS_CHANGED",
      title: `Status changed to ${data.status}`,
      body: issue.title,
      resourceId: issue.id,
    })
  }
  if (notifications.length > 0) {
    await createNotifications(notifications, user.id)
  }

  const wsSlug = issue.project.workspace.slug
  revalidatePath(`/${wsSlug}`)
  revalidatePath(`/${wsSlug}/issues`)
  revalidatePath(`/${wsSlug}/projects/${issue.project.slug}`)
  revalidatePath(`/${wsSlug}/issues/${data.issueId}`)
}

/**
 * Reorder an issue on the kanban board: change its status and/or position
 * relative to neighbors. `beforeId`/`afterId` are the issues sandwiching the
 * drop target in its destination column.
 */
export async function reorderIssue(input: {
  issueId: string
  status:
    | "BACKLOG"
    | "TODO"
    | "IN_PROGRESS"
    | "IN_REVIEW"
    | "DONE"
    | "CANCELLED"
  beforeId?: string | null
  afterId?: string | null
}) {
  const user = await getUser()
  const data = reorderIssueSchema.parse(input)

  const { issue, member } = await assertIssueAccess(data.issueId, user.id)
  if (member.role === "VIEWER") throw new Error("Viewers cannot move issues")

  // Resolve neighbor orderIndexes (must belong to same project)
  const [before, after] = await Promise.all([
    data.beforeId
      ? prisma.issue.findFirst({
          where: { id: data.beforeId, projectId: issue.projectId },
          select: { orderIndex: true },
        })
      : Promise.resolve(null),
    data.afterId
      ? prisma.issue.findFirst({
          where: { id: data.afterId, projectId: issue.projectId },
          select: { orderIndex: true },
        })
      : Promise.resolve(null),
  ])

  let newOrderIndex: number
  if (before && after) {
    newOrderIndex = (before.orderIndex + after.orderIndex) / 2
  } else if (before) {
    newOrderIndex = before.orderIndex + 1000
  } else if (after) {
    newOrderIndex = after.orderIndex - 1000
  } else {
    // Empty column — pick a fresh slot
    const tail = await prisma.issue.findFirst({
      where: { projectId: issue.projectId, status: data.status },
      orderBy: { orderIndex: "desc" },
      select: { orderIndex: true },
    })
    newOrderIndex = (tail?.orderIndex ?? 0) + 1000
  }

  const statusChanged = data.status !== issue.status
  const completedAt =
    statusChanged && (data.status === "DONE" || data.status === "CANCELLED")
      ? new Date()
      : statusChanged
        ? null
        : undefined

  await prisma.$transaction(async (tx) => {
    await tx.issue.update({
      where: { id: data.issueId },
      data: {
        status: data.status,
        orderIndex: newOrderIndex,
        ...(completedAt !== undefined && { completedAt }),
      },
    })

    if (statusChanged) {
      await tx.activity.create({
        data: {
          projectId: issue.projectId,
          issueId: data.issueId,
          actorId: user.id,
          type: "STATUS_CHANGED",
          metadata: { from: issue.status, to: data.status },
        },
      })
    }
  })

  const wsSlug = issue.project.workspace.slug
  revalidatePath(`/${wsSlug}/projects/${issue.project.slug}/board`)
  revalidatePath(`/${wsSlug}/projects/${issue.project.slug}`)
}

export async function deleteIssue(formData: FormData) {
  const user = await getUser()

  const data = deleteIssueSchema.parse({
    issueId: formData.get("issueId") as string,
  })

  const { issue, member } = await assertIssueAccess(data.issueId, user.id)

  if (member.role === "VIEWER") throw new Error("Viewers cannot delete issues")

  await prisma.issue.delete({ where: { id: data.issueId } })

  const wsSlug = issue.project.workspace.slug
  revalidatePath(`/${wsSlug}`)
  revalidatePath(`/${wsSlug}/issues`)
  revalidatePath(`/${wsSlug}/projects/${issue.project.slug}`)
}
