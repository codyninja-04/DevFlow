"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/utils"
import {
  createProjectSchema,
  deleteProjectSchema,
  updateProjectSchema,
} from "@/lib/validations/project"

async function getAuthenticatedUser() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  return { ...session.user, id: session.user.id }
}

async function assertWorkspaceMember(workspaceId: string, userId: string) {
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    select: { role: true },
  })
  if (!member) throw new Error("Not a member of this workspace")
  return member
}

async function assertProjectAccess(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, workspaceId: true, workspace: { select: { slug: true } } },
  })
  if (!project) throw new Error("Project not found")

  const member = await assertWorkspaceMember(project.workspaceId, userId)
  return { project, member }
}

export async function createProject(formData: FormData) {
  const user = await getAuthenticatedUser()

  const raw = {
    workspaceId: formData.get("workspaceId") as string,
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || undefined,
    color: (formData.get("color") as string) || undefined,
    startDate: (formData.get("startDate") as string) || undefined,
    targetDate: (formData.get("targetDate") as string) || undefined,
  }

  const data = createProjectSchema.parse(raw)
  const membership = await assertWorkspaceMember(data.workspaceId, user.id)

  if (membership.role === "VIEWER") {
    throw new Error("Viewers cannot create projects")
  }

  const baseSlug = slugify(data.name)
  const count = await prisma.project.count({
    where: { workspaceId: data.workspaceId, slug: { startsWith: baseSlug } },
  })
  const slug = count === 0 ? baseSlug : `${baseSlug}-${count}`

  const workspace = await prisma.workspace.findUniqueOrThrow({
    where: { id: data.workspaceId },
    select: { slug: true },
  })

  await prisma.project.create({
    data: {
      workspaceId: data.workspaceId,
      name: data.name,
      slug,
      description: data.description,
      color: data.color,
      startDate: data.startDate,
      targetDate: data.targetDate,
    },
  })

  revalidatePath(`/${workspace.slug}`)
  revalidatePath(`/${workspace.slug}/projects`)
  redirect(`/${workspace.slug}/projects`)
}

export async function updateProject(formData: FormData) {
  const user = await getAuthenticatedUser()

  const raw = {
    projectId: formData.get("projectId") as string,
    name: (formData.get("name") as string) || undefined,
    description: formData.has("description")
      ? (formData.get("description") as string) || null
      : undefined,
    status: (formData.get("status") as string) || undefined,
    color: (formData.get("color") as string) || undefined,
    startDate: formData.has("startDate")
      ? (formData.get("startDate") as string) || null
      : undefined,
    targetDate: formData.has("targetDate")
      ? (formData.get("targetDate") as string) || null
      : undefined,
  }

  const data = updateProjectSchema.parse(raw)
  const { project, member } = await assertProjectAccess(data.projectId, user.id)

  if (member.role === "VIEWER") {
    throw new Error("Viewers cannot update projects")
  }

  await prisma.project.update({
    where: { id: data.projectId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.color !== undefined && { color: data.color }),
      ...(data.startDate !== undefined && { startDate: data.startDate }),
      ...(data.targetDate !== undefined && { targetDate: data.targetDate }),
    },
  })

  revalidatePath(`/${project.workspace.slug}`)
  revalidatePath(`/${project.workspace.slug}/projects`)
}

export async function deleteProject(formData: FormData) {
  const user = await getAuthenticatedUser()

  const data = deleteProjectSchema.parse({
    projectId: formData.get("projectId") as string,
  })

  const { project, member } = await assertProjectAccess(data.projectId, user.id)

  if (member.role !== "ADMIN") {
    throw new Error("Only admins can delete projects")
  }

  await prisma.project.delete({ where: { id: data.projectId } })

  revalidatePath(`/${project.workspace.slug}`)
  redirect(`/${project.workspace.slug}/projects`)
}
