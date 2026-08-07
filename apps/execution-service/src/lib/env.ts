
function requiredEvn(name: string){
    const res = process.env[name];
    if(!res) throw new Error(`required url of ${name}`);
    return res;
}

export const env = {
    port: Number(process.env.port) || 4000,
    redis: requiredEvn("REDIS_URL"),
    executionQueue: requiredEvn("EXECUTION_QUEUE")
} 