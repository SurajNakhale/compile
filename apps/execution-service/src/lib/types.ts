import { Language, Status } from "@repo/database";
import z from "zod";


export const subSchema = z.object({
    submissionId: z.string(),
    sourceCode: z.string(),
    language: z.enum(Language),
})

export type payload = {
    submissionId: string,
    sourceCode: string,
    language: Language
}

export type resultPayloadType = {
    submissionId: string,
    status: string,
    stdout: string,
    stderr: string,
    compileOutput: string
}

export type executeType = {
    status: Status,
    stdout: string,
    stderr: string,
    compileOutput: string
}
