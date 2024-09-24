import { Context, log } from "../deps.ts";
import { sendEmail } from "./notifier.ts";
export function setupLogger() {
  log.setup({
    handlers: {
      default: new log.ConsoleHandler("DEBUG", {
        formatter: log.formatters.jsonFormatter,
        useColors: false,
      }),
    },
  });
}

export async function postLog(ctx: Context) {
  const { message, type } = await ctx.request.body.json();
  if (type === "ERROR") {
    sendEmail(`客户端错误:\n${message}`);
    log.error(message);
  } else {
    log.info(message);
  }

  ctx.response.status = 200;
}
