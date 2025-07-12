const TAROT_HANDLER_URL = process.env.TAROT_HANDLER_URL || "https://your-tarot-handler-domain.com"; // ⚠️ 改成你的实际 tarot-handler 地址

app.post("/webhook", async (req, res) => {
  try {
    const { toAddress, fromAddress, amount, txid } = req.body;
    if (toAddress !== WALLET_ADDRESS) return res.sendStatus(200);

    const paid   = parseFloat(amount);
    const wallet = fromAddress;
    const chatId = getUser(wallet);

    // 1. 如果已登记，直接发抽牌按钮
    if (chatId) {
      // 【自动升级】如果是补差价金额，自动请求 tarot-handler 升级
      if (paid === 24) {
        try {
          // 通知 tarot-handler 进行升级
          await axios.post(`${TAROT_HANDLER_URL}/mark-premium`, {
            chatId,
            wallet
          });
        } catch (err) {
          console.error("[Upgrade notify error]", err.response?.data || err.message);
        }
      }

      // 继续正常发牌
      await axios.post(`${API_URL}/sendMessage`, {
        chat_id: chatId,
        text: `🙏 Received ${paid} USDT (fees included). Please draw your cards:`,
        parse_mode: "MarkdownV2"
      });
      await axios.post(`${API_URL}/sendMessage`, {
        chat_id: chatId,
        text: "🃏 Please draw your cards:",
        parse_mode: "MarkdownV2",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🃏 Card 1", callback_data: "card_0" }],
            [{ text: "🃏 Card 2", callback_data: "card_1" }],
            [{ text: "🃏 Card 3", callback_data: "card_2" }]
          ]
        }
      });
    } else {
      addPending(wallet, { amount: paid, txid });
    }
  } catch (err) {
    console.error("[Payment webhook error]", err);
  }
  res.sendStatus(200);
});
