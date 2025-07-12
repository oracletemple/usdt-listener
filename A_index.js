// A_index.js — v1.2.3
// usdt-listener: polls for USDT transfers and notifies Telegram by wallet mapping
require('dotenv').config();
const { getUSDTTransactions } = require('./utils/G_transaction');
const { sendButtons, sendText } = require('./utils/G_send-message');
const { getUser, addPending } = require('./utils/G_wallet-map');

const WALLET_ADDRESS = process.env.WALLET_ADDRESS;
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || '15000', 10);

const THRESHOLD_BASIC = parseFloat(process.env.AMOUNT_THRESHOLD_BASIC);
const THRESHOLD_UPGRADE = parseFloat(process.env.AMOUNT_THRESHOLD_UPGRADE);

let lastSeenTx = null;

async function pollTransactions() {
  try {
    const transactions = await getUSDTTransactions(WALLET_ADDRESS, lastSeenTx);
    for (const { txid, from, amount } of transactions) {
      lastSeenTx = txid;
      // Determine recipient Telegram chatId
      const chatId = getUser(from);
      if (chatId) {
        // 已登记用户：立即发送抽牌按钮
        await sendText(chatId, `🙏 Received ${amount} USDT (fees included). Please draw your cards:`);
        await sendButtons(chatId, '🃏 Please draw your cards:', [
          [{ text: '🃏 Card 1', callback_data: 'card_0' }],
          [{ text: '🃏 Card 2', callback_data: 'card_1' }],
          [{ text: '🃏 Card 3', callback_data: 'card_2' }]
        ]);
      } else {
        // 未登记：缓存为 pending
        addPending(from, { amount, txid });
      }
    }
  } catch (err) {
    console.error('[pollTransactions error]', err);
  }
}

// 启动轮询
pollTransactions();
setInterval(pollTransactions, POLL_INTERVAL);
console.log(`⏳ Polling ${WALLET_ADDRESS} every ${POLL_INTERVAL}ms for USDT transactions`);
