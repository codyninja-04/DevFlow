"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, useTransition } from "react"
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { MessageSquareIcon } from "lucide-react"
import { toast } from "sonner"

import { reorderIssue } from "@/lib/actions/issue"
import { ISSUE_STATUS_LABELS } from "@/config/constants"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { PriorityIcon } from "./priority-icon"
import { StatusIcon } from "./status-icon"

type IssueStatus =
  | "BACKLOG"
  | "TODO"
  | "IN_PROGRESS"
  | "IN_REVIEW"
  | "DONE"
  | "CANCELLED"

export interface BoardIssue {
  id: string
  title: string
  status: IssueStatus
  priority: string
  type: string
  orderIndex: number
  assignee: { id: string; name: string | null; image: string | null } | null
  labels: Array<{ id: string; name: string; color: string }>
  _count: { comments: number; subIssues: number }
}

interface KanbanBoardProps {
  issues: BoardIssue[]
  workspaceSlug: string
  canEdit: boolean
}

const COLUMNS: IssueStatus[] = [
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "DONE",
  "CANCELLED",
]

export function KanbanBoard({
  issues: initialIssues,
  workspaceSlug,
  canEdit,
}: KanbanBoardProps) {
  const [issues, setIssues] = useState<BoardIssue[]>(initialIssues)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  // Re-sync from server when not mid-drag (e.g. after revalidation)
  useEffect(() => {
    if (!activeId) setIssues(initialIssues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialIssues])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const grouped = useMemo(() => {
    const map: Record<IssueStatus, BoardIssue[]> = {
      BACKLOG: [],
      TODO: [],
      IN_PROGRESS: [],
      IN_REVIEW: [],
      DONE: [],
      CANCELLED: [],
    }
    for (const issue of issues) map[issue.status].push(issue)
    for (const status of COLUMNS) {
      map[status].sort((a, b) => a.orderIndex - b.orderIndex)
    }
    return map
  }, [issues])

  const activeIssue = activeId
    ? issues.find((i) => i.id === activeId) ?? null
    : null

  function findContainer(id: string): IssueStatus | null {
    if ((COLUMNS as string[]).includes(id)) return id as IssueStatus
    const issue = issues.find((i) => i.id === id)
    return issue ? issue.status : null
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id))
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    const activeIdStr = String(active.id)
    const overIdStr = String(over.id)

    const fromStatus = findContainer(activeIdStr)
    const toStatus = findContainer(overIdStr)
    if (!fromStatus || !toStatus) return

    const moving = issues.find((i) => i.id === activeIdStr)
    if (!moving) return

    // Build the destination list (excluding the moving card if same column)
    const destList = grouped[toStatus].filter((i) => i.id !== activeIdStr)
    const overIndex = (COLUMNS as string[]).includes(overIdStr)
      ? destList.length
      : destList.findIndex((i) => i.id === overIdStr)

    const insertAt = overIndex === -1 ? destList.length : overIndex
    const before = insertAt > 0 ? destList[insertAt - 1] : null
    const after = insertAt < destList.length ? destList[insertAt] : null

    // No-op detection
    if (
      fromStatus === toStatus &&
      before?.id !== undefined &&
      moving.orderIndex > (before?.orderIndex ?? -Infinity) &&
      moving.orderIndex < (after?.orderIndex ?? Infinity) &&
      grouped[fromStatus].findIndex((i) => i.id === activeIdStr) === insertAt
    ) {
      return
    }

    // Compute optimistic orderIndex
    let newOrder: number
    if (before && after) newOrder = (before.orderIndex + after.orderIndex) / 2
    else if (before) newOrder = before.orderIndex + 1000
    else if (after) newOrder = after.orderIndex - 1000
    else newOrder = 1000

    const snapshot = issues
    const optimistic = issues.map((i) =>
      i.id === activeIdStr
        ? { ...i, status: toStatus, orderIndex: newOrder }
        : i
    )
    setIssues(optimistic)

    startTransition(async () => {
      try {
        await reorderIssue({
          issueId: activeIdStr,
          status: toStatus,
          beforeId: before?.id ?? null,
          afterId: after?.id ?? null,
        })
      } catch (error) {
        setIssues(snapshot)
        toast.error(
          error instanceof Error ? error.message : "Failed to move issue"
        )
      }
    })
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={canEdit ? handleDragStart : undefined}
      onDragEnd={canEdit ? handleDragEnd : undefined}
    >
      <div className="flex gap-3 overflow-x-auto pb-4">
        {COLUMNS.map((status) => (
          <Column
            key={status}
            status={status}
            issues={grouped[status]}
            workspaceSlug={workspaceSlug}
          />
        ))}
      </div>
      <DragOverlay>
        {activeIssue && (
          <Card issue={activeIssue} workspaceSlug={workspaceSlug} dragging />
        )}
      </DragOverlay>
    </DndContext>
  )
}

interface ColumnProps {
  status: IssueStatus
  issues: BoardIssue[]
  workspaceSlug: string
}

function Column({ status, issues, workspaceSlug }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-lg border bg-muted/30 transition-colors ${
        isOver ? "bg-muted/60" : ""
      }`}
    >
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-2">
          <StatusIcon status={status} className="size-3.5" />
          <span className="text-sm font-semibold">
            {ISSUE_STATUS_LABELS[status]}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">{issues.length}</span>
      </div>
      <SortableContext
        items={issues.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-1 flex-col gap-2 p-2">
          {issues.map((issue) => (
            <SortableCard
              key={issue.id}
              issue={issue}
              workspaceSlug={workspaceSlug}
            />
          ))}
          {issues.length === 0 && (
            <div className="py-6 text-center text-xs text-muted-foreground">
              No issues
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  )
}

interface CardProps {
  issue: BoardIssue
  workspaceSlug: string
  dragging?: boolean
}

function SortableCard({ issue, workspaceSlug }: CardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: issue.id })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card issue={issue} workspaceSlug={workspaceSlug} />
    </div>
  )
}

function Card({ issue, workspaceSlug, dragging }: CardProps) {
  return (
    <div
      className={`group rounded-md border bg-background p-3 shadow-sm transition-shadow ${
        dragging ? "shadow-lg ring-2 ring-primary/20" : "hover:shadow-md"
      }`}
    >
      <div className="flex items-start gap-2">
        <PriorityIcon priority={issue.priority} className="mt-0.5 size-3.5" />
        <Link
          href={`/${workspaceSlug}/issues/${issue.id}`}
          className="flex-1 text-sm font-medium leading-snug hover:underline"
          onClick={(e) => dragging && e.preventDefault()}
        >
          {issue.title}
        </Link>
      </div>
      {issue.labels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {issue.labels.map((label) => (
            <Badge
              key={label.id}
              variant="outline"
              className="text-[0.625rem] px-1.5 py-0"
            >
              <span
                className="mr-1 inline-block size-1.5 rounded-full"
                style={{ backgroundColor: label.color }}
              />
              {label.name}
            </Badge>
          ))}
        </div>
      )}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {issue._count.comments > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquareIcon className="size-3" />
              {issue._count.comments}
            </span>
          )}
        </div>
        {issue.assignee ? (
          <Avatar size="sm">
            {issue.assignee.image && (
              <AvatarImage
                src={issue.assignee.image}
                alt={issue.assignee.name ?? ""}
              />
            )}
            <AvatarFallback>
              {issue.assignee.name?.charAt(0) ?? "?"}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="size-6" />
        )}
      </div>
    </div>
  )
}
