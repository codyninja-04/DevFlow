"use client"

import { PanelLeftCloseIcon, PanelLeftOpenIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { useSidebarStore } from "@/store/sidebar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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

interface AppSidebarProps {
  currentWorkspace: Workspace
  workspaces: Workspace[]
  projects: Project[]
}

export function AppSidebar({
  currentWorkspace,
  workspaces,
  projects,
}: AppSidebarProps) {
  const { isCollapsed, toggleCollapsed } = useSidebarStore()

  return (
    <aside
      className={cn(
        "hidden h-screen flex-col border-r bg-background transition-[width] duration-200 md:flex",
        isCollapsed ? "w-[52px]" : "w-60"
      )}
    >
      {/* Workspace switcher */}
      <div className="flex h-12 items-center px-2">
        <WorkspaceSwitcher
          currentWorkspace={currentWorkspace}
          workspaces={workspaces}
          isCollapsed={isCollapsed}
        />
      </div>

      <Separator />

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        <SidebarNav
          workspaceSlug={currentWorkspace.slug}
          projects={projects}
          isCollapsed={isCollapsed}
        />
      </div>

      <Separator />

      {/* Bottom: user + collapse toggle */}
      <div className="flex items-center justify-between px-2 py-2">
        <UserNav
          workspaceSlug={currentWorkspace.slug}
          isCollapsed={isCollapsed}
        />
        {!isCollapsed && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={toggleCollapsed}
                />
              }
            >
              <PanelLeftCloseIcon className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent side="right">Collapse sidebar</TooltipContent>
          </Tooltip>
        )}
        {isCollapsed && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={toggleCollapsed}
                  className="mx-auto"
                />
              }
            >
              <PanelLeftOpenIcon className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent side="right">Expand sidebar</TooltipContent>
          </Tooltip>
        )}
      </div>
    </aside>
  )
}
