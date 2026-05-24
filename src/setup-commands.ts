import "dotenv/config";
import { Bot } from "grammy";

const token = process.env.BOT_TOKEN;
if (!token || token === "YOUR_BOT_TOKEN_HERE") {
  console.error("Please set your BOT_TOKEN in .env file");
  process.exit(1);
}

const bot = new Bot(token);

async function setup() {
  await bot.api.setMyCommands([
    { command: "start", description: "Start the bot and see welcome message" },
    { command: "log", description: "Describe food and AI estimates calories" },
    { command: "today", description: "See today's calorie total" },
    { command: "week", description: "See this week's calorie stats" },
    { command: "subscribe", description: "Subscribe to Nutrino Premium" },
    { command: "cancel", description: "Cancel your subscription" },
    { command: "help", description: "Show available commands" },
  ]);

  console.log("Bot commands registered successfully!");

  const me = await bot.api.getMe();
  console.log(`Bot: @${me.username}`);
}

setup().catch(console.error);
