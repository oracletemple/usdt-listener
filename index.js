require('dotenv').config();
const axios = require('axios');
const { sendMessage } = require('./utils/telegram');

const wallet = process.env.WALLET_ADDRESS;
const userId = process.env.RECEIVER_ID;
const amountThreshold = parseFloat(process.env.AMOUNT_THRESHOLD || '10');
const runTest = process.env.RUN_TEST_MESSAGES === 'true';

let lastTxID = null;
let testCount = 0;

async function checkTransactions() {
  console.log(`[DEBUG] checkTransactions() 被调用`);

  if (!wallet || !userId) {
    console.error('❌ WALLET_ADDRESS 或 RECEIVER_ID 缺失');
    return;
  }

  try {
    const url = `https://apilist.tronscanapi.com/api/token_trc20/transfers?limit=20&sort=-timestamp&toAddress=${wallet}`;
    const res = await axios.get(url);
    const txs = res.data?.token_transfers || [];

    console.log(`[DEBUG] 拉取到 ${txs.length} 条交易`);

    for (const tx of txs) {
      const hash = tx.transaction_id;
      if (!tx || tx.to_address !== wallet) continue;
      if (tx.finalResult && tx.finalResult !== 'SUCCESS') continue;
      if ((tx.tokenAbbr || tx.tokenInfo?.tokenAbbr) !== 'USDT') continue;

      const amount = parseFloat(tx.quant || 0) / Math.pow(10, tx.tokenInfo?.tokenDecimal || 6);
      console.log(`[DEBUG] 检查交易: ${hash} -> ${amount} USDT`);

      if (hash === lastTxID) break;
      lastTxID = hash;

      if (amount >= amountThreshold) {
        const message = `✅ Payment received: ${amount} USDT (TRC20)\n\n🔮 Thank you for your offering. Your spiritual reading is now ready.`;

        console.log(`[DEBUG] 触发发送：${amount} USDT`);
        try {
          await sendMessage(userId, message);
          console.log(`[DEBUG] sendMessage 调用完成 ✅`);
        } catch (err) {
          console.error(`[ERROR] sendMessage 失败 ❌`, err.message);
        }

        break;
      }
    }
  } catch (err) {
    console.error('❌ 请求失败:', err.message);
  }
}

// 定时执行
setInterval(() => {
  console.log(`[DEBUG] 每10秒触发检查: ${new Date().toISOString()}`);

  if (runTest && testCount < 3) {
    const testAmount = 10.01 + testCount;
    const message = `✅ [测试] Payment received: ${testAmount.toFixed(2)} USDT (TRC20)\n\n🔮 Thank you for your offering.`;
    sendMessage(userId, message)
      .then(() => console.log(`[TEST] 成功发送测试消息 ${testCount + 1} ✅`))
      .catch((err) => console.error(`[TEST] 测试消息失败 ❌`, err.message));
    testCount++;
  }

  checkTransactions();
}, 10000);

console.log('🚀 USDT Payment Listener Started...');
