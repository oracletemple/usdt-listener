// index.js
// v1.1.3 - 修复 12USDT 自动交互与模拟按钮一致性问题

require('dotenv').config();
const axios = require('axios');
const { sendMessage, sendTarotButtons, simulateButtonClick } = require('./utils/telegram');
const { startSession } = require('./utils/tarot-session');

const wallet = process.env.WALLET_ADDRESS;
const userId = process.env.RECEIVER_ID;
const amountThreshold = parseFloat(process.env.AMOUNT_THRESHOLD || '10');

const notifiedTxs = new Set();
let testCount = 0;
let testMode = true;

// ✅ 模拟交易（含自动模拟点击按钮）
const testTransactions = [
  { amount: 12, hash: 'test_tx_001' }, // 自动点击
  { amount: 12, hash: 'test_tx_002' }, // 自动点击
  { amount: 12, hash: 'test_tx_003' }, // 留作手动测试
  { amount: 30, hash: 'test_tx_004' }, // 自动点击
  { amount: 30, hash: 'test_tx_005' }, // 自动点击
  { amount: 30, hash: 'test_tx_006' }, // 留作手动测试
];

// 🌟 主逻辑
async function handleTransaction({ amount, hash, isSuccess = true }) {
  if (notifiedTxs.has(hash)) return;
  notifiedTxs.add(hash);

  console.log(`[TEST] Simulated Tx: ${hash} -> ${amount} USDT`);

  let message = `💸 Payment ${isSuccess ? 'received' : 'failed'}:\n\n`;
  message += `💰 Amount: ${amount} USDT\n`;
  message += `🔗 Tx Hash: ${hash}\n`;

  if (!isSuccess) {
    message += `\n⚠️ Transaction failed. Please verify on-chain.`;
  } else if (amount >= 29.9) {
    message += `\n🧠 You unlocked *Custom Oracle Reading*.\nPlease reply with your question.\n\n🔮 Also receive a 3-card Tarot Reading:`;
  } else if (amount >= amountThreshold) {
    message += `\n🔮 Please focus and draw 3 cards:\n👇 Tap to reveal your Tarot Reading:`;
  } else {
    message += `\n⚠️ Payment below threshold (${amountThreshold} USDT). Not processed.`;
  }

  if (testMode) message = `🧪 [TEST MODE]\n\n` + message;

  try {
    await sendMessage(userId, message);

    // 🔮 自动开启 session 并发送按钮（只要达到门槛金额）
    if (amount >= amountThreshold) {
      startSession(userId);
      await sendTarotButtons(userId);
    }

    // 模拟按钮点击逻辑
    const simulateNeeded = ['test_tx_001', 'test_tx_002', 'test_tx_004', 'test_tx_005'].includes(hash);
    if (simulateNeeded) {
      setTimeout(() => simulateButtonClick(userId, 'card_3'), 3000);
    }

    console.log(`[INFO] Message + buttons sent ✅`);
  } catch (err) {
    console.error(`[ERROR] Failed to send message: ${err.message}`);
  }
}

// ⏱️ 只跑一次测试
const testInterval = setInterval(() => {
  if (testCount < testTransactions.length) {
    handleTransaction(testTransactions[testCount]);
    testCount++;
  } else {
    clearInterval(testInterval);
    testMode = false;
    console.log('[INFO] Test mode complete. Now entering live mode.');
  }
}, 1500);
