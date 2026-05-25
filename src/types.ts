import { Context } from "grammy";

export interface Env {
  DB: D1Database;
  BOT_TOKEN: string;
  MISTRAL_API_KEY: string;
}

export interface UserInfo {
  id: number;
  telegram_id: number;
  subscribed_until: string | null;
}

export interface NutrinoContext extends Context {
  env: Env;
  user?: UserInfo;
}

export interface DbUser {
  id: number;
  telegram_id: number;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  created_at: string;
  updated_at: string;
  subscribed_until: string | null;
  subscription_id: string | null;
}
