// index.js for usdt-listener

require('dotenv').config();
const axios = require('axios');
const { sendMessage, sendTarotButtons } = require('./utils/telegram');

const wallet = process.env.WALLET_ADDRESS;
const userId = process.env.RECEIVER_ID;
const amountThreshold = parseFloat(process.env.AMOUNT_THRESHOLD || '12');

const notifiedTxs = new Set();
let testCount = 0;
let testMode = true;

const simulateButtonClick = async (chatId, cardCode = 'card_3') => {
  try {
    await axios.post('https://tarot-handler.onrender.com/simulate-click', {
      chatId,
      cardIndex: cardCode === 'card_1' ? 0 : cardCode === 'card_2' ? 1 : 2,
    });
  } catch (err) {
    console.error('[ERROR] Failed to simulate button click:', err.message);
  }
};

// 📦 模拟交易数据（3 x 12USDT + 3 x 30USDT）
const testTransactions = [
  { amount: 12, hash: 'test_tx_001' }, // 展示按钮并模拟点击
  { amount: 12, hash: 'test_tx_002' }, // 展示按钮并模拟点击
  { amount: 12, hash: 'test_tx_003' }, // 展示按钮但不点击（你自己测试）
  { amount: 30, hash: 'test_tx_004' }, // 展示按钮 + 高端提示
  { amount: 30, hash: 'test_tx_005' }, // 展示按钮 + 模拟点击
  { amount: 30, hash: 'test_tx_006' }, // 展示按钮（你自己操作）
];

// 🧠 主交易处理逻辑
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
    message += `\n🔮 Please focus your energy and draw 3 cards...\n`;
    message += `👇 Tap the buttons to reveal your Tarot Reading.\n\n`;
    message += `🧠 You have unlocked the *Custom Oracle Reading*.\nPlease reply with your question – we will begin your spiritual decoding.`;
  } else if (amount >= amountThreshold) {
    message += `\n🔮 Please focus your energy and draw 3 cards...\n`;
    message += `👇 Tap the buttons to reveal your Tarot Reading.`;
  } else {
    message += `\n⚠️ Payment below minimum threshold (${amountThreshold} USDT). It will not be processed.`;
  }

  if (testMode) {
    message = `🧪 [TEST MODE]\n\n` + message;
  }

  try {
    await sendMessage(userId, message);
    if (amount >= amountThreshold && isSuccess) {
      await sendTarotButtons(userId);
    }

    if (['test_tx_001', 'test_tx_002'].includes(hash)) {
      setTimeout(() => simulateButtonClick(userId, 'card_3'), 2000);
    }

    if (hash === 'test_tx_005') {
      setTimeout(() => simulateButtonClick(userId, 'card_1'), 2000);
    }

    console.log(`[INFO] Message sent to Telegram ✅`);
  } catch (err) {
    console.error(`[ERROR] Failed to send message: ${err.message}`);
  }
}

// 🔁 自动触发模拟交易（每1秒一笔）
const testInterval = setInterval(() => {
  if (testCount < testTransactions.length) {
    handleTransaction(testTransactions[testCount]);
    testCount++;
  } else {
    clearInterval(testInterval);
    testMode = false;
  }
}, 1000);
