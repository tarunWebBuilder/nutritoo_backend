import { Composer } from "grammy";
import type { AuthContext } from "../middleware/auth";

const composer = new Composer<AuthContext>();

composer.command("start", async (ctx) => {
  const name = ctx.from?.first_name || "there";
  await ctx.reply(
    `Welcome to Nutrino, ${name}! 🥗\n\n` +
    `I help you track your daily calorie intake.\n\n` +
    `Commands:\n` +
    `/log <food> - AI estimates and logs calories (e.g. /log chicken salad)\n` +
    `/today - See today's total calories\n` +
    `/week - See this week's stats\n` +
    `/subscribe - Subscribe to Nutrino\n` +
    `/cancel - Cancel subscription\n` +
    `/help - Show this message`
  );
});

composer.command("help", async (ctx) => {
  await ctx.reply(
    `Commands:\n` +
    `/log <food> - AI estimates and logs calories\n` +
    `/today - See today's total calories\n` +
    `/week - See this week's stats\n` +
    `/subscribe - Subscribe to Nutrino\n` +
    `/cancel - Cancel subscription\n` +
    `/help - Show this message`
  );
});

export default composer;
