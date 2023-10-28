import { $Sls20201230, OpenApi, Sls20201230 } from "../../deps.ts";
import { env } from "../env.ts";
import { logger } from "../logger.ts";
import { Context } from "../types.ts";
import { getDataResult, getErrorResult } from "../utils.ts";

export async function getBlogs(ctx: Context) {
  const config = new OpenApi.Config({
    accessKeyId: env.ALIYUN_ACCESS_KEY_ID,
    accessKeySecret: env.ALIYUN_ACCESS_KEY_SECRET,
    endpoint: "cn-zhangjiakou.log.aliyuncs.com",
  });

  const client = new Sls20201230.default(config);
  const now: number = Math.floor(Date.now() / 1000);
  const query =
    "request_uri: /blog/ AND NOT request_uri: /_next/ AND NOT request_uri: /tag/ AND NOT request_uri: /page/ AND NOT request_uri: /category/ AND status = 200 | SELECT request_uri AS path, COUNT(*) AS pv GROUP BY path ORDER BY pv DESC LIMIT 10";
  const req1 = new $Sls20201230.GetLogsRequest({
    from: now - 86400 * 14,
    to: now - 86400 * 7,
    query,
  });
  const req2 = new $Sls20201230.GetLogsRequest({
    from: now - 86400 * 7,
    to: now,
    query,
  });
  const res1 = await client.getLogs(
    "wycode",
    "nginx-log",
    req1,
  );
  const res2 = await client.getLogs(
    "wycode",
    "nginx-log",
    req2,
  );

  if (res1.statusCode !== 200) {
    logger.error("failed to get log of previous week", res1);
    ctx.response.body = getErrorResult(JSON.stringify(res1));
    return;
  }
  if (res2.statusCode !== 200) {
    logger.error("failed to get log of this week", res2);
    ctx.response.body = getErrorResult(JSON.stringify(res2));
    return;
  }

  // merge res1 and res2
  const res = res2.body.map((it2) => ({
    key: /^\/blog\/([\w-]+)$/.exec(it2.path)?.[1],
    pv2: it2.pv,
    pv1: res1.body.find((it1) => it2.path === it1.path)?.pv || 0,
  }));

  ctx.response.body = getDataResult(res);
}

export async function getDashboardUrl(ctx: Context) {
  const config = new OpenApi.Config({
    accessKeyId: env.ALIYUN_ACCESS_KEY_ID,
    accessKeySecret: env.ALIYUN_ACCESS_KEY_SECRET,
    endpoint: "cn-shanghai.log.aliyuncs.com",
  });

  const client = new Sls20201230.default(config);

  const createTicketRequest = new $Sls20201230.CreateTicketRequest({
    playAccessKeyId: env.ALIYUN_ACCESS_KEY_ID,
    playAccessKeySecret: env.ALIYUN_ACCESS_KEY_SECRET,
  });
  let res;
  try {
    res = await client.createTicket(createTicketRequest);
    if (res.statusCode !== 200 || !res.body.ticket) throw new Error();
  } catch (e) {
    const msg = "fail to create aliyun sls ticket";
    logger.error(msg, e);
    ctx.response.body = getErrorResult(msg);
    return;
  }

  const dashboardUrl =
    `https://sls.console.aliyun.com/lognext/project/wycode/dashboard/dashboard-1681748176013-364535?isShare=true&hideTopbar=true&hideSidebar=true&ignoreTabLocalStorage=true&hiddenModeSwitch=true&sls_ticket=${res.body.ticket}`;
  ctx.response.body = getDataResult(dashboardUrl);
}
