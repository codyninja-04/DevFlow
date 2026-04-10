"use client"

import { useState } from "react"
import { toast } from "sonner"

import { updateWorkspace, deleteWorkspace } from "@/lib/actions/workspace"
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
import { Textarea } from "@/components/ui/textarea"

interface WorkspaceSettingsFormProps {
  workspace: {
    id: string
    name: string
    slug: string
    description: string | null
    logoUrl: string | null
  }
  isAdmin: boolean
}

export function WorkspaceSettingsForm({
  workspace,
  isAdmin,
}: WorkspaceSettingsFormProps) {
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState("")

  async function handleUpdate(formData: FormData) {
    setUpdating(true)
    try {
      await updateWorkspace(formData)
      toast.success("Workspace updated")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update workspace")
      setUpdating(false)
    }
  }

  async function handleDelete(formData: FormData) {
    setDeleting(true)
    try {
      await deleteWorkspace(formData)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete workspace")
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* General settings */}
      <Card>
        <form action={handleUpdate}>
          <input type="hidden" name="workspaceId" value={workspace.id} />
          <CardHeader>
            <CardTitle>General</CardTitle>
            <CardDescription>
              Update your workspace name, description, and logo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ws-name">Workspace name</Label>
              <Input
                id="ws-name"
                name="name"
                defaultValue={workspace.name}
                required
                maxLength={50}
                disabled={!isAdmin}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ws-description">Description</Label>
              <Textarea
                id="ws-description"
                name="description"
                defaultValue={workspace.description ?? ""}
                maxLength={500}
                rows={3}
                placeholder="What does your workspace do?"
                disabled={!isAdmin}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ws-logo">Logo URL</Label>
              <Input
                id="ws-logo"
                name="logoUrl"
                type="url"
                defaultValue={workspace.logoUrl ?? ""}
                placeholder="https://example.com/logo.png"
                disabled={!isAdmin}
              />
              <p className="text-xs text-muted-foreground">
                Paste a public image URL to use as your workspace logo.
              </p>
            </div>

            <div className="space-y-1">
              <Label className="text-muted-foreground">Slug</Label>
              <p className="rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                {workspace.slug}
                <span className="ml-1 text-xs">(auto-generated from name on save)</span>
              </p>
            </div>
          </CardContent>
          {isAdmin && (
            <CardFooter>
              <Button type="submit" disabled={updating}>
                {updating ? "Saving..." : "Save changes"}
              </Button>
            </CardFooter>
          )}
        </form>
      </Card>

      {/* Danger zone */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Danger zone</CardTitle>
            <CardDescription>
              Permanently delete this workspace, all its projects, issues, sprints, and
              members. This action cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Label htmlFor="confirm-delete">
                Type <strong>{workspace.name}</strong> to confirm
              </Label>
              <Input
                id="confirm-delete"
                value={confirmDelete}
                onChange={(e) => setConfirmDelete(e.target.value)}
                placeholder={workspace.name}
              />
            </div>
          </CardContent>
          <CardFooter>
            <form action={handleDelete}>
              <input type="hidden" name="workspaceId" value={workspace.id} />
              <Button
                type="submit"
                variant="destructive"
                disabled={confirmDelete !== workspace.name || deleting}
              >
                {deleting ? "Deleting..." : "Delete workspace"}
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
