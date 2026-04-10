"use client"

import { useTransition } from "react"
import { toast } from "sonner"

import { updateIssue } from "@/lib/actions/issue"
import {
  ISSUE_PRIORITIES,
  ISSUE_PRIORITY_LABELS,
  ISSUE_STATUS_LABELS,
  ISSUE_STATUSES,
  ISSUE_TYPE_LABELS,
  ISSUE_TYPES,
} from "@/config/constants"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

interface Member {
  userId: string
  user: { id: string; name: string | null; email: string | null; image: string | null }
}

interface IssueSidebarProps {
  issueId: string
  status: string
  priority: string
  type: string
  assigneeId: string | null
  dueDate: Date | null
  storyPoints: number | null
  members: Member[]
}

export function IssueSidebar({
  issueId,
  status,
  priority,
  type,
  assigneeId,
  dueDate,
  storyPoints,
  members,
}: IssueSidebarProps) {
  const [pending, startTransition] = useTransition()

  function handleChange(field: string, value: string) {
    startTransition(async () => {
      const formData = new FormData()
      formData.set("issueId", issueId)
      formData.set(field, value)
      try {
        await updateIssue(formData)
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to update"
        )
      }
    })
  }

  const selectClass =
    "flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"

  return (
    <aside className="space-y-4">
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <select
            value={status}
            onChange={(e) => handleChange("status", e.target.value)}
            disabled={pending}
            className={selectClass}
          >
            {Object.entries(ISSUE_STATUSES).map(([key, value]) => (
              <option key={key} value={value}>
                {ISSUE_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Priority</Label>
          <select
            value={priority}
            onChange={(e) => handleChange("priority", e.target.value)}
            disabled={pending}
            className={selectClass}
          >
            {Object.entries(ISSUE_PRIORITIES).map(([key, value]) => (
              <option key={key} value={value}>
                {ISSUE_PRIORITY_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Type</Label>
          <select
            value={type}
            onChange={(e) => handleChange("type", e.target.value)}
            disabled={pending}
            className={selectClass}
          >
            {Object.entries(ISSUE_TYPES).map(([key, value]) => (
              <option key={key} value={value}>
                {ISSUE_TYPE_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <Separator />

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Assignee</Label>
          <select
            value={assigneeId ?? ""}
            onChange={(e) => handleChange("assigneeId", e.target.value)}
            disabled={pending}
            className={selectClass}
          >
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.user.name ?? m.user.email ?? m.userId}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Due date</Label>
          <input
            type="date"
            value={dueDate ? new Date(dueDate).toISOString().split("T")[0] : ""}
            onChange={(e) => handleChange("dueDate", e.target.value)}
            disabled={pending}
            className={selectClass}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Story points</Label>
          <input
            type="number"
            min={0}
            max={100}
            value={storyPoints ?? ""}
            onChange={(e) => handleChange("storyPoints", e.target.value)}
            disabled={pending}
            className={selectClass}
            placeholder="—"
          />
        </div>
      </div>
    </aside>
  )
}
