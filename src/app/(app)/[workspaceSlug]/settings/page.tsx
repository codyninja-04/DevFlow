import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { getWorkspaceBySlug } from "@/lib/queries/workspace"
import { Header } from "@/components/layout/header"
import { WorkspaceSettingsForm } from "@/components/layout/workspace-settings-form"

interface PageProps {
  params: Promise<{ workspaceSlug: string }>
}

export default async function SettingsPage({ params }: PageProps) {
  const { workspaceSlug } = await params
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const workspace = await getWorkspaceBySlug(workspaceSlug, session.user.id)
  if (!workspace) redirect("/sign-in")

  const isAdmin = workspace.currentMember.role === "ADMIN"

  return (
    <>
      <Header title="Settings" workspaceSlug={workspaceSlug} />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl space-y-4 p-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
            <p className="text-sm text-muted-foreground">
              Manage your workspace configuration.
            </p>
          </div>
          <WorkspaceSettingsForm
            workspace={{
              id: workspace.id,
              name: workspace.name,
              slug: workspace.slug,
              description: workspace.description ?? null,
              logoUrl: workspace.logoUrl ?? null,
            }}
            isAdmin={isAdmin}
          />
        </div>
      </div>
    </>
  )
}
