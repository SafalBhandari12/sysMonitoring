export const config = {
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgresql://postgres:password@localhost:5433/postgres",
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "random-client-id",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "random-secret",
  GOOGLE_REDIRECT_URI:
    process.env.GOOGLE_REDIRECT_URI ||
    "http://localhost:3000/auth/google/callback",
};
