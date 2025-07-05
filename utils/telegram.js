// utils/telegram.js · v1.1.5
const { Telegraf } = require('telegraf');
const { createWebhook } = require('telegraf/lib/server/express');

const bot = new Telegraf(process.env.BOT_TOKEN);

// ➕ 可添加付款成功后的通知等逻辑
bot.start((ctx) => ctx.reply('💰 Welcome to the USDT Listener Bot!'));

const webhookCallback = createWebhook(bot);

bot.telegram.setWebhook(`${process.env.WEBHOOK_URL}`).then(() => {
  console.log('✅ Webhook set:', process.env.WEBHOOK_URL);
}).catch(console.error);

module.exports = { bot, webhookCallback };
