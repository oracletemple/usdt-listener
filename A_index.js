// A_index.js — v1.2.4
// usdt-listener: handles incoming USDT payment webhooks and routes draw buttons by wallet mapping
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const { getUser, addPending } = require("./utils/G_wallet-map");

const BOT_TOKEN      = process.env.BOT_TOKEN;
const RECEIVER_ID   = parseInt(process.env.RECEIVER_ID, 10);
const WALLET_ADDRESS = process.env.WALLET_ADDRESS;
const API_URL       = `https://api.telegram.org/bot${BOT_TOKEN}`;

const app = express();
app.use(bodyParser.json());

app.post("/webhook", async (req, res) => {
  try {
    const { toAddress, fromAddress, amount, txid } = req.body;
    if (toAddress !== WALLET_ADDRESS) return res.sendStatus(200);

    const paid   = parseFloat(amount);
    const wallet = fromAddress;
    const chatId = getUser(wallet);

    if (chatId) {
      // Registered user: send draw buttons immediately
      await axios.post(`${API_URL}/sendMessage`, {
        chat_id: chatId,
        text: `🙏 Received ${paid} USDT (fees included). Please draw your cards:`,
        parse_mode: "MarkdownV2"
      });
      await axios.post(`${API_URL}/sendMessage`, {
        chat_id: chatId,
        text: "🃏 Please draw your cards:",
        parse_mode: "MarkdownV2",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🃏 Card 1", callback_data: "card_0" }],
            [{ text: "🃏 Card 2", callback_data: "card_1" }],
            [{ text: "🃏 Card 3", callback_data: "card_2" }]
          ]
        }
      });
    } else {
      // Not registered yet: queue as pending
      addPending(wallet, { amount: paid, txid });
    }
  } catch (err) {
    console.error("[Payment webhook error]", err);
  }
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 usdt-listener running on port ${PORT}`);
});
