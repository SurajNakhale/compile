import z from "zod"
import { Language } from "../../../../packages/database/generated/prisma/enums"

export const subSchema = z.object({
    code: z.string(),
    language: z.enum(Language)
})
export type subSchemaType = z.infer<typeof subSchema>