import { Bot, webhookCallback } from "grammy";
import type { NutrinoContext, Env } from "./types";
import { authMiddleware } from "./middleware/auth";
import startCommand from "./commands/start";
import foodCommands from "./commands/food";
import subscriptionCommands, { handleSuccessfulPayment } from "./commands/subscription";

function createBot(env: Env): Bot<NutrinoContext> {
  const bot = new Bot<NutrinoContext>(env.BOT_TOKEN);

  bot.use(async (ctx, next) => {
    ctx.env = env;
    await next();
  });

  bot.use(authMiddleware);
  bot.use(startCommand);
  bot.use(foodCommands);
  bot.use(subscriptionCommands);

  bot.on("message:successful_payment", async (ctx) => {
    await handleSuccessfulPayment(ctx);
  });

  bot.on("message", async (ctx) => {
    if (!ctx.message?.text) return;
    if (ctx.message.text.startsWith("/")) return;
    await ctx.reply("Use /help to see available commands.");
  });

  return bot;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === "/webhook") {
      const bot = createBot(env);
      return await webhookCallback(bot, "cloudflare-mod")(req);
    }

    return new Response("Nutrino bot running", { status: 200 });
  },
};
