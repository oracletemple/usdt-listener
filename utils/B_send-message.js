// B_send-message.js - v1.1.0

const axios = require("axios");

const BOT_TOKEN = process.env.BOT_TOKEN;
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

/**
 * 发送纯文本消息
 */
async function sendTextMessage(chatId, text) {
  await axios.post(`${API_URL}/sendMessage`, {
    chat_id: chatId,
    text: text,
    parse_mode: "Markdown"
  });
}

/**
 * 发送包含按钮的消息（用于抽牌）
 */
async function sendCardButtons(chatId) {
  await axios.post(`${API_URL}/sendMessage`, {
    chat_id: chatId,
    text: "🧿 Your spiritual reading is ready. Please choose a card to reveal:",
    reply_markup: {
      inline_keyboard: [[
        { text: "🃏 Card 1", callback_data: "card_1_12" },
        { text: "🃏 Card 2", callback_data: "card_2_12" },
        { text: "🃏 Card 3", callback_data: "card_3_12" }
      ]]
    }
  });
}

/**
 * 发送图片 + 解读说明
 */
async function sendCardImageAndMeaning(chatId, imageUrl, title, meaning) {
  await axios.post(`${API_URL}/sendPhoto`, {
    chat_id: chatId,
    photo: imageUrl,
    caption: `*${title}*\n\n${meaning}`,
    parse_mode: "Markdown"
  });
}

module.exports = {
  sendTextMessage,
  sendCardButtons,
  sendCardImageAndMeaning
};
