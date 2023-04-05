import { helpers, ObjectId } from "../../deps.ts";
import { COLLECTIONS, db } from "../mongo.ts";
import { Context } from "../types.ts";
import { getDataResult } from "../utils.ts";

export async function setConfig(ctx: Context) {
  const data = await ctx.request.body().value;
  if (!data.key) ctx.throw(400, "key required");
  if (!data.value) ctx.throw(400, "value required");
  const configs = db.collection(COLLECTIONS.CONFIG);
  await configs.updateOne({ _id: data.key }, {
    $set: { _id: data.key, value: data.value, date: new Date() },
  }, { upsert: true });
  ctx.response.body = getDataResult(data.key);
}

export async function getConfig(ctx: Context) {
  const { key } = helpers.getQuery(ctx, { mergeParams: true });
  if (!key) ctx.throw(400, "key required");
  const config = await db.collection(COLLECTIONS.CONFIG).findOne({ _id: key });
  if (!config) ctx.throw(404, "配置不存在");
  ctx.response.body = getDataResult(config);
}

export async function deleteConfig(ctx: Context) {
  const id = ctx?.params?.id as string;
  if (!id) ctx.throw(400, "id required");
  ctx.response.body = getDataResult(
    await db.collection(COLLECTIONS.CONFIG).deleteOne({
      _id: new ObjectId(id),
    }),
  );
}
