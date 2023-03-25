import { Router } from "../deps.ts";

import * as auth from "./controllers/auth.ts";
import { state } from "./controllers/state.ts";
import * as config from "./controllers/config.ts";
import { userGuard } from "./middleware.ts";
import { UserRole } from "./types.ts";

export const router = new Router()
  .prefix("/api/v1")
  .get("/", state)
  .post("/login", auth.login)
  .post("/config", userGuard(UserRole.ADMIN), config.setConfig)
  .get("/config", userGuard(), config.getConfig)
