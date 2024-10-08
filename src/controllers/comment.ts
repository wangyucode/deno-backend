import { log, ObjectId } from "../../deps.ts";
import { isProd } from "../env.ts";
import { COLLECTIONS, db } from "../mongo.ts";
import { sendEmail } from "../notifier.ts";
import { Context } from "../types.ts";
import { getDataResult } from "../utils.ts";

export async function getComments(ctx: Context) {
  const a = ctx.request.url.searchParams.get("a");
  const k = ctx.request.url.searchParams.get("k");
  const t = ctx.request.url.searchParams.get("t");

  if (!a) ctx.throw(400, "a required");
  if (!k) ctx.throw(400, "k required");
  if (!t) ctx.throw(400, "topic required");

  const app = await db.collection(COLLECTIONS.COMMENT_APP).findOne({
    name: a,
    accessKey: k,
  });

  if (!app) ctx.throw(401);

  const comments = await db.collection(COLLECTIONS.COMMENT).find({
    app: a,
    topic: t,
  }, {
    projection: {
      createTime: {
        $dateToString: {
          date: "$createTime",
          format: "%Y/%m/%d %H:%M:%S",
          timezone: "+08",
        },
      },
      content: 1,
      user: 1,
      like: 1,
      to: 1,
    },
  }).toArray();

  // hide user email
  comments.map((it) => {
    if (/^\S+@\w+(\.[\w]+)+$/.test(it.user)) {
      let user = it.user.charAt(0);
      const atIndex = it.user.lastIndexOf("@");
      user += new Array(atIndex).fill("*").join("");
      user += it.user.substring(atIndex);
      it.user = user;
    }
  });

  ctx.response.body = getDataResult(comments);
}

export async function postComment(ctx: Context) {
  const { type, content, app, key, topic, user, to, toId } = await ctx.request
    .body.json();
  log.info("postComment-->", type, content, app, key, topic, user, to, toId);
  // 评论类型，0.评论，1.点赞
  if ((typeof type) !== "number" || type < 0 || type > 1) {
    ctx.throw(400, "评论类型不合法");
  }
  if (type === 0) {
    if (!content) ctx.throw(400, "内容不能为空");
    if (content.length > 1023) ctx.throw(400, "内容不能超过1000个字");
  }

  const commentApp = await db.collection(COLLECTIONS.COMMENT_APP).findOne({
    name: app,
    accessKey: key,
  });
  if (!commentApp) ctx.throw(401);

  const commentCollection = db.collection(COLLECTIONS.COMMENT);
  let result = null;
  switch (type) {
    case 0: {
      const data = {
        app,
        topic,
        content,
        type,
        user,
        to,
        deleted: false,
        createTime: new Date(),
        like: 0,
      };
      result = await commentCollection.insertOne(data);
      ctx.response.body = getDataResult(result.toString());
      isProd() &&
        sendEmail(
          `评论已保存: ${app} - ${topic}\n${JSON.stringify(data, null, 2)}`,
        );
      break;
    }
    case 1: {
      if (!toId) ctx.throw(400, "toId required");
      result = await commentCollection.updateOne({
        _id: new ObjectId(toId),
      }, { $inc: { like: 1 } });
      ctx.response.body = getDataResult(result.modifiedCount);
      break;
    }
    default:
      ctx.throw(400, "暂不支持");
  }
}
