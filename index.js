import express from 'express';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3000;

const TOKEN = "33955|6Dxs0qZzCc3GrLnVks065cnIF4CHhZW5wzU9eDed2606dfd9";
const VALOR = 1299;

app.get('/', (req, res) => {
  res.send('Backend PushinPay funcionando! 🚀');
});

app.get('/pix', async (req, res) => {
  try {
    const response = await fetch('https://api.pushinpay.com.br/api/pix/cashIn', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        value: VALOR,
        webhook_url: "",
        redirect_url: "https://t.me/+edEpDjMIoBlkMTYx"
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({ error: 'Erro ao criar cobrança PIX', details: errorText });
    }

    const data = await response.json();

    res.set('Access-Control-Allow-Origin', '*');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
