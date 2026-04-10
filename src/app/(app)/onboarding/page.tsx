"use server"

import { redirect } from "next/navigation"
import { UserRole } from "@prisma/client"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default async function OnboardingPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  // If they already have a workspace, skip onboarding
  const existing = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    select: { workspace: { select: { slug: true } } },
  })
  if (existing) redirect(`/${existing.workspace.slug}`)

  async function createWorkspace(formData: FormData) {
    "use server"

    const innerSession = await auth()
    if (!innerSession?.user?.id) redirect("/sign-in")

    const name = (formData.get("name") as string | null)?.trim()
    if (!name) return

    const baseSlug = slugify(name)

    // Ensure slug uniqueness
    const count = await prisma.workspace.count({
      where: { slug: { startsWith: baseSlug } },
    })
    const slug = count === 0 ? baseSlug : `${baseSlug}-${count}`

    const workspace = await prisma.workspace.create({
      data: {
        name,
        slug,
        members: {
          create: {
            userId: innerSession.user.id,
            role: UserRole.ADMIN,
          },
        },
      },
    })

    redirect(`/${workspace.slug}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Create your workspace</CardTitle>
          <CardDescription>
            A workspace is where your team collaborates on projects and issues.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createWorkspace} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Workspace name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Acme Corp"
                required
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full">
              Create workspace
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
