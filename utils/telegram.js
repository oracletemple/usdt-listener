// utils/telegram.js

const axios = require('axios');
const {
  startSession,
  getCard,
  isSessionComplete,
  getFullReading,
} = require('./tarot-session');

const TOKEN = process.env.BOT_TOKEN;
const API_URL = `https://api.telegram.org/bot${TOKEN}`;

async function sendMessage(chatId, text, buttons = null) {
  const payload = {
    chat_id: chatId,
    text,
    parse_mode: 'Markdown',
  };

  if (buttons) {
    payload.reply_markup = {
      inline_keyboard: [buttons],
    };
  }

  try {
    await axios.post(`${API_URL}/sendMessage`, payload);
  } catch (err) {
    console.error('[Telegram] sendMessage failed:', err.message);
  }
}

async function sendDrawCardButtons(chatId) {
  startSession(chatId);
  const buttons = [
    {
      text: 'Draw First Card 🃏',
      callback_data: 'draw_0',
    },
    {
      text: 'Draw Second Card 🃏',
      callback_data: 'draw_1',
    },
    {
      text: 'Draw Third Card 🃏',
      callback_data: 'draw_2',
    },
  ];

  const message = `🔮 Please focus your energy and draw 3 cards...\n\n👇 Tap the buttons to reveal your Tarot Reading:`;

  await sendMessage(chatId, message, buttons);
}

async function handleCallbackQuery(query) {
  const chatId = query.message.chat.id;
  const msgId = query.message.message_id;
  const action = query.data;

  if (!action.startsWith('draw_')) return;

  const index = parseInt(action.split('_')[1]);
  const card = getCard(chatId, index);

  if (!card) {
    await answerCallback(query.id, 'You already revealed this card.');
    return;
  }

  await answerCallback(query.id, 'Card drawn!');
  await sendMessage(chatId, `🃏 You drew: *${card.name} (${card.orientation})*\n${card.meaning}`);

  if (isSessionComplete(chatId)) {
    const full = getFullReading(chatId);
    await sendMessage(chatId, full);
  }
}

async function answerCallback(callbackId, text) {
  try {
    await axios.post(`${API_URL}/answerCallbackQuery`, {
      callback_query_id: callbackId,
      text,
      show_alert: false,
    });
  } catch (err) {
    console.error('[Telegram] answerCallback failed:', err.message);
  }
}

module.exports = {
  sendMessage,
  sendTarotButtons, // ⬅️ 确保这一行存在
};

