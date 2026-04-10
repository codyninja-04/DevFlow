import { notFound, redirect } from "next/navigation"

import { auth } from "@/auth"
import {
  getWorkspaceBySlug,
  getUserWorkspaces,
  getWorkspaceProjects,
} from "@/lib/queries/workspace"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { MobileSidebar } from "@/components/layout/mobile-sidebar"

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ workspaceSlug: string }>
}

export default async function WorkspaceLayout({
  children,
  params,
}: LayoutProps) {
  const { workspaceSlug } = await params
  const session = await auth()

  if (!session?.user?.id) redirect("/sign-in")

  const [workspace, workspaces] = await Promise.all([
    getWorkspaceBySlug(workspaceSlug, session.user.id),
    getUserWorkspaces(session.user.id),
  ])

  if (!workspace) notFound()

  const workspaceProjects = await getWorkspaceProjects(workspace.id)

  const sidebarData = {
    currentWorkspace: {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      logoUrl: workspace.logoUrl,
    },
    workspaces: workspaces.map((w) => ({
      id: w.id,
      name: w.name,
      slug: w.slug,
      logoUrl: w.logoUrl,
    })),
    projects: workspaceProjects,
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar {...sidebarData} />
      <MobileSidebar {...sidebarData} />
      <main className="flex flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}
