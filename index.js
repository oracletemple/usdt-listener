console.log('[ENV DEBUG]', {
  BOT_TOKEN: process.env.BOT_TOKEN,
  WALLET_ADDRESS: process.env.WALLET_ADDRESS,
  RECEIVER_ID: process.env.RECEIVER_ID,
  AMOUNT_THRESHOLD: process.env.AMOUNT_THRESHOLD,
});

require('dotenv').config();
const axios = require('axios');
const { sendMessage } = require('./utils/telegram');

const wallet = process.env.WALLET_ADDRESS;
const userId = process.env.RECEIVER_ID;
const amountThreshold = parseFloat(process.env.AMOUNT_THRESHOLD || '10');

let lastTxID = null;

async function checkTransactions() {
  if (!wallet || !userId) {
    console.error('❌ WALLET_ADDRESS or RECEIVER_ID is missing in .env');
    return;
  }

  try {
    const url = `https://apilist.tronscan.org/api/token_trc20/transfers?limit=20&sort=-timestamp&toAddress=${wallet}`;
    const res = await axios.get(url);
    const txs = res.data?.data || [];

    for (const tx of txs) {
      const hash = tx.transaction_id;

      if (!tx || tx.to_address !== wallet) continue;
      if (tx.finalResult && tx.finalResult !== 'SUCCESS') continue;
      if ((tx.tokenAbbr || tx.symbol) !== 'USDT') continue;

      const amount = parseFloat(tx.amount_str || tx.amount) / Math.pow(10, tx.tokenDecimal || 6);
      console.log(`[DEBUG] 检查交易: ${hash} -> ${amount} USDT`);

      if (hash === lastTxID) break;

      if (amount >= amountThreshold) {
        const message = `✅ Payment received: ${amount} USDT (TRC20)\n\n🔮 Thank you for your offering. Your spiritual reading is now ready.\n\n📝 Want a deeper reading? The Oracle Temple is always open.`;
        await sendMessage(userId, message);
        lastTxID = hash;
        break;
      }
    }
  } catch (err) {
    console.error('❌ Error during transaction check:', err.message);
  }
}

setInterval(checkTransactions, 10000);
console.log('🚀 USDT Payment Listener Started...');
