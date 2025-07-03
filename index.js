require('dotenv').config();
const axios = require('axios');
const { sendMessage } = require('./utils/telegram');

const wallet = process.env.WALLET_ADDRESS;
const userId = process.env.RECEIVER_ID;
const amountThreshold = parseFloat(process.env.AMOUNT_THRESHOLD || '10');

let lastTxID = null;

async function checkTransactions() {
  console.log(`[DEBUG] checkTransactions() 被调用`);

  try {
    const url = `https://apilist.tronscan.org/api/token_trc20/transfers?limit=50&sort=-timestamp&toAddress=${wallet}`;
    console.log(`[DEBUG] 请求 URL: ${url}`);

    const res = await axios.get(url);
    const txs = res.data?.token_transfers || [];

    console.log(`[DEBUG] 共拉取 ${txs.length} 条交易`);

    for (const tx of txs) {
      const hash = tx.transaction_id;
      if (!tx || tx.to_address !== wallet) continue;
      if ((tx.contractRet || tx.finalResult) !== 'SUCCESS') continue;
      if ((tx.tokenAbbr || tx.tokenInfo?.tokenAbbr) !== 'USDT') continue;

      const amount = parseFloat(tx.quant || tx.amount_str) / Math.pow(10, tx.tokenInfo?.tokenDecimal || 6);
      console.log(`[DEBUG] 交易: ${hash} - 金额 ${amount} USDT`);

      // 去重逻辑可暂时注释掉以调试
      // if (hash === lastTxID) break;

      if (amount >= amountThreshold) {
        const message = `✅ Payment received: ${amount} USDT (TRC20)\n\n🔮 Thank you for your offering. Your spiritual reading is now ready.`;

        try {
          console.log(`[DEBUG] 尝试发送通知给 Telegram ID ${userId}`);
          await sendMessage(userId, message);
          console.log(`[DEBUG] ✅ 已发送 TG 通知`);
        } catch (err) {
          console.error(`[ERROR] TG 发送失败 ❌`, err.message);
        }

        lastTxID = hash;
        break;
      }
    }
  } catch (err) {
    console.error(`[ERROR] 网络请求失败 ❌:`, err.message);
  }
}

setInterval(() => {
  console.log(`[DEBUG] 每10秒触发检查: ${new Date().toISOString()}`);
  checkTransactions();
}, 10000);

console.log('🚀 USDT Payment Listener Started...');
