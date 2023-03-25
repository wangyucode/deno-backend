import { lodash } from "../../deps.ts";
import { router } from "../routes.ts";
import { Context } from "../types.ts";

export function state(ctx: Context) {
  const routes = [...router].map((it) =>
    lodash.pick(it, "path", "paramNames", "methods")
  );
  ctx.response.body = { state: "UP", routes };
}
