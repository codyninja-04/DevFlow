import type { NotificationType } from "@prisma/client"

import { prisma } from "@/lib/prisma"

export interface CreateNotificationInput {
  userId: string
  type: NotificationType
  title: string
  body?: string
  resourceId?: string
}

/**
 * Server-only helper to create notifications. Skips notifications where the
 * recipient is the same as the actor (you don't notify yourself).
 */
export async function createNotifications(
  inputs: CreateNotificationInput[],
  actorId?: string
) {
  const filtered = actorId
    ? inputs.filter((n) => n.userId !== actorId)
    : inputs
  if (filtered.length === 0) return
  await prisma.notification.createMany({ data: filtered })
}
