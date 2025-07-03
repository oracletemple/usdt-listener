const { Telegraf } = require('telegraf');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.launch()
  .then(() => {
    console.log('🤖 Telegram bot started.');
  })
  .catch(err => {
    console.error('❌ Failed to launch Telegram bot:', err.message);
  });

// 捕获所有 Bot 异常
bot.catch((err) => {
  console.error('🤖 Bot 遇到未捕捉异常 ❗', err);
});

function sendMessage(chatId, message) {
  return bot.telegram.sendMessage(chatId, message)
    .then(() => console.log(`✅ Message sent to ${chatId}`))
    .catch(err => console.error(`❌ Failed to send message:`, err.message));
}

module.exports = {
  sendMessage
};
