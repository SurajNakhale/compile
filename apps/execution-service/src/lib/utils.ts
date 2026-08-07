import type { Response } from "express";
import { redisClient } from "./client";
import { env } from "./env";
import type { resultPayloadType } from "./types";
import { Language } from "@repo/database";
import { join } from "node:path";

const executionQueue = process.env["EXECUTION_QUEUE"]!;

export function response(res: Response, statusCode: number, data: object){
    return res.status(statusCode).json(data);
}

export async function pushToResultQueue(resultPayload: resultPayloadType){
    await redisClient.lPush(env.executionQueue, JSON.stringify(resultPayload));
}

export function getFilePath(folderpath:string, language: string){
    if(language == Language.CPP){
        return join(folderpath, "a.cpp");
    }
    if(language == Language.TS){
        return join(folderpath, "a.ts");
    }
    if(language == Language.JS){
        return join(folderpath, "a.js");
    }
    if(language == Language.PY){
        return join(folderpath, "a.py");
    }
}

export function getDockerImage(language: Language){
    if(language == Language.CPP){
        return "cpp-runner"
    }
    else if(language == Language.PY){
        return "python-runner"
    }
    else if(language == Language.JS || language == Language.TS){
        return "node-runner"
    }
}