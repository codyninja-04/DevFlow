import { z } from "zod"

export const createProjectSchema = z.object({
  workspaceId: z.string().min(1),
  name: z
    .string()
    .min(1, "Project name is required")
    .max(50, "Project name must be 50 characters or less"),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color")
    .default("#6366f1"),
  icon: z.string().max(50).optional(),
  startDate: z.coerce.date().optional(),
  targetDate: z.coerce.date().optional(),
})

export const updateProjectSchema = z.object({
  projectId: z.string().min(1),
  name: z
    .string()
    .min(1, "Project name is required")
    .max(50, "Project name must be 50 characters or less")
    .optional(),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .nullable()
    .optional(),
  status: z.enum(["ACTIVE", "ARCHIVED", "PAUSED"]).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color")
    .optional(),
  icon: z.string().max(50).nullable().optional(),
  startDate: z.coerce.date().nullable().optional(),
  targetDate: z.coerce.date().nullable().optional(),
})

export const deleteProjectSchema = z.object({
  projectId: z.string().min(1),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
