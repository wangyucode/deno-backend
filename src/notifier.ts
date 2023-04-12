import { SMTPClient } from "../deps.ts";
import { env } from "./env.ts";
import { logger } from "./logger.ts";

// export async function sendDingTalkMessage(message: string): Promise<void> {
//   const response = await fetch(
//     `https://oapi.dingtalk.com/robot/send?access_token=${env.DING_TALK_TOKEN}`,
//     {
//       method: "POST",
//       headers: {
//         "content-type": "application/json",
//       },
//       body:
//         `{"msgtype": "markdown", "markdown": {"title":"【Deno】后端推送", "text":"## ${message}"}}`,
//     },
//   );

//   logger.info(`sent ding-talk message: ${await response.text()}`);
// }

let client: SMTPClient;
const FROM_EMAIL = "wayne001@vip.qq.com";

export async function sendEmail(
  content: string,
  subject = "【Deno】后端推送",
  to = "wangyu@wycode.cn",
): Promise<void> {
  if (!client) {
    client = new SMTPClient({
      connection: {
        hostname: "smtp.qq.com",
        port: 465,
        tls: true,
        auth: {
          username: FROM_EMAIL,
          password: env.MAIL_PASSWORD,
        },
      },
    });
  }

  const message = {
    from: FROM_EMAIL,
    subject,
    to,
    content,
  };

  await client.send(message);
  logger.info(`sent email to: ${to}`);
}
