import { mkdir, rm, rmdir, writeFile } from "fs/promises";
import { join } from "path";
import { getFilePath } from "./utils";
import fs from "fs"
//create workspace
export async function createWorkspace(submissionId: string){
    const folderpath = join(__dirname, `../../temp/${submissionId}`);
    const createdDir = await mkdir(folderpath, {recursive: true});
    
    return createdDir!;
}

//write to file and delete the workspace
export async function WriteToSourceFile(createdDir: string, language: string, sourceCode: string){
    const filePath = getFilePath(createdDir, language);

    if(filePath) await writeFile(filePath, sourceCode, "utf-8");
}

export async function deleteWorkspace(createdDir: string){
    await rm(createdDir, {recursive: true, force: true});
}   