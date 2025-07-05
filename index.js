// v1.1.2 - usdt-listener/index.js (auto test: simulate 3 cards per payment)

const express = require("express");
const bodyParser = require("body-parser");
const { simulateClick } = require("./utils/simulate-click");

const RECEIVER_ID = 7685088782;
const AMOUNT_THRESHOLD = 10;

const app = express();
app.use(bodyParser.json());

let paymentCount12 = 0;
let paymentCount30 = 0;

function isValidAmount(amount) {
  return amount >= AMOUNT_THRESHOLD;
}

function simulateThreeCards(labelOrder = ["🃏 Card 1", "🃏 Card 2", "🃏 Card 3"]) {
  labelOrder.forEach((label, i) => {
    setTimeout(() => simulateClick(RECEIVER_ID, label), i * 1500);
  });
}

function handlePayment(amount) {
  if (amount >= 29 && amount <= 31) {
    paymentCount30++;
    if (paymentCount30 === 1) {
      simulateThreeCards(["🃏 Card 2", "🃏 Card 1", "🃏 Card 3"]);
    } else if (paymentCount30 === 2) {
      simulateThreeCards(["🃏 Card 1", "🃏 Card 3", "🃏 Card 2"]);
    }
  } else if (amount >= 11 && amount <= 13) {
    paymentCount12++;
    if (paymentCount12 === 1) {
      simulateThreeCards(["🃏 Card 1", "🃏 Card 3", "🃏 Card 2"]);
    } else if (paymentCount12 === 2) {
      simulateThreeCards(["🃏 Card 3", "🃏 Card 2", "🃏 Card 1"]);
    }
  }
}

app.post("/webhook", (req, res) => {
  try {
    const { amount } = req.body;
    if (typeof amount === "number" && isValidAmount(amount)) {
      handlePayment(amount);
    }
  } catch (err) {
    console.error("Error processing payment:", err);
  }

  res.sendStatus(200);
});

// ✅ 自动模拟两笔付款（上线测试）
handlePayment(12);
handlePayment(30);

const PORT = 10000;
app.listen(PORT, () => {
  console.log(`USDT listener running on port ${PORT}`);
});
