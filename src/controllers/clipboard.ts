import { env } from "../env.ts";
import { COLLECTIONS, CONFIG_KEYS, db } from "../mongo.ts";
import { sendEmail } from "../notifier.ts";
import { Context } from "../types.ts";
import { getDataResult, getErrorResult } from "../utils.ts";
import { getConfig } from "./config.ts";
import { getWechatSession } from "./wechat.ts";

export async function getNotification(ctx: Context) {
  ctx.request.url.searchParams.append(
    "key",
    CONFIG_KEYS.CONFIG_NOTIFICATION_CLIPBOARD,
  );
  return await getConfig(ctx);
}

export async function getById(ctx: Context) {
  const _id = ctx?.params?.id as string;
  if (!_id) ctx.throw(400, "id required");
  const cc = db.collection(COLLECTIONS.CLIPBOARD);
  const result = await cc.findOne({ _id }, {
    projection: { content: 1, createDate: 1, lastUpdate: 1, tips: 1 },
  });
  ctx.response.body = result ? getDataResult(result) : getErrorResult("未找到");
}

export async function getByOpenid(ctx: Context) {
  const openid = ctx?.params?.openid as string;
  if (!openid) ctx.throw(400, "openid required");
  const result = await findByOpenid(openid);
  ctx.response.body = result ? getDataResult(result) : getErrorResult("未找到");
}

export async function saveById(ctx: Context) {
  const data = await ctx.request.body().value;
  if (!data._id) ctx.throw(400, "_id required");
  const cc = db.collection(COLLECTIONS.CLIPBOARD);
  const result = await cc.updateOne(
    { _id: data._id },
    {
      $set: { content: data.content, lastUpdate: new Date() },
    },
  );
  ctx.response.body = result.modifiedCount
    ? getDataResult(data._id)
    : getErrorResult("未找到");
}

export async function getByWxCode(ctx: Context) {
  const code = ctx?.params?.code as string;
  if (!code) ctx.throw(400, "code required");
  const { openid } = await getWechatSession(
    env.WX_APPID_CLIPBOARD,
    env.WX_SECRET_CLIPBOARD,
    code,
  );
  if (openid) {
    let result = await findByOpenid(openid);
    if (result) {
      ctx.response.body = getDataResult(result);
    } else {
      let id = generateShortUuid();
      const cc = db.collection(COLLECTIONS.CLIPBOARD);
      while (await cc.findOne({ _id: id })) { //add new char if id exist
        id += Math.floor(Math.random() * 36).toString(36);
      }
      const now = new Date();
      result = {
        _id: id,
        content:
          "请输入你想保存的内容,内容可在网页端: https://wycode.cn/clipboard 使用查询码查询,或小程序免登录查询。",
        tips: "",
        openid,
        createDate: now,
        lastUpdate: now,
      };
      await cc.insertOne(result);
      sendEmail("有新的用户注册了Clipboard服务", "剪贴板服务");
      ctx.response.body = getDataResult(result);
    }
  } else {
    ctx.throw(401, "登录失败");
  }
}

async function findByOpenid(openid: string) {
  const cc = db.collection(COLLECTIONS.CLIPBOARD);
  return await cc.findOne({ openid: openid }, {
    projection: {
      content: 1,
      createDate: 1,
      lastUpdate: 1,
      tips: 1,
      openid: 1,
    },
  });
}

export function generateShortUuid(): string {
  const uuid = crypto.randomUUID().replace("-", "");
  let shortId = "";
  for (let i = 0; i < 4; i++) { //分成4组，每组8位
    const str = uuid.substring(i * 8, i * 8 + 8);
    const x = Number.parseInt(str, 16);
    shortId += (x % 36).toString(36); //对10个数字和26个字母取模
  }
  return shortId;
}
