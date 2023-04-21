import { OpenApi, Sts } from "../../deps.ts";
import { env } from "../env.ts";
import { logger } from "../logger.ts";
import { Context } from "../types.ts";
import { getDataResult, getErrorResult } from "../utils.ts";

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
  const url = `http://signin.aliyun.com/federation?Action=Login&LoginUrl=${
    encodeURIComponent("https://wycode.cn")
  }&Destination=${destinationUrl}&SigninToken=${
    encodeURIComponent(token.SigninToken)
  }`;
  ctx.response.body = getDataResult(url);
}
