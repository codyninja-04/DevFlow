"use client"

import { useSession } from "next-auth/react"
import {
  LogOutIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react"

import { cn, generateInitials } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface UserNavProps {
  workspaceSlug: string
  isCollapsed?: boolean
}

export function UserNav({ workspaceSlug, isCollapsed }: UserNavProps) {
  const { data: session } = useSession()
  const user = session?.user

  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-muted outline-none transition-colors",
          isCollapsed && "justify-center px-0"
        )}
      >
        <Avatar size="sm">
          {user.image && <AvatarImage src={user.image} alt={user.name ?? ""} />}
          <AvatarFallback>
            {generateInitials(user.name ?? user.email ?? "U")}
          </AvatarFallback>
        </Avatar>
        {!isCollapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-sm font-medium">{user.name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {user.email}
            </span>
          </div>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col">
            <span className="text-sm font-medium">{user.name}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <UserIcon />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem>
          <SettingsIcon />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          render={
            <form
              action={async () => {
                const { signOut } = await import("next-auth/react")
                await signOut({ redirectTo: "/sign-in" })
              }}
            >
              <button type="submit" className="flex w-full items-center gap-1.5">
                <LogOutIcon className="size-4" />
                Sign out
              </button>
            </form>
          }
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
