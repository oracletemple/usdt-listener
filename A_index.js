// A_index.js — v1.2.1
// usdt-listener Webhook entry: handles incoming payment notifications and routes to Telegram
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

// Load env vars
const {
  BOT_TOKEN,
  RECEIVER_ID,
  WALLET_ADDRESS,
  PRICE_BASIC,
  PRICE_PREMIUM,
  UPGRADE_PRICE,
  AMOUNT_THRESHOLD_BASIC,
  AMOUNT_THRESHOLD_PREMIUM,
  AMOUNT_THRESHOLD_UPGRADE,
} = process.env;

const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

const app = express();
app.use(bodyParser.json());

app.post('/webhook', async (req, res) => {
  const { toAddress, amount } = req.body; // ensure payload includes these
  if (toAddress !== WALLET_ADDRESS) return res.sendStatus(200);

  const chatId = RECEIVER_ID;
  const paid = parseFloat(amount);

  try {
    let text;
    let drawAmount;

    // Determine plan based on thresholds
    if (paid >= parseFloat(AMOUNT_THRESHOLD_UPGRADE)) {
      text = `🙏 Received upgrade payment of ${paid} USDT (fees included). Activating Premium Plan…`;
      drawAmount = parseFloat(PRICE_PREMIUM);
    } else if (paid >= parseFloat(AMOUNT_THRESHOLD_BASIC)) {
      text = `🙏 Received basic payment of ${paid} USDT (fees included). Activating Basic Plan…`;
      drawAmount = parseFloat(PRICE_BASIC);
    } else {
      // Insufficient amount
      return res.sendStatus(200);
    }

    // Notify user
    await axios.post(`${API_URL}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: 'MarkdownV2'
    });

    // Prompt to draw cards based on plan
    await axios.post(`${API_URL}/sendMessage`, {
      chat_id: chatId,
      text: '🃏 Please draw your cards:',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🃏 Card 1', callback_data: 'card_0' }],
          [{ text: '🃏 Card 2', callback_data: 'card_1' }],
          [{ text: '🃏 Card 3', callback_data: 'card_2' }]
        ]
      }
    });

  } catch (err) {
    console.error('[Payment webhook error]', err);
  }

  res.sendStatus(200);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`usdt-listener running on port ${port}`));
