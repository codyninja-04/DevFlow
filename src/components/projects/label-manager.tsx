"use client"

import { useState, useTransition } from "react"
import { PlusIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { createLabel, deleteLabel } from "@/lib/actions/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const LABEL_COLORS = [
  "#94a3b8",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#0ea5e9",
]

interface LabelItem {
  id: string
  name: string
  color: string
}

interface LabelManagerProps {
  projectId: string
  labels: LabelItem[]
}

export function LabelManager({ projectId, labels }: LabelManagerProps) {
  const [name, setName] = useState("")
  const [color, setColor] = useState(LABEL_COLORS[0]!)
  const [pending, startTransition] = useTransition()

  function handleCreate() {
    if (!name.trim()) return
    startTransition(async () => {
      const formData = new FormData()
      formData.set("projectId", projectId)
      formData.set("name", name.trim())
      formData.set("color", color)
      try {
        await createLabel(formData)
        setName("")
        toast.success("Label created")
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to create label"
        )
      }
    })
  }

  function handleDelete(labelId: string) {
    startTransition(async () => {
      const formData = new FormData()
      formData.set("labelId", labelId)
      try {
        await deleteLabel(formData)
        toast.success("Label deleted")
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to delete label"
        )
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Labels</CardTitle>
        <CardDescription>
          Manage labels for categorizing issues.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing labels */}
        {labels.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {labels.map((label) => (
              <div
                key={label.id}
                className="flex items-center gap-1 rounded-full border py-0.5 pl-2 pr-1"
              >
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: label.color }}
                />
                <span className="text-xs font-medium">{label.name}</span>
                <button
                  type="button"
                  onClick={() => handleDelete(label.id)}
                  disabled={pending}
                  className="ml-0.5 rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                >
                  <Trash2Icon className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Create new label */}
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="label-name" className="text-xs">
              New label
            </Label>
            <Input
              id="label-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Label name"
              maxLength={30}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleCreate()
                }
              }}
            />
          </div>
          <div className="flex gap-1">
            {LABEL_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="size-5 rounded-full transition-transform hover:scale-125"
                style={{
                  backgroundColor: c,
                  boxShadow: color === c ? `0 0 0 2px ${c}` : undefined,
                }}
              >
                <span className="sr-only">{c}</span>
              </button>
            ))}
          </div>
          <Button
            size="sm"
            disabled={!name.trim() || pending}
            onClick={handleCreate}
          >
            <PlusIcon className="size-3" />
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
