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

      // 临时关闭去重，强制每笔都处理
      // if (hash === lastTxID) break;
      console.log(`[DEBUG] 不跳过重复交易: ${hash}`);

      if (amount >= amountThreshold) {
        const message = `✅ Payment received: ${amount} USDT (TRC20)\n\n🔮 Thank you for your offering. Your spiritual reading is now ready.`;
        console.log(`[DEBUG] 检查通过，准备发送消息：${hash} -> ${amount} USDT`);
        console.log(`[DEBUG] 准备发送 Telegram 消息到 ${userId}`);
        console.log(`[DEBUG] 消息内容: ${message}`);

        try {
          await sendMessage(userId, message);
          console.log(`✅ Telegram 消息发送成功 -> ${userId}`);
        } catch (err) {
          console.error(`❌ Telegram 消息发送失败:`, err.message);
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
  checkTransactions();
}, 10000);

console.log('🚀 USDT Payment Listener Started...');
