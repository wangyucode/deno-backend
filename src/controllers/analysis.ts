import { helpers } from "../../deps.ts";
import { COLLECTIONS, db } from "../mongo.ts";
import { Apps, Context } from "../types.ts";
import { getDataResult } from "../utils.ts";

export async function getBlogs(ctx: Context) {
  const blogs = await db.collection(COLLECTIONS.ACCESS_COUNT).find(
    { _id: { $regex: /^blog_[\w-]+$/ } },
    {
      sort: { monthly: -1 },
      projection: { records: 0 },
      limit: 10,
    },
  ).toArray();

  ctx.response.body = getDataResult(blogs);
}

export async function getApps(ctx: Context) {
  const apps = await db.collection(COLLECTIONS.ACCESS_COUNT).find({
    _id: { $in: Apps },
  }, {
    projection: { records: 0 },
  }).toArray();
  ctx.response.body = getDataResult(apps);
}

export async function getErrors(ctx: Context) {
  const query = helpers.getQuery(ctx, { mergeParams: true });
  let page = Number.parseInt(query.page);
  const size = Number.parseInt(query.size);
  const status = Number.parseInt(query.status);
  if (Number.isNaN(size) || size <= 0) ctx.throw(400, "size required");
  if (Number.isNaN(page) || page < 0) page = 0;
  const result = db.collection(COLLECTIONS.ACCESS_ERROR).find(
    status > 0 ? { status } : undefined,
    {
      projection: { _id: 0 },
      sort: {
        time: -1,
      },
    },
  );
  const total = await db.collection(COLLECTIONS.ACCESS_ERROR).countDocuments();
  const items = await result.skip(page * size).limit(size).toArray();
  ctx.response.body = getDataResult({ page, size, items, total });
}

export async function getRecords(ctx: Context) {
  const query = helpers.getQuery(ctx, { mergeParams: true });
  const records = await db.collection(COLLECTIONS.ACCESS_COUNT).findOne({
    _id: query.id || "all",
  });
  ctx.response.body = getDataResult(records);
}
