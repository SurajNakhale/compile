import { Language, prisma, Status } from "@repo/database";
import "dotenv/config";
import { createClient } from "redis";
import { spawn } from "child_process";
import {promises as fs} from "fs";
import path from "path";
import { exit, exitCode } from "process";
import { clearTimeout } from "timers";
import { rejects } from "assert";

const client = createClient({url: process.env.REDIS_URL});

async function getSubmission(subId: string){
    const submission = await prisma.submission.update({
        where: {
            id: subId
        },
        data: {
            status: Status.PROCESSING
        },
        select:{
            id: true,
            sourceCode: true,
            language: true
        }
    });

    return submission
}
client.connect().then(async() => {
    console.log("redis connected")

    while(1){
        const response = await client.brPop("execute", 2);
        console.log(response)
        if(!response) continue;
        const data = JSON.parse(response.element);
        console.log(data);

        const result: {id: string, sourceCode: string, language: Language} = await getSubmission(data.id);

        if(result.language == Language.CPP){
            const { id, sourceCode } = result;

            const filePath = path.join(__dirname, "../code/a.cpp");
            const outputPath = path.join(__dirname, "../code/out");

            await fs.writeFile(filePath, sourceCode);

            const compileResponse = spawn("g++", [`${filePath}`, "-o", `${outputPath}`]);
            let compileError = "error: ";
            try{
                await new Promise<void>((resolve, reject) => {
                    compileResponse.stderr.on("data", (data) => {
                        compileError += data.toString();
                    })
                    
                    compileResponse.on("close", (exitCode) => {
                        if(exitCode == 0) resolve();
                        else reject(compileError);
                    })});
                    
                    
                    let runCompiledCode = spawn(outputPath);
                    let stderr = ""
                    let stdout = ""
                    let timerId;
                
                try{
                    await Promise.race([
                        new Promise<void>((resolve, reject) => {
                            runCompiledCode.stderr.on("data", (data) => {
                                stderr += data.toString();
                            })
                            runCompiledCode.stdout.on("data", (data) => {
                                stdout += data.toString();
                            })
        
                            runCompiledCode.on("close", (exitCode) => {
                                if(exitCode == 0){
                                    resolve()
                                }
                                else{
                                    reject(stderr)
                                }
                            })
                        }),
                        new Promise<void>((_, reject) => {
                            timerId = setTimeout(async() => {
                                reject(new Error("TIMEOUT"))
                            }, 5000)
                        })
                    ]);


                    const output = await prisma.submission.update({
                        where: {
                            id: id
                        },
                        data: {
                            status: Status.SUCCESS,
                            stdout: stdout
                        }
                    })

                    console.log(output);

                }
                catch(err: any){
                    if(err.message == "TIMEOUT"){
                        runCompiledCode.kill("SIGKILL");
                        await prisma.submission.update({
                            where: {
                                id: id
                            },
                            data: {
                                status: Status.TIME_LIMIT_EXCEED
                            }
                        })
                    }
                    else{
                        await prisma.submission.update({
                            where: {
                                id: id
                            },
                            data: {
                                status: Status.ERROR,
                                stderr: stderr
                            }
                        })
                    }
                }
                finally{
                    if(timerId){
                        clearTimeout(timerId);
                    }
                }
            }
            catch(err: any){
                compileResponse.kill("SIGKILL");

                await prisma.submission.update({
                    where: {
                        id: id
                    },
                    data: {
                        status: Status.COMPILATION_ERROR,
                        compileOutput: compileError
                    }
                })

                console.log(compileError)
            }
        }


        if(result.language == Language.JS){
            const {id, sourceCode} = result;

            const filePath = path.join(__dirname, "../code/a.js");
            await fs.writeFile(filePath, sourceCode)
            const childProcess = spawn("bun", [`${filePath}`]);
            let timerId;
            let stderr = "";;
            let stdout = "";

            try{
                await Promise.race([
                    new Promise<void>((resolve, reject) => {
                        childProcess.stderr.on("data", (data) => {
                            stderr += data.toString();
                        })
                        childProcess.stdout.on("data", (data) => {
                            stdout += data.toString();
                        })

                        childProcess.on("close", (exitCode) => {
                            if(exitCode == 0) resolve();
                            else reject(new Error("executation failed"));
                        })
                    }),
                    new Promise((_, reject) => {
                        timerId = setTimeout(() => {
                            reject(new Error("TIMEOUT"))
                        }, 5000)
                    })
                ]);

                const res = await prisma.submission.update({
                    where: {
                        id: id
                    },
                    data: {
                        status: Status.SUCCESS,
                        stdout: stdout
                    }
                })


                console.log(res);

            }
            catch(err: any){
                if(err.message == "executation failed"){
                    const res = await prisma.submission.update({
                        where: {
                            id: id
                        },
                        data: {
                            status: Status.ERROR,
                            stderr: stderr
                        }
                    });

                    console.log(res)
                }

                if(err.message == "TIMEOUT"){
                    const res = await prisma.submission.update({
                        where: {
                            id: id
                        },
                        data: {
                            status: Status.TIME_LIMIT_EXCEED
                        }
                    })

                    console.log(res);
                }
            }
            finally{
                if(timerId){
                    clearTimeout(timerId);
                }
            }
        }

        if(result.language == Language.TS){

        }



        if(result.language == Language.PY){

        }
    }
}
)