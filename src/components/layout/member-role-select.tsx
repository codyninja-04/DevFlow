"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import type { UserRole } from "@prisma/client"

import { updateMemberRole } from "@/lib/actions/workspace"

const selectClass =
  "flex h-7 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"

interface MemberRoleSelectProps {
  memberId: string
  workspaceId: string
  currentRole: UserRole
}

export function MemberRoleSelect({
  memberId,
  workspaceId,
  currentRole,
}: MemberRoleSelectProps) {
  const [pending, startTransition] = useTransition()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const role = e.target.value as UserRole
    startTransition(async () => {
      try {
        await updateMemberRole(memberId, workspaceId, role)
        toast.success("Role updated")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update role")
      }
    })
  }

  return (
    <select
      defaultValue={currentRole}
      onChange={handleChange}
      disabled={pending}
      className={selectClass}
    >
      <option value="ADMIN">Admin</option>
      <option value="MEMBER">Member</option>
      <option value="VIEWER">Viewer</option>
    </select>
  )
}
