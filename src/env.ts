import { load } from "../deps.ts";

export let env: Record<string, string>;

export async function loadEnv(): Promise<void> {
  env = await load();
}

export function isProd(): boolean {
  return env.ENV === "prod";
}
