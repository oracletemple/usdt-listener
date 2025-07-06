// A_index.js - v1.0.0

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");

const handleTransaction = require("./A_transaction-listener");
const simulateButtonClick = require("./utils/G_simulate-click");

const app = express();
app.use(bodyParser.json());

// ✅ Webhook 接口（链上交易通知）或模拟测试触发
app.post("/webhook", async (req, res) => {
  try {
    const update = req.body;
    console.log("📥 Received webhook payload:", JSON.stringify(update, null, 2));
    await handleTransaction(update);
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Webhook error:", err);
    res.sendStatus(500);
  }
});

// ✅ 测试入口：/simulate?userId=xxx&cardIndex=1&amount=12
app.get("/simulate", async (req, res) => {
  const { userId, cardIndex, amount } = req.query;
  if (!userId || !cardIndex || !amount) {
    return res.status(400).send("❌ Missing parameters");
  }

  try {
    await simulateButtonClick(Number(userId), Number(cardIndex), Number(amount));
    res.send("✅ Simulated button click");
  } catch (err) {
    console.error("❌ Simulation error:", err);
    res.status(500).send("Simulation failed");
  }
});

// 🚀 启动监听服务
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 usdt-listener running on port ${PORT}`);
});
