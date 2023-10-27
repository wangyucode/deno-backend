import { isProd } from "../env.ts";
import { logger } from "../logger.ts";
import { COLLECTIONS, db } from "../mongo.ts";
import { sendEmail } from "../notifier.ts";
import { Context } from "../types.ts";
import { getDataResult } from "../utils.ts";

const SESSION_URL = "https://api.weixin.qq.com/sns/jscode2session";

interface Session {
  session_key?: string;
  openid?: string;
}

export async function getWechatSession(
  appid: string,
  secret: string,
  jscode: string,
): Promise<Session> {
  const url =
    `${SESSION_URL}?appid=${appid}&secret=${secret}&js_code=${jscode}&grant_type=authorization_code`;
  const res = await fetch(url);
  return await res.json();
}

export async function getWechatApps(ctx: Context) {
  const appid = ctx.request.headers.get("referer")?.match(
    /^https:\/\/servicewechat.com\/+(\w+)\/.*$/,
  )?.[1];
  if (!appid) {
    logger.error(
      "非法访问 /wechat/apps ->",
      ctx.request.headers.get("referer"),
    );
    if (isProd()) {
      sendEmail(
        "非法访问 /wechat/apps ->" + ctx.request.headers.get("referer"),
      );
    }
    ctx.throw(400);
  }
  ctx.response.body = getDataResult(
    await db.collection(COLLECTIONS.WECHAT_APP).find({
      appid: { $not: { $eq: appid } },
    }).toArray(),
  );
}
