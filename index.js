require('dotenv').config();
const axios = require('axios');
const { sendMessage } = require('./utils/telegram');

const wallet = process.env.WALLET_ADDRESS;
const userId = process.env.RECEIVER_ID;
const amountThreshold = parseFloat(process.env.AMOUNT_THRESHOLD || '12');

const notifiedTxs = new Set();
let testCount = 0;
let testMode = true;
const { generateThreeCardReading } = require('./utils/tarot');
// 🧪 Simulated test transactions (3x12USDT + 3x30USDT)
const testTransactions = [
  { amount: 12, hash: 'test_tx_001' },
  { amount: 12, hash: 'test_tx_002' },
  { amount: 12, hash: 'test_tx_003' },
  { amount: 30, hash: 'test_tx_004' },
  { amount: 30, hash: 'test_tx_005' },
  { amount: 30, hash: 'test_tx_006' },
];

// 🧠 Main message handler for any transaction
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
  message += `\n🎴 Please focus your energy and draw 3 cards...\n`;
  message += `\nTap the buttons below to reveal your Tarot Reading:`;
  message += `\n\n👉 [Draw First Card]\n👉 [Draw Second Card]\n👉 [Draw Third Card]`;
  message += `\n\n(Interactive reading coming soon...)`;
  } else {
    message += `\n⚠️ Payment below minimum threshold (${amountThreshold} USDT). It will not be processed.`;
  }
  if (testMode) {
  message = `🧪 [TEST MODE]\n\n` + message;
}
  
  try {
    await sendMessage(userId, message);
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
    console.log(`✅ Test completed. Entering live monitoring mode...`);
  }
}, 1000);

// 🔍 Live chain listener
async function checkTransactions() {
  if (testMode) return;

  console.log(`[DEBUG] Running live check...`);

  if (!wallet || !userId) {
    console.error('❌ Missing WALLET_ADDRESS or RECEIVER_ID');
    return;
  }

  try {
    const url = `https://apilist.tronscanapi.com/api/token_trc20/transfers?limit=20&sort=-timestamp&toAddress=${wallet}`;
    const res = await axios.get(url);
    const txs = res.data?.token_transfers || [];

    console.log(`[DEBUG] Retrieved ${txs.length} transactions`);

    for (const tx of txs) {
      const hash = tx.transaction_id;
      if (!hash || tx.to_address !== wallet) continue;
      if (notifiedTxs.has(hash)) continue;

      const symbol = tx.tokenInfo?.tokenAbbr || tx.tokenAbbr || tx.symbol;
      if (symbol !== 'USDT') continue;

      const amount = parseFloat(tx.quant) / Math.pow(10, tx.tokenInfo?.tokenDecimal || 6);
      const isSuccess = tx.finalResult === 'SUCCESS';

      await handleTransaction({ amount, hash, isSuccess });
    }
  } catch (err) {
    console.error(`❌ API request failed: ${err.message}`);
  }
}

setInterval(() => {
  if (!testMode) {
    console.log(`[DEBUG] Triggering live scan at ${new Date().toISOString()}`);
    checkTransactions();
  }
}, 10000);

console.log('🚀 Listener started in TEST MODE: 6 simulated payments will trigger first.');
