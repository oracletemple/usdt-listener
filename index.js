// index.js - v1.0.7
require('dotenv').config();
const axios = require('axios');
const { sendMessage, sendTarotButtons } = require('./utils/telegram');

const wallet = process.env.WALLET_ADDRESS;
const userId = process.env.RECEIVER_ID;
const amountThreshold = parseFloat(process.env.AMOUNT_THRESHOLD || '12');
const handlerUrl = process.env.HANDLER_URL || 'https://tarot-handler.onrender.com';

const notifiedTxs = new Set();
let testCount = 0;
let testMode = true;

// 🧪 模拟测试交易：3个 12 USDT（基础档）+ 3个 30 USDT（高端档）
const testTransactions = [
  { amount: 12, hash: 'test_tx_001' }, // 发送按钮 + 模拟交互
  { amount: 12, hash: 'test_tx_002' }, // 发送按钮 + 模拟交互
  { amount: 12, hash: 'test_tx_003' }, // 手动测试交互
  { amount: 30, hash: 'test_tx_004' }, // 高端内容 + 模拟交互
  { amount: 30, hash: 'test_tx_005' }, // 高端内容 + 模拟交互
  { amount: 30, hash: 'test_tx_006' }, // 高端内容 + 手动测试
];

// 🌐 调用模拟按钮接口
async function simulateButtonClick(chatId, cardIndex) {
  try {
    const res = await axios.post(`${handlerUrl}/simulate-click`, {
      chatId,
      cardIndex,
    });
    console.log(`[INFO] Simulate click success:`, res.data);
  } catch (err) {
    console.error(`[ERROR] Simulate button click failed:`, err.message);
  }
}

// 🎯 主逻辑：处理每一笔交易
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
    message += `\n🧠 You have unlocked the *Custom Oracle Reading*.\nPlease reply with your question – we will begin your spiritual decoding.`;
    message += `\n\n🔮 Please focus your energy and draw 3 cards...\n👇 Tap the buttons to reveal your Tarot Reading:`;
  } else if (amount >= amountThreshold) {
    message += `\n🔮 Please focus your energy and draw 3 cards...\n👇 Tap the buttons to reveal your Tarot Reading:`;
  } else {
    message += `\n⚠️ Payment below minimum threshold (${amountThreshold} USDT). It will not be processed.`;
  }

  if (testMode) {
    message = `🧪 [TEST MODE]\n\n` + message;
  }

  try {
    await sendMessage(userId, message);

    // 👉 所有符合条件的用户都发送按钮
    if (amount >= amountThreshold) {
      await sendTarotButtons(userId);
    }

    // 💡 测试模拟交互
    if (hash === 'test_tx_001') await simulateButtonClick(userId, 2);
    if (hash === 'test_tx_002') await simulateButtonClick(userId, 2);
    if (hash === 'test_tx_004') await simulateButtonClick(userId, 1);
    if (hash === 'test_tx_005') await simulateButtonClick(userId, 1);

    console.log(`[INFO] Message sent to Telegram ✅`);
  } catch (err) {
    console.error(`[ERROR] Failed to send message: ${err.message}`);
  }
}

// ⏱️ 执行模拟测试流程
const testInterval = setInterval(() => {
  if (testCount < testTransactions.length) {
    handleTransaction(testTransactions[testCount]);
    testCount++;
  } else {
    clearInterval(testInterval);
    testMode = false;
  }
}, 1200);
