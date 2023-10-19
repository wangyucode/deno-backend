import * as middleware from "./middleware.ts";
import { router } from "./routes.ts";
import { connectToMongo } from "./mongo.ts";
import { Application, format, oakCors } from "../deps.ts";
import { env, isProd, loadEnv } from "./env.ts";
import { logger, setupLogger } from "./logger.ts";
import { sendEmail } from "./notifier.ts";
import { afterServerStart } from "./setup.ts";

function startHttpServer() {
  const app = new Application();
  app.use(oakCors());
  app.use(middleware.errorMiddleware);
  app.use(middleware.loggerMiddleware);
  app.use(router.routes());
  app.use(router.allowedMethods());

  app.listen({ port: Number.parseInt(env.PORT) });
}

loadEnv()
  .then(setupLogger)
  .then(connectToMongo)
  .then(startHttpServer)
  .then(afterServerStart)
  .then(() => {
    logger.info(`server listening on ${env.PORT}`);
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
    logger.error("deno-backend 启动时发生错误", e);
  });
