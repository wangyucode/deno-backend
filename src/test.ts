import { bcrypt } from "../deps.ts";
import { generateShortUuid } from "./controllers/clipboard.ts";
import { loadEnv } from "./env.ts";
import { logger, setupLogger } from "./logger.ts";
import { sendEmail } from "./notifier.ts";

await loadEnv();
await setupLogger();

const hash = await bcrypt.hash("123456");

logger.debug(hash);
logger.debug(await bcrypt.compare("123456", hash));

logger.debug(generateShortUuid());
await sendEmail("test");
await sendEmail("test1");
