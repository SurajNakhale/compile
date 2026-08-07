import { type executeType, type payload } from "../lib/types";
import { getDockerImage, pushToResultQueue } from "../lib/utils";
import { Language, Status } from "@repo/database"
import { executeCppCode } from "./cpp";
import { executePythonCode } from "./python";
import { executeJavaScriptCode } from "./javascript";
import { executeTypescriptCode } from "./typescript";
import { createWorkspace, deleteWorkspace, WriteToSourceFile } from "../lib/workspace";


export async function executeSubmission(payload: payload){
    const {submissionId, sourceCode, language} = payload;
    let resultPayload;
    let executionResult: executeType | undefined = undefined; 
    let createdDir: string | undefined = undefined;

    
    try{

        createdDir = await createWorkspace(submissionId);
        if(!createdDir) throw new Error("error while creating workspace")
        //write to source file
    
        await WriteToSourceFile(createdDir, language, sourceCode);
    
        const dockerImage = getDockerImage(language)!;

        switch (language) {
        case Language.CPP:
            executionResult = await executeCppCode(createdDir, dockerImage);
            break;
    
        case Language.PY:
            executionResult = await executePythonCode(createdDir, dockerImage);
            break;
    
        case Language.JS:
            executionResult = await executeJavaScriptCode(createdDir, dockerImage);
            break;
            
        case Language.TS:
            executionResult = await executeTypescriptCode(createdDir, dockerImage);
            break;
    
        default:
            throw new Error("Unsupported language");
        }   
    
        
        resultPayload = {
            submissionId,
            status: executionResult.status,
            stdout: executionResult.stdout,
            stderr: executionResult.stderr,
            compileOutput: executionResult.compileOutput
        }
        
    }
    catch(err){
        resultPayload = {
            submissionId,
            status: Status.INTERNAL_SERVER_ERROR,
            stdout: executionResult?.stdout ?? "",
            stderr: executionResult?.stderr ?? (err instanceof Error ? err.message : String(err)),
            compileOutput: executionResult!.compileOutput
        }
    }
    finally{
        if(createdDir){
            await deleteWorkspace(createdDir);
        } 
    }
    
    if(resultPayload){
        await pushToResultQueue(resultPayload);
        console.log("pushed to result-queue", resultPayload)
    }

}