import { isProd } from "../env.ts";
import { logger } from "../logger.ts";
import { db,COLLECTIONS } from "../mongo.ts";
import { sendEmail } from "../notifier.ts";
import { Context } from "../types.ts";
import { getDataResult } from "../utils.ts";

export async function getWechatApps(ctx: Context) {
    const appid = ctx.request.headers.get('referer')?.match(/^https:\/\/servicewechat.com\/(\w+)\/.*$/)?.[1];
    if (!appid){
        logger.error('非法访问 /wechat/apps ->', ctx.request.headers.get('referer'));
        if(isProd()) sendEmail('非法访问 /wechat/apps ->' + ctx.request.headers.get('referer'));
        ctx.throw(400);
    } 
    ctx.response.body = getDataResult(await db.collection(COLLECTIONS.WECHAT_APP).find({appid: {$not : {$eq: appid}}}).toArray());
}