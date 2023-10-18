// deno-lint-ignore-file
import WxPay from "npm:wechatpay-node-v3@2.1.6";

import { ObjectId} from "../deps.ts";
import { generateShortUuid } from "./controllers/clipboard.ts";
import { env, loadEnv } from "./env.ts";
import { logger, setupLogger } from "./logger.ts";

await loadEnv();
await setupLogger();

logger.debug(generateShortUuid());

// logger.debug(JSON.stringify({cert: Deno.readTextFileSync("./certs/apiclient_cert.pem"), key: Deno.readTextFileSync("./certs/apiclient_key.pem")}))
const {cert,key} = JSON.parse(env.VENDING_WX_API_CLINET_CERT);

const pay = new WxPay({
  appid: env.VENDING_APP_ID,
  mchid: env.VENDING_MCH_ID,
  publicKey: cert,
  privateKey: key,
});

const params = {
    appid: env.VENDING_APP_ID,
    mchid: env.VENDING_MCH_ID,
    description: "测试商品",
    out_trade_no: new Date().getTime().toString(),
    amount:{
        total: 1
    },
    notify_url: "https://wycode.cn/api/v1/vending/wx-notify"
}

const nonce_str = Math.random().toString(36).substring(2, 15), // 随机字符串
      timestamp = parseInt(+new Date() / 1000 + '').toString(), // 时间戳 秒
      url = '/v3/pay/transactions/native';

const signature = pay.getSignature('POST', nonce_str, timestamp, url, params); // 如果是get 请求 则不需要params 参数拼接在url上 例如 /v3/pay/transactions/id/12177525012014?mchid=1230000109
const authorization = pay.getAuthorization(nonce_str, timestamp, signature);

const res = await fetch('https://api.mch.weixin.qq.com/v3/pay/transactions/native', {
    body: JSON.stringify(params),
    method: 'POST',
    headers: {
        "Authorization": authorization,
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Accept-Language": "zh-CN"
    }
})

console.log(res);

const data = await res.json();

logger.debug(data);