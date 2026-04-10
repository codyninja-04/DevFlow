"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  FolderKanbanIcon,
  HomeIcon,
  LayersIcon,
  SettingsIcon,
  TicketIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface NavItem {
  title: string
  href: string
  icon: LucideIcon
}

interface SidebarNavProps {
  workspaceSlug: string
  projects: Array<{
    id: string
    name: string
    slug: string
    color: string
    icon: string | null
  }>
  isCollapsed?: boolean
}

function getNavItems(workspaceSlug: string): NavItem[] {
  const base = `/${workspaceSlug}`
  return [
    { title: "Dashboard", href: base, icon: HomeIcon },
    { title: "Issues", href: `${base}/issues`, icon: TicketIcon },
    { title: "Projects", href: `${base}/projects`, icon: FolderKanbanIcon },
    { title: "Sprints", href: `${base}/sprints`, icon: LayersIcon },
    { title: "Members", href: `${base}/members`, icon: UsersIcon },
    { title: "Settings", href: `${base}/settings`, icon: SettingsIcon },
  ]
}

export function SidebarNav({
  workspaceSlug,
  projects,
  isCollapsed,
}: SidebarNavProps) {
  const pathname = usePathname()
  const navItems = getNavItems(workspaceSlug)

  return (
    <nav className="flex flex-col gap-1">
      {/* Main navigation */}
      <div className="flex flex-col gap-0.5">
        {navItems.map((item) => {
          const isActive =
            item.href === `/${workspaceSlug}`
              ? pathname === item.href
              : pathname.startsWith(item.href)

          const link = (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors hover:bg-muted",
                isActive
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground",
                isCollapsed && "justify-center px-0"
              )}
            >
              <item.icon className="size-4 shrink-0" />
              {!isCollapsed && <span>{item.title}</span>}
            </Link>
          )

          if (isCollapsed) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger render={link} />
                <TooltipContent side="right">{item.title}</TooltipContent>
              </Tooltip>
            )
          }

          return link
        })}
      </div>

      {/* Projects section */}
      {projects.length > 0 && !isCollapsed && (
        <div className="mt-4">
          <h4 className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Projects
          </h4>
          <div className="flex flex-col gap-0.5">
            {projects.map((project) => {
              const href = `/${workspaceSlug}/projects/${project.slug}`
              const isActive = pathname.startsWith(href)

              return (
                <Link
                  key={project.id}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted",
                    isActive
                      ? "bg-muted text-foreground font-medium"
                      : "text-muted-foreground"
                  )}
                >
                  <span
                    className="size-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="truncate">{project.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </nav>
  )
}
