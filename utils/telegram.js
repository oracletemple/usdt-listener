// v1.1.5
const { Telegraf } = require('telegraf');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);

async function initTelegramBot() {
  const webhookUrl = process.env.WEBHOOK_URL;
  if (!webhookUrl) {
    console.error('❌ Missing WEBHOOK_URL in .env');
    return;
  }
  await bot.telegram.setWebhook(webhookUrl);
  console.log('✅ Telegram Webhook registered at:', webhookUrl);
}

async function handleTelegramUpdate(update) {
  try {
    await bot.handleUpdate(update);
  } catch (err) {
    console.error('❌ Failed to process Telegram update:', err);
  }
}

module.exports = {
  bot,
  initTelegramBot,
  handleTelegramUpdate,
};
