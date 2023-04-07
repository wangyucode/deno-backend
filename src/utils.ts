import { create, getNumericDate, verify} from "../deps.ts";
import { logger } from "./logger.ts";
import { UserRole } from "./types.ts";

import { AuthUser, CommonResult } from "./types.ts";

export function getDataResult(payload: unknown): CommonResult {
  return { payload, success: true };
}

export function getErrorResult(message?: string): CommonResult {
  return { message, success: false };
}

const key = await crypto.subtle.generateKey(
  { name: "HMAC", hash: "SHA-256" },
  true,
  ["sign", "verify"],
);

export async function getAuthToken(user: AuthUser) {
  const payload = {
    _id: user._id,
    email: user.email,
    roles: user.roles,
    exp: getNumericDate(12 * 60 * 60), // 12 hour from now
  };

  return await create({ alg: "HS256", typ: "JWT" }, payload, key);
}

export async function getJwtPayload(token: string): Promise<AuthUser | null> {
  try {
    return await verify(token, key) as AuthUser;
  } catch (e) {
    logger.warning(e.message);
    return null;
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function generateRandomString(length: number): string {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

export function isValidRole(role: string): boolean {
  return Object.values(UserRole).includes(role as UserRole) &&
    role !== UserRole.COOK;
}
