import { Status } from "@repo/database";
import { spawn } from "node:child_process";

export async function executeJavaScriptCode(
    createdDir: string,
    dockerImage: string
) {
    const runJavaScriptCode = spawn("docker", [
        "run",
        "--rm",
        "-v",
        `${createdDir}:/app`,
        dockerImage,
        "node",
        "a.js"
    ]);

    let stderr = "";
    let stdout = "";
    let status;
    let timerId: NodeJS.Timeout;

    try {
        await Promise.race([
            new Promise<void>((resolve, reject) => {
                runJavaScriptCode.stdout.on("data", (data) => {
                    stdout += data.toString();
                });

                runJavaScriptCode.stderr.on("data", (data) => {
                    stderr += data.toString();
                });

                runJavaScriptCode.on("close", (exitCode) => {
                    if (exitCode === 0) resolve();
                    else reject(new Error(Status.ERROR));
                });
            }),

            new Promise<void>((_, reject) => {
                timerId = setTimeout(() => {
                    runJavaScriptCode.kill();
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
        compileOutput: ""
    };
}