"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { createNotifications } from "@/lib/notifications"
import { prisma } from "@/lib/prisma"
import {
  createSprintSchema,
  moveIssueToSprintSchema,
  sprintIdSchema,
  updateSprintSchema,
} from "@/lib/validations/sprint"

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
      slug: true,
      workspaceId: true,
      workspace: { select: { slug: true } },
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

async function assertSprintAccess(sprintId: string, userId: string) {
  const sprint = await prisma.sprint.findUnique({
    where: { id: sprintId },
    select: {
      id: true,
      projectId: true,
      status: true,
      name: true,
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
  if (!sprint) throw new Error("Sprint not found")
  const member = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: sprint.project.workspaceId,
        userId,
      },
    },
    select: { role: true },
  })
  if (!member) throw new Error("Not a workspace member")
  return { sprint, member }
}

async function notifyWorkspaceMembers(
  workspaceId: string,
  actorId: string,
  type: "SPRINT_STARTED" | "SPRINT_COMPLETED",
  title: string,
  body: string,
  resourceId: string
) {
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    select: { userId: true },
  })
  await createNotifications(
    members.map((m) => ({
      userId: m.userId,
      type,
      title,
      body,
      resourceId,
    })),
    actorId
  )
}

function revalidateSprintPaths(workspaceSlug: string, projectSlug: string) {
  revalidatePath(`/${workspaceSlug}`)
  revalidatePath(`/${workspaceSlug}/sprints`)
  revalidatePath(`/${workspaceSlug}/projects/${projectSlug}`)
}

export async function createSprint(formData: FormData) {
  const user = await getUser()

  const data = createSprintSchema.parse({
    projectId: formData.get("projectId"),
    name: formData.get("name"),
    goal: (formData.get("goal") as string) || undefined,
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  })

  const { project, member } = await assertProjectMember(data.projectId, user.id)
  if (member.role === "VIEWER") throw new Error("Viewers cannot create sprints")

  await prisma.sprint.create({
    data: {
      projectId: data.projectId,
      name: data.name,
      goal: data.goal,
      startDate: data.startDate,
      endDate: data.endDate,
    },
  })

  revalidateSprintPaths(project.workspace.slug, project.slug)
}

export async function updateSprint(formData: FormData) {
  const user = await getUser()

  const raw = {
    sprintId: formData.get("sprintId") as string,
    name: (formData.get("name") as string) || undefined,
    goal: formData.has("goal")
      ? (formData.get("goal") as string) || null
      : undefined,
    startDate: (formData.get("startDate") as string) || undefined,
    endDate: (formData.get("endDate") as string) || undefined,
  }
  const data = updateSprintSchema.parse(raw)

  const { sprint, member } = await assertSprintAccess(data.sprintId, user.id)
  if (member.role === "VIEWER") throw new Error("Viewers cannot update sprints")

  await prisma.sprint.update({
    where: { id: data.sprintId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.goal !== undefined && { goal: data.goal }),
      ...(data.startDate !== undefined && { startDate: data.startDate }),
      ...(data.endDate !== undefined && { endDate: data.endDate }),
    },
  })

  revalidateSprintPaths(sprint.project.workspace.slug, sprint.project.slug)
  revalidatePath(
    `/${sprint.project.workspace.slug}/projects/${sprint.project.slug}/sprints/${sprint.id}`
  )
}

export async function startSprint(formData: FormData) {
  const user = await getUser()
  const data = sprintIdSchema.parse({ sprintId: formData.get("sprintId") })

  const { sprint, member } = await assertSprintAccess(data.sprintId, user.id)
  if (member.role === "VIEWER") throw new Error("Viewers cannot start sprints")
  if (sprint.status !== "PLANNED")
    throw new Error("Only planned sprints can be started")

  // Only one ACTIVE sprint per project at a time
  const activeCount = await prisma.sprint.count({
    where: { projectId: sprint.projectId, status: "ACTIVE" },
  })
  if (activeCount > 0)
    throw new Error("Another sprint is already active in this project")

  await prisma.$transaction([
    prisma.sprint.update({
      where: { id: data.sprintId },
      data: { status: "ACTIVE" },
    }),
    prisma.activity.create({
      data: {
        projectId: sprint.projectId,
        actorId: user.id,
        type: "SPRINT_STARTED",
        metadata: { sprintId: sprint.id, sprintName: sprint.name },
      },
    }),
  ])

  await notifyWorkspaceMembers(
    sprint.project.workspaceId,
    user.id,
    "SPRINT_STARTED",
    `Sprint started: ${sprint.name}`,
    sprint.name,
    sprint.id
  )

  revalidateSprintPaths(sprint.project.workspace.slug, sprint.project.slug)
}

export async function completeSprint(formData: FormData) {
  const user = await getUser()
  const data = sprintIdSchema.parse({ sprintId: formData.get("sprintId") })

  const { sprint, member } = await assertSprintAccess(data.sprintId, user.id)
  if (member.role === "VIEWER")
    throw new Error("Viewers cannot complete sprints")
  if (sprint.status !== "ACTIVE")
    throw new Error("Only active sprints can be completed")

  await prisma.$transaction([
    prisma.sprint.update({
      where: { id: data.sprintId },
      data: { status: "COMPLETED", completedAt: new Date() },
    }),
    prisma.activity.create({
      data: {
        projectId: sprint.projectId,
        actorId: user.id,
        type: "SPRINT_COMPLETED",
        metadata: { sprintId: sprint.id, sprintName: sprint.name },
      },
    }),
  ])

  await notifyWorkspaceMembers(
    sprint.project.workspaceId,
    user.id,
    "SPRINT_COMPLETED",
    `Sprint completed: ${sprint.name}`,
    sprint.name,
    sprint.id
  )

  revalidateSprintPaths(sprint.project.workspace.slug, sprint.project.slug)
}

export async function deleteSprint(formData: FormData) {
  const user = await getUser()
  const data = sprintIdSchema.parse({ sprintId: formData.get("sprintId") })

  const { sprint, member } = await assertSprintAccess(data.sprintId, user.id)
  if (member.role === "VIEWER") throw new Error("Viewers cannot delete sprints")

  // Detach issues (don't delete them) then remove the sprint
  await prisma.$transaction([
    prisma.issue.updateMany({
      where: { sprintId: data.sprintId },
      data: { sprintId: null },
    }),
    prisma.sprint.delete({ where: { id: data.sprintId } }),
  ])

  const wsSlug = sprint.project.workspace.slug
  revalidateSprintPaths(wsSlug, sprint.project.slug)
  redirect(`/${wsSlug}/projects/${sprint.project.slug}`)
}

export async function moveIssueToSprint(formData: FormData) {
  const user = await getUser()
  const data = moveIssueToSprintSchema.parse({
    issueId: formData.get("issueId"),
    sprintId: (formData.get("sprintId") as string) || null,
  })

  const issue = await prisma.issue.findUnique({
    where: { id: data.issueId },
    select: {
      id: true,
      projectId: true,
      project: {
        select: {
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
        userId: user.id,
      },
    },
    select: { role: true },
  })
  if (!member) throw new Error("Not a workspace member")
  if (member.role === "VIEWER") throw new Error("Viewers cannot move issues")

  if (data.sprintId) {
    const sprint = await prisma.sprint.findUnique({
      where: { id: data.sprintId },
      select: { projectId: true },
    })
    if (!sprint || sprint.projectId !== issue.projectId)
      throw new Error("Sprint does not belong to this project")
  }

  await prisma.issue.update({
    where: { id: data.issueId },
    data: { sprintId: data.sprintId },
  })

  revalidateSprintPaths(issue.project.workspace.slug, issue.project.slug)
}
