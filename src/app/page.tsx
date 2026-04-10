import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export default async function HomePage() {
  const session = await auth()

  if (!session?.user?.id) redirect("/sign-in")

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    select: { workspace: { select: { slug: true } } },
    orderBy: { joinedAt: "asc" },
  })

  if (!membership) redirect("/onboarding")

  redirect(`/${membership.workspace.slug}`)
}
