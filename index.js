// v1.1.5
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { handleTelegramUpdate, initTelegramBot } = require('./utils/telegram');

const app = express();
const PORT = process.env.PORT || 3000;

// Parse Telegram updates
app.use(bodyParser.json());

// Telegram Webhook handler
app.post('/webhook', async (req, res) => {
  try {
    await handleTelegramUpdate(req.body);
    res.sendStatus(200);
  } catch (err) {
    console.error('❌ Webhook handler error:', err);
    res.sendStatus(500);
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 USDT Listener Webhook server running at http://localhost:${PORT}`);
  await initTelegramBot(); // Register webhook at startup
});
