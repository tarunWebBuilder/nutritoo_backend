import { Composer, InlineKeyboard } from "grammy";
import prisma from "../db";
import type { AuthContext } from "../middleware/auth";

const SUBSCRIPTION_PRICE_STARS = 50;
const SUBSCRIPTION_DAYS = 30;

const composer = new Composer<AuthContext>();

composer.command("subscribe", async (ctx) => {
  if (!ctx.user) return;

  if (ctx.user.subscribedUntil && ctx.user.subscribedUntil > new Date()) {
    const expires = ctx.user.subscribedUntil.toLocaleDateString();
    await ctx.reply(
      `You already have an active subscription until ${expires}.`
    );
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
    `🌰 *Nutrino Premium*\n\n` +
    `Click the button below to complete payment:\n\n` +
    `Price: ${SUBSCRIPTION_PRICE_STARS} ⭐`,
    { parse_mode: "Markdown", reply_markup: keyboard }
  );
});

composer.callbackQuery("subscribe_cancel", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText("Subscription cancelled.");
});

composer.command("cancel", async (ctx) => {
  if (!ctx.user) return;

  await prisma.user.update({
    where: { id: ctx.user.id },
    data: { subscribedUntil: null },
  });

  await ctx.reply("Your subscription has been cancelled. You'll lose access to premium features.");
});

export async function handleSuccessfulPayment(ctx: AuthContext) {
  if (!ctx.user) return;

  const now = new Date();
  const currentExpiry = ctx.user.subscribedUntil || now;
  const newExpiry = new Date(Math.max(currentExpiry.getTime(), now.getTime()));
  newExpiry.setDate(newExpiry.getDate() + SUBSCRIPTION_DAYS);

  await prisma.user.update({
    where: { id: ctx.user.id },
    data: { subscribedUntil: newExpiry },
  });

  ctx.user.subscribedUntil = newExpiry;

  await ctx.reply(
    `✅ Payment successful!\n\n` +
    `Your Nutrino Premium is active until ${newExpiry.toLocaleDateString()}.\n` +
    `Start tracking: /log Chicken salad 450`
  );
}

export default composer;
