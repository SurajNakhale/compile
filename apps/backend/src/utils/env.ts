import "dotenv/config";

function readRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env variable: ${name}`);
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? "3000"),
  redisUrl: readRequiredEnv("REDIS_URL")
};
