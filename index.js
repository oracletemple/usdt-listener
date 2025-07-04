require('dotenv').config();
const axios = require('axios');
const { sendMessage, sendTarotButtons } = require('./utils/telegram');

const wallet = process.env.WALLET_ADDRESS;
const userId = process.env.RECEIVER_ID;
const amountThreshold = parseFloat(process.env.AMOUNT_THRESHOLD || '12');
const webhookUrl = process.env.WEBHOOK_URL || 'https://tarot-handler.onrender.com/simulate-click';

const notifiedTxs = new Set();
let testCount = 0;
let testMode = true;

// Simulated test transactions (3x12USDT + 3x30USDT)
const testTransactions = [
  { amount: 12, hash: 'test_tx_001' }, // 模拟抽牌交互（card 3）
  { amount: 12, hash: 'test_tx_002' }, // 模拟抽牌交互（card 3）
  { amount: 12, hash: 'test_tx_003' }, // 手动交互
  { amount: 30, hash: 'test_tx_004' }, // 高端提示 + 模拟抽牌（card 3）
  { amount: 30, hash: 'test_tx_005' }, // 高端提示 + 模拟抽牌（card 3）
  { amount: 30, hash: 'test_tx_006' }, // 手动交互
];

// 模拟点击按钮抽牌
async function simulateButtonClick(chatId, cardKey) {
  const cardIndex = cardKey === 'card_1' ? 2 : 0; // 默认模拟的是第三张
  try {
    const res = await axios.post(webhookUrl, {
      chatId,
      cardIndex,
    });
    console.log('[INFO] Simulate click success:', res.data);
  } catch (err) {
    console.error('[ERROR] Failed to simulate button click:', err.message);
  }
}

// 🌺 Main message handler for any transaction
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
    if (amount < 29.9 && isSuccess) {
      await sendTarotButtons(userId);
    } else if (amount >= 29.9 && isSuccess) {
      await sendTarotButtons(userId); // 高端同样具备按钮互动
    }

    // ✅ 模拟按钮点击交互
    if (['test_tx_001', 'test_tx_002', 'test_tx_004', 'test_tx_005'].includes(hash)) {
      setTimeout(() => simulateButtonClick(userId, 'card_1'), 2000);
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
