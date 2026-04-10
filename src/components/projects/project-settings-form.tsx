"use client"

import { useState } from "react"
import { toast } from "sonner"

import { deleteProject, updateProject } from "@/lib/actions/project"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

const PROJECT_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#0ea5e9",
  "#64748b",
]

interface ProjectSettingsFormProps {
  project: {
    id: string
    name: string
    description: string | null
    color: string
    status: string
    startDate: Date | null
    targetDate: Date | null
  }
  workspaceSlug: string
  isAdmin: boolean
}

export function ProjectSettingsForm({
  project,
  workspaceSlug,
  isAdmin,
}: ProjectSettingsFormProps) {
  const [color, setColor] = useState(project.color)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState("")

  async function handleUpdate(formData: FormData) {
    setUpdating(true)
    try {
      await updateProject(formData)
      toast.success("Project updated")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update project"
      )
    } finally {
      setUpdating(false)
    }
  }

  async function handleDelete(formData: FormData) {
    setDeleting(true)
    try {
      await deleteProject(formData)
      toast.success("Project deleted")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete project"
      )
      setDeleting(false)
    }
  }

  function toDateInputValue(date: Date | null) {
    if (!date) return ""
    return new Date(date).toISOString().split("T")[0]
  }

  return (
    <div className="space-y-6">
      {/* General settings */}
      <Card>
        <form action={handleUpdate}>
          <input type="hidden" name="projectId" value={project.id} />
          <input type="hidden" name="color" value={color} />

          <CardHeader>
            <CardTitle>General</CardTitle>
            <CardDescription>
              Update your project&apos;s basic information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="settings-name">Name</Label>
              <Input
                id="settings-name"
                name="name"
                defaultValue={project.name}
                required
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="settings-description">Description</Label>
              <Textarea
                id="settings-description"
                name="description"
                defaultValue={project.description ?? ""}
                maxLength={500}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {PROJECT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="size-6 rounded-full ring-offset-2 ring-offset-background transition-all hover:scale-110"
                    style={{
                      backgroundColor: c,
                      boxShadow:
                        color === c ? `0 0 0 2px ${c}` : undefined,
                    }}
                  >
                    <span className="sr-only">{c}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="settings-status">Status</Label>
              <select
                id="settings-status"
                name="status"
                defaultValue={project.status}
                className="flex h-8 w-full max-w-xs rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="settings-start">Start date</Label>
                <Input
                  id="settings-start"
                  name="startDate"
                  type="date"
                  defaultValue={toDateInputValue(project.startDate)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="settings-target">Target date</Label>
                <Input
                  id="settings-target"
                  name="targetDate"
                  type="date"
                  defaultValue={toDateInputValue(project.targetDate)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={updating}>
              {updating ? "Saving..." : "Save changes"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Danger zone */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Danger zone</CardTitle>
            <CardDescription>
              Permanently delete this project and all its issues, sprints, and
              labels. This action cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Label htmlFor="confirm-delete">
                Type <strong>{project.name}</strong> to confirm
              </Label>
              <Input
                id="confirm-delete"
                value={confirmDelete}
                onChange={(e) => setConfirmDelete(e.target.value)}
                placeholder={project.name}
              />
            </div>
          </CardContent>
          <CardFooter>
            <form action={handleDelete}>
              <input type="hidden" name="projectId" value={project.id} />
              <Button
                type="submit"
                variant="destructive"
                disabled={confirmDelete !== project.name || deleting}
              >
                {deleting ? "Deleting..." : "Delete project"}
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
