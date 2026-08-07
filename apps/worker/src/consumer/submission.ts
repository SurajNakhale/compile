import "dotenv/config";
import axios from "axios";
import { redisClient } from "../utils/client";
import { prisma, Status } from "@repo/database";

const executionServiceUrl = process.env["EXECUTION_SERVICE_URL"]!;
const submissionQueue = process.env["SUBMISSION_QUEUE"]!;

export async function startSubmissionConsumer() {
    while (true) {
        // BRPOP submission-queue
        // Process submission
        try{

            const qres = await redisClient.brPop(submissionQueue, 0);
            console.log(qres)
            if(!qres) continue;
            
            const parsedMsg = JSON.parse(qres.element);
            
            const { subId } = parsedMsg;
            
            const subdata = await prisma.submission.findUnique({
                where: {
                    id: subId
                }
            })
            
            if(!subdata) continue;
            
            const result = await prisma.submission.update({
                where: {
                    id: subId
                },
                data: {
                    status: Status.PROCESSING
                }
            })
            
            
            console.log(result.status);
            
            const payload = {
                submissionId: subId,
                sourceCode: subdata.sourceCode,
                language: subdata.language
            }
            
            const response = await axios.post(executionServiceUrl, payload);
            
            if(response.data.status != "success"){
            // Update submission to INTERNAL_ERROR db call
                console.log("INTERNAL_ERROR")
                continue;
            }
        }
        catch(err){
            console.log(err);
        }
    }
} 
