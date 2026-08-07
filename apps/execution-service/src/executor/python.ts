import { Status } from "@repo/database";
import { spawn } from "node:child_process";

export async function executePythonCode(
    createdDir: string,
    dockerImage: string
) {
    const runPythonCode = spawn("docker", [
        "run",
        "--rm",
        "-v",
        `${createdDir}:/app`,
        dockerImage,
        "python",
        "a.py"
    ]);

    let stderr = "";
    let stdout = "";
    let status;
    let timerId: NodeJS.Timeout;

    try {
        await Promise.race([
            new Promise<void>((resolve, reject) => {
                runPythonCode.stdout.on("data", (data) => {
                    stdout += data.toString();
                });

                runPythonCode.stderr.on("data", (data) => {
                    stderr += data.toString();
                });

                runPythonCode.on("close", (exitCode) => {
                    if (exitCode === 0) resolve();
                    else reject(new Error(Status.ERROR));
                });
            }),

            new Promise<void>((_, reject) => {
                timerId = setTimeout(() => {
                    runPythonCode.kill();   // or stop the container
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