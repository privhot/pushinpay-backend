const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const TOKEN = "33818|1nui49UuT2aJrYd6x40RZkDQgfFdMgvOzt2CoNXi54bcd297";

app.post("/gerar-pix", async (req, res) => {
  try {
    const { value, name, document, email, description } = req.body;

    const response = await fetch("https://api.pushinpay.com/api/create-payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`
      },
      body: JSON.stringify({
        value,
        name,
        document,
        email,
        description
      })
    });

    const data = await response.json();

    if (!data.success) {
      return res.status(400).json({ error: "Erro ao gerar cobrança", details: data });
    }

    res.json(data.payload);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

app.get("/payment-status/:hash", async (req, res) => {
  try {
    const { hash } = req.params;

    const response = await fetch(`https://api.pushinpay.com/api/payment-status/${hash}`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`
      }
    });

    const data = await response.json();

    if (!data.success) {
      return res.status(400).json({ error: "Erro ao consultar status", details: data });
    }

    res.json(data.payload);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

// Rota para teste
app.get('/', (req, res) => {
  res.send('API PushinPay funcionando!');
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
