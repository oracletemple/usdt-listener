// v1.0.13
const express = require("express");
const bodyParser = require("body-parser");
const { handleTransaction } = require("./utils/telegram");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(bodyParser.json());

app.post("/webhook", async (req, res) => {
  const { amount, hash } = req.body;
  if (!amount || !hash) {
    return res.status(400).send("Missing amount or hash");
  }

  try {
    await handleTransaction({ amount, hash });
    res.send("Transaction processed");
  } catch (err) {
    console.error("[Webhook] Error processing transaction:", err.message);
    res.status(500).send("Error");
  }
});

app.listen(PORT, () => {
  console.log(`Tarot service running on port ${PORT}`);
});
