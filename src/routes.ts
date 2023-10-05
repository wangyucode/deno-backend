import { Router } from "../deps.ts";

import * as auth from "./controllers/auth.ts";
import { state } from "./controllers/state.ts";
import * as config from "./controllers/config.ts";
import * as comments from "./controllers/comment.ts";
import * as wechat from "./controllers/wechat.ts";
import * as clipboard from "./controllers/clipboard.ts";
import * as analysis from "./controllers/analysis.ts";
import * as email from "./controllers/email.ts";
import * as chat from "./controllers/chat.ts";
import * as vending from "./controllers/vending.ts";
import { apiKeyGuard, userGuard } from "./middleware.ts";
import { UserRole } from "./types.ts";

export const router = new Router()
  .prefix("/api/v1")
  .get("/", state)
  .post("/login", auth.login)
  .get("/config", config.getConfig)
  .post("/config", userGuard(UserRole.ADMIN), config.setConfig)
  .delete("/config/:id", userGuard(UserRole.ADMIN), config.deleteConfig)
  .post("/email", email.send)
  .post("/comment", comments.postComment)
  .get("/comment", comments.getComments)
  .get("/wechat/apps", wechat.getWechatApps)
  .get("/clipboard/wx/:code", clipboard.getByWxCode)
  .get("/clipboard/notification", clipboard.getNotification)
  .get("/clipboard/:id", clipboard.getById)
  .get("/clipboard/openid/:openid", clipboard.getByOpenid)
  .post("/clipboard", clipboard.saveById)
  .get("/analysis/blogs", analysis.getBlogs)
  .get("/analysis/dashboard", analysis.getDashboardUrl)
  .get("/ws/create", chat.create)
  .get("/ws/join", chat.join)
  .get("/vending/banner", apiKeyGuard, vending.getBanners)
  .get("/vending/goods", apiKeyGuard, vending.getGoods);
