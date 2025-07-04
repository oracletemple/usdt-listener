// v1.1.0
require('dotenv').config();
const axios = require('axios');
const { sendMessage } = require('./utils/telegram');

const wallet = process.env.WALLET_ADDRESS;
const userId = process.env.RECEIVER_ID;
const amountThreshold = parseFloat(process.env.AMOUNT_THRESHOLD || '10');
const handlerURL = process.env.WEBHOOK_URL || 'https://tarot-handler.onrender.com/simulate-click';

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

async function simulateClick(chatId, index) {
  try {
    const res = await axios.post(handlerURL, {
      chatId,
      cardIndex: index,
    });
    console.log('[INFO] Simulate click success:', res.data);
  } catch (err) {
    console.error('[ERROR] Simulate button click failed:', err.message);
  }
}

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
    message += `\n🧠 You have unlocked the *Custom Oracle Reading*.`;
    message += `\nPlease reply with your question – we will begin your spiritual decoding.`;
    message += `\n\n🔮 Bonus: You also receive a 3-card Tarot Reading below:`;
  } else if (amount >= amountThreshold) {
    message += `\n🔮 Please focus your energy and draw 3 cards...`;
    message += `\n👇 Tap the buttons to reveal your Tarot Reading:`;
  } else {
    message += `\n⚠️ Payment below minimum threshold (${amountThreshold} USDT). It will not be processed.`;
  }

  if (testMode) {
    message = `🧪 [TEST MODE]\n\n` + message;
  }

  try {
    await sendMessage(userId, message);

    if (amount >= amountThreshold) {
      // 自动模拟点击第三张
      if (['test_tx_001', 'test_tx_002', 'test_tx_004', 'test_tx_005'].includes(hash)) {
        setTimeout(() => simulateClick(userId, 2), 2000);
      }
    }

    console.log(`[INFO] Message sent to Telegram ✅`);
  } catch (err) {
    console.error(`[ERROR] Failed to send message: ${err.message}`);
  }
}

const testInterval = setInterval(() => {
  if (testCount < testTransactions.length) {
    handleTransaction(testTransactions[testCount]);
    testCount++;
  } else {
    clearInterval(testInterval);
    testMode = false;
  }
}, 1000);
