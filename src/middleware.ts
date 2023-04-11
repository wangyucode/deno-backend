import { Status, STATUS_TEXT } from "../deps.ts";
import { isProd } from "./env.ts";
import { logger } from "./logger.ts";
import { sendEmail } from "./notifier.ts";
import { AuthUser, Context, UserRole } from "./types.ts";
import { getErrorResult, getJwtPayload } from "./utils.ts";

export async function loggerMiddleware(
  ctx: Context,
  next: () => Promise<unknown>,
): Promise<void> {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  // ctx.response.headers.set("X-Response-Time", `${ms}ms`);
  logger.info(`${ctx.request.method} ${ctx.request.url} - ${ms}ms`);
}

export async function errorMiddleware(
  ctx: Context,
  next: () => Promise<unknown>,
): Promise<void> {
  try {
    await next();
  } catch (err) {
    const status: Status = err.status || Status.InternalServerError;
    const message = err.message || STATUS_TEXT[status];
    ctx.response.status = status;
    ctx.response.body = getErrorResult(message);
    if (status >= 500) {
      logger.error(status, message, err.stack);
      if (isProd()) {
        sendEmail(`Unexpected error: ${status} ${message} \n ${err.stack}`);
      }
    }
  }
}

export function userGuard(...roles: UserRole[]) {
  return async function userGuard(
    ctx: Context,
    next: () => Promise<unknown>,
  ): Promise<void> {
    const authHeader = ctx.request.headers.get("Authorization");
    if (!authHeader) ctx.throw(401);

    const token = authHeader.replace(/^bearer/i, "").trim();
    const user = await getJwtPayload(token);

    if (!user) ctx.throw(401);
    ctx.user = user as AuthUser;

    if (roles.length > 0) {
      roles.push(UserRole.COOK);
      const hasPermission = user.roles.every((r) =>
        roles.includes(r as UserRole)
      );
      if (!hasPermission) {
        ctx.throw(403);
      }
    }
    await next();
  };
}
