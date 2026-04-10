"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/utils"
import type { UserRole } from "@prisma/client"

async function requireAdmin(workspaceId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
  })
  if (!member || member.role !== "ADMIN") throw new Error("Admin access required")

  return { userId: session.user.id }
}

export async function inviteMember(formData: FormData) {
  const workspaceId = formData.get("workspaceId") as string
  const email = (formData.get("email") as string)?.trim().toLowerCase()
  const role = ((formData.get("role") as string) || "MEMBER") as UserRole

  if (!workspaceId || !email) throw new Error("Missing required fields")

  await requireAdmin(workspaceId)

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    throw new Error(`No account found for ${email}. They must sign up first.`)
  }

  const existing = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: user.id } },
  })
  if (existing) throw new Error("This user is already a member of the workspace.")

  await prisma.workspaceMember.create({
    data: { workspaceId, userId: user.id, role },
  })

  revalidatePath("/", "layout")
}

export async function removeMember(formData: FormData) {
  const workspaceId = formData.get("workspaceId") as string
  const memberId = formData.get("memberId") as string

  if (!workspaceId || !memberId) throw new Error("Missing required fields")

  const { userId } = await requireAdmin(workspaceId)

  const target = await prisma.workspaceMember.findUnique({
    where: { id: memberId },
  })
  if (!target || target.workspaceId !== workspaceId) throw new Error("Member not found")
  if (target.userId === userId) throw new Error("You cannot remove yourself")

  if (target.role === "ADMIN") {
    const adminCount = await prisma.workspaceMember.count({
      where: { workspaceId, role: "ADMIN" },
    })
    if (adminCount <= 1) throw new Error("Cannot remove the last admin")
  }

  await prisma.workspaceMember.delete({ where: { id: memberId } })
  revalidatePath("/", "layout")
}

export async function updateWorkspace(formData: FormData) {
  const workspaceId = formData.get("workspaceId") as string
  const name = (formData.get("name") as string)?.trim()
  const description = (formData.get("description") as string)?.trim() || null
  const logoUrl = (formData.get("logoUrl") as string)?.trim() || null

  if (!workspaceId || !name) throw new Error("Name is required")

  await requireAdmin(workspaceId)

  const newSlug = slugify(name)

  // Ensure slug uniqueness (exclude current workspace)
  const conflict = await prisma.workspace.findFirst({
    where: { slug: newSlug, id: { not: workspaceId } },
    select: { id: true },
  })
  const slug = conflict ? `${newSlug}-${Date.now().toString(36)}` : newSlug

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { name, slug, description, logoUrl },
  })

  revalidatePath("/", "layout")
  redirect(`/${slug}/settings`)
}

export async function deleteWorkspace(formData: FormData) {
  const workspaceId = formData.get("workspaceId") as string
  if (!workspaceId) throw new Error("Missing workspaceId")

  await requireAdmin(workspaceId)

  await prisma.workspace.delete({ where: { id: workspaceId } })

  // Redirect to another workspace or onboarding
  const session = await auth()
  const next = session?.user?.id
    ? await prisma.workspaceMember.findFirst({
        where: { userId: session.user.id },
        select: { workspace: { select: { slug: true } } },
      })
    : null

  redirect(next ? `/${next.workspace.slug}` : "/onboarding")
}

export async function updateMemberRole(
  memberId: string,
  workspaceId: string,
  role: UserRole
) {
  const { userId } = await requireAdmin(workspaceId)

  const target = await prisma.workspaceMember.findUnique({
    where: { id: memberId },
  })
  if (!target || target.workspaceId !== workspaceId) throw new Error("Member not found")
  if (target.userId === userId) throw new Error("You cannot change your own role")

  if (target.role === "ADMIN" && role !== "ADMIN") {
    const adminCount = await prisma.workspaceMember.count({
      where: { workspaceId, role: "ADMIN" },
    })
    if (adminCount <= 1) throw new Error("Cannot remove the last admin")
  }

  await prisma.workspaceMember.update({
    where: { id: memberId },
    data: { role },
  })

  revalidatePath("/", "layout")
}
