import "dotenv/config";
import { prisma } from "@repo/database";
import { redisClient } from "../utils/client";

const executionQueue = process.env["EXECUTION_QUEUE"]!;

export async function startResultConsumer() {
    while (true) {
        // BRPOP execution-results
        // Update DB
        try{
            const qres = await redisClient.brPop(executionQueue, 0);
            console.log(qres);
            if(!qres){
                continue;
            }
            
            const executionRes = JSON.parse(qres.element);
            // "submissionId": "sub_123",
            // "status": "SUCCESS",
            // "stdout": "Hello",
            // "stderr": "",
            // "compileOutput": "",
            
            const { submissionId, status, stdout, stderr, compileOutput } = executionRes;
            
            const res = await prisma.submission.update({
                where: {
                    id: submissionId
                },
                data: {
                    status,
                    compileOutput,
                    stderr,
                    stdout
                }
            })
            
            console.log(res);
        }
        catch(err){
            console.log(err);
        }
    }
}
