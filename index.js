require('dotenv').config();
const axios = require('axios');
const { sendMessage } = require('./utils/telegram');

const wallet = process.env.WALLET_ADDRESS;
const userId = process.env.RECEIVER_ID;
const amountThreshold = parseFloat(process.env.AMOUNT_THRESHOLD || '10');

const notifiedTxs = new Set(); // 记录已通知的交易哈希

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
      if (!hash || !tx.to_address || tx.to_address !== wallet) continue;
      if (notifiedTxs.has(hash)) continue; // 跳过已通知

      const tokenSymbol = tx.tokenInfo?.tokenAbbr || tx.tokenAbbr || tx.symbol;
      const amount = parseFloat(tx.quant) / Math.pow(10, tx.tokenInfo?.tokenDecimal || 6);

      const isSuccess = tx.finalResult === 'SUCCESS';

      let message = `💸 收到一笔${isSuccess ? '' : '❌失败的'} USDT 转账:\n\n`;
      message += `💰 数量: ${amount} USDT (TRC20)\n`;
      message += `🔗 哈希: ${hash}\n`;
      message += isSuccess
        ? `\n🔮 谢谢你的奉献，解读即将开始...`
        : `\n⚠️ 交易失败，可能未到账，请检查区块链状态`;

      console.log(`[DEBUG] 检查交易: ${hash} -> ${amount} USDT 状态: ${tx.finalResult}`);

      try {
        await sendMessage(userId, message);
        console.log(`[INFO] ✅ Message sent to ${userId}`);
      } catch (err) {
        console.error(`[ERROR] ❌ sendMessage 失败:`, err.message);
      }

      notifiedTxs.add(hash); // 标记为已处理
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
