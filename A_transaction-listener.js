// A_transaction-listener.js - v1.0.0

const { sendButtons } = require("./utils/G_send-message");
const { startSession } = require("./utils/G_tarot-session");

const RECEIVER_ID = parseInt(process.env.RECEIVER_ID, 10);
const AMOUNT_THRESHOLD = parseFloat(process.env.AMOUNT_THRESHOLD || "10");

/**
 * 处理监听到的链上交易数据（或模拟数据）
 * @param {object} tx - 链上交易 JSON 数据
 */
async function handleTransaction(tx) {
  const userId = tx?.userId;
  const amount = parseFloat(tx?.amount);

  if (!userId || isNaN(amount)) {
    console.warn("⚠️ Invalid transaction format");
    return;
  }

  if (amount < AMOUNT_THRESHOLD) {
    console.warn(`⚠️ Received ${amount} USDT, below threshold.`);
    return;
  }

  // 启动占卜会话
  await startSession(userId, amount);

  // 推送按钮（由 tarot-handler 来处理按钮点击）
  const buttons = [[
    { text: "🃏 Card 1", callback_data: `card_1_${amount}` },
    { text: "🃏 Card 2", callback_data: `card_2_${amount}` },
    { text: "🃏 Card 3", callback_data: `card_3_${amount}` }
  ]];

  const message = "💫 Payment received!\nPlease choose a card to reveal your spiritual message:";
  await sendButtons(userId, message, buttons);

  console.log(`✅ Transaction from user ${userId} for ${amount} USDT processed.`);
}

module.exports = handleTransaction;
