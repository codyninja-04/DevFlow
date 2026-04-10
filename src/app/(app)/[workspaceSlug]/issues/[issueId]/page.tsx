import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import {
  ArrowLeftIcon,
  MessageSquareIcon,
  Trash2Icon,
} from "lucide-react"

import { auth } from "@/auth"
import { addComment } from "@/lib/actions/comment"
import { deleteIssue, updateIssue } from "@/lib/actions/issue"
import { getIssueById, getWorkspaceMembers } from "@/lib/queries/issue"
import { getWorkspaceBySlug } from "@/lib/queries/workspace"
import { formatDate, formatRelativeDate } from "@/lib/utils"
import {
  ISSUE_PRIORITY_LABELS,
  ISSUE_STATUS_LABELS,
  ISSUE_TYPE_LABELS,
} from "@/config/constants"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Header } from "@/components/layout/header"
import { CommentSection } from "@/components/issues/comment-section"
import { IssueSidebar } from "@/components/issues/issue-sidebar"
import { PriorityIcon } from "@/components/issues/priority-icon"
import { StatusIcon } from "@/components/issues/status-icon"

interface PageProps {
  params: Promise<{ workspaceSlug: string; issueId: string }>
}

const ACTIVITY_LABELS: Record<string, string> = {
  ISSUE_CREATED: "created this issue",
  ISSUE_UPDATED: "updated this issue",
  STATUS_CHANGED: "changed status",
  PRIORITY_CHANGED: "changed priority",
  ISSUE_ASSIGNED: "assigned this issue",
  ISSUE_UNASSIGNED: "unassigned this issue",
  COMMENT_ADDED: "added a comment",
}

export default async function IssueDetailPage({ params }: PageProps) {
  const { workspaceSlug, issueId } = await params
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const workspace = await getWorkspaceBySlug(workspaceSlug, session.user.id)
  if (!workspace) redirect("/sign-in")

  const [issue, members] = await Promise.all([
    getIssueById(issueId),
    getWorkspaceMembers(workspace.id),
  ])

  if (!issue || issue.project.workspaceId !== workspace.id) notFound()

  return (
    <>
      <Header title={issue.title} workspaceSlug={workspaceSlug} />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl p-6">
          {/* Back link */}
          <Link
            href={`/${workspaceSlug}/issues`}
            className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeftIcon className="size-3" />
            All Issues
          </Link>

          <div className="grid gap-6 lg:grid-cols-[1fr_240px]">
            {/* Main content */}
            <div className="space-y-6">
              {/* Title + project */}
              <div>
                <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Link
                    href={`/${workspaceSlug}/projects/${issue.project.slug}`}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    <span
                      className="size-2 rounded-sm"
                      style={{ backgroundColor: issue.project.color }}
                    />
                    {issue.project.name}
                  </Link>
                  <span>&middot;</span>
                  <span>
                    {ISSUE_TYPE_LABELS[issue.type as keyof typeof ISSUE_TYPE_LABELS] ?? issue.type}
                  </span>
                </div>
                <IssueTitle issueId={issue.id} title={issue.title} />
              </div>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <StatusIcon status={issue.status} className="size-3" />
                  {ISSUE_STATUS_LABELS[issue.status as keyof typeof ISSUE_STATUS_LABELS] ?? issue.status}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <PriorityIcon priority={issue.priority} className="size-3" />
                  {ISSUE_PRIORITY_LABELS[issue.priority as keyof typeof ISSUE_PRIORITY_LABELS] ?? issue.priority}
                </Badge>
                {issue.labels.map((label: { id: string; name: string; color: string }) => (
                  <Badge key={label.id} variant="outline">
                    <span
                      className="mr-1 size-2 rounded-full"
                      style={{ backgroundColor: label.color }}
                    />
                    {label.name}
                  </Badge>
                ))}
              </div>

              {/* Description */}
              <div>
                <h3 className="mb-2 text-sm font-semibold">Description</h3>
                {issue.description ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap rounded-lg border p-4 text-sm">
                    {issue.description}
                  </div>
                ) : (
                  <p className="rounded-lg border p-4 text-sm text-muted-foreground">
                    No description provided.
                  </p>
                )}
              </div>

              {/* Sub-issues */}
              {issue.subIssues.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold">
                    Sub-issues ({issue.subIssues.length})
                  </h3>
                  <div className="divide-y rounded-lg border">
                    {issue.subIssues.map((sub) => (
                      <Link
                        key={sub.id}
                        href={`/${workspaceSlug}/issues/${sub.id}`}
                        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50"
                      >
                        <StatusIcon status={sub.status} className="size-3.5" />
                        <span className="flex-1 truncate">{sub.title}</span>
                        {sub.assignee && (
                          <Avatar size="sm">
                            {sub.assignee.image && (
                              <AvatarImage src={sub.assignee.image} alt="" />
                            )}
                            <AvatarFallback>
                              {sub.assignee.name?.charAt(0) ?? "?"}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Comments */}
              <CommentSection
                issueId={issue.id}
                comments={issue.comments}
                addCommentAction={addComment}
              />

              <Separator />

              {/* Activity log */}
              <div>
                <h3 className="mb-3 text-sm font-semibold">Activity</h3>
                <div className="space-y-3">
                  {issue.activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-2 text-xs text-muted-foreground"
                    >
                      <Avatar size="sm">
                        {activity.actor.image && (
                          <AvatarImage src={activity.actor.image} alt="" />
                        )}
                        <AvatarFallback>
                          {activity.actor.name?.charAt(0) ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span>
                        <span className="font-medium text-foreground">
                          {activity.actor.name}
                        </span>{" "}
                        {ACTIVITY_LABELS[activity.type] ?? activity.type}
                        {activity.metadata &&
                          typeof activity.metadata === "object" &&
                          "from" in (activity.metadata as Record<string, unknown>) &&
                          "to" in (activity.metadata as Record<string, unknown>) && (
                            <>
                              {" "}
                              from{" "}
                              <span className="font-medium">
                                {String((activity.metadata as Record<string, unknown>).from ?? "none")}
                              </span>{" "}
                              to{" "}
                              <span className="font-medium">
                                {String((activity.metadata as Record<string, unknown>).to ?? "none")}
                              </span>
                            </>
                          )}
                      </span>
                      <span className="ml-auto shrink-0">
                        {formatRelativeDate(activity.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delete */}
              {workspace.currentMember.role !== "VIEWER" && (
                <>
                  <Separator />
                  <form
                    action={async (formData: FormData) => {
                      "use server"
                      await deleteIssue(formData)
                      redirect(`/${workspaceSlug}/issues`)
                    }}
                  >
                    <input type="hidden" name="issueId" value={issue.id} />
                    <Button type="submit" variant="destructive" size="sm">
                      <Trash2Icon className="size-3" />
                      Delete issue
                    </Button>
                  </form>
                </>
              )}
            </div>

            {/* Sidebar */}
            <IssueSidebar
              issueId={issue.id}
              status={issue.status}
              priority={issue.priority}
              type={issue.type}
              assigneeId={issue.assigneeId}
              dueDate={issue.dueDate}
              storyPoints={issue.storyPoints}
              members={members}
            />
          </div>
        </div>
      </div>
    </>
  )
}

// Inline editable title
async function IssueTitle({
  issueId,
  title,
}: {
  issueId: string
  title: string
}) {
  return (
    <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
  )
}
