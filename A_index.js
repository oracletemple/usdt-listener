// A_index.js - v1.0.0

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");

const { handleTransactionEvent } = require("./A_transaction-listener");

const app = express();
app.use(bodyParser.json());

// ✅ Webhook 主入口：链上监听模块通过 POST 请求调用此接口
app.post("/webhook", async (req, res) => {
  try {
    const update = req.body;
    console.log("📥 Received transaction event:", JSON.stringify(update, null, 2));
    await handleTransactionEvent(update);
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Webhook handler error:", err);
    res.sendStatus(500);
  }
});

// 🚀 启动服务
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 usdt-listener running on port ${PORT}`);
});
