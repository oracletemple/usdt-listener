const { Telegraf } = require('telegraf');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);

// 启动 Bot
bot.launch().then(() => {
  console.log('🤖 Telegram bot started.');
}).catch(err => {
  console.error('❌ Failed to launch Telegram bot:', err.message);
});

// 发送消息函数
function sendMessage(chatId, message) {
  return bot.telegram.sendMessage(chatId, message)
    .then(() => console.log(`✅ Message sent to ${chatId}`))
    .catch(err => console.error(`❌ Failed to send message:`, err.message));
}

module.exports = {
  sendMessage
};
