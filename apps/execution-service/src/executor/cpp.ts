import { Status } from "@repo/database";
import { spawn } from "node:child_process";

export async function executeCppCode(createdDir: string, dockerImage: string) {
    const compileResponse = spawn("docker", [
        "run",
        "--rm",
        "-v",
        `${createdDir}:/app`,
        dockerImage,
        "g++",
        "a.cpp",
        "-o",
        "out"
    ]);

    let compileOutput = "";
    let stderr = "";
    let stdout = "";
    let status;
    let timerId: NodeJS.Timeout;

    try {
        await new Promise<void>((resolve, reject) => {
            compileResponse.stderr.on("data", (data) => {
                compileOutput += data.toString();
            });

            compileResponse.on("close", (exitCode) => {
                if (exitCode === 0) resolve();
                else reject(new Error(Status.COMPILATION_ERROR));
            });
        });

        const runCompiledCode = spawn("docker", [
            "run",
            "--rm",
            "-v",
            `${createdDir}:/app`,
            dockerImage,
            "./out"
        ]);

        await Promise.race([
            new Promise<void>((resolve, reject) => {
                runCompiledCode.stdout.on("data", (data) => {
                    stdout += data.toString();
                });

                runCompiledCode.stderr.on("data", (data) => {
                    stderr += data.toString();
                });

                runCompiledCode.on("close", (exitCode) => {
                    if (exitCode === 0) resolve();
                    else reject(new Error(Status.ERROR));
                });
            }),

            new Promise<void>((_, reject) => {
                timerId = setTimeout(() => {
                    runCompiledCode.kill();
                    reject(new Error(Status.TIME_LIMIT_EXCEED));
                }, 2000);
            })
        ]);

        status = Status.SUCCESS;
    } catch (err: any) {
        status = err.message;
    } finally {
        if (timerId!) {
            clearTimeout(timerId);
        }
    }

    return {
        status,
        stdout,
        stderr,
        compileOutput
    };
}