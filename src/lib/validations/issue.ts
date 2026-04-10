import { z } from "zod"

export const createIssueSchema = z.object({
  projectId: z.string().min(1),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less"),
  description: z.string().optional(),
  status: z
    .enum(["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"])
    .default("BACKLOG"),
  priority: z
    .enum(["NO_PRIORITY", "URGENT", "HIGH", "MEDIUM", "LOW"])
    .default("NO_PRIORITY"),
  type: z
    .enum(["TASK", "BUG", "FEATURE", "IMPROVEMENT", "EPIC", "STORY"])
    .default("TASK"),
  assigneeId: z.string().nullable().optional(),
  sprintId: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
  labelIds: z.array(z.string()).optional(),
  dueDate: z.coerce.date().nullable().optional(),
  storyPoints: z.coerce.number().int().min(0).max(100).nullable().optional(),
})

export const updateIssueSchema = z.object({
  issueId: z.string().min(1),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less")
    .optional(),
  description: z.string().nullable().optional(),
  status: z
    .enum(["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"])
    .optional(),
  priority: z
    .enum(["NO_PRIORITY", "URGENT", "HIGH", "MEDIUM", "LOW"])
    .optional(),
  type: z
    .enum(["TASK", "BUG", "FEATURE", "IMPROVEMENT", "EPIC", "STORY"])
    .optional(),
  assigneeId: z.string().nullable().optional(),
  sprintId: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
  labelIds: z.array(z.string()).optional(),
  dueDate: z.coerce.date().nullable().optional(),
  storyPoints: z.coerce.number().int().min(0).max(100).nullable().optional(),
})

export const deleteIssueSchema = z.object({
  issueId: z.string().min(1),
})

export const reorderIssueSchema = z.object({
  issueId: z.string().min(1),
  status: z.enum([
    "BACKLOG",
    "TODO",
    "IN_PROGRESS",
    "IN_REVIEW",
    "DONE",
    "CANCELLED",
  ]),
  beforeId: z.string().nullable().optional(),
  afterId: z.string().nullable().optional(),
})

export type CreateIssueInput = z.infer<typeof createIssueSchema>
export type UpdateIssueInput = z.infer<typeof updateIssueSchema>
