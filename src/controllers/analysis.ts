import {
  $OpenApi,
  $Sls20201230,
  $Sts20150401,
  OpenApi,
  Sls20201230,
  Sts20150401,
} from "../../deps.ts";
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
  const config = new $OpenApi.Config({
    accessKeyId: env.ALIYUN_ACCESS_KEY_ID,
    accessKeySecret: env.ALIYUN_ACCESS_KEY_SECRET,
    endpoint: "sts.cn-zhangjiakou.aliyuncs.com",
  });

  const client = new Sts20150401.default(config);
  const request = new $Sts20150401.AssumeRoleRequest({
    roleArn: "acs:ram::1601928733909937:role/aliyun-log-read-role",
    roleSessionName: "aliyun-log-read-role",
  });

  let res;
  // assume role session
  try {
    res = await client.assumeRole(request);
    if (res.statusCode !== 200 || !res.body.credentials) throw new Error();
  } catch (e) {
    const msg = "fail to create assumeRole on aliyun";
    logger.error(msg, e);
    ctx.response.body = getErrorResult(msg);
    return;
  }
  let signInRes;
  // sign in
  try {
    signInRes = await (await fetch(
      "https://signin.aliyun.com/federation?Action=GetSigninToken" +
        "&AccessKeyId=" +
        encodeURIComponent(res.body.credentials.accessKeyId ?? "") +
        "&AccessKeySecret=" +
        encodeURIComponent(res.body.credentials.accessKeySecret ?? "") +
        "&SecurityToken=" +
        encodeURIComponent(res.body.credentials.securityToken ?? "") +
        "&TicketType=mini",
    )).json();
    if (!signInRes.SigninToken) throw new Error();
  } catch (e) {
    const msg = "fail to get SLS token on aliyun";
    logger.error(msg, e);
    ctx.response.body = getErrorResult(msg);
    return;
  }

  const dashboardUrl = "https://signin.aliyun.com/federation?Action=Login" +
    "&LoginUrl=" +
    encodeURIComponent(
      "https://sls.console.aliyun.com/lognext/project/wycode/dashboard/dashboard-1681748176013-364535",
    ) +
    "&Destination=" +
    encodeURIComponent(
      "https://sls4service.console.aliyun.com/lognext/project/wycode/dashboard/dashboard-1681748176013-364535?isShare=true&hideTopbar=true&hideSidebar=true&ignoreTabLocalStorage=true&hiddenModeSwitch=true&readOnly=true",
    ) +
    "&SigninToken=" +
    encodeURIComponent(signInRes.SigninToken);
  ctx.response.body = getDataResult(dashboardUrl);
}
