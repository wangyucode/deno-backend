import { helpers, WxPay } from "../../deps.ts";
import { COLLECTIONS, db } from "../mongo.ts";
import { Context } from "../types.ts";
import { getDataResult, getErrorResult } from "../utils.ts";
import { logger } from "../logger.ts";
import { env, loadEnv } from "../env.ts";

await loadEnv();
const { cert, key } = JSON.parse(env.VENDING_WX_API_CLINET_CERT);

const pay = new WxPay({
  appid: env.VENDING_APP_ID,
  mchid: env.VENDING_MCH_ID,
  publicKey: cert,
  privateKey: key,
  key: env.VENDING_WX_APIV3_KEY,
});

export async function getBanners(ctx: Context) {
  const cc = db.collection(COLLECTIONS.VENDING_BANNER);
  const result = await cc.find().toArray();
  ctx.response.body = result ? getDataResult(result) : getErrorResult("未找到");
}

export async function getGoods(ctx: Context) {
  const { type } = helpers.getQuery(ctx, { mergeParams: true });
  const cc = db.collection(COLLECTIONS.VENDING_GOODS);
  const result = await cc.find({ type }).toArray();
  ctx.response.body = result ? getDataResult(result) : getErrorResult("未找到");
}

export async function createOrder(ctx: Context) {
  const { description, total, goods_detail } = await ctx.request.body().value;
  logger.info("createOrder:", description, total, goods_detail.length);
  if (!description || !total || !goods_detail || !goods_detail.length) {
    ctx.throw(400);
  }
  const out_trade_no = new Date().getTime().toString();
  const params = {
    description,
    appid: env.VENDING_APP_ID,
    mchid: env.VENDING_MCH_ID,
    out_trade_no,
    amount: { total },
    detail: { goods_detail },
    notify_url: "https://wycode.cn/api/v1/vending/wx-notify",
  };
  const nonce_str = Math.random().toString(36).substring(2, 15), // 随机字符串
    timestamp = parseInt(+new Date() / 1000 + "").toString(), // 时间戳 秒
    url = "/v3/pay/transactions/native";
  const signature = pay.getSignature("POST", nonce_str, timestamp, url, params);
  const authorization = pay.getAuthorization(nonce_str, timestamp, signature);
  const res = await fetch(
    "https://api.mch.weixin.qq.com/v3/pay/transactions/native",
    {
      body: JSON.stringify(params),
      method: "POST",
      headers: {
        "Authorization": authorization,
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Accept-Language": "zh-CN",
      },
    },
  );
  const data = await res.json();
  data.out_trade_no = out_trade_no;
  logger.info("createOrder: data: ", JSON.stringify(data));
  ctx.response.body = getDataResult(data);
}

export async function notify(ctx: Context) {
  const body = await ctx.request.body().value;
  logger.info("wx notification", JSON.stringify(body));
  const params = {
    body,
    signature: ctx.request.headers.get("wechatpay-signature") || "",
    serial: ctx.request.headers.get("wechatpay-serial") || "",
    nonce: ctx.request.headers.get("wechatpay-nonce") || "",
    timestamp: ctx.request.headers.get("wechatpay-timestamp") || 0,
  };
  const ret = await pay.verifySign(params);
  logger.info("验签结果:", ret);
  if (!ret) ctx.throw(401);

  if (body.event_type === "TRANSACTION.SUCCESS") {
    const result = await pay.decipher_gcm(
      body.resource.ciphertext,
      body.resource.associated_data,
      body.resource.nonce,
    );
    logger.info("解密结果:", JSON.stringify(result));
    if (!result) ctx.throw(403, "解密失败");

    const cc = db.collection(COLLECTIONS.VENDING_ORDER);
    await cc.insertOne(result);
  }

  ctx.response.body = "ok";
}