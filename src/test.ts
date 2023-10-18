// deno-lint-ignore-file
import { generateShortUuid } from "./controllers/clipboard.ts";
import { loadEnv } from "./env.ts";
import { logger, setupLogger } from "./logger.ts";

await loadEnv();
await setupLogger();

logger.debug(generateShortUuid());
