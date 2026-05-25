import { Composer } from "grammy";
import type { NutrinoContext } from "../types";

const composer = new Composer<NutrinoContext>();

composer.command("start", async (ctx) => {
  const name = ctx.from?.first_name || "there";
  await ctx.reply(
    `Welcome to Nutrino, ${name}! 🥗\n\n` +
    `I track your daily calories using AI.\n\n` +
    `Commands:\n` +
    `/log <food> - AI estimates calories (e.g. /log lentil soup)\n` +
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
