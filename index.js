// ✅ 修复版本 index.js
// 📁 放置位置：usdt-listener/index.js
// ⚠️ 此版本会通过网络调用 simulate-click 接口，由 tarot-handler Web Service 执行模拟交互

require('dotenv').config();
const axios = require('axios');
const { sendMessage, sendTarotButtons } = require('./utils/telegram');

const wallet = process.env.WALLET_ADDRESS;
const userId = process.env.RECEIVER_ID;
const amountThreshold = parseFloat(process.env.AMOUNT_THRESHOLD || '12');
const tarotHandlerURL = process.env.TAROT_HANDLER_URL || 'https://tarot-handler.onrender.com';

const notifiedTxs = new Set();
let testCount = 0;
let testMode = true;

// Simulated test transactions (3x12USDT + 3x30USDT)
const testTransactions = [
  { amount: 12, hash: 'test_tx_001' },
  { amount: 12, hash: 'test_tx_002' },
  { amount: 12, hash: 'test_tx_003' },
  { amount: 30, hash: 'test_tx_004' },
  { amount: 30, hash: 'test_tx_005' },
  { amount: 30, hash: 'test_tx_006' },
];

async function simulateClick(chatId, cardIndex) {
  try {
    const response = await axios.post(`${tarotHandlerURL}/simulate-click`, {
      chatId,
      cardIndex,
    });
    console.log('[INFO] Simulate click success:', response.data);
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
    message += `\n🧠 You have unlocked the **Custom Oracle Reading**.\nPlease reply with your question – we will begin your spiritual decoding.`;
  } else if (amount >= amountThreshold && amount < 29.9) {
    message += `\n🔮 Please focus your energy and draw 3 cards...\n👇 Tap the buttons to reveal your Tarot Reading:`;
  } else {
    message += `\n⚠️ Payment below minimum threshold (${amountThreshold} USDT). It will not be processed.`;
  }

  if (testMode) {
    message = `🧪 [TEST MODE]\n\n` + message;
  }

  try {
    await sendMessage(userId, message);
    if (amount < 29.9 && isSuccess) {
      await sendTarotButtons(userId);
    }

    // ✅ 按照要求模拟前两次 12 和前两次 30 的交互抽牌
    if (hash === 'test_tx_001') {
      setTimeout(() => simulateClick(userId, 2), 2000); // 模拟点击第3张
    }
    if (hash === 'test_tx_002') {
      setTimeout(() => simulateClick(userId, 2), 2000);
    }
    if (hash === 'test_tx_004') {
      setTimeout(() => simulateClick(userId, 2), 2000);
    }
    if (hash === 'test_tx_005') {
      setTimeout(() => simulateClick(userId, 2), 2000);
    }

    console.log(`[INFO] Message sent to Telegram ✅`);
  } catch (err) {
    console.error(`[ERROR] Failed to send message: ${err.message}`);
  }
}

// ⏱️ Run test transactions every second
const testInterval = setInterval(() => {
  if (testCount < testTransactions.length) {
    handleTransaction(testTransactions[testCount]);
    testCount++;
  } else {
    clearInterval(testInterval);
    testMode = false;
  }
}, 1000);
