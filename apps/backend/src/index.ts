import { prisma } from "@repo/database";
import express, { type Request, type Response } from "express";
import { createClient } from "redis";
// import { Language, Status } from "../../../packages/database/generated/prisma/enums";
import { Language, Status } from "@repo/database/generated/prisma/enums";

import { subSchema } from "./utils/types";
import { errorResponse, successResponse } from "./utils/response";
import { env } from "./utils/env";

const app = express();
const client = createClient({ url: env.redisUrl });

app.use(express.json());

async function pushToQueue(key: string, elements: {id: string}){
    await client.lPush(key, JSON.stringify(elements));
}


app.post("/submission", async (req: Request, res: Response) => {
    const parsedMsg = subSchema.safeParse(req.body);

    if(!parsedMsg.success){
        return errorResponse(res, 400, parsedMsg.error.issues);
    }

    const {code, language} = parsedMsg.data;

    const newsubmission = await prisma.submission.create({
        data: {
            sourceCode: code,
            language: language,
            status: Status.PENDING
        }
    });

    try{
        await pushToQueue("problems" , {
            id: newsubmission.id
        });
    }
    catch(err){
        await prisma.submission.update({
            where: {
                id: newsubmission.id,
            },
            data: {
                status: Status.ERROR
            }
        });

        return errorResponse(res, 500, err)
    }
    
    return successResponse(res, 201, {
        status: newsubmission.status,
        submissionId: newsubmission.id
    })

})

app.get("/submission/:subId", async (req: Request, res: Response) => {
    const submissionId = req.params.subId as string;

    try{
        const response = await prisma.submission.findUnique({
            where: {
                id: submissionId
            }
        })

        if(!response) return errorResponse(res, 404, {message: "submission not found"});

        return successResponse(res, 200, {
            status: response.status,
            output: response.stdout,
            error: response.stderr,
        })
    }
    catch(err){
        return errorResponse(res, 500, err)
    }
})

async function main(){
    await client.connect();
    console.log("redis connected");

    app.listen(env.port, () => console.log(`backend running on port ${env.port}`))
}

main();