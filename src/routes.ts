import { Router } from "../deps.ts";

import * as auth from "./controllers/auth.ts";
import { state } from "./controllers/state.ts";
import * as config from "./controllers/config.ts";
import * as comments from "./controllers/comment.ts";
import * as wechat from "./controllers/wechat.ts";
import { userGuard } from "./middleware.ts";
import { UserRole } from "./types.ts";

export const router = new Router()
  .prefix("/api/v1")
  .get("/", state)
  .post("/login", auth.login)
  .get("/config", config.getConfig)
  .post("/config", userGuard(UserRole.ADMIN), config.setConfig)
  .delete('/config/:id', userGuard(UserRole.ADMIN), config.deleteConfig)
  .post('/comment', comments.postComment)
  .get('/wechat/apps', wechat.getWechatApps)

