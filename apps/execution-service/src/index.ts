import express from "express";
import { env } from "./lib/env";
import { redisClient } from "./lib/client";
import { executeRouter } from "./route/execute";

const app = express();
app.use(express.json());

app.use("/", executeRouter);

async function main() {
    await redisClient.connect();
    console.log("redis connect")

     app.listen(env.port, () => {
        console.log(`execution-service running on port: ${env.port}`);
    })
}

main();