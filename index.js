require('dotenv').config();
const axios = require('axios');
const { sendMessage } = require('./utils/telegram');

const wallet = process.env.WALLET_ADDRESS;
const userId = parseInt(process.env.RECEIVER_ID, 10);
const amountThreshold = parseFloat(process.env.AMOUNT_THRESHOLD || '10');

let lastTxID = null;
let simulatedCount = 0;
const maxSimulated = 3;
let simulationDone = false;

// 🧪 模拟付款逻辑
async function simulatePayment() {
  const fakeAmount = 10 + simulatedCount * 0.1;
  const message = `✅ [模拟付款] Payment received: ${fakeAmount.toFixed(2)} USDT (TRC20)\n\n🔮 Thank you for your offering. Your spiritual reading is now ready.`;
  try {
    await sendMessage(userId, message);
    console.log(`[SIMULATION] 第 ${simulatedCount + 1} 次模拟付款已发送 ✅`);
  } catch (err) {
    console.error(`[SIMULATION] 模拟发送失败 ❌`, err.message);
  }
}

async function checkTransactions() {
  console.log(`[DEBUG] checkTransactions() 被调用`);

  // 模拟流程（前3次）
  if (!simulationDone && simulatedCount < maxSimulated) {
    await simulatePayment();
    simulatedCount++;
    if (simulatedCount >= maxSimulated) {
      simulationDone = true;
      console.log(`[SIMULATION] ✅ 模拟流程完成，切换为正式监听模式`);
    }
    return; // 模拟时跳过真实监听
  }

  // 正式监听模式
  if (!wallet || !userId) {
    console.error('❌ WALLET_ADDRESS 或 RECEIVER_ID 缺失');
    return;
  }

  try {
    const url = `https://apilist.tronscan.org/api/token_trc20/transfers?limit=20&sort=-timestamp&toAddress=${wallet}`;
    const res = await axios.get(url);
    const txs = res.data?.data || [];

    console.log(`[DEBUG] 拉取到 ${txs.length} 条交易`);

    for (const tx of txs) {
      const hash = tx.transaction_id;
      if (!tx || tx.to_address !== wallet) continue;
      if (tx.finalResult && tx.finalResult !== 'SUCCESS') continue;
      if ((tx.tokenAbbr || tx.symbol) !== 'USDT') continue;

      const amount = parseFloat(tx.amount_str || tx.amount) / Math.pow(10, tx.tokenDecimal || 6);
      console.log(`[DEBUG] 检查交易: ${hash} -> ${amount} USDT`);

      if (hash === lastTxID) break;

      if (amount >= amountThreshold) {
        const message = `✅ Payment received: ${amount} USDT (TRC20)\n\n🔮 Thank you for your offering. Your spiritual reading is now ready.`;
        console.log(`[DEBUG] 触发发送：${amount} USDT`);
        try {
          await sendMessage(userId, message);
          console.log(`[DEBUG] sendMessage 调用完成 ✅`);
        } catch (err) {
          console.error(`[ERROR] sendMessage 失败 ❌`, err.message);
        }
        lastTxID = hash;
        break;
      }
    }
  } catch (err) {
    console.error('❌ 请求失败:', err.message);
  }
}

setInterval(() => {
  console.log(`[DEBUG] 每10秒触发检查: ${new Date().toISOString()}`);
  checkTransactions();
}, 10000);

console.log('🚀 USDT Payment Listener Started...');
