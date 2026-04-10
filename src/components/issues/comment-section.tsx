"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"

import { formatRelativeDate } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface Comment {
  id: string
  body: string
  createdAt: Date
  editedAt: Date | null
  author: { id: string; name: string | null; image: string | null }
}

interface CommentSectionProps {
  issueId: string
  comments: Comment[]
  addCommentAction: (formData: FormData) => Promise<void>
}

export function CommentSection({
  issueId,
  comments,
  addCommentAction,
}: CommentSectionProps) {
  const [body, setBody] = useState("")
  const [pending, startTransition] = useTransition()

  function handleSubmit() {
    if (!body.trim()) return
    startTransition(async () => {
      const formData = new FormData()
      formData.set("issueId", issueId)
      formData.set("body", body)
      try {
        await addCommentAction(formData)
        setBody("")
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to add comment"
        )
      }
    })
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">
        Comments ({comments.length})
      </h3>

      {/* Comment list */}
      {comments.length > 0 && (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar size="sm">
                {comment.author.image && (
                  <AvatarImage
                    src={comment.author.image}
                    alt={comment.author.name ?? ""}
                  />
                )}
                <AvatarFallback>
                  {comment.author.name?.charAt(0) ?? "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{comment.author.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeDate(comment.createdAt)}
                    {comment.editedAt && " (edited)"}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm">
                  {comment.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add comment */}
      <div className="space-y-2">
        <Textarea
          placeholder="Add a comment..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            disabled={!body.trim() || pending}
            onClick={handleSubmit}
          >
            {pending ? "Posting..." : "Comment"}
          </Button>
        </div>
      </div>
    </div>
  )
}
