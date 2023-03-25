import { bcrypt } from "../../deps.ts";
import { COLLECTIONS, db } from "../mongo.ts";
import { AuthUser, Context } from "../types.ts";
import { getAuthToken, getDataResult } from "../utils.ts";

export async function login(ctx: Context): Promise<void> {
  const data = await ctx.request.body().value;
  if (!data || !data.name) ctx.throw(400, "name required");
  if (!data.password) ctx.throw(400, "password required");

  const user = await db.collection<AuthUser>(COLLECTIONS.USER).findOne({
    name: data.name,
  });

  if (user) {
    const result = await bcrypt.compare(data.password, user.password as string);
    if (result) {
      const token = await getAuthToken(user);
      ctx.response.body = getDataResult(token);
      return;
    }
  }

  ctx.throw(401);
}
