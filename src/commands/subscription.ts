import { Composer, InlineKeyboard } from "grammy";
import { updateSubscription } from "../db";
import type { NutrinoContext } from "../types";

const SUBSCRIPTION_PRICE_STARS = 100;
const SUBSCRIPTION_DAYS = 30;

const composer = new Composer<NutrinoContext>();

composer.command("subscribe", async (ctx) => {
  if (!ctx.user) return;

  if (ctx.user.subscribed_until && new Date(ctx.user.subscribed_until) > new Date()) {
    const expires = new Date(ctx.user.subscribed_until).toLocaleDateString();
    await ctx.reply(`You already have an active subscription until ${expires}.`);
    return;
  }

  const keyboard = new InlineKeyboard()
    .text(`Subscribe - ${SUBSCRIPTION_PRICE_STARS} ⭐`, "subscribe_confirm")
    .text("Cancel", "subscribe_cancel");

  await ctx.reply(
    `🌰 *Nutrino Premium*\n\n` +
    `Get access to calorie tracking for ${SUBSCRIPTION_DAYS} days.\n\n` +
    `Price: ${SUBSCRIPTION_PRICE_STARS} Telegram Stars\n\n` +
    `Proceed?`,
    { parse_mode: "Markdown", reply_markup: keyboard }
  );
});

composer.callbackQuery("subscribe_confirm", async (ctx) => {
  if (!ctx.user) return;

  await ctx.answerCallbackQuery();

  const invoice = await ctx.api.createInvoiceLink(
    "Nutrino Premium",
    "30-day subscription to Nutrino calorie tracker",
    `sub_${ctx.user.id}`,
    "",
    "XTR",
    [{ label: "Nutrino Premium (30 days)", amount: SUBSCRIPTION_PRICE_STARS }]
  );

  const keyboard = new InlineKeyboard().url("Pay via Telegram Stars", invoice);
  await ctx.editMessageText(
    `🌰 *Nutrino Premium*\n\nClick the button below to complete payment:\n\nPrice: ${SUBSCRIPTION_PRICE_STARS} ⭐`,
    { parse_mode: "Markdown", reply_markup: keyboard }
  );
});

composer.callbackQuery("subscribe_cancel", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText("Subscription cancelled.");
});

composer.command("cancel", async (ctx) => {
  if (!ctx.user) return;

  await updateSubscription(ctx.env.DB, ctx.user.id, null);
  await ctx.reply("Your subscription has been cancelled.");
});

export async function handleSuccessfulPayment(ctx: NutrinoContext) {
  if (!ctx.user) return;

  const now = new Date();
  const currentExpiry = ctx.user.subscribed_until
    ? new Date(ctx.user.subscribed_until)
    : now;
  const newExpiry = new Date(Math.max(currentExpiry.getTime(), now.getTime()));
  newExpiry.setDate(newExpiry.getDate() + SUBSCRIPTION_DAYS);

  await updateSubscription(ctx.env.DB, ctx.user.id, newExpiry.toISOString());
  ctx.user.subscribed_until = newExpiry.toISOString();

  await ctx.reply(
    `✅ Payment successful!\n\n` +
    `Your Nutrino Premium is active until ${newExpiry.toLocaleDateString()}.\n` +
    `Start tracking: /log oatmeal with berries`
  );
}

export default composer;
