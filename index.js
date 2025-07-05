// v1.1.9
const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const { handleTransaction, handleCallbackQuery } = require("./utils/telegram");

dotenv.config();

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 10000;

app.get("/", (req, res) => {
  res.send("Tarot service running.");
});

app.post("/webhook", async (req, res) => {
  const body = req.body;

  if (body.callback_query) {
    await handleCallbackQuery(body.callback_query);
  } else if (body.amount) {
    await handleTransaction(body);
  }

  res.sendStatus(200);
});

// ✅ 模拟测试接口（点击后模拟一笔 12USDT 或 30USDT 的交易）
app.get("/simulate/:amount", async (req, res) => {
  const { amount } = req.params;
  const mockData = {
    amount: parseFloat(amount),
    sender: "TG_SIMULATED_USER",
    memo: "test-transaction",
  };
  await handleTransaction(mockData);
  res.send(`Simulated transaction of ${amount} USDT`);
});

app.listen(PORT, () => {
  console.log(`Tarot service running on port ${PORT}`);
});
