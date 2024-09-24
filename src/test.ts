// deno-lint-ignore-file
import { log } from "../deps.ts";
import { generateShortUuid } from "./controllers/clipboard.ts";
import { loadEnv } from "./env.ts";
import { setupLogger } from "./logger.ts";

await loadEnv();
await setupLogger();

log.debug(generateShortUuid());
