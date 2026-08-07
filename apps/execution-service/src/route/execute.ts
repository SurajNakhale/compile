import { Router } from "express";
import { response } from "../lib/utils";
import { subSchema, type payload } from "../lib/types";
import { executeSubmission } from "../executor";


const executeRouter = Router();

executeRouter.post("/execute", async (req, res) => {
    const parsedMsg = subSchema.safeParse(req.body);

    if(!parsedMsg.success){
        console.log(parsedMsg.error);
        return response(res, 400, {message: "validation error"})
    }

    const { submissionId, sourceCode, language } = parsedMsg.data;

    //start execution in background
    const payload: payload = {
        submissionId,
        sourceCode,
        language
    }

    executeSubmission(payload);

    return response(res, 202, {status: "Accepted", message: "execution started"});
})

export { executeRouter };