const axios = require('axios');
const BOT_TOKEN = process.env.BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

async function sendMessage(chatId, text) {
  try {
    const res = await axios.post(TELEGRAM_API, {
      chat_id: chatId,
      text,
    });
    console.log(`[DEBUG] sendMessage 调用完成 ✅`);
    return res.data;
  } catch (err) {
    throw new Error(`发送失败: ${err.message}`);
  }
}

module.exports = { sendMessage };
