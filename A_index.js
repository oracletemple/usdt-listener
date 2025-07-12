// A_index.js — v1.2.5
// usdt-listener: handles USDT payment webhook,自动识别补差价升级/推送抽牌按钮

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const { getUser, addPending } = require("./utils/G_wallet-map");

const BOT_TOKEN      = process.env.BOT_TOKEN;
const RECEIVER_ID    = parseInt(process.env.RECEIVER_ID, 10);
const WALLET_ADDRESS = process.env.WALLET_ADDRESS;
const API_URL        = `https://api.telegram.org/bot${BOT_TOKEN}`;
const TAROT_HANDLER_URL = process.env.TAROT_HANDLER_URL; // tarot-handler 服务地址

// 高级模块补差价金额/容差，均用环境变量配置，方便将来升级
const UPGRADE_AMOUNT = parseFloat(process.env.AMOUNT_THRESHOLD_UPGRADE || "24");
const TOLERANCE = 0.05; // 金额浮动容差

const app = express();
app.use(bodyParser.json());

app.post("/webhook", async (req, res) => {
  try {
    const { toAddress, fromAddress, amount, txid } = req.body;
    if (toAddress !== WALLET_ADDRESS) return res.sendStatus(200);

    const paid   = parseFloat(amount);
    const wallet = fromAddress;
    const chatId = getUser(wallet);

    // 1. 如已登记，推送抽牌按钮&自动升级
    if (chatId) {
      // ⚡ 检查是否为补差价升级
      if (Math.abs(paid - UPGRADE_AMOUNT) < TOLERANCE) {
        try {
          // 通知 tarot-handler 升级权限
          await axios.post(`${TAROT_HANDLER_URL}/mark-premium`, { chatId });
        } catch (err) {
          console.error("[Upgrade notify error]", err.response?.data || err.message);
        }
      }
      // 推送抽牌按钮
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
      // 未登记缓存为 pending
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
