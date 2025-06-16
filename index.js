import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

const TOKEN = "33955|6Dxs0qZzCc3GrLnVks065cnIF4CHhZW5wzU9eDed2606dfd9";

app.use(cors());
app.use(express.json());

// Rota raiz só para teste rápido
app.get('/', (req, res) => {
  res.send('Backend PushinPay funcionando! 🚀');
});

// Criar cobrança PIX
app.post('/api/pix', async (req, res) => {
  const { name, email, cpf, phone, amount } = req.body;

  try {
    const response = await fetch('https://api.pushinpay.com.br/api/pix/cashIn', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        value: amount,
        // webhook_url: "", // opcional, deixe vazio se não usar
        redirect_url: "https://t.me/+edEpDjMIoBlkMTYx"
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({ success: false, error: 'Erro ao criar cobrança PIX', details: errorText });
    }

    const data = await response.json();

    // Ajuste o retorno conforme a resposta real da PushinPay
    return res.json({
      success: true,
      pix_data: {
        qrCodeText: data.payload?.qr_code || data.qr_code || '',
      },
      transaction_hash: data.transaction_hash || data.id || '',
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: 'Erro interno', details: error.message });
  }
});

// Consultar status do pagamento
app.get('/api/status', async (req, res) => {
  const { hash } = req.query;
  if (!hash) {
    return res.status(400).json({ success: false, error: "Parâmetro hash é obrigatório" });
  }

  try {
    const response = await fetch(`https://api.pushinpay.com.br/api/pix/status/${hash}`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Accept': 'application/json'
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({ success: false, error: 'Erro ao consultar status', details: errorText });
    }

    const data = await response.json();

    return res.json({
      success: true,
      payment_status: data.status || 'unknown',
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Erro interno', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
