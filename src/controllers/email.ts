import { env } from "../env.ts";
import { sendEmail } from "../notifier.ts";
import { Context } from "../types.ts";
import { getDataResult } from "../utils.ts";

export async function send(ctx: Context) {
  const { key, subject, content, to } = await ctx.request.body().value;
  if (!content) ctx.throw(400, "content is required");
  if (key !== env.MAIL_PASSWORD) ctx.throw(403, "invalid key");
  await sendEmail(content, subject, to);
  ctx.response.body = getDataResult("ok");
}
