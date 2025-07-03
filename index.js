require('dotenv').config();
const axios = require('axios');
const { sendMessage } = require('./utils/telegram');

const wallet = process.env.WALLET_ADDRESS;
const userId = process.env.RECEIVER_ID;
const amountThreshold = parseFloat(process.env.AMOUNT_THRESHOLD || '10');

const notifiedTxs = new Set();
let testCount = 0;
let testMode = true;

// 👇 模拟测试交易：3个12USDT + 3个30USDT
const testTransactions = [
  { amount: 12, hash: 'test_tx_001' },
  { amount: 12, hash: 'test_tx_002' },
  { amount: 12, hash: 'test_tx_003' },
  { amount: 30, hash: 'test_tx_004' },
  { amount: 30, hash: 'test_tx_005' },
  { amount: 30, hash: 'test_tx_006' },
];

// ✅ 处理一笔交易（测试或真实）
async function handleTransaction({ amount, hash, isSuccess = true }) {
  if (notifiedTxs.has(hash)) return;
  notifiedTxs.add(hash);

  console.log(`[TEST] 模拟交易: ${hash} -> ${amount} USDT`);

  let message = `💸 收到一笔${isSuccess ? '' : '❌失败的'} USDT 转账:\n\n`;
  message += `💰 数量: ${amount} USDT (TRC20)\n`;
  message += `🔗 哈希: ${hash}\n`;

  if (!isSuccess) {
    message += `\n⚠️ 交易失败，可能未到账，请检查区块链状态`;
  } else if (amount >= 29.9) {
    message += `\n🧠 感谢你的奉献。你已解锁「定制问答服务」。请告诉我们你当前最想解答的问题，我们将为你生成一次高维灵性解读。`;
  } else if (amount >= amountThreshold) {
    message += `\n🔮 谢谢你的奉献，灵性占卜即将开始。\n请从 1~9 中选择一个数字，启动你的神秘之旅…`;
  } else {
    message += `\n⚠️ 转账金额低于门槛（当前最低 ${amountThreshold} USDT），不会被处理`;
  }

  try {
    await sendMessage(userId, message);
    console.log(`[INFO] ✅ Message sent to ${userId}`);
  } catch (err) {
    console.error(`[ERROR] ❌ sendMessage 失败:`, err.message);
  }
}

// 🧪 每秒模拟一笔测试交易，最多6次
const testInterval = setInterval(() => {
  if (testCount < testTransactions.length) {
    handleTransaction(testTransactions[testCount]);
    testCount++;
  } else {
    clearInterval(testInterval);
    testMode = false;
    console.log(`✅ 测试结束，进入正式监听模式`);
  }
}, 1000);

// 🚀 正式监听逻辑（每10秒触发）
async function checkTransactions() {
  if (testMode) return; // 暂停监听，直到测试结束

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
      if (notifiedTxs.has(hash)) continue;

      const tokenSymbol = tx.tokenInfo?.tokenAbbr || tx.tokenAbbr || tx.symbol;
      if (tokenSymbol !== 'USDT') continue;

      const amount = parseFloat(tx.quant) / Math.pow(10, tx.tokenInfo?.tokenDecimal || 6);
      const isSuccess = tx.finalResult === 'SUCCESS';

      await handleTransaction({ amount, hash, isSuccess });
    }
  } catch (err) {
    console.error('❌ 请求失败:', err.message);
  }
}

setInterval(() => {
  if (!testMode) {
    console.log(`[DEBUG] 每10秒触发检查: ${new Date().toISOString()}`);
    checkTransactions();
  }
}, 10000);

console.log('🚀 Listener Started with Test Mode (6笔模拟交易将自动发送)');
