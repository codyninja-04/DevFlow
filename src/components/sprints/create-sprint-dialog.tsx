"use client"

import { useState } from "react"
import { toast } from "sonner"

import { createSprint } from "@/lib/actions/sprint"
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

interface CreateSprintDialogProps {
  projectId: string
  children: React.ReactNode
}

export function CreateSprintDialog({
  projectId,
  children,
}: CreateSprintDialogProps) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  // Default to a 2-week sprint starting tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const twoWeeksOut = new Date(tomorrow)
  twoWeeksOut.setDate(twoWeeksOut.getDate() + 14)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)

  async function handleSubmit(formData: FormData) {
    setPending(true)
    try {
      await createSprint(formData)
      toast.success("Sprint created")
      setOpen(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create sprint"
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children as React.ReactElement} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create sprint</DialogTitle>
          <DialogDescription>
            Plan a time-boxed iteration for this project.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="projectId" value={projectId} />

          <div className="space-y-2">
            <Label htmlFor="sprint-name">Name</Label>
            <Input
              id="sprint-name"
              name="name"
              placeholder="Sprint 1"
              required
              maxLength={80}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sprint-goal">Goal</Label>
            <Textarea
              id="sprint-goal"
              name="goal"
              placeholder="What should this sprint achieve?"
              maxLength={500}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="sprint-start">Start date</Label>
              <Input
                id="sprint-start"
                name="startDate"
                type="date"
                defaultValue={fmt(tomorrow)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sprint-end">End date</Label>
              <Input
                id="sprint-end"
                name="endDate"
                type="date"
                defaultValue={fmt(twoWeeksOut)}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating..." : "Create sprint"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
