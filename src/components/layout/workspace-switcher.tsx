"use client"

import Link from "next/link"
import { ChevronsUpDownIcon, PlusIcon } from "lucide-react"

import { cn, generateInitials } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Workspace {
  id: string
  name: string
  slug: string
  logoUrl: string | null
}

interface WorkspaceSwitcherProps {
  currentWorkspace: Workspace
  workspaces: Workspace[]
  isCollapsed?: boolean
}

export function WorkspaceSwitcher({
  currentWorkspace,
  workspaces,
  isCollapsed,
}: WorkspaceSwitcherProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm font-medium hover:bg-muted outline-none transition-colors",
          isCollapsed && "justify-center px-0"
        )}
      >
        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-[0.625rem] font-bold text-primary-foreground">
          {generateInitials(currentWorkspace.name)}
        </span>
        {!isCollapsed && (
          <>
            <span className="truncate">{currentWorkspace.name}</span>
            <ChevronsUpDownIcon className="ml-auto size-4 shrink-0 text-muted-foreground" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="start" className="w-56">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        {workspaces.map((ws) => (
          <DropdownMenuItem key={ws.id} render={<Link href={`/${ws.slug}`} />}>
            <span className="flex size-5 shrink-0 items-center justify-center rounded bg-primary/10 text-[0.5rem] font-bold text-primary">
              {generateInitials(ws.name)}
            </span>
            <span className="truncate">{ws.name}</span>
            {ws.id === currentWorkspace.id && (
              <span className="ml-auto size-1.5 rounded-full bg-primary" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/onboarding" />}>
          <PlusIcon />
          Create workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
