import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

// Singleton Prisma client to avoid creating many connections in development
const prisma = new PrismaClient();

export default prisma;
