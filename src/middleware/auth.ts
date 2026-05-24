import { Context, MiddlewareFn } from "grammy";
import prisma from "../db";

export interface AuthContext extends Context {
  user?: {
    id: number;
    telegramId: bigint;
    subscribedUntil: Date | null;
  };
}

export const authMiddleware: MiddlewareFn<AuthContext> = async (ctx, next) => {
  if (!ctx.from) {
    await ctx.reply("User not found.");
    return;
  }

  const telegramId = BigInt(ctx.from.id);

  let user = await prisma.user.findUnique({
    where: { telegramId },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        telegramId,
        firstName: ctx.from.first_name,
        lastName: ctx.from.last_name,
        username: ctx.from.username,
      },
    });
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName: ctx.from.first_name,
        lastName: ctx.from.last_name,
        username: ctx.from.username,
      },
    });
  }

  ctx.user = {
    id: user.id,
    telegramId: user.telegramId,
    subscribedUntil: user.subscribedUntil,
  };

  await next();
};

export const requireSubscription: MiddlewareFn<AuthContext> = async (ctx, next) => {
  if (!ctx.user) {
    await ctx.reply("Please start the bot with /start first.");
    return;
  }

  if (!ctx.user.subscribedUntil || ctx.user.subscribedUntil < new Date()) {
    await ctx.reply(
      "You need an active subscription to use this feature.\n\n" +
      "Subscribe with /subscribe to get started."
    );
    return;
  }

  await next();
};
