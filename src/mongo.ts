import { Database, MongoClient } from "../deps.ts";
import { env } from "./env.ts";
import { logger } from "./logger.ts";
import { sleep } from "./utils.ts";

const DB_NAME = "wycode";
export let db: Database;
let retry = 0;

export enum COLLECTIONS {
  USER = "user",
  COMMENT_APP = "mongoCommentApp",
  CONFIG = "config",
  CLIPBOARD = "clipboard",
  COMMENT = "comments",
  WECHAT_APP = "wechatApp",
  VENDING_BANNER = "vendingBanner",
  VENDING_GOODS = "vendingGoods",
  VENDING_ORDER = "vendingOrder",
}

export enum CONFIG_KEYS {
  CONFIG_NOTIFICATION_CLIPBOARD = "CONFIG_NOTIFICATION_CLIPBOARD",
  CONFIG_PATCH_RECORD = "CONFIG_PATCH_RECORD",
}

export async function connectToMongo(): Promise<void> {
  try {
    logger.info("connecting to mongodb...");
    const client = new MongoClient();
    // Connect the client to the server
    await client.connect(env.MONGODB_URI);
    // Establish and verify connection
    db = client.database(DB_NAME);
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
