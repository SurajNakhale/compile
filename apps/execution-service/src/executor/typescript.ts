import { Status } from "@repo/database";
import { spawn } from "node:child_process";

export async function executeTypescriptCode(createdDir: string, dockerImage: string){
    const compileResponse = spawn("docker", ["run", "--rm", "-v", `${createdDir}:/app`, `${dockerImage}`, 'tsc', 'a.ts']);

    let compileOutput = "";
    let status;
    let stderr = "";
    let stdout = "";
    let timerId: NodeJS.Timeout;

    try{

        await new Promise<void>((resolve, reject) => {  
            compileResponse.stderr.on("data", (data) => {
                compileOutput += data.toString();
            })
    
            compileResponse.on("close", (exitcode) => {
                if(exitcode == 0) resolve();
                else reject(new Error(Status.COMPILATION_ERROR));
            });
        })

        const runTsCode = spawn("docker", ["run", "--rm", '-v', `${createdDir}:/app`, `${dockerImage}`, 'node', 'a.js'])

        await Promise.race([
            new Promise<void>((resolve, reject) => {
                runTsCode.stderr.on("data", (data) => {
                    stderr += data.toString();
                })
        
                runTsCode.stdout.on("data", (data) => {
                    stdout += data.toString();
                })
        
                runTsCode.on("close", (exitCode) => {
                    if(exitCode == 0) resolve()
                    else reject(new Error(Status.ERROR))
                })
            }),

            new Promise((_, reject) => {
                timerId = setTimeout(() => {
                    runTsCode.kill("SIGKILL");
                    reject(new Error(Status.TIME_LIMIT_EXCEED));
                }, 2000)
            })
        ])

        status = Status.SUCCESS;
    }
    catch(err: any){
        status = err.message
    }
    finally{
        if(timerId!){
            clearTimeout(timerId);
        }
    }


    return {
        status,
        stderr,
        stdout,
        compileOutput
    }
}