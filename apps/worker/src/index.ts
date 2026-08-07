import { startResultConsumer } from "./consumer/result";
import { startSubmissionConsumer } from "./consumer/submission";
import { redisClient } from "./utils/client";

async function main() {
    await redisClient.connect();
    
    await Promise.all([
        startSubmissionConsumer(),
        startResultConsumer(),
    ]);
}

main();
    