import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import * as dotenv from "dotenv";
import { PrismaClient } from "../generated/prisma/client.js";

dotenv.config();

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST || "localhost",
  port: Number(process.env.DATABASE_PORT) || 3306,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  connectionLimit: 20,
});

const prisma = new PrismaClient({
  adapter,
  log: [
    {
      emit: "event",
      level: "query",
    },
    {
      emit: "event",
      level: "error",
    },
    {
      emit: "event",
      level: "info",
    },
    {
      emit: "event",
      level: "warn",
    },
  ],
});

prisma.$on("warn", (e: any) => {
  console.log("Prisma Warn:", e);
});

prisma.$on("info", (e: any) => {
  console.log("Prisma Info:", e);
});

prisma.$on("error", (e: any) => {
  console.error("Prisma Error:", e);
});

export default prisma;
