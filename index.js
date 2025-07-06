// index.js - v1.2.0 (Clean Webhook Version, No Simulation)
import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { sendButtonMessage } from './utils/telegram.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post('/webhook', async (req, res) => {
  const { user_id, amount } = req.body;

  if (!user_id || !amount) {
    console.log('⚠️ Missing user_id or amount');
    return res.status(400).send('Missing data');
  }

  console.log(`✅ Received ${amount} USDT from ${user_id}`);

  if (amount >= 10 && amount < 20) {
    await sendButtonMessage(user_id, 'basic');
  } else if (amount >= 20) {
    await sendButtonMessage(user_id, 'premium');
  } else {
    console.log(`⚠️ Received ${amount} USDT, which is below the minimum threshold.`);
  }

  res.send('OK');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
