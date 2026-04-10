import { z } from "zod"

export const createLabelSchema = z.object({
  projectId: z.string().min(1),
  name: z
    .string()
    .min(1, "Label name is required")
    .max(30, "Label name must be 30 characters or less"),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color")
    .default("#94a3b8"),
})

export const deleteLabelSchema = z.object({
  labelId: z.string().min(1),
})
