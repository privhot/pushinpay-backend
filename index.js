const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Armazenamento temporário dos pagamentos
const pagamentos = {};

// Rota para gerar cobrança PIX
app.post('/gerar-pix', async (req, res) => {
  try {
    const { value, description } = req.body;

    const response = await axios.post(
      'https://api.pushinpay.com.br/api/pix/cashIn',
      {
        value: value,
        webhook_url: 'https://pushinpay-backend-1.onrender.com/webhook',
        split_rules: [],
        description: description || 'Pagamento PIX'
      },
      {
        headers: {
          Authorization: 'Bearer 52168|UeUc4yiBILwOs7KQw9KTBMvikdw7xMUqOR0xeJRWdf3a9ae7',
          'Content-Type': 'application/json'
        }
      }
    );

    const data = response.data;

    const paymentId = data.id || data.paymentId || data.hash;

    pagamentos[paymentId] = 'pending';

    const code = data.pix_copy_paste || data.pixCode || data.qrCode || data.qr_code;

    let qrImage = '';
    if (data.qr_code_base64 && data.qr_code_base64.length > 100) {
      qrImage = `data:image/png;base64,${data.qr_code_base64}`;
    } else if (code) {
      qrImage = `https://quickchart.io/qr?text=${encodeURIComponent(code)}`;
    } else {
      qrImage = null;
    }

    res.json({
      pixCode: code,
      qrCodeUrl: qrImage,
      paymentId: paymentId
    });

  } catch (error) {
    console.error('Erro ao gerar pagamento:', error.response?.data || error.message);
    res.status(500).json({ error: 'Erro ao gerar pagamento.' });
  }
});

// Rota para verificar o status do pagamento
app.get('/payment-status/:id', (req, res) => {
  const { id } = req.params;
  const status = pagamentos[id];

  if (!status) {
    return res.status(404).json({ error: 'Pagamento não encontrado.' });
  }

  res.json({ status });
});

// Rota de webhook da PushinPay
app.post('/webhook', (req, res) => {
  const { id, status } = req.body;

  console.log(`Webhook recebido: ${id} = ${status}`);

  if (pagamentos[id]) {
    pagamentos[id] = status;
  }

  res.status(200).send('OK');
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
