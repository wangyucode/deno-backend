import { helpers, ObjectId, WxPay } from "../../deps.ts";
import { COLLECTIONS, db } from "../mongo.ts";
import { Context } from "../types.ts";
import { getDataResult, getErrorResult } from "../utils.ts";
import { logger } from "../logger.ts";
import { env } from "../env.ts";
import { sendEmail } from "../notifier.ts";

let wxPay: WxPay;

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

export async function getOrder(ctx: Context) {
  const { id } = helpers.getQuery(ctx, { mergeParams: true });
  const cc = db.collection(COLLECTIONS.VENDING_ORDER);
  const result = await cc.findOne({ _id: id });
  ctx.response.body = getDataResult(result);
}

export async function createOrder(ctx: Context) {
  const { description, total, goodsDetail } = await ctx.request.body().value;
  logger.info("createOrder:", description, total, goodsDetail.length);
  if (!description || !total || !goodsDetail || !goodsDetail.length) {
    ctx.throw(400);
  }
  const out_trade_no = new ObjectId();
  const params = {
    description,
    appid: env.VENDING_APP_ID,
    mchid: env.VENDING_MCH_ID,
    out_trade_no,
    amount: { total },
    notify_url: "https://wycode.cn/api/v1/vending/wx-notify",
  };
  const nonce_str = Math.random().toString(36).substring(2, 15), // 随机字符串
    timestamp = parseInt(+new Date() / 1000 + "").toString(), // 时间戳 秒
    url = "/v3/pay/transactions/native";
  const pay = getWxPay();
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
  if (res.status === 200) {
    const cc = db.collection(COLLECTIONS.VENDING_ORDER);
    await cc.insertOne({
      _id: out_trade_no,
      createDate: new Date(),
      trade_state: "CREATED",
      goodsDetail,
    });
    ctx.response.body = getDataResult(data);
  } else {
    ctx.response.body = getErrorResult(data);
  }
}

export async function notify(ctx: Context) {
  const body = await ctx.request.body().value;
  logger.info(
    "wx notification",
    JSON.stringify(body),
    JSON.stringify(ctx.request.headers),
  );
  const pay = getWxPay();
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
      // deno-lint-ignore no-explicit-any
    ) as any;
    const resultString = JSON.stringify(result);
    logger.info("解密结果:", resultString);
    if (!result) ctx.throw(403, "解密失败");

    const cc = db.collection(COLLECTIONS.VENDING_ORDER);
    await cc.updateOne({ _id: new ObjectId(result.out_trade_no) }, result);
    sendEmail(`订单支付成功：\n${resultString}`);
  }

  ctx.response.body = "ok";
}

export function getWxPay() {
  if (!wxPay) {
    const { cert, key } = JSON.parse(env.VENDING_WX_API_CLIENT_CERT);

    wxPay = new WxPay({
      appid: env.VENDING_APP_ID,
      mchid: env.VENDING_MCH_ID,
      publicKey: cert,
      privateKey: key,
      key: env.VENDING_WX_APIV3_KEY,
    });

    wxPay["getRequest"] = async (url, authorization) => {
      const res = await fetch(url, {
        headers: {
          "Accept": "application/json",
          "Authorization": authorization,
          "Accept-Language": "zh-CN",
        },
      });
      const data = await res.json();
      logger.info(JSON.stringify(data));
      data.status = res.status;
      return data;
    };
  }

  return wxPay;
}
