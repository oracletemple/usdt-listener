// A_transaction-listener.js - v1.0.0

const { sendButtons } = require("./G_send-message");

const RECEIVER_ID = process.env.RECEIVER_ID;
const AMOUNT_THRESHOLD = Number(process.env.AMOUNT_THRESHOLD) || 10;

/**
 * 处理链上交易事件（由 /webhook 接收到的数据）
 * @param {object} data - 包含 userId、amount、txHash 等字段
 */
async function handleTransactionEvent(data) {
  const userId = data.userId;       // Telegram 用户 ID
  const amount = Number(data.amount); // 实际交易金额
  const txHash = data.txHash || "N/A";

  console.log(`🔍 TX received: user=${userId}, amount=${amount}, tx=${txHash}`);

  if (!userId || isNaN(amount)) {
    console.warn("⚠️ Invalid transaction data received.");
    return;
  }

  if (amount < AMOUNT_THRESHOLD) {
    console.log(`⚠️ Received ${amount} USDT, below threshold (${AMOUNT_THRESHOLD} USDT). Ignored.`);
    return;
  }

  const tier = amount >= 30 ? 30 : 12;

  // 推送抽牌按钮
  const text = `💸 Received ${amount} USDT\nYour spiritual reading is ready. Please choose a card:`;
  const buttons = [[
    { text: "🃏 Card 1", callback_data: `card_1_${tier}` },
    { text: "🃏 Card 2", callback_data: `card_2_${tier}` },
    { text: "🃏 Card 3", callback_data: `card_3_${tier}` }
  ]];

  await sendButtons(userId, text, buttons);
}

module.exports = { handleTransactionEvent };
