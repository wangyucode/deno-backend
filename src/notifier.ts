import { createTransport } from "../deps.ts";
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

let transporter: {
  sendMail: (
    message: { from: string; subject: string; text: string; to: string },
  ) => Promise<void>;
};
const ADMIN_EMAIL = "wangyu@wycode.cn";

export async function sendEmail(text: string): Promise<void> {
  if (!transporter) {
    transporter = createTransport({
      host: "smtp.exmail.qq.com",
      port: 465,
      secure: true,
      auth: {
        user: ADMIN_EMAIL,
        pass: env.MAIL_PASSWORD,
      },
    });

    const message = {
      from: ADMIN_EMAIL,
      subject: "【Deno】后端推送",
      text,
      to: ADMIN_EMAIL,
    };

    await transporter.sendMail(message);
    logger.info(`sent email to: ${ADMIN_EMAIL}`);
  }
}
