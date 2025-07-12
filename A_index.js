const UPGRADE_AMOUNT = 24;
const TOLERANCE = 0.05; // 允许小误差

app.post("/webhook", async (req, res) => {
  try {
    const { toAddress, fromAddress, amount, txid } = req.body;
    if (toAddress !== WALLET_ADDRESS) return res.sendStatus(200);

    const paid   = parseFloat(amount);
    const wallet = fromAddress;
    const chatId = getUser(wallet);

    // 1. 如果已登记，自动升级&发抽牌按钮
    if (chatId) {
      // 补差价/高级自动升级
      if (Math.abs(paid - UPGRADE_AMOUNT) < TOLERANCE) {
        try {
          await axios.post(`${TAROT_HANDLER_URL}/mark-premium`, { chatId });
        } catch (err) {
          console.error("[Upgrade notify error]", err.response?.data || err.message);
        }
      }
      // 继续推送抽牌按钮
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
