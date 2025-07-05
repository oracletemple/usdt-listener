// v1.1.0 - usdt-listener/index.js

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const { simulateClick } = require("./utils/simulate-click");

const RECEIVER_ID = process.env.RECEIVER_ID; // Telegram user ID
const AMOUNT_THRESHOLD = parseFloat(process.env.AMOUNT_THRESHOLD || "10");

const app = express();
app.use(bodyParser.json());

let paymentCount12 = 0;
let paymentCount30 = 0;

function isValidAmount(amount) {
  return amount >= AMOUNT_THRESHOLD;
}

function handlePayment(amount) {
  if (amount >= 29 && amount <= 31) {
    paymentCount30++;
    if (paymentCount30 <= 2) {
      const label = paymentCount30 === 1 ? "🃏 Card 1" : "🃏 Card 2";
      simulateClick(RECEIVER_ID, label);
    }
  } else if (amount >= 11 && amount <= 13) {
    paymentCount12++;
    if (paymentCount12 <= 2) {
      const label = paymentCount12 === 1 ? "🃏 Card 1" : "🃏 Card 2";
      simulateClick(RECEIVER_ID, label);
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`USDT listener running on port ${PORT}`);
});
