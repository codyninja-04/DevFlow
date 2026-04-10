import { z } from "zod"

export const createSprintSchema = z
  .object({
    projectId: z.string().min(1),
    name: z
      .string()
      .min(1, "Sprint name is required")
      .max(80, "Sprint name must be 80 characters or less"),
    goal: z
      .string()
      .max(500, "Goal must be 500 characters or less")
      .optional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine((d) => d.endDate > d.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  })

export const updateSprintSchema = z
  .object({
    sprintId: z.string().min(1),
    name: z.string().min(1).max(80).optional(),
    goal: z.string().max(500).nullable().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  })
  .refine(
    (d) =>
      !d.startDate || !d.endDate || d.endDate > d.startDate,
    { message: "End date must be after start date", path: ["endDate"] }
  )

export const sprintIdSchema = z.object({
  sprintId: z.string().min(1),
})

export const moveIssueToSprintSchema = z.object({
  issueId: z.string().min(1),
  sprintId: z.string().min(1).nullable(),
})

export type CreateSprintInput = z.infer<typeof createSprintSchema>
export type UpdateSprintInput = z.infer<typeof updateSprintSchema>
