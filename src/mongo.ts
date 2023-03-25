import { Database, MongoClient } from "../deps.ts";
import { env } from "./env.ts";
import { logger } from "./logger.ts";
import { sleep } from "./utils.ts";

const DB_NAME = "lims";
export let db: Database;
let retry = 0;

export enum COLLECTIONS {
  USER = "user",
  TASK = "task",
  DEPARTMENT = "department",
  CONFIG = "config",
}

export async function connectToMongo(): Promise<void> {
  try {
    logger.info("connecting to mongodb...");
    const client = new MongoClient();
    // Connect the client to the server
    await client.connect(env.MONGODB_URI);
    // Establish and verify connection
    db = await client.database(DB_NAME);
    await client.runCommand(DB_NAME, { ping: 1 });
    logger.info("Connected successfully to mongodb");
  } catch {
    if (retry < 10) {
      retry++;
      await sleep(5000);
      await connectToMongo();
    } else {
      throw new Error("Error connecting to mongodb");
    }
  }
}
