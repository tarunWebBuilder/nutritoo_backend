import { Composer } from "grammy";
import prisma from "../db";
import type { AuthContext } from "../middleware/auth";
import { estimateCalories } from "../services/calorie-estimator";

const composer = new Composer<AuthContext>();

function getStartOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getEndOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function getStartOfWeek(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

composer.command("log", async (ctx) => {
  if (!ctx.user) return;

  const text = ctx.match?.trim() || "";
  if (!text) {
    await ctx.reply("Describe what you ate — e.g. /log chicken salad with olive oil");
    return;
  }

  const msg = await ctx.reply("🤔 Estimating calories with AI...");

  const estimate = await estimateCalories(text);
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

  await prisma.foodEntry.create({
    data: {
      userId: ctx.user.id,
      description,
      calories,
      aiResponse: estimate as object,
    },
  });

  const todayStart = getStartOfDay();
  const todayEnd = getEndOfDay();
  const dailyTotal = await prisma.foodEntry.aggregate({
    where: {
      userId: ctx.user.id,
      date: { gte: todayStart, lte: todayEnd },
    },
    _sum: { calories: true },
  });

  await ctx.reply(
    `✅ Logged: ${description} — ${calories} kcal\n` +
    `Today's total: ${dailyTotal._sum.calories || 0} kcal`
  );
});

composer.command("today", async (ctx) => {
  if (!ctx.user) return;

  const todayStart = getStartOfDay();
  const todayEnd = getEndOfDay();

  const entries = await prisma.foodEntry.findMany({
    where: {
      userId: ctx.user.id,
      date: { gte: todayStart, lte: todayEnd },
    },
    orderBy: { loggedAt: "desc" },
  });

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

  const weekStart = getStartOfWeek();
  const weekEnd = new Date();

  const entries = await prisma.foodEntry.findMany({
    where: {
      userId: ctx.user.id,
      date: { gte: weekStart, lte: weekEnd },
    },
    orderBy: { date: "asc" },
  });

  const dayMap = new Map<string, number>();
  for (const entry of entries) {
    const dayKey = entry.date.toISOString().split("T")[0];
    dayMap.set(dayKey, (dayMap.get(dayKey) || 0) + entry.calories);
  }

  const weekTotal = Array.from(dayMap.values()).reduce((a, b) => a + b, 0);
  const avgPerDay = dayMap.size > 0 ? Math.round(weekTotal / dayMap.size) : 0;

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const lines: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const key = d.toISOString().split("T")[0];
    const cal = dayMap.get(key) || 0;
    const marker = cal > 0 ? `${cal} kcal` : "—";
    lines.push(`${dayNames[i]}: ${marker}`);
  }

  await ctx.reply(
    `📅 *This Week's Calories*\n\n${lines.join("\n")}\n\n` +
    `Week total: ${weekTotal} kcal\n` +
    `Daily avg: ${avgPerDay} kcal`,
    { parse_mode: "Markdown" }
  );
});

export default composer;
