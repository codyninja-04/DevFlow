"use server"

import { revalidatePath } from "next/cache"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createLabelSchema, deleteLabelSchema } from "@/lib/validations/label"

export async function createLabel(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const data = createLabelSchema.parse({
    projectId: formData.get("projectId"),
    name: formData.get("name"),
    color: formData.get("color") || undefined,
  })

  const project = await prisma.project.findUnique({
    where: { id: data.projectId },
    select: { workspaceId: true, slug: true, workspace: { select: { slug: true } } },
  })
  if (!project) throw new Error("Project not found")

  const member = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId: project.workspaceId, userId: session.user.id },
    },
    select: { role: true },
  })
  if (!member) throw new Error("Not a workspace member")
  if (member.role === "VIEWER") throw new Error("Viewers cannot create labels")

  await prisma.label.create({
    data: {
      projectId: data.projectId,
      name: data.name,
      color: data.color,
    },
  })

  revalidatePath(`/${project.workspace.slug}/projects/${project.slug}`)
}

export async function deleteLabel(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const data = deleteLabelSchema.parse({
    labelId: formData.get("labelId"),
  })

  const label = await prisma.label.findUnique({
    where: { id: data.labelId },
    select: {
      project: {
        select: { workspaceId: true, slug: true, workspace: { select: { slug: true } } },
      },
    },
  })
  if (!label) throw new Error("Label not found")

  const member = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: label.project.workspaceId,
        userId: session.user.id,
      },
    },
    select: { role: true },
  })
  if (!member) throw new Error("Not a workspace member")
  if (member.role === "VIEWER") throw new Error("Viewers cannot delete labels")

  await prisma.label.delete({ where: { id: data.labelId } })

  revalidatePath(`/${label.project.workspace.slug}/projects/${label.project.slug}`)
}
