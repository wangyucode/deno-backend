import { Context, format, log } from "../deps.ts";
import { isProd } from "./env.ts";

export let logger: log.Logger;
export async function setupLogger(): Promise<void> {
  const formatter = (record: log.LogRecord) =>
    `[${record.levelName}] [${
      format(new Date(), "yyyy/MM/dd HH:mm:ss SSS")
    }] ${record.msg} ${record.args.join(" ")}`;
  const config: log.LogConfig = {
    handlers: {
      console: new log.handlers.ConsoleHandler("DEBUG", { formatter }),
      file: new log.handlers.FileHandler("INFO", {
        filename: isProd() ? "/app/log/app.log" : "./log/app.log",
        formatter,
      }),
    },
    loggers: {
      "DEVELOPMENT": {
        level: "DEBUG",
        handlers: ["console"],
      },
      "PRODUCT": {
        level: "INFO",
        handlers: ["console", "file"],
      },
    },
  };
  await log.setup(config);

  logger = log.getLogger(isProd() ? "PRODUCT" : "DEVELOPMENT");
}

export async function postLog(ctx: Context) {
  const message = await ctx.request.body().value;
  logger.info(message);
  ctx.response.body = message;
}
