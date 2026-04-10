import { cache } from "react"

import { prisma } from "@/lib/prisma"

export const getUserNotifications = cache(
  async (userId: string, limit = 30) => {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    })
  }
)

export const getUnreadNotificationCount = cache(async (userId: string) => {
  return prisma.notification.count({ where: { userId, isRead: false } })
})
