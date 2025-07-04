// v1.0.6
require('dotenv').config();
const axios = require('axios');
const { sendMessage, sendTarotButtons, simulateButtonClick } = require('./utils/telegram');

const wallet = process.env.WALLET_ADDRESS;
const userId = process.env.RECEIVER_ID;
const amountThreshold = parseFloat(process.env.AMOUNT_THRESHOLD || '12');

const notifiedTxs = new Set();
let testCount = 0;
let testMode = true;

// ✅ 模拟交易（前3个12 USDT，后3个30 USDT）
const testTransactions = [
  { amount: 12, hash: 'test_tx_001' }, // 模拟按钮并抽牌
  { amount: 12, hash: 'test_tx_002' }, // 模拟按钮并抽牌
  { amount: 12, hash: 'test_tx_003' }, // 留作你手动操作测试
  { amount: 30, hash: 'test_tx_004' }, // 模拟按钮并抽牌
  { amount: 30, hash: 'test_tx_005' }, // 模拟按钮并抽牌
  { amount: 30, hash: 'test_tx_006' }, // 留作你手动操作测试
];

// ✅ 主函数：处理到账交易
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
    message += `\n🔮 Please focus your energy and draw 3 cards...\n`;
    message += `👇 Tap the buttons to reveal your Tarot Reading:`;
  } else {
    message += `\n⚠️ Payment below minimum threshold (${amountThreshold} USDT). It will not be processed.`;
  }

  if (testMode) {
    message = `🧪 [TEST MODE]\n\n` + message;
  }

  try {
    await sendMessage(userId, message);

    // ✅ 两档都展示按钮
    if (amount >= amountThreshold && isSuccess) {
      await sendTarotButtons(userId);
    }

    // ✅ 模拟点击逻辑（只自动测试前两个12和30的）
    if (["test_tx_001", "test_tx_002", "test_tx_004", "test_tx_005"].includes(hash)) {
      setTimeout(() => simulateButtonClick(userId, 2), 2000); // 抽第3张牌
    }

    console.log(`[INFO] Message sent to Telegram ✅`);
  } catch (err) {
    console.error(`[ERROR] Failed to send message: ${err.message}`);
  }
}

// ✅ 自动执行模拟交易
const testInterval = setInterval(() => {
  if (testCount < testTransactions.length) {
    handleTransaction(testTransactions[testCount]);
    testCount++;
  } else {
    clearInterval(testInterval);
    testMode = false;
  }
}, 1000);
