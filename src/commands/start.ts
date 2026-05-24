import { Composer } from "grammy";
import type { AuthContext } from "../middleware/auth";

const composer = new Composer<AuthContext>();

composer.command("start", async (ctx) => {
  const name = ctx.from?.first_name || "there";
  await ctx.reply(
    `Welcome to Nutrino, ${name}! 🥗\n\n` +
    `I help you track your daily calorie intake.\n\n` +
    `Commands:\n` +
    `/log <description> <calories> - Log a food entry\n` +
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
    `/log <description> <calories> - Log a food entry\n` +
    `/today - See today's total calories\n` +
    `/week - See this week's stats\n` +
    `/subscribe - Subscribe to Nutrino\n` +
    `/cancel - Cancel subscription\n` +
    `/help - Show this message`
  );
});

export default composer;
