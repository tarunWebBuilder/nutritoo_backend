import "dotenv/config";
import { Bot } from "grammy";
import { authMiddleware, type AuthContext } from "./middleware/auth";
import startCommand from "./commands/start";
import foodCommands from "./commands/food";
import subscriptionCommands, { handleSuccessfulPayment } from "./commands/subscription";
import prisma from "./db";

const token = process.env.BOT_TOKEN;
if (!token || token === "YOUR_BOT_TOKEN_HERE") {
  console.error("Please set your BOT_TOKEN in .env file");
  process.exit(1);
}

const bot = new Bot<AuthContext>(token);

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

  await ctx.reply(
    "I didn't understand that. Use /help to see available commands."
  );
});

async function main() {
  await bot.start({
    onStart: (info) => {
      console.log(`Bot started: @${info.username}`);
    },
  });
}

main().catch(async (err) => {
  console.error("Bot error:", err);
  await prisma.$disconnect();
  process.exit(1);
});

process.once("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.once("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
