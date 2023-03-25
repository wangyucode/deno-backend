import { Context as OakContext } from "../deps.ts";

/**
 * Custom appilication context
 */
export class Context extends OakContext {
  user?: AuthUser;
  params?: Record<string, string | null>;
}

export interface CommonResult {
  success: boolean;
  payload?: unknown;
  message?: string;
}

export type AuthUser = {
  /** user id */
  _id: string;
  /** user email address */
  email: string;
  /** user password */
  password?: string;
  /** user roles */
  roles: string[];
};

export enum UserRole {
  USER = "guest",
  ADMIN = "admin",
  COOK = "cook",
}

export type EmailTransporter = {
  sendMail: (message: { from: string; subject: string; text: string; to: string; }) => Promise<void>;
}


