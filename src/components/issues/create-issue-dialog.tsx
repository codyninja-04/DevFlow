"use client"

import { useRef, useState } from "react"
import { toast } from "sonner"

import { createIssue } from "@/lib/actions/issue"
import {
  ISSUE_PRIORITIES,
  ISSUE_PRIORITY_LABELS,
  ISSUE_STATUS_LABELS,
  ISSUE_STATUSES,
  ISSUE_TYPE_LABELS,
  ISSUE_TYPES,
} from "@/config/constants"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Member {
  userId: string
  user: { id: string; name: string | null; image: string | null }
}

interface CreateIssueDialogProps {
  projectId: string
  members: Member[]
  children: React.ReactNode
}

export function CreateIssueDialog({
  projectId,
  members,
  children,
}: CreateIssueDialogProps) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(formData: FormData) {
    setPending(true)
    try {
      await createIssue(formData)
      toast.success("Issue created")
      setOpen(false)
      formRef.current?.reset()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create issue"
      )
    } finally {
      setPending(false)
    }
  }

  const selectClass =
    "flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children as React.ReactElement} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create issue</DialogTitle>
          <DialogDescription>
            Add a new issue to this project.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="space-y-4">
          <input type="hidden" name="projectId" value={projectId} />

          <div className="space-y-2">
            <Label htmlFor="issue-title">Title</Label>
            <Input
              id="issue-title"
              name="title"
              placeholder="Issue title"
              required
              maxLength={200}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="issue-description">Description</Label>
            <Textarea
              id="issue-description"
              name="description"
              placeholder="Add a description... (Markdown supported)"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="issue-status">Status</Label>
              <select
                id="issue-status"
                name="status"
                defaultValue="BACKLOG"
                className={selectClass}
              >
                {Object.entries(ISSUE_STATUSES).map(([key, value]) => (
                  <option key={key} value={value}>
                    {ISSUE_STATUS_LABELS[value]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="issue-priority">Priority</Label>
              <select
                id="issue-priority"
                name="priority"
                defaultValue="NO_PRIORITY"
                className={selectClass}
              >
                {Object.entries(ISSUE_PRIORITIES).map(([key, value]) => (
                  <option key={key} value={value}>
                    {ISSUE_PRIORITY_LABELS[value]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="issue-type">Type</Label>
              <select
                id="issue-type"
                name="type"
                defaultValue="TASK"
                className={selectClass}
              >
                {Object.entries(ISSUE_TYPES).map(([key, value]) => (
                  <option key={key} value={value}>
                    {ISSUE_TYPE_LABELS[value]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="issue-assignee">Assignee</Label>
              <select
                id="issue-assignee"
                name="assigneeId"
                defaultValue=""
                className={selectClass}
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.user.name ?? m.userId}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="issue-due">Due date</Label>
              <Input id="issue-due" name="dueDate" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="issue-points">Story points</Label>
              <Input
                id="issue-points"
                name="storyPoints"
                type="number"
                min={0}
                max={100}
                placeholder="0"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating..." : "Create issue"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
