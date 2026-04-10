"use client"

import Link from "next/link"
import { CalendarIcon, CheckCircle2Icon, PlayIcon } from "lucide-react"
import { toast } from "sonner"

import {
  completeSprint,
  startSprint,
} from "@/lib/actions/sprint"
import { formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

type SprintItem = {
  id: string
  name: string
  goal: string | null
  status: "PLANNED" | "ACTIVE" | "COMPLETED"
  startDate: Date
  endDate: Date
  issueCount: number
  doneCount: number
  progress: number
}

interface SprintListProps {
  sprints: SprintItem[]
  workspaceSlug: string
  projectSlug: string
  canManage: boolean
}

const STATUS_VARIANTS: Record<
  SprintItem["status"],
  "default" | "secondary" | "outline"
> = {
  ACTIVE: "default",
  PLANNED: "secondary",
  COMPLETED: "outline",
}

const STATUS_LABELS: Record<SprintItem["status"], string> = {
  ACTIVE: "Active",
  PLANNED: "Planned",
  COMPLETED: "Completed",
}

export function SprintList({
  sprints,
  workspaceSlug,
  projectSlug,
  canManage,
}: SprintListProps) {
  if (sprints.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-12">
        <CalendarIcon className="mb-3 size-10 text-muted-foreground/50" />
        <h3 className="text-base font-semibold">No sprints yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a sprint to start planning iterations.
        </p>
      </Card>
    )
  }

  async function handleAction(
    action: (fd: FormData) => Promise<void>,
    sprintId: string,
    successMsg: string
  ) {
    const fd = new FormData()
    fd.set("sprintId", sprintId)
    try {
      await action(fd)
      toast.success(successMsg)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Action failed"
      )
    }
  }

  return (
    <div className="space-y-3">
      {sprints.map((sprint) => (
        <Card key={sprint.id} className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Link
                  href={`/${workspaceSlug}/projects/${projectSlug}/sprints/${sprint.id}`}
                  className="font-semibold hover:underline"
                >
                  {sprint.name}
                </Link>
                <Badge variant={STATUS_VARIANTS[sprint.status]}>
                  {STATUS_LABELS[sprint.status]}
                </Badge>
              </div>
              {sprint.goal && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {sprint.goal}
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CalendarIcon className="size-3" />
                  {formatDate(sprint.startDate)} – {formatDate(sprint.endDate)}
                </span>
                <span>
                  {sprint.doneCount} / {sprint.issueCount} done
                </span>
              </div>
              {sprint.issueCount > 0 && (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${sprint.progress}%` }}
                  />
                </div>
              )}
            </div>
            {canManage && (
              <div className="flex shrink-0 gap-2">
                {sprint.status === "PLANNED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleAction(
                        startSprint,
                        sprint.id,
                        "Sprint started"
                      )
                    }
                  >
                    <PlayIcon data-icon="inline-start" />
                    Start
                  </Button>
                )}
                {sprint.status === "ACTIVE" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleAction(
                        completeSprint,
                        sprint.id,
                        "Sprint completed"
                      )
                    }
                  >
                    <CheckCircle2Icon data-icon="inline-start" />
                    Complete
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}
