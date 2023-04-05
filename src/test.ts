import { bcrypt } from "../deps.ts";
import { loadEnv } from "./env.ts";
import { logger, setupLogger } from "./logger.ts";

loadEnv()
  .then(setupLogger);

const hash = await bcrypt.hash("123456");

logger.debug(hash);
logger.debug(await bcrypt.compare("123456", hash));

