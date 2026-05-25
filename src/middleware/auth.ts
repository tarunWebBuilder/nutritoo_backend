import { MiddlewareFn } from "grammy";
import { findOrCreateUser } from "../db";
import type { NutrinoContext } from "../types";

export const authMiddleware: MiddlewareFn<NutrinoContext> = async (ctx, next) => {
  if (!ctx.from) return;

  const user = await findOrCreateUser(
    ctx.env.DB,
    ctx.from.id,
    ctx.from.first_name,
    ctx.from.last_name,
    ctx.from.username
  );

  ctx.user = {
    id: user.id,
    telegram_id: user.telegram_id,
    subscribed_until: user.subscribed_until,
  };

  await next();
};

export const requireSubscription: MiddlewareFn<NutrinoContext> = async (ctx, next) => {
  if (!ctx.user) {
    await ctx.reply("Please start the bot with /start first.");
    return;
  }

  if (!ctx.user.subscribed_until || new Date(ctx.user.subscribed_until) < new Date()) {
    await ctx.reply(
      "You need an active subscription to use this feature.\n\n" +
      "Subscribe with /subscribe to get started."
    );
    return;
  }

  await next();
};
