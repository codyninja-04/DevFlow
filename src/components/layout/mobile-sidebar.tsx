"use client"

import { MenuIcon } from "lucide-react"

import { useSidebarStore } from "@/store/sidebar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet"
import { SidebarNav } from "./sidebar-nav"
import { UserNav } from "./user-nav"
import { WorkspaceSwitcher } from "./workspace-switcher"

interface Workspace {
  id: string
  name: string
  slug: string
  logoUrl: string | null
}

interface Project {
  id: string
  name: string
  slug: string
  color: string
  icon: string | null
}

interface MobileSidebarProps {
  currentWorkspace: Workspace
  workspaces: Workspace[]
  projects: Project[]
}

export function MobileSidebarTrigger() {
  const { toggle } = useSidebarStore()

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={toggle}
      className="md:hidden"
    >
      <MenuIcon className="size-4" />
      <span className="sr-only">Toggle menu</span>
    </Button>
  )
}

export function MobileSidebar({
  currentWorkspace,
  workspaces,
  projects,
}: MobileSidebarProps) {
  const { isOpen, setOpen } = useSidebarStore()

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent side="left" className="w-60 p-0" showCloseButton={false}>
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <div className="flex h-12 items-center px-2">
          <WorkspaceSwitcher
            currentWorkspace={currentWorkspace}
            workspaces={workspaces}
          />
        </div>

        <Separator />

        <div className="flex-1 overflow-y-auto px-2 py-2">
          <SidebarNav
            workspaceSlug={currentWorkspace.slug}
            projects={projects}
          />
        </div>

        <Separator />

        <div className="px-2 py-2">
          <UserNav workspaceSlug={currentWorkspace.slug} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
