import { helpers } from "../../deps.ts";
import { COLLECTIONS, db } from "../mongo.ts";
import { Context } from "../types.ts";
import { getDataResult, getErrorResult } from "../utils.ts";
import { logger } from "../logger.ts";

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

export async function notify(ctx: Context) {
  const data = await ctx.request.body().value;
  logger.info("wx notification", data);
  // TODO: change order status
  ctx.response.body = 'ok';
}
