import { Composer } from "grammy";
import prisma from "../db";
import type { AuthContext } from "../middleware/auth";

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
    await ctx.reply("Usage: /log <description> <calories>\nExample: /log Chicken salad 450");
    return;
  }

  const parts = text.split(/(\d+)$/).filter(Boolean);
  if (parts.length < 2) {
    await ctx.reply("Usage: /log <description> <calories>\nExample: /log Chicken salad 450");
    return;
  }

  const caloriesStr = parts[parts.length - 1].trim();
  const description = parts.slice(0, -1).join(" ").trim();
  const calories = parseInt(caloriesStr, 10);

  if (isNaN(calories) || calories <= 0) {
    await ctx.reply("Please provide a valid number of calories.");
    return;
  }

  if (calories > 10000) {
    await ctx.reply("That seems too high. Please check your calorie count.");
    return;
  }

  const entry = await prisma.foodEntry.create({
    data: {
      userId: ctx.user.id,
      description,
      calories,
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
    `✅ Logged: ${description} - ${calories} kcal\n` +
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
