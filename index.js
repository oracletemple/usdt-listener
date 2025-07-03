require('dotenv').config();
const axios = require('axios');
const express = require('express');
const bodyParser = require('body-parser');

const { sendMessage, sendTarotButtons } = require('./utils/telegram');
const { generateThreeCardReading } = require('./utils/tarot');
const { handleButtonPress } = require('./utils/tarot-session');

const wallet = process.env.WALLET_ADDRESS;
const userId = process.env.RECEIVER_ID;
const amountThreshold = parseFloat(process.env.AMOUNT_THRESHOLD || '12');

const notifiedTxs = new Set();
let testCount = 0;
let testMode = true;

const testTransactions = [
  { amount: 12, hash: 'test_tx_001' },
  { amount: 12, hash: 'test_tx_002' },
  { amount: 12, hash: 'test_tx_003' },
  { amount: 30, hash: 'test_tx_004' },
  { amount: 30, hash: 'test_tx_005' },
  { amount: 30, hash: 'test_tx_006' },
];

// 💡 Main message handler for any transaction
async function handleTransaction({ amount, hash, isSuccess = true }) {
  if (notifiedTxs.has(hash)) return;
  notifiedTxs.add(hash);

  console.log(`[TEST] Simulated Tx: ${hash} -> ${amount} USDT`);

  let message = `💸 Payment ${isSuccess ? 'received' : 'failed'}:\n\n`;
  message += `💰 Amount: ${amount} USDT (TRC20)\n`;
  message += `🔗 Tx Hash: ${hash}\n`;

  if (!isSuccess) {
    message += `\n⚠️ Transaction failed. Please verify on-chain status.`;
  } else if (amount >= 29.9) {
    message += `\n🧿 You have unlocked the **Custom Oracle Reading**.\nPlease reply with your question – we will begin your spiritual decoding.`;
  } else if (amount >= amountThreshold && amount < 29.9) {
    message += `\n🔮 Please focus your energy and draw 3 cards...`;
    message += `\n👇 Tap the buttons to reveal your Tarot Reading:\n`;

    await sendTarotButtons(userId); // 👈 发送按钮
    return;
  } else {
    message += `\n⚠️ Payment below minimum threshold (${amountThreshold} USDT). It will not be processed.`;
  }

  if (testMode) {
    message = `🧪 [TEST MODE]\n\n` + message;
  }

  try {
    await sendMessage(userId, message);
    console.log(`[INFO] Message sent to Telegram ✅`);
  } catch (err) {
    console.error(`[ERROR] Failed to send message: ${err.message}`);
  }
}

// 🧪 Run test transactions every second
const testInterval = setInterval(() => {
  if (testCount < testTransactions.length) {
    handleTransaction(testTransactions[testCount]);
    testCount++;
  } else {
    clearInterval(testInterval);
    testMode = false;
  }
}, 1000);

// ⚙️ Express server to handle button interactions
const app = express();
app.use(bodyParser.json());

app.post('/telegram-webhook', async (req, res) => {
  const body = req.body;
  if (body.callback_query) {
    const chatId = body.callback_query.message.chat.id;
    const data = body.callback_query.data;
    await handleButtonPress(chatId, data);
  }
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Express server running on port ${PORT}`);
});
