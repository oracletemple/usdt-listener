// A_index.js - v1.1.3

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");

const { getUSDTTransactions } = require("./utils/G_transaction");
const { sendButtons } = require("./utils/G_send-message");

const WALLET_ADDRESS = process.env.WALLET_ADDRESS;
const RECEIVER_ID = process.env.RECEIVER_ID;
const AMOUNT_THRESHOLD = parseFloat(process.env.AMOUNT_THRESHOLD || "10");

const app = express();
app.use(bodyParser.json());

// ✅ Webhook 主入口（监听 USDT 转账消息）
app.post("/webhook", async (req, res) => {
  try {
    const transactions = await getUSDTTransactions(WALLET_ADDRESS);

    for (const tx of transactions) {
      const { sender, amount } = tx;

      if (amount >= AMOUNT_THRESHOLD) {
        console.log(`✅ Detected valid payment: ${amount} USDT from ${sender}`);

        // 🎯 推送按钮消息（由 tarot-handler Webhook 处理）
        const buttons = [[
          { text: "🃏 Card 1", callback_data: "card_1_" + amount },
          { text: "🃏 Card 2", callback_data: "card_2_" + amount },
          { text: "🃏 Card 3", callback_data: "card_3_" + amount }
        ]];

        await sendButtons(RECEIVER_ID, "🧿 Your spiritual reading is ready. Please choose a card to reveal:", buttons);
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Webhook error:", err);
    res.sendStatus(500);
  }
});

// 🚀 启动监听服务
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 USDT Listener running on port ${PORT}`);
});
