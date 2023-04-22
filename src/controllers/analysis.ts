import { OpenApi, Sls, Sts } from "../../deps.ts";
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
  // deno-lint-ignore no-explicit-any
  const client = new (Sls.default as any).default(config);
  const now: number = Math.floor(Date.now() / 1000);
  const query =
    "request_uri: /blog/ AND NOT request_uri: /_next/ AND NOT request_uri: /tag/ AND NOT request_uri: /page/ AND NOT request_uri: /category/ AND status = 200 | SELECT request_uri AS path, COUNT(*) AS pv GROUP BY path ORDER BY pv DESC LIMIT 10";
  const req1 = new Sls.GetLogsRequest({
    from: now - 86400 * 14,
    to: now - 86400 * 7,
    query,
  });
  const req2 = new Sls.GetLogsRequest({
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
    ctx.response.body = getErrorResult(res1);
    return;
  }
  if (res2.statusCode !== 200) {
    logger.error("failed to get log of this week", res2);
    ctx.response.body = getErrorResult(res2);
    return;
  }

  // merge res1 and res2
  const res = res2.body.map((it2: { path: string; pv: number }) => ({
    key: /^\/blog\/([\w-]+)$/.exec(it2.path)?.[1],
    pv2: it2.pv,
    pv1:
      res1.body.find((it1: { path: string; pv: number }) =>
        it2.path === it1.path
      )?.pv || 0,
  }));

  ctx.response.body = getDataResult(res);
}

export async function getDashboardUrl(ctx: Context) {
  const config = new OpenApi.Config({
    accessKeyId: env.ALIYUN_ACCESS_KEY_ID,
    accessKeySecret: env.ALIYUN_ACCESS_KEY_SECRET,
    endpoint: "sts.cn-zhangjiakou.aliyuncs.com",
  });

  // deno-lint-ignore no-explicit-any
  const client = new (Sts.default as any).default(config);
  const assumeRoleRequest = new Sts.AssumeRoleRequest({
    roleArn: "acs:ram::1601928733909937:role/aliyun-log-read-role",
    roleSessionName: "deno",
    durationSeconds: 21600,
  });
  const assumeRoleResponse = await client.assumeRole(assumeRoleRequest);

  if (assumeRoleResponse.statusCode !== 200) {
    logger.error("failed to call assumeRole", assumeRoleResponse);
    ctx.response.body = getErrorResult(assumeRoleResponse);
    return;
  }
  const credentials = assumeRoleResponse.body.credentials;

  const tokenRes = await fetch(
    `http://signin.aliyun.com/federation?Action=GetSigninToken&AccessKeyId=${credentials.accessKeyId}&AccessKeySecret=${credentials.accessKeySecret}&SecurityToken=${
      encodeURIComponent(credentials.securityToken)
    }&TicketType=mini`,
  );
  const token = await tokenRes.json();

  if (!token.SigninToken) {
    logger.error("failed to call GetSigninToken", tokenRes);
    ctx.response.body = getErrorResult(token);
    return;
  }
  const destinationUrl = encodeURIComponent(
    "https://sls4service.console.aliyun.com/lognext/project/wycode/dashboard/dashboard-1681748176013-364535?isShare=true&hideTopbar=true&hideSidebar=true&ignoreTabLocalStorage=true&readOnly=true&hiddenReset=true&hiddenModeSwitch=true",
  );
  const url = `https://signin.aliyun.com/federation?Action=Login&LoginUrl=${
    encodeURIComponent("https://wycode.cn")
  }&Destination=${destinationUrl}&SigninToken=${
    encodeURIComponent(token.SigninToken)
  }`;
  ctx.response.body = getDataResult(url);
}
