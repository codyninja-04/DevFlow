"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { auth } from "@/auth"
import { createNotifications } from "@/lib/notifications"
import { prisma } from "@/lib/prisma"

const addCommentSchema = z.object({
  issueId: z.string().min(1),
  body: z.string().min(1, "Comment cannot be empty").max(5000),
})

export async function addComment(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const data = addCommentSchema.parse({
    issueId: formData.get("issueId"),
    body: formData.get("body"),
  })

  const issue = await prisma.issue.findUnique({
    where: { id: data.issueId },
    select: {
      id: true,
      title: true,
      assigneeId: true,
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

  // Verify membership
  const member = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: issue.project.workspaceId,
        userId: session.user.id,
      },
    },
  })
  if (!member) throw new Error("Not a workspace member")

  await prisma.$transaction([
    prisma.comment.create({
      data: {
        issueId: data.issueId,
        authorId: session.user.id,
        body: data.body,
      },
    }),
    prisma.activity.create({
      data: {
        projectId: issue.projectId,
        issueId: data.issueId,
        actorId: session.user.id,
        type: "COMMENT_ADDED",
      },
    }),
  ])

  if (issue.assigneeId) {
    await createNotifications(
      [
        {
          userId: issue.assigneeId,
          type: "ISSUE_COMMENTED",
          title: "New comment",
          body: issue.title,
          resourceId: issue.id,
        },
      ],
      session.user.id
    )
  }

  const wsSlug = issue.project.workspace.slug
  revalidatePath(`/${wsSlug}/issues/${data.issueId}`)
}
