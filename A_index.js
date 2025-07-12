// A_index.js — v1.2.3
// usdt-listener service: polls for USDT transactions and pushes Telegram messages
require('dotenv').config();
const { getUSDTTransactions } = require('./utils/G_transaction');
const { sendButtons, sendText } = require('./utils/G_send-message');

const WALLET_ADDRESS = process.env.WALLET_ADDRESS;
const RECEIVER_ID = parseInt(process.env.RECEIVER_ID, 10);
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || '15000', 10);

const THRESHOLD_BASIC = parseFloat(process.env.AMOUNT_THRESHOLD_BASIC);
const THRESHOLD_PREMIUM = parseFloat(process.env.AMOUNT_THRESHOLD_PREMIUM);
const THRESHOLD_UPGRADE = parseFloat(process.env.AMOUNT_THRESHOLD_UPGRADE);

let lastSeenTx = null;

async function pollTransactions() {
  try {
    const transactions = await getUSDTTransactions(WALLET_ADDRESS, lastSeenTx);
    for (const tx of transactions) {
      const { txid, from, amount } = tx;
      // remember last processed tx
      lastSeenTx = txid;

      if (amount < THRESHOLD_BASIC) continue;

      const chatId = RECEIVER_ID;
      let promptText = '';

      if (amount >= THRESHOLD_UPGRADE) {
        promptText = `🙏 Received upgrade payment of ${amount} USDT (fees included). Activating Premium Plan…`;
      } else if (amount >= THRESHOLD_BASIC) {
        promptText = `🙏 Received basic payment of ${amount} USDT (fees included). Activating Basic Plan…`;
      }
      // send notification
      await sendText(chatId, promptText);

      // prompt to draw cards
      const buttons = [
        [{ text: '🃏 Card 1', callback_data: 'card_0' }],
        [{ text: '🃏 Card 2', callback_data: 'card_1' }],
        [{ text: '🃏 Card 3', callback_data: 'card_2' }]
      ];
      await sendButtons(chatId, '🃏 Please draw your cards:', buttons);
    }
  } catch (err) {
    console.error('[pollTransactions error]', err);
  }
}

// start polling
pollTransactions();
setInterval(pollTransactions, POLL_INTERVAL);

console.log(`⏳ Polling ${WALLET_ADDRESS} every ${POLL_INTERVAL}ms for USDT transactions`);
