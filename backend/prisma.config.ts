import { defineConfig, env } from "prisma/config";
import "dotenv/config";

export default defineConfig({
  earlyAccess: true,
  datasource: {
    url: process.env.DATABASE_URL || env("DATABASE_URL"),
  },
});
