import { redirect } from "next/navigation"
import { PlusIcon, UsersIcon } from "lucide-react"

import { auth } from "@/auth"
import { getWorkspaceBySlug } from "@/lib/queries/workspace"
import { getWorkspaceMembers } from "@/lib/queries/workspace"
import { removeMember } from "@/lib/actions/workspace"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Header } from "@/components/layout/header"
import { InviteMemberDialog } from "@/components/layout/invite-member-dialog"
import { MemberRoleSelect } from "@/components/layout/member-role-select"

interface PageProps {
  params: Promise<{ workspaceSlug: string }>
}

const ROLE_BADGE: Record<string, string> = {
  ADMIN: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  MEMBER: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  VIEWER: "bg-muted text-muted-foreground",
}

function formatDate(date: Date) {
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

export default async function MembersPage({ params }: PageProps) {
  const { workspaceSlug } = await params
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const workspace = await getWorkspaceBySlug(workspaceSlug, session.user.id)
  if (!workspace) redirect("/sign-in")

  const members = await getWorkspaceMembers(workspace.id)
  const isAdmin = workspace.currentMember.role === "ADMIN"

  return (
    <>
      <Header title="Members" workspaceSlug={workspaceSlug} />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-4 p-6">
          {/* Page heading */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Members</h2>
              <p className="text-sm text-muted-foreground">
                {members.length} member{members.length !== 1 ? "s" : ""} in this workspace
              </p>
            </div>
            {isAdmin && (
              <InviteMemberDialog workspaceId={workspace.id}>
                <Button>
                  <PlusIcon data-icon="inline-start" />
                  Invite member
                </Button>
              </InviteMemberDialog>
            )}
          </div>

          {/* Member list */}
          {members.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border py-16">
              <UsersIcon className="mb-4 size-12 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold">No members</h3>
            </div>
          ) : (
            <div className="rounded-lg border">
              {members.map((member, index) => {
                const isSelf = member.userId === session.user!.id
                const initials = member.user.name?.charAt(0)?.toUpperCase() ?? "?"

                return (
                  <div key={member.id}>
                    {index > 0 && <Separator />}
                    <div className="flex items-center gap-3 px-4 py-3">
                      {/* Avatar */}
                      <Avatar size="sm">
                        {member.user.image && (
                          <AvatarImage src={member.user.image} alt={member.user.name ?? ""} />
                        )}
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>

                      {/* Name + email */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {member.user.name ?? "Unknown"}
                          {isSelf && (
                            <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>
                          )}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {member.user.email}
                        </p>
                      </div>

                      {/* Joined date */}
                      <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                        Joined {formatDate(member.joinedAt)}
                      </span>

                      {/* Role */}
                      {isAdmin && !isSelf ? (
                        <MemberRoleSelect
                          memberId={member.id}
                          workspaceId={workspace.id}
                          currentRole={member.role}
                        />
                      ) : (
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_BADGE[member.role] ?? ROLE_BADGE.VIEWER}`}
                        >
                          {member.role.charAt(0) + member.role.slice(1).toLowerCase()}
                        </span>
                      )}

                      {/* Remove button */}
                      {isAdmin && !isSelf && (
                        <form action={removeMember}>
                          <input type="hidden" name="workspaceId" value={workspace.id} />
                          <input type="hidden" name="memberId" value={member.id} />
                          <Button
                            variant="ghost"
                            size="sm"
                            type="submit"
                            className="text-destructive hover:text-destructive"
                          >
                            Remove
                          </Button>
                        </form>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
