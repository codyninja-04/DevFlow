import Link from "next/link"
import { MessageSquareIcon } from "lucide-react"

import { formatRelativeDate } from "@/lib/utils"
import {
  ISSUE_PRIORITY_LABELS,
  ISSUE_STATUS_LABELS,
  ISSUE_TYPE_LABELS,
} from "@/config/constants"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { PriorityIcon } from "./priority-icon"
import { StatusIcon } from "./status-icon"

interface IssueItem {
  id: string
  title: string
  status: string
  priority: string
  type: string
  createdAt: Date
  assignee: { id: string; name: string | null; image: string | null } | null
  labels: Array<{ id: string; name: string; color: string }>
  _count: { comments: number; subIssues: number }
  project?: { id: string; name: string; slug: string; color: string }
}

interface IssueListProps {
  issues: IssueItem[]
  workspaceSlug: string
  showProject?: boolean
}

export function IssueList({
  issues,
  workspaceSlug,
  showProject,
}: IssueListProps) {
  if (issues.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        No issues found.
      </div>
    )
  }

  return (
    <div className="divide-y rounded-lg border">
      {issues.map((issue) => (
        <Link
          key={issue.id}
          href={`/${workspaceSlug}/issues/${issue.id}`}
          className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
        >
          {/* Status + Priority */}
          <div className="flex items-center gap-1.5">
            <PriorityIcon priority={issue.priority} className="size-3.5" />
            <StatusIcon status={issue.status} className="size-3.5" />
          </div>

          {/* Title + meta */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium">
                {issue.title}
              </span>
              {issue.labels.map((label) => (
                <Badge key={label.id} variant="outline" className="text-[0.625rem] px-1.5 py-0">
                  <span
                    className="mr-1 inline-block size-1.5 rounded-full"
                    style={{ backgroundColor: label.color }}
                  />
                  {label.name}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {showProject && issue.project && (
                <>
                  <span className="flex items-center gap-1">
                    <span
                      className="size-2 rounded-sm"
                      style={{ backgroundColor: issue.project.color }}
                    />
                    {issue.project.name}
                  </span>
                  <span>&middot;</span>
                </>
              )}
              <span>{ISSUE_TYPE_LABELS[issue.type as keyof typeof ISSUE_TYPE_LABELS] ?? issue.type}</span>
              <span>&middot;</span>
              <span>{formatRelativeDate(issue.createdAt)}</span>
            </div>
          </div>

          {/* Right side: comments + assignee */}
          <div className="flex items-center gap-3">
            {issue._count.comments > 0 && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MessageSquareIcon className="size-3" />
                {issue._count.comments}
              </span>
            )}
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
        </Link>
      ))}
    </div>
  )
}
