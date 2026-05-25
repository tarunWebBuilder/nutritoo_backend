import { Composer } from "grammy";
import { insertFoodEntry, getTodayTotal, getTodayEntries, getWeekEntries } from "../db";
import { estimateCalories } from "../services/calorie-estimator";
import type { NutrinoContext } from "../types";

const composer = new Composer<NutrinoContext>();

composer.command("log", async (ctx) => {
  if (!ctx.user) return;

  const text = ctx.match?.trim() || "";
  if (!text) {
    await ctx.reply("Describe what you ate — e.g. /log chicken salad with olive oil");
    return;
  }

  const msg = await ctx.reply("🤔 Estimating calories with AI...");

  const estimate = await estimateCalories(text, ctx.env.MISTRAL_API_KEY);
  if (!estimate) {
    await ctx.api.editMessageText(
      msg.chat.id,
      msg.message_id,
      "Couldn't estimate that. Try being more specific (e.g. /log 200g chicken breast)."
    );
    return;
  }

  const { description, calories } = estimate;

  const macroParts: string[] = [];
  if (estimate.protein_g) macroParts.push(`P ${estimate.protein_g}g`);
  if (estimate.fat_g) macroParts.push(`F ${estimate.fat_g}g`);
  if (estimate.carbs_g) macroParts.push(`C ${estimate.carbs_g}g`);
  const macroLine = macroParts.length ? ` (${macroParts.join(", ")})` : "";
  const serving = estimate.serving_size ? ` • ${estimate.serving_size}` : "";

  await ctx.api.editMessageText(
    msg.chat.id,
    msg.message_id,
    `🤖 *${description}* — ${calories} kcal${macroLine}${serving}`,
    { parse_mode: "Markdown" }
  );

  await insertFoodEntry(ctx.env.DB, ctx.user.id, description, calories, estimate);

  const dailyTotal = await getTodayTotal(ctx.env.DB, ctx.user.id);

  await ctx.reply(
    `✅ Logged: ${description} — ${calories} kcal\n` +
    `Today's total: ${dailyTotal} kcal`
  );
});

composer.command("today", async (ctx) => {
  if (!ctx.user) return;

  const entries = await getTodayEntries(ctx.env.DB, ctx.user.id);
  const total = entries.reduce((sum, e) => sum + e.calories, 0);

  if (entries.length === 0) {
    await ctx.reply("No food logged today yet.");
    return;
  }

  const lines = entries.map(
    (e, i) => `${i + 1}. ${e.description} - ${e.calories} kcal`
  );
  lines.push(`\nTotal: ${total} kcal`);

  await ctx.reply(`📊 *Today's Food Log*\n\n${lines.join("\n")}`, {
    parse_mode: "Markdown",
  });
});

composer.command("week", async (ctx) => {
  if (!ctx.user) return;

  const entries = await getWeekEntries(ctx.env.DB, ctx.user.id);

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);

  const dayMap = new Map<string, number>();
  for (const e of entries) {
    dayMap.set(e.date, e.calories);
  }

  const lines: string[] = [];
  let weekTotal = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = d.toISOString().split("T")[0];
    const cal = dayMap.get(key) || 0;
    weekTotal += cal;
    lines.push(`${dayNames[i]}: ${cal > 0 ? `${cal} kcal` : "—"}`);
  }

  const daysTracked = dayMap.size;
  const avg = daysTracked > 0 ? Math.round(weekTotal / daysTracked) : 0;

  await ctx.reply(
    `📅 *This Week's Calories*\n\n${lines.join("\n")}\n\n` +
    `Week total: ${weekTotal} kcal\n` +
    `Daily avg: ${avg} kcal`,
    { parse_mode: "Markdown" }
  );
});

export default composer;
