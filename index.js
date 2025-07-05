// v1.1.3 - usdt-listener/index.js (interactive draw mode)

const express = require("express");
const bodyParser = require("body-parser");
const { sendButtons } = require("./utils/telegram");

const RECEIVER_ID = 7685088782;
const AMOUNT_THRESHOLD = 10;

const app = express();
app.use(bodyParser.json());

function isValidAmount(amount) {
  return amount >= AMOUNT_THRESHOLD;
}

function handlePayment(amount) {
  if (amount >= 11 && amount <= 13 || amount >= 29 && amount <= 31) {
    sendButtons(
      RECEIVER_ID,
      "✨ We've received your payment.\nPlease choose a card below to begin your reading:"
    );
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

const PORT = 10000;
app.listen(PORT, () => {
  console.log(`USDT listener running on port ${PORT}`);
});
