require('dotenv').config();
const axios = require('axios');
const { sendMessage } = require('./utils/telegram');

const wallet = process.env.WALLET_ADDRESS;
const userId = process.env.RECEIVER_ID;
const amountThreshold = parseFloat(process.env.AMOUNT_THRESHOLD || '10');

let lastTxID = null;

async function checkTransactions() {
  console.log(`[DEBUG] checkTransactions() 被调用`);

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

      // 注释去重逻辑
      // if (hash === lastTxID) break;
      console.log(`[DEBUG] 不跳过重复交易: ${hash}`);

      if (amount >= amountThreshold) {
        const message = `✅ Payment received: ${amount} USDT (TRC20)\n\n🔮 Thank you for your offering. Your spiritual reading is now ready.`;

        console.log(`[DEBUG] 触发发送：${amount} USDT`);
        console.log(`[DEBUG] 尝试发送给 chat_id=${userId} 内容：${message}`);

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

// 定时执行
setInterval(() => {
  console.log(`[DEBUG] 每10秒触发检查: ${new Date().toISOString()}`);
  
  async function checkTransactions() {
  console.log(`[DEBUG] checkTransactions() 被调用`);

  // ✅ 模拟测试交易（仅首次执行）
  if (!global.__testSent__) {
    const testAmount = 11.11;
    const message = `✅ [测试] Payment received: ${testAmount} USDT (TRC20)\n\n🔮 Thank you for your offering. Your spiritual reading is now ready.`;
    sendMessage(userId, message)
      .then(() => console.log(`[TEST] 成功发送测试交易提醒 ✅`))
      .catch(err => console.error(`[TEST] 测试消息失败 ❌`, err.message));
    global.__testSent__ = true;
  }

  // ...其余 checkTransactions 原始逻辑保持不变

  checkTransactions();
}, 10000);

console.log('🚀 USDT Payment Listener Started...');
