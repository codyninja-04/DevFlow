"use server"

import { revalidatePath } from "next/cache"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

async function getUserId() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  return session.user.id
}

export async function markNotificationRead(formData: FormData) {
  const userId = await getUserId()
  const id = formData.get("id") as string
  if (!id) throw new Error("Missing id")

  await prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true },
  })

  revalidatePath("/", "layout")
}

export async function markAllNotificationsRead() {
  const userId = await getUserId()
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  })
  revalidatePath("/", "layout")
}
