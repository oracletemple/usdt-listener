// A_index.js - v1.0.0

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const { sendButtons } = require("./utils/B_send-message");

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 10000;
const RECEIVER_ID = parseInt(process.env.RECEIVER_ID); // Telegram user ID
const AMOUNT_THRESHOLD = parseFloat(process.env.AMOUNT_THRESHOLD || "10");

/**
 * 检查 TRC20 交易是否为有效支付（12 或 30 USDT）
 * @param {Object} tx - 来自链上监听服务的交易对象
 */
function isValidPayment(tx) {
  return (
    tx.to &&
    tx.to.toLowerCase() === process.env.WALLET_ADDRESS.toLowerCase() &&
    parseFloat(tx.amount) >= AMOUNT_THRESHOLD
  );
}

// ✅ Webhook 接收链上交易（模拟链上监听服务推送数据）
app.post("/txhook", async (req, res) => {
  const tx = req.body;
  console.log("📥 Received transaction:", tx);

  if (!isValidPayment(tx)) {
    console.log("⚠️ Invalid or low-value transaction.");
    return res.sendStatus(200);
  }

  const amount = parseFloat(tx.amount);
  const userId = RECEIVER_ID;

  try {
    // ✅ 推送按钮消息（客户自己点击抽牌）
    await sendButtons(userId, amount);
    console.log(`✅ Pushed buttons for ${amount} USDT`);
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Failed to send buttons:", err);
    res.sendStatus(500);
  }
});

// ✅ 启动服务
app.listen(PORT, () => {
  console.log(`🚀 USDT Listener running on port ${PORT}`);
});
