import * as middleware from "./middleware.ts";
import { router } from "./routes.ts";
import { connectToMongo } from "./mongo.ts";
import { Application, format, log, oakCors } from "../deps.ts";
import { env, isProd, loadEnv } from "./env.ts";
import { setupLogger } from "./logger.ts";
import { sendEmail } from "./notifier.ts";
import { afterServerStart } from "./setup.ts";

function startHttpServer() {
  new Application()
    .use(oakCors())
    .use(middleware.errorMiddleware)
    .use(router.routes())
    .use(router.allowedMethods())
    .listen({ port: Number.parseInt(env.PORT) });
}

loadEnv()
  .then(setupLogger)
  .then(connectToMongo)
  .then(startHttpServer)
  .then(afterServerStart)
  .then(() => {
    log.info(`server listening on ${env.PORT}`);
    if (isProd()) {
      sendEmail(
        `deno-backend start successfully on: ${
          format(new Date(), "yyyy/MM/dd HH:mm:ss")
        }.`,
      );
    }
  })
  .catch((e) => {
    console.error("deno-backend 启动时发生错误", e);
    if (isProd()) {
      sendEmail(`deno-backend start failed: ${e.toString()}`);
    }
    log.error("deno-backend 启动时发生错误", e);
  });
