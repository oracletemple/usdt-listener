// index.js
// v1.1.0

require('dotenv').config();
const { sendMessage, sendTarotButtons, simulateButtonClick } = require('./utils/telegram');
const { startSession } = require('./utils/tarot-session');

const wallet = process.env.WALLET_ADDRESS;
const userId = process.env.RECEIVER_ID;
const amountThreshold = parseFloat(process.env.AMOUNT_THRESHOLD || '10');

const notifiedTxs = new Set();
let testCount = 0;
let testMode = true;

// ✅ 模拟交易（含互动点击模拟）
const testTransactions = [
  { amount: 12, hash: 'test_tx_001' }, // 模拟点击按钮
  { amount: 12, hash: 'test_tx_002' }, // 模拟点击按钮
  { amount: 12, hash: 'test_tx_003' }, // 不模拟按钮，供你手动测试
  { amount: 30, hash: 'test_tx_004' }, // 模拟点击按钮 + GPT 提示
  { amount: 30, hash: 'test_tx_005' }, // 模拟点击按钮 + GPT 提示
  { amount: 30, hash: 'test_tx_006' }, // 不模拟按钮
];

// ✅ 主处理逻辑
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
    message += `\n🔮 Please focus your energy and draw 3 cards...\n👇 Tap the buttons below:`;
  } else {
    message += `\n⚠️ Payment below minimum threshold (${amountThreshold} USDT). It will not be processed.`;
  }

  if (testMode) {
    message = `🧪 [TEST MODE]\n\n` + message;
  }

  try {
    await sendMessage(userId, message);

    if (amount >= amountThreshold && isSuccess) {
      startSession(userId);
      await sendTarotButtons(userId);
    }

    const autoClickTxs = ['test_tx_001', 'test_tx_002', 'test_tx_004', 'test_tx_005'];
    if (autoClickTxs.includes(hash)) {
      setTimeout(() => simulateButtonClick(userId, 'card_3'), 3000);
    }

    console.log(`[INFO] Message sent to Telegram ✅`);
  } catch (err) {
    console.error(`[ERROR] Failed to send message: ${err.message}`);
  }
}

// ⏱️ 启动模拟测试
const testInterval = setInterval(() => {
  if (testCount < testTransactions.length) {
    handleTransaction(testTransactions[testCount]);
    testCount++;
  } else {
    clearInterval(testInterval);
    testMode = false;
  }
}, 1000);
